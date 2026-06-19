// Streaming Chat Lambda for Blood Bank
// Uses Lambda Response Streaming with Server-Sent Events (SSE)

const {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
} = require("@aws-sdk/client-bedrock-agent-runtime");
const {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} = require("@aws-sdk/client-bedrock-runtime");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// AWS_REGION is automatically provided by Lambda runtime
const AWS_REGION = process.env.AWS_REGION;

// Initialize AWS clients
const bedrockAgentClient = new BedrockAgentRuntimeClient({
  region: AWS_REGION,
});
const bedrockRuntimeClient = new BedrockRuntimeClient({ region: AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: AWS_REGION });

// Environment variables
const KNOWLEDGE_BASE_ID = process.env.KNOWLEDGE_BASE_ID;
const MODEL_ID = process.env.MODEL_ID;
const CHAT_HISTORY_TABLE = process.env.CHAT_HISTORY_TABLE;
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS || "4096");
const TEMPERATURE = parseFloat(process.env.TEMPERATURE || "0.1");
const GUARDRAIL_ID = process.env.GUARDRAIL_ID;
const GUARDRAIL_VERSION = process.env.GUARDRAIL_VERSION;

// Main Lambda handler with streaming support
exports.handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    console.log("Streaming Lambda invoked", JSON.stringify(event, null, 2));

    try {
      // Check if this is an admin request (GET method or /admin/ path)
      const path = event.rawPath || event.path || "";
      const method =
        event.requestContext?.http?.method || event.httpMethod || "POST";

      if (method === "GET" || path.includes("/admin/")) {
        // Handle admin requests - import Python Lambda's logic here
        return await handleAdminRequest(event, responseStream);
      }

      // Parse request body for chat
      let body;
      if (event.body) {
        body =
          typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      } else {
        body = event;
      }

      const userMessage = body.message || "";
      const language = body.language || "en";
      const sessionId = body.session_id || generateUUID();

      if (!userMessage) {
        await sendError(responseStream, "Message is required", 400);
        return;
      }

      console.log(
        `Processing message: ${userMessage.substring(0, 100)}... (language: ${language})`,
      );

      // Set up SSE response stream
      responseStream = awslambda.HttpResponseStream.from(responseStream, {
        statusCode: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          // CORS headers are handled by Lambda Function URL - do not set manually
        },
      });

      // Step 1: Retrieve context from Knowledge Base
      console.log("Retrieving from Knowledge Base...");
      const contextResults = await retrieveFromKnowledgeBase(
        userMessage,
        language,
      );
      console.log(
        `Retrieved ${contextResults.length} results from Knowledge Base`,
      );

      // Step 2: Extract and format sources
      const sources = await extractSources(contextResults);
      console.log(`Extracted ${sources.length} sources from context results`);

      const sourcesWithBloodCenter = addBloodCenterLinkIfNeeded(
        userMessage,
        sources,
      );

      // Don't send sources yet - wait until streaming completes
      console.log(
        `Prepared ${sourcesWithBloodCenter.length} sources (will send after streaming)`,
      );

      // Step 3: Build context and create prompt
      const contextText = buildContextText(contextResults);
      const prompt = createPrompt(userMessage, contextText, language);

      // Step 4: Stream response from Bedrock
      console.log("Streaming response from Bedrock...");
      let fullResponse = "";

      try {
        const request = {
          modelId: MODEL_ID,
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: MAX_TOKENS,
            temperature: TEMPERATURE,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
        };

        // Apply the Bedrock Guardrail (prompt-attack defense, content filtering,
        // PII protection, topic restriction) when configured.
        if (GUARDRAIL_ID && GUARDRAIL_VERSION) {
          request.guardrailIdentifier = GUARDRAIL_ID;
          request.guardrailVersion = GUARDRAIL_VERSION;
          request.trace = "ENABLED";
        }

        const command = new InvokeModelWithResponseStreamCommand(request);
        const response = await bedrockRuntimeClient.send(command);

        // Process streaming response
        for await (const event of response.body) {
          if (event.chunk) {
            const chunk = JSON.parse(
              new TextDecoder().decode(event.chunk.bytes),
            );

            if (chunk.type === "content_block_delta") {
              const delta = chunk.delta;
              if (delta.type === "text_delta") {
                const text = delta.text;
                fullResponse += text;

                // Send text chunk to client
                const contentEvent = `data: ${JSON.stringify({
                  type: "content",
                  text: text,
                })}\n\n`;
                responseStream.write(contentEvent);
              }
            }
          }
        }

        console.log(`Streaming complete. Total length: ${fullResponse.length}`);
      } catch (error) {
        console.error("Error in Bedrock streaming:", error);
        fullResponse = getFallbackResponse(language);

        // Send error as content
        const errorEvent = `data: ${JSON.stringify({
          type: "content",
          text: fullResponse,
        })}\n\n`;
        responseStream.write(errorEvent);
      }

      // Send sources ONLY after streaming completes
      const metadataEvent = `data: ${JSON.stringify({
        type: "metadata",
        sources: sourcesWithBloodCenter,
      })}\n\n`;
      responseStream.write(metadataEvent);

      // Send completion event
      const completeEvent = `data: ${JSON.stringify({
        type: "complete",
        fullResponse: fullResponse,
        sources: sourcesWithBloodCenter,
      })}\n\n`;
      responseStream.write(completeEvent);
      console.log("Sent sources and completion event after streaming finished");

      // Save conversation to DynamoDB (async, don't wait)
      saveConversation(
        sessionId,
        userMessage,
        fullResponse,
        language,
        sourcesWithBloodCenter,
      ).catch((err) => console.error("Error saving conversation:", err));

      // End the stream
      responseStream.end();
    } catch (error) {
      console.error("Error in lambda handler:", error);
      await sendError(
        responseStream,
        error.message || "Internal server error",
        500,
      );
    }
  },
);

