# API Documentation

## Overview

The Blood Bank AI Chatbot provides a RESTful API for chat interactions, admin operations, and system management. All endpoints are secured and follow standard HTTP conventions.

## Base URL

```
https://your-api-gateway-id.execute-api.region.amazonaws.com/prod
```

## Authentication

### Public Endpoints
- Chat endpoints are publicly accessible
- No authentication required for basic chat functionality

### Admin Endpoints
- Require Amazon Cognito authentication
- Use JWT tokens for authorization
- Admin users must be registered in the Cognito User Pool

## Chat API

### Send Message

Send a message to the chatbot and receive an AI-generated response.

**Endpoint:** `POST /`

**Request Body:**
```json
{
  "message": "What are the requirements for blood donation?",
  "language": "en",
  "sessionId": "optional-session-id"
}
```

**Parameters:**
- `message` (string, required): User's question or message
- `language` (string, optional): Language code ("en" or "es"), defaults to "en"
- `sessionId` (string, optional): Session identifier for conversation continuity

**Response:**
```json
{
  "response": "To donate blood, you must meet several basic requirements...",
  "sources": [
    {
      "title": "Blood Donation Eligibility - Blood Bank",
      "url": "https://americasblood.org/for-donors/eligibility/",
      "type": "WEB",
      "score": 0.95
    }
  ],
  "sessionId": "generated-session-id",
  "conversationId": "unique-conversation-id",
  "language": "en",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad request (invalid parameters)
- `500`: Internal server error

### Health Check

Check API health and system status.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "model": "anthropic.claude-3-haiku-20240307-v1:0",
  "knowledge_base": "kb-12345678"
}
```

## Admin API

### Get Conversations

Retrieve conversation history with filtering and pagination.

**Endpoint:** `GET /admin/conversations`

**Headers:**
```
Authorization: Bearer <cognito-jwt-token>
```

**Query Parameters:**
- `limit` (number, optional): Number of conversations to return (default: 50, max: 100)
- `startDate` (string, optional): Start date filter (ISO 8601 format)
- `endDate` (string, optional): End date filter (ISO 8601 format)
- `language` (string, optional): Filter by language ("en" or "es")
- `lastEvaluatedKey` (string, optional): Pagination token

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv-12345",
      "sessionId": "session-67890",
      "question": "What are blood donation requirements?",
      "answer": "To donate blood, you must meet...",
      "timestamp": "2024-01-15T10:30:00Z",
      "date": "2024-01-15",
      "language": "en",
      "sources": [...]
    }
  ],
  "lastEvaluatedKey": "pagination-token",
  "count": 25,
  "scannedCount": 25
}
```

### Trigger Data Sync

Manually trigger synchronization of knowledge base data sources.

**Endpoint:** `POST /admin/sync`

**Headers:**
```
Authorization: Bearer <cognito-jwt-token>
```

**Request Body:**
```json
{
  "syncType": "all",
  "dataSources": ["pdf", "web", "daily"]
}
```

**Parameters:**
- `syncType` (string, optional): Type of sync ("all", "pdf", "web", "daily")
- `dataSources` (array, optional): Specific data sources to sync

**Response:**
```json
{
  "success": true,
  "message": "Sync initiated successfully",
  "jobs": [
    {
      "dataSourceName": "BloodCentersDocuments",
      "jobId": "job-12345",
      "status": "IN_PROGRESS"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Get System Status

Get comprehensive system status and health information.

**Endpoint:** `GET /admin/status`

**Headers:**
```
Authorization: Bearer <cognito-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "model": "anthropic.claude-3-haiku-20240307-v1:0",
  "knowledge_base": "kb-12345678",
  "components": {
    "api_gateway": "healthy",
    "lambda_functions": "healthy",
    "knowledge_base": "healthy",
    "dynamodb": "healthy",
    "s3": "healthy"
  },
  "metrics": {
    "total_conversations": 1250,
    "conversations_today": 45,
    "average_response_time": "2.3s",
    "success_rate": "99.2%"
  }
}
```

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "error": "Error message description",
  "success": false,
  "details": "Additional error details (in development mode)",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-12345"
}
```

### Common Error Codes

#### 400 Bad Request
- Missing required parameters
- Invalid parameter values
- Malformed request body

#### 401 Unauthorized
- Missing authentication token
- Invalid or expired JWT token
- Insufficient permissions

#### 403 Forbidden
- Access denied to admin endpoints
- User not in admin group

#### 404 Not Found
- Endpoint not found
- Resource not found

#### 429 Too Many Requests
- Rate limit exceeded
- Throttling applied

#### 500 Internal Server Error
- Bedrock service unavailable
- Knowledge base errors
- Database connection issues

## Rate Limiting

### Public Endpoints
- **Chat API**: 100 requests per minute per IP
- **Health Check**: 60 requests per minute per IP

### Admin Endpoints
- **All Admin APIs**: 300 requests per minute per authenticated user

### Headers
Rate limit information is included in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

## CORS Configuration

The API supports cross-origin requests with the following configuration:

**Allowed Origins:** `*` (configurable)
**Allowed Methods:** `GET, POST, PUT, DELETE, OPTIONS`
**Allowed Headers:** `Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token`
**Max Age:** 3600 seconds

## SDK Examples

### JavaScript/Node.js

```javascript
// Chat API Example
const response = await fetch('https://your-api-url/prod', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'What are the blood donation requirements?',
    language: 'en'
  })
});