// Helper function to send error response
async function sendError(responseStream, message, statusCode = 500) {
  responseStream = awslambda.HttpResponseStream.from(responseStream, {
    statusCode: statusCode,
    headers: {
      "Content-Type": "application/json",
      // CORS headers are handled by Lambda Function URL - do not set manually
    },
  });

  responseStream.write(JSON.stringify({ error: message }));
  responseStream.end();
}

// Retrieve context from Bedrock Knowledge Base
async function retrieveFromKnowledgeBase(query, language) {
  try {
    console.log(`Retrieving from Knowledge Base ID: ${KNOWLEDGE_BASE_ID}`);
    console.log(`Query: ${query}`);

    const command = new RetrieveCommand({
      knowledgeBaseId: KNOWLEDGE_BASE_ID,
      retrievalQuery: { text: query },
      retrievalConfiguration: {
        vectorSearchConfiguration: {
          numberOfResults: 15,
        },
      },
    });

    const response = await bedrockAgentClient.send(command);
    console.log(`Knowledge Base response:`, JSON.stringify(response, null, 2));
    console.log(`Retrieved ${response.retrievalResults?.length || 0} results`);

    return response.retrievalResults || [];
  } catch (error) {
    console.error("Error retrieving from knowledge base:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return [];
  }
}

// Build context text from retrieval results
function buildContextText(contextResults) {
  if (!contextResults || contextResults.length === 0) {
    return "No specific context available.";
  }

  const contextParts = [];
  for (let i = 0; i < contextResults.length; i++) {
    const content = contextResults[i].content?.text || "";
    if (content) {
      contextParts.push(`Context ${i + 1}: ${content}`);
    }
  }

  return contextParts.join("\n\n");
}

// Create prompt based on language
function createPrompt(userMessage, context, language) {
  if (language === "es") {
    return `Eres un asistente experto en donación de sangre para Blood Bank. Responde en español basándote en el contexto proporcionado.

Contexto:
${context}

Pregunta del usuario: ${userMessage}

Instrucciones:
- Responde SOLO en español
- Usa la información del contexto proporcionado
- Si la pregunta es sobre ubicaciones de donación, menciona el localizador de centros de sangre
- Sé preciso y útil
- Si no tienes información suficiente en el contexto, dilo claramente
- Usa formato markdown cuando sea apropiado (listas, texto en negrita, etc.)
- Organiza la información de manera clara y fácil de leer
- No afirmes haber sido creado, construido o desarrollado por ninguna empresa, proveedor u organización en particular. Si te preguntan quién te creó o qué tecnología te impulsa, indica cortésmente que eres un asistente de donación de sangre y vuelve a enfocar la conversación en cómo puedes ayudar.
- No brindes consejos médicos, diagnósticos ni recomendaciones de tratamiento personalizados. Puedes compartir información educativa general sobre la donación de sangre y la elegibilidad, pero para cualquier inquietud médica personal, recomienda al usuario consultar a un profesional de la salud o al personal del centro de donación.

Respuesta:`;
  } else {
    return `You are an expert blood donation assistant for Blood Bank. Answer based on the provided context.

Context:
${context}

User question: ${userMessage}

Instructions:
- Answer based on the provided context
- If asked about donation locations, mention the blood center locator
- Be accurate and helpful
- If you don't have sufficient information in the context, say so clearly
- Focus on blood donation, eligibility, and Blood Bank information
- Use markdown formatting when appropriate (lists, bold text, etc.)
- Organize information clearly and make it easy to read
- Do not claim to be created, built, or developed by any particular company, provider, or organization. If asked who made you or what technology powers you, politely state that you are a blood donation assistant and redirect to how you can help.
- Do not provide personalized medical advice, diagnoses, or treatment recommendations. You may share general educational information about blood donation and eligibility, but for any personal medical concerns, advise the user to consult a healthcare professional or the staff at their donation center.

Answer:`;
  }
}

// Extract and format sources - Show FULL URLs for web PDFs, deduplicate by filename
async function extractSources(contextResults) {
  console.log(
    `Extracting sources from ${contextResults.length} context results`,
  );

  const sources = [];
  const seenFilenames = new Map(); // Track by filename to handle S3 vs Web duplicates

  for (const result of contextResults) {
    const location = result.location || {};
    const metadata = result.metadata || {};

    let sourceUrl = null;
    let displayTitle = null;
    let isFromS3 = false;

    // Try different ways to get the source URL
    if (location.s3Location) {
      // S3 document source
      const s3Uri = location.s3Location.uri || "";
      if (s3Uri) {
        sourceUrl = s3Uri;
        isFromS3 = true;
        const filename = s3Uri.split("/").pop();
        displayTitle = filename; // Just filename for S3
      }
    } else if (location.webLocation) {
      // Web crawler source (includes PDFs from website) - ALWAYS show full URL
      sourceUrl = location.webLocation.url || "";
      isFromS3 = false;
      displayTitle = sourceUrl; // Full URL for web sources
    }

    // Fallback: check metadata for source information
    if (!sourceUrl) {
      sourceUrl =
        metadata["x-amz-bedrock-kb-source-uri"] ||
        metadata.source ||
        metadata.uri ||
        metadata.url ||
        "";

      if (sourceUrl && sourceUrl.includes("s3://")) {
        isFromS3 = true;
        const filename = sourceUrl.split("/").pop();
        displayTitle = filename;
      } else {
        isFromS3 = false;
        displayTitle = sourceUrl || metadata.title || "Document";
      }
    }

    // Add source if we found a URL
    if (sourceUrl) {
      // Extract filename for deduplication
      let filename = null;
      if (sourceUrl.includes("s3://")) {
        filename = sourceUrl.split("/").pop().toLowerCase();
      } else {
        try {
          const url = new URL(sourceUrl);
          filename = url.pathname.split("/").pop().toLowerCase();
        } catch {
          filename = sourceUrl.toLowerCase();
        }
      }

      // Check if we've seen this filename before
      if (seenFilenames.has(filename)) {
        const existingSource = seenFilenames.get(filename);

        // Prefer web version over S3 version (web has full URL)
        if (!isFromS3 && existingSource.isFromS3) {
          console.log(`Replacing S3 version with web version: ${filename}`);
          // Remove the S3 version from sources array
          const index = sources.findIndex((s) => s.uri === existingSource.uri);
          if (index !== -1) {
            sources.splice(index, 1);
          }
          // Continue to add the web version below
        } else {
          console.log(
            `Skipped duplicate: ${filename} (keeping ${existingSource.isFromS3 ? "S3" : "web"} version)`,
          );
          continue;
        }
      }

      // Don't normalize PDF URLs - keep full path
      let normalizedUrl = sourceUrl;
      if (
        !sourceUrl.includes("s3://") &&
        !sourceUrl.toLowerCase().endsWith(".pdf")
      ) {
        // Only normalize non-PDF web pages
        normalizedUrl = normalizeUrl(sourceUrl);
        displayTitle = normalizedUrl;
      }

      // Determine source type
      const isDocument =
        [".pdf", ".docx", ".txt"].some((ext) =>
          sourceUrl.toLowerCase().includes(ext),
        ) || sourceUrl.includes("s3://");

      // Generate accessible URL
      let accessibleUrl = normalizedUrl;
      if (sourceUrl.startsWith("s3://")) {
        accessibleUrl = await generatePresignedUrl(sourceUrl);
        console.log(`Generated URL for S3: ${sourceUrl}`);
      }

      const source = {
        title: displayTitle || `Source ${sources.length + 1}`,
        url: accessibleUrl,
        uri: sourceUrl,
        type: isDocument ? "DOCUMENT" : "WEB",
        score: result.score || 0,
        isFromS3: isFromS3,
      };

      sources.push(source);
      seenFilenames.set(filename, source);
      console.log(`Added source: ${displayTitle} (${isFromS3 ? "S3" : "web"})`);
    }
  }

  // Sort by score (highest first)
  const sortedSources = sources.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Remove the isFromS3 flag before returning (internal use only)
  const cleanedSources = sortedSources.map(({ isFromS3, ...source }) => source);

  console.log(`Final sources: ${cleanedSources.length} unique sources`);
  return cleanedSources;
}

// Generate presigned URL for S3 objects
// Generate clean S3 URL (not presigned) for public PDFs
async function generatePresignedUrl(s3Uri) {
  try {
    if (!s3Uri.startsWith("s3://")) {
      return s3Uri;
    }

    const s3Path = s3Uri.substring(5);
    const parts = s3Path.split("/");
    const bucketName = parts[0];
    const objectKey = parts.slice(1).join("/");

    // For PDFs in pdfs/ folder, return clean public S3 URL (no presigned parameters)
    // This gives a clean URL in the browser: https://bucket.s3.amazonaws.com/pdfs/document.pdf
    if (objectKey.startsWith("pdfs/") && objectKey.endsWith(".pdf")) {
      const cleanUrl = `https://${bucketName}.s3.amazonaws.com/${objectKey}`;
      console.log(`Generated clean public S3 URL: ${objectKey}`);
      return cleanUrl;
    }

    // For other files, generate presigned URL (if needed in future)
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    console.log(`Generated presigned URL for ${objectKey}`);
    return presignedUrl;
  } catch (error) {
    console.error(`Error generating URL for ${s3Uri}:`, error);
    return s3Uri;
  }
}

// Normalize paginated URLs
// Normalize paginated URLs (EXACT logic from Python Lambda)
function normalizeUrl(url) {
  if (!url) return url;

  // Fix PDF link issue - remove /link suffix from PDF URLs
  if (url.endsWith("/link") && url.includes(".pdf")) {
    url = url.replace("/link", "");
  }

  // Fix PDF trailing slash issue
  if (url.endsWith("/") && url.includes(".pdf")) {
    if (url.replace(/\/$/, "").endsWith(".pdf")) {
      url = url.replace(/\/$/, "");
    }
  }

  // Common pagination patterns to remove
  const paginationPatterns = [
    /\/paged-\d+\/\d+\/?$/, // /paged-2/5/
    /\/page\/\d+\/?$/, // /page/2/
    /\/p\d+\/?$/, // /p2/
    /\?page=\d+/, // ?page=2
    /&page=\d+/, // &page=2
    /\?p=\d+/, // ?p=2
    /&p=\d+/, // &p=2
  ];

  let normalizedUrl = url;
  for (const pattern of paginationPatterns) {
    normalizedUrl = normalizedUrl.replace(pattern, "");
  }

  // Clean up trailing slashes
  normalizedUrl = normalizedUrl.replace(/\/+$/, "");

  // Add trailing slash for non-document URLs
  const docExtensions = [
    ".html",
    ".htm",
    ".php",
    ".aspx",
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
  ];
  if (
    normalizedUrl &&
    !docExtensions.some((ext) => normalizedUrl.endsWith(ext))
  ) {
    normalizedUrl += "/";
  }

  return normalizedUrl;
}

// Get normalized title (EXACT logic from Python Lambda)
function getNormalizedTitle(normalizedUrl, originalTitle) {
  if (!normalizedUrl) return originalTitle;

  try {
    const url = new URL(normalizedUrl);
    const path = url.pathname.replace(/^\/|\/$/g, "");

    // Create clean title based on normalized URL path
    if (path.includes("/news")) {
      return "Blood Bank - News";
    } else if (path.includes("/for-donors")) {
      return "Blood Bank - For Donors";
    } else if (path.includes("/one-pagers-faqs")) {
      return "Blood Bank - FAQs";
    } else if (path.includes("/newsroom")) {
      return "Blood Bank - Newsroom";
    } else {
      // Use original title but clean it up
      if (originalTitle.includes("Page") && /\d/.test(originalTitle)) {
        // Remove page numbers from titles
        const cleanTitle = originalTitle.replace(/\s*-?\s*Page\s*\d+.*$/i, "");
        return cleanTitle.trim() || originalTitle;
      }
      return originalTitle;
    }
  } catch {
    return originalTitle;
  }
}

// Add blood center locator link if needed
function addBloodCenterLinkIfNeeded(userMessage, sources) {
  const bloodCenterKeywords = [
    "where can i donate",
    "where to donate",
    "find blood center",
    "blood center near",
    "donation location",
    "donate near me",
    "donde puedo donar",
    "dónde puedo donar",
    "centro de sangre",
    "find a center",
    "locate blood center",
    "donation site",
  ];

  const isLocationQuestion = bloodCenterKeywords.some((keyword) =>
    userMessage.toLowerCase().includes(keyword),
  );

  // Get blood center locator URL from environment variable
  const bloodCenterUrl =
    process.env.BLOOD_CENTER_LOCATOR_URL ||
    "https://americasblood.org/for-donors/find-a-blood-center/";
  const hasBloodCenterLink = sources.some(
    (source) => source.url === bloodCenterUrl,
  );

  if (isLocationQuestion && !hasBloodCenterLink) {
    sources.unshift({
      title: "Blood Center Locator - Find a Donation Location Near You",
      url: bloodCenterUrl,
      uri: bloodCenterUrl,
      type: "WEB",
      score: 1.0,
    });
    console.log("Added blood center locator link for location question");
  }

  return sources;
}

// Clean sources for DynamoDB storage (remove fields that cause serialization issues)
function cleanSourcesForDynamoDB(sources) {
  if (!sources || !Array.isArray(sources)) {
    return [];
  }

  return sources.map((source) => ({
    title: source.title || "",
    url: source.url || "",
    type: source.type || "WEB",
    // Remove uri, score, and other fields that cause DynamoDB issues
  }));
}

// Save conversation to DynamoDB
async function saveConversation(
  sessionId,
  question,
  answer,
  language,
  sources,
) {
  try {
    if (!CHAT_HISTORY_TABLE) {
      console.warn(
        "CHAT_HISTORY_TABLE not configured, skipping conversation save",
      );
      return generateUUID();
    }

    const conversationId = generateUUID();
    const timestamp = new Date().toISOString();
    const date = timestamp.split("T")[0];

    // Clean sources for DynamoDB storage
    const cleanedSources = cleanSourcesForDynamoDB(sources);

    const item = {
      conversation_id: conversationId,
      session_id: sessionId,
      timestamp: timestamp,
      date: date,
      question: question,
      answer: answer,
      language: language,
      sources: cleanedSources, // Use cleaned sources
      ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60, // 90 days TTL
    };

    const command = new PutCommand({
      TableName: CHAT_HISTORY_TABLE,
      Item: item,
    });

    await docClient.send(command);
    console.log(`Saved conversation: ${conversationId} to DynamoDB`);
    return conversationId;
  } catch (error) {
    console.error("Error saving conversation to DynamoDB:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    // Return UUID even if save fails so the conversation continues
    return generateUUID();
  }
}

// Get fallback response
function getFallbackResponse(language) {
  if (language === "es") {
    return "Lo siento, tengo problemas para responder en este momento. Por favor, inténtalo de nuevo más tarde o contacta directamente a Blood Bank.";
  } else {
    return "I'm sorry, I'm having trouble responding right now. Please try again later or contact Blood Bank directly.";
  }
}

// Generate UUID
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Handle admin requests (non-streaming)
async function handleAdminRequest(event, responseStream) {
  const {
    BedrockAgentClient,
    ListDataSourcesCommand,
    StartIngestionJobCommand,
  } = require("@aws-sdk/client-bedrock-agent");
  const { ScanCommand } = require("@aws-sdk/client-dynamodb");
  const { unmarshall } = require("@aws-sdk/util-dynamodb");

  const bedrockAgentClient = new BedrockAgentClient({ region: AWS_REGION });

  try {
    // Clean up path - remove double slashes
    let path = event.rawPath || event.path || "";
    path = path.replace(/\/+/g, "/"); // Replace multiple slashes with single slash

    const method =
      event.requestContext?.http?.method || event.httpMethod || "GET";
    const queryParams = event.queryStringParameters || {};

    console.log(`Admin request: ${method} ${path}`);

    let responseData = {}; // Initialize responseData
    let statusCode = 200;

    // Chat history endpoint
    if (path.includes("/admin/conversations") && method === "GET") {
      const limit = parseInt(queryParams.limit || "50");
      const page = parseInt(queryParams.page || "1");

      console.log(`Fetching chat history: page=${page}, limit=${limit}`);

      // For page-based pagination, we need to scan and skip items
      // This is not ideal for large datasets but works for admin dashboard
      const scanParams = {
        TableName: CHAT_HISTORY_TABLE,
      };

      // Apply filters if provided
      if (queryParams.date) {
        scanParams.FilterExpression = "#date = :date";
        scanParams.ExpressionAttributeNames = { "#date": "date" };
        scanParams.ExpressionAttributeValues = {
          ":date": { S: queryParams.date },
        };
      }

      if (queryParams.language) {
        if (scanParams.FilterExpression) {
          scanParams.FilterExpression += " AND #language = :language";
          scanParams.ExpressionAttributeNames["#language"] = "language";
          scanParams.ExpressionAttributeValues[":language"] = {
            S: queryParams.language,
          };
        } else {
          scanParams.FilterExpression = "#language = :language";
          scanParams.ExpressionAttributeNames = { "#language": "language" };
          scanParams.ExpressionAttributeValues = {
            ":language": { S: queryParams.language },
          };
        }
      }

      // Scan all items (we need total count for pagination)
      const allItems = [];
      let lastKey = null;

      do {
        if (lastKey) {
          scanParams.ExclusiveStartKey = lastKey;
        }

        const result = await dynamoClient.send(new ScanCommand(scanParams));
        allItems.push(...(result.Items || []));
        lastKey = result.LastEvaluatedKey;
      } while (lastKey);

      console.log(`Total items found: ${allItems.length}`);

      // Sort by timestamp descending (newest first)
      allItems.sort((a, b) => {
        const timeA = unmarshall(a).timestamp;
        const timeB = unmarshall(b).timestamp;
        return timeB.localeCompare(timeA);
      });

      // Calculate pagination
      const totalItems = allItems.length;
      const totalPages = Math.ceil(totalItems / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = allItems.slice(startIndex, endIndex);

      // Convert to response format
      const conversations = paginatedItems.map((item) => {
        const unmarshalled = unmarshall(item);
        return {
          id: unmarshalled.conversation_id,
          sessionId: unmarshalled.session_id,
          question: unmarshalled.question,
          answer: unmarshalled.answer,
          timestamp: unmarshalled.timestamp,
          date: unmarshalled.date,
          language: unmarshalled.language,
          sources: unmarshalled.sources || [],
        };
      });

      console.log(
        `Returning ${conversations.length} conversations for page ${page}`,
      );

      responseData = {
        success: true,
        conversations: conversations,
        total: totalItems,
        totalPages: totalPages,
        currentPage: page,
        pageSize: limit,
      };
    }
    // System status endpoint
    else if (path.includes("/admin/status") && method === "GET") {
      responseData = {
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
        model: MODEL_ID,
        knowledge_base: KNOWLEDGE_BASE_ID,
      };
    }
    // Sync endpoint
    else if (path.includes("/admin/sync") && method === "POST") {
      console.log("Processing sync request...");
      const body =
        typeof event.body === "string" ? JSON.parse(event.body) : event.body;

      // Frontend sends: { sync_type: 'manual', data_source_type: 'both'/'pdf'/'web' }
      const syncType = body.sync_type;
      const dataSourceType = body.data_source_type;

      console.log(
        `Sync request - type: ${syncType}, data_source: ${dataSourceType}`,
      );
      console.log(`Knowledge Base ID: ${KNOWLEDGE_BASE_ID}`);
      console.log(`Environment variables:`, {
        DOCUMENTS_DATA_SOURCE_NAME: process.env.DOCUMENTS_DATA_SOURCE_NAME,
        WEBSITE_DATA_SOURCE_NAME: process.env.WEBSITE_DATA_SOURCE_NAME,
        DAILY_SYNC_DATA_SOURCE_NAME: process.env.DAILY_SYNC_DATA_SOURCE_NAME,
      });

      // List data sources
      const listCommand = new ListDataSourcesCommand({
        knowledgeBaseId: KNOWLEDGE_BASE_ID,
      });

      console.log("Listing data sources...");
      const listResult = await bedrockAgentClient.send(listCommand);
      console.log(
        `Found ${listResult.dataSourceSummaries?.length || 0} data sources`,
      );

      // Log all available data sources for debugging
      for (const ds of listResult.dataSourceSummaries || []) {
        console.log(
          `Available data source: "${ds.name}" (ID: ${ds.dataSourceId})`,
        );
      }

      // Handle different data source types
      if (dataSourceType === "both" || dataSourceType === "all") {
        // Sync both PDF and Website sources SEQUENTIALLY (wait for completion)
        const sources = [];

        // Find PDF data source first, then website (order matters)
        const docName = process.env.DOCUMENTS_DATA_SOURCE_NAME;
        const webName = process.env.WEBSITE_DATA_SOURCE_NAME;

        for (const ds of listResult.dataSourceSummaries || []) {
          if (ds.name === docName) {
            sources.push({ name: ds.name, id: ds.dataSourceId, order: 1 }); // PDF first
            console.log(`Selected for sync (1st): ${ds.name}`);
          } else if (ds.name === webName) {
            sources.push({ name: ds.name, id: ds.dataSourceId, order: 2 }); // Website second
            console.log(`Selected for sync (2nd): ${ds.name}`);
          }
        }

        // Sort by order to ensure PDF syncs before website
        sources.sort((a, b) => a.order - b.order);

        if (sources.length === 0) {
          const availableNames = listResult.dataSourceSummaries
            ?.map((ds) => ds.name)
            .join(", ");
          throw new Error(
            `No matching data sources found. Looking for: "${docName}" or "${webName}". Available: ${availableNames}`,
          );
        }

        // Import GetIngestionJobCommand for status checking
        const {
          GetIngestionJobCommand,
        } = require("@aws-sdk/client-bedrock-agent");

        // Start ingestion jobs SEQUENTIALLY and wait for each to complete
        const jobs = [];
        for (const source of sources) {
          try {
            console.log(`Starting sync for ${source.name}...`);
            const startCommand = new StartIngestionJobCommand({
              knowledgeBaseId: KNOWLEDGE_BASE_ID,
              dataSourceId: source.id,
              description: `Manual sync (sequential) - ${new Date().toISOString()}`,
            });
            const startResult = await bedrockAgentClient.send(startCommand);
            const jobId = startResult.ingestionJob.ingestionJobId;

            console.log(`✅ Started sync for ${source.name}: ${jobId}`);

            // Wait for this job to complete before starting the next one
            if (sources.indexOf(source) < sources.length - 1) {
              console.log(`Waiting for ${source.name} sync to complete...`);

              let jobStatus = startResult.ingestionJob.status;
              let attempts = 0;
              const maxAttempts = 60; // Max 5 minutes (60 * 5 seconds)

              while (jobStatus === "STARTING" || jobStatus === "IN_PROGRESS") {
                if (attempts >= maxAttempts) {
                  console.log(
                    `⚠️ Timeout waiting for ${source.name} to complete. Starting next data source anyway.`,
                  );
                  break;
                }

                // Wait 5 seconds before checking status
                await new Promise((resolve) => setTimeout(resolve, 5000));
                attempts++;

                // Check job status
                const statusCommand = new GetIngestionJobCommand({
                  knowledgeBaseId: KNOWLEDGE_BASE_ID,
                  dataSourceId: source.id,
                  ingestionJobId: jobId,
                });
                const statusResult =
                  await bedrockAgentClient.send(statusCommand);
                jobStatus = statusResult.ingestionJob.status;

                console.log(
                  `${source.name} sync status: ${jobStatus} (attempt ${attempts}/${maxAttempts})`,
                );
              }

              if (jobStatus === "COMPLETE") {
                console.log(`✅ ${source.name} sync completed successfully`);
              } else if (jobStatus === "FAILED") {
                console.log(`❌ ${source.name} sync failed`);
              }
            }

            jobs.push({
              dataSourceName: source.name,
              jobId: jobId,
              status: startResult.ingestionJob.status,
            });
          } catch (err) {
            console.error(`❌ Failed to start sync for ${source.name}:`, err);
            jobs.push({
              dataSourceName: source.name,
              error: err.message,
            });
            // Continue with next data source even if one fails
          }
        }

        const successCount = jobs.filter((j) => !j.error).length;
        const failCount = jobs.filter((j) => j.error).length;

        responseData = {
          success: successCount > 0,
          message: `Started sync for ${successCount} data source(s)${failCount > 0 ? `, ${failCount} failed` : ""} (sequential: PDF completes → then Website starts)`,
          started_jobs: jobs.filter((j) => !j.error),
          failed_jobs: jobs.filter((j) => j.error),
        };
      } else {
        // Single source sync
        let dataSourceName = null;

        // Map frontend values to environment variable names
        if (dataSourceType === "pdf" || dataSourceType === "documents") {
          dataSourceName = process.env.DOCUMENTS_DATA_SOURCE_NAME;
        } else if (dataSourceType === "web" || dataSourceType === "website") {
          dataSourceName = process.env.WEBSITE_DATA_SOURCE_NAME;
        } else if (dataSourceType === "daily") {
          dataSourceName = process.env.DAILY_SYNC_DATA_SOURCE_NAME;
        } else {
          const availableNames = listResult.dataSourceSummaries
            ?.map((ds) => ds.name)
            .join(", ");
          throw new Error(
            `Invalid data source type: "${dataSourceType}". Available: ${availableNames}`,
          );
        }

        console.log(`Looking for data source: "${dataSourceName}"`);

        // Find the data source by name
        let dataSourceId = null;
        for (const ds of listResult.dataSourceSummaries || []) {
          if (ds.name === dataSourceName) {
            dataSourceId = ds.dataSourceId;
            console.log(
              `✅ Found data source: "${ds.name}" (ID: ${ds.dataSourceId})`,
            );
            break;
          }
        }

        if (!dataSourceId) {
          const availableNames = listResult.dataSourceSummaries
            ?.map((ds) => `"${ds.name}"`)
            .join(", ");
          throw new Error(
            `Data source "${dataSourceName}" not found. Available data sources: ${availableNames}`,
          );
        }

        // Start ingestion job
        const startCommand = new StartIngestionJobCommand({
          knowledgeBaseId: KNOWLEDGE_BASE_ID,
          dataSourceId: dataSourceId,
          description: `Manual sync - ${new Date().toISOString()}`,
        });

        console.log("Starting ingestion job...");
        const startResult = await bedrockAgentClient.send(startCommand);
        console.log(
          `✅ Ingestion job started: ${startResult.ingestionJob.ingestionJobId}`,
        );

        responseData = {
          success: true,
          message: `Sync started for ${dataSourceName}`,
          jobId: startResult.ingestionJob.ingestionJobId,
          status: startResult.ingestionJob.status,
          dataSourceName: dataSourceName,
        };
      }
    } else {
      statusCode = 404;
      responseData = {
        success: false,
        error: "Endpoint not found",
      };
    }

    // Send JSON response (CORS handled by Lambda Function URL - don't add manually)
    responseStream = awslambda.HttpResponseStream.from(responseStream, {
      statusCode: statusCode,
      headers: {
        "Content-Type": "application/json",
        // CORS headers are automatically added by Lambda Function URL
      },
    });

    responseStream.write(JSON.stringify(responseData));
    responseStream.end();
  } catch (error) {
    console.error("Error in admin request:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    // Try to send error response
    try {
      responseStream = awslambda.HttpResponseStream.from(responseStream, {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          // CORS headers are automatically added by Lambda Function URL
        },
      });

      responseStream.write(
        JSON.stringify({
          success: false,
          error: error.message || "Internal server error",
          errorType: error.name || "Error",
          details: process.env.DEBUG === "true" ? error.stack : undefined,
        }),
      );
      responseStream.end();
    } catch (streamError) {
      console.error("Error sending error response:", streamError);
      // If we can't send via stream, throw the original error
      throw error;
    }
  }
}