const data = await response.json();
console.log(data.response);
```

### Python

```python
import requests

# Chat API Example
url = 'https://your-api-url/prod'
payload = {
    'message': 'What are the blood donation requirements?',
    'language': 'en'
}

response = requests.post(url, json=payload)
data = response.json()
print(data['response'])
```

### cURL

```bash
# Chat API Example
curl -X POST https://your-api-url/prod \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the blood donation requirements?",
    "language": "en"
  }'

# Admin API Example (with authentication)
curl -X GET https://your-api-url/prod/admin/conversations \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

## Webhooks

### Conversation Events

The system can be configured to send webhook notifications for conversation events:

**Event Types:**
- `conversation.created`: New conversation started
- `conversation.completed`: Conversation ended
- `error.occurred`: System error encountered

**Webhook Payload:**
```json
{
  "event": "conversation.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "conversationId": "conv-12345",
    "sessionId": "session-67890",
    "language": "en",
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.1"
  }
}
```

## Monitoring and Analytics

### CloudWatch Metrics

The API automatically publishes metrics to CloudWatch:

- **Request Count**: Total number of API requests
- **Error Rate**: Percentage of failed requests
- **Response Time**: Average response time in milliseconds
- **Throttle Count**: Number of throttled requests

### Custom Metrics

- **Conversation Count**: Number of conversations per day
- **Language Distribution**: Usage by language
- **Popular Questions**: Most frequently asked questions
- **Source Citations**: Most referenced sources

## Security Considerations

### Data Privacy
- No personal information is logged
- Conversation content is anonymized
- IP addresses are hashed for analytics

### API Security
- All endpoints use HTTPS
- Request validation and sanitization
- SQL injection and XSS protection
- Rate limiting and throttling

### Authentication Security
- JWT tokens with expiration
- Secure token storage recommendations
- Regular token rotation

## Support and Troubleshooting

### Common Issues

#### Slow Response Times
- Check Knowledge Base ingestion status
- Monitor Lambda function performance
- Verify network connectivity

#### Authentication Errors
- Verify JWT token validity
- Check Cognito user pool configuration
- Ensure proper IAM permissions

#### Rate Limiting
- Implement exponential backoff
- Cache responses when appropriate
- Monitor usage patterns

### Getting Help

For API support:
1. Check CloudWatch logs for error details
2. Verify request format and parameters
3. Test with provided examples
4. Contact system administrators for persistent issues