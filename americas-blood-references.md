# America's Blood Centers — All References Across the Codebase

This document lists every reference to "America's Blood Centers" (or variations like "Blood Bank", "ABC", "AmericasBlood", "americasblood.org") found in the project, file by file. Files with no references are explicitly noted.

**Status: ✅ = replaced, 🔗 = left as URL/repo (per instructions), 📄 = left as PDF filename (per instructions)**

---

## Root Files

### `README.md`

| Line | Original Snippet                                                          | Status                                                          |
| ---- | ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1    | `# America's Blood Centers AI Chatbot`                                    | ✅ → `# Blood Bank AI Chatbot`                                   |
| 3    | `...for America's Blood Centers.`                                         | ✅ → `...for Blood Bank.`                                        |
| 9    | `alt="America's Blood Centers Chatbot Demo"`                              | ✅ → `alt="Blood Bank Chatbot Demo"`                             |
| 51   | `America's Blood Centers AI Chatbot is a conversational AI assistant...`  | ✅ → `Blood Bank AI Chatbot is a conversational AI assistant...` |
| 61   | `- **Blood Center Locator** integration...`                               | ✅ (already generic, no org name)                                |
| 88   | `git clone https://github.com/your-org/America-Blood-Centers-chatbot.git` | 🔗 Left as-is (repo URL)                                         |
| 89   | `cd America-Blood-Centers-chatbot/Backend`                                | 🔗 Left as-is (repo path)                                        |
| 133  | `# America's Blood Centers logo`                                          | ✅ → `# Blood Bank logo`                                         |
| 158  | `americasblood.org`                                                       | 🔗 Left as-is (URL)                                              |
| 191  | `developed for America's Blood Centers`                                   | ✅ → `developed for Blood Bank`                                  |

### `LICENSE`

No references.

---

## Backend/

### `Backend/package.json`

| Line | Original Snippet                                                                    | Status                                                                     |
| ---- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 3    | `"name": "americas-blood-centers-bedrock-backend"`                                  | ✅ → `"name": "blood-bank-bedrock-backend"`                                 |
| 5    | `"description": "America's Blood Centers Chatbot - Bedrock Implementation Backend"` | ✅ → `"description": "Blood Bank Chatbot - Bedrock Implementation Backend"` |
| 35   | `"author": "America's Blood Centers"`                                               | ✅ → `"author": "Blood Bank"`                                               |

### `Backend/package-lock.json`

| Line | Original Snippet                                   | Status                                     |
| ---- | -------------------------------------------------- | ------------------------------------------ |
| 3    | `"name": "americas-blood-centers-bedrock-backend"` | ✅ → `"name": "blood-bank-bedrock-backend"` |
| 9    | `"name": "americas-blood-centers-bedrock-backend"` | ✅ → `"name": "blood-bank-bedrock-backend"` |

### `Backend/cdk.json`

No references.

### `Backend/tsconfig.json`

No references.

### `Backend/.gitignore`

No references.

### `Backend/buildspec.yml`

| Line | Original Snippet                                                  | Status                                                     |
| ---- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| 42   | `cdk destroy AmericasBloodCentersBedrockStack`                    | ✅ → `BloodBankBedrockStack`                                |
| 49   | `echo "Deploying America's Blood Centers Bedrock Chatbot"`        | ✅ → `"Deploying Blood Bank Bedrock Chatbot"`               |
| 62   | `cdk deploy AmericasBloodCentersBedrockStack`                     | ✅ → `BloodBankBedrockStack`                                |
| 76   | `STACK_NAME="AmericasBloodCentersBedrockStack"`                   | ✅ → `"BloodBankBedrockStack"`                              |
| 77   | `.AmericasBloodCentersBedrockStack.DocumentsBucketName`           | ✅ → `.BloodBankBedrockStack.DocumentsBucketName`           |
| 78   | `.AmericasBloodCentersBedrockStack.KnowledgeBaseId`               | ✅ → `.BloodBankBedrockStack.KnowledgeBaseId`               |
| 79   | `.AmericasBloodCentersBedrockStack.ChatLambdaFunctionUrl`         | ✅ → `.BloodBankBedrockStack.ChatLambdaFunctionUrl`         |
| 80   | `.AmericasBloodCentersBedrockStack.OpenSearchCollectionEndpoint`  | ✅ → `.BloodBankBedrockStack.OpenSearchCollectionEndpoint`  |
| 103  | `.AmericasBloodCentersBedrockStack.SequentialSyncStateMachineArn` | ✅ → `.BloodBankBedrockStack.SequentialSyncStateMachineArn` |
| 135  | `.AmericasBloodCentersBedrockStack.AmplifyAppId`                  | ✅ → `.BloodBankBedrockStack.AmplifyAppId`                  |
| 157  | `.AmericasBloodCentersBedrockStack.AdminUserPoolId`               | ✅ → `.BloodBankBedrockStack.AdminUserPoolId`               |
| 158  | `.AmericasBloodCentersBedrockStack.AdminUserPoolClientId`         | ✅ → `.BloodBankBedrockStack.AdminUserPoolClientId`         |
| 187  | `.AmericasBloodCentersBedrockStack.BuildsBucketName`              | ✅ → `.BloodBankBedrockStack.BuildsBucketName`              |

### `Backend/deploy.sh`

| Line | Original Snippet                                              | Status                                               |
| ---- | ------------------------------------------------------------- | ---------------------------------------------------- |
| 5    | `# America's Blood Centers Bedrock Chatbot Deployment Script` | ✅ → `# Blood Bank Bedrock Chatbot Deployment Script` |

### `Backend/bin/bedrock-stack.ts`

| Line | Original Snippet                                                   | Status                                      |
| ---- | ------------------------------------------------------------------ | ------------------------------------------- |
| 25   | `'AmericasBloodCentersBedrockStack'`                               | ✅ → `'BloodBankBedrockStack'`               |
| 33   | `description: 'America\'s Blood Centers Chatbot using Bedrock...'` | ✅ → `'Blood Bank Chatbot using Bedrock...'` |
| 35   | `Project: 'AmericasBloodCenters'`                                  | ✅ → `Project: 'BloodBank'`                  |

### `Backend/lib/bedrock-chatbot-stack.ts`

| Line | Original Snippet                                                         | Status             |
| ---- | ------------------------------------------------------------------------ | ------------------ |
| ~554 | `{ url: "https://americasblood.org/" }`                                  | 🔗 Left as-is (URL) |
| ~555 | `{ url: "https://americasblood.org/for-donors/" }`                       | 🔗 Left as-is (URL) |
| ~556 | `{ url: "https://americasblood.org/for-donors/find-a-blood-center/" }`   | 🔗 Left as-is (URL) |
| ~557 | `{ url: "https://americasblood.org/for-donors/americas-blood-supply/" }` | 🔗 Left as-is (URL) |
| ~614 | `{ url: "https://americasblood.org/for-donors/americas-blood-supply/" }` | 🔗 Left as-is (URL) |
| ~690 | `BLOOD_CENTER_LOCATOR_URL: 'https://americasblood.org/...'`              | 🔗 Left as-is (URL) |

### `Backend/lambda/chat-lambda-streaming/index.js`

| Line | Original Snippet                                              | Status                                        |
| ---- | ------------------------------------------------------------- | --------------------------------------------- |
| 1    | `// Streaming Chat Lambda for America's Blood Centers`        | ✅ → `// Streaming Chat Lambda for Blood Bank` |
| 259  | `para America's Blood Centers`                                | ✅ → `para Blood Bank`                         |
| 277  | `for America's Blood Centers`                                 | ✅ → `for Blood Bank`                          |
| 289  | `America's Blood Centers information`                         | ✅ → `Blood Bank information`                  |
| 516  | `"America's Blood Centers - News"`                            | ✅ → `"Blood Bank - News"`                     |
| 518  | `"America's Blood Centers - For Donors"`                      | ✅ → `"Blood Bank - For Donors"`               |
| 520  | `"America's Blood Centers - FAQs"`                            | ✅ → `"Blood Bank - FAQs"`                     |
| 522  | `"America's Blood Centers - Newsroom"`                        | ✅ → `"Blood Bank - Newsroom"`                 |
| 629  | `contacta directamente a America's Blood Centers`             | ✅ → `contacta directamente a Blood Bank`      |
| 631  | `contact America's Blood Centers directly`                    | ✅ → `contact Blood Bank directly`             |
| 551  | `'https://americasblood.org/for-donors/find-a-blood-center/'` | 🔗 Left as-is (URL)                            |

### `Backend/lambda/chat-lambda-streaming/package.json`

No references.

### `Backend/lambda/daily-sync-lambda/daily_sync.py`

No references.

### `Backend/lambda/daily-sync-lambda/requirements.txt`

No references.

### `Backend/lambda/sync-operations/sync_operations.py`

No references.

### `Backend/lambda/sync-operations/requirements.txt`

No references.

### `Backend/data-sources/urls.txt`

| Line | Original Snippet                                                   | Status                                                    |
| ---- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| 1    | `# America's Blood Centers - Web URLs and PDFs for Knowledge Base` | ✅ → `# Blood Bank - Web URLs and PDFs for Knowledge Base` |
| 6    | `https://americasblood.org`                                        | 🔗 Left as-is (URL)                                        |
| 10   | `https://americasblood.org/for-donors/americas-blood-supply/`      | 🔗 Left as-is (URL)                                        |
| 11   | `https://americasblood.org/for-donors/find-a-blood-center/`        | 🔗 Left as-is (URL)                                        |
| 14   | `https://americasblood.org/one-pagers-faqs/...`                    | 🔗 Left as-is (URL)                                        |

### `Backend/data-sources/daily-sync.txt`

| Line | Original Snippet                                              | Status             |
| ---- | ------------------------------------------------------------- | ------------------ |
| 3    | `https://americasblood.org/for-donors/americas-blood-supply/` | 🔗 Left as-is (URL) |

### `Backend/data-sources/pdfs/` (PDF filenames)

| Filename                                                                    | Status                      |
| --------------------------------------------------------------------------- | --------------------------- |
| `ABC-Ensuring-the-Safety-of-the-U.S.-Blood-Supply.pdf`                      | 📄 Left as-is (PDF filename) |
| `ABC-FAQ-on-FDAs-IDA-Change-Final.pdf`                                      | 📄 Left as-is (PDF filename) |
| `ABC-Frequently-Asked-Questions-about-Alpha-Gal-Syndrome-Final.pdf`         | 📄 Left as-is (PDF filename) |
| `ABC-Promoting-Awareness-of-New-Eligibility-Criteria-Final.pdf`             | 📄 Left as-is (PDF filename) |
| `ABC-Strengthening-the-Cyber-Resilience-of-the-Blood-Community-5.28.25.pdf` | 📄 Left as-is (PDF filename) |
| `Americas-Blood-Centers-2025-Advocacy-Agenda.pdf`                           | 📄 Left as-is (PDF filename) |

---

## Frontend/

### `Frontend/package.json`

| Line | Original Snippet                            | Status                              |
| ---- | ------------------------------------------- | ----------------------------------- |
| 3    | `"name": "americas-blood-centers-frontend"` | ✅ → `"name": "blood-bank-frontend"` |

### `Frontend/package-lock.json`

| Line | Original Snippet                            | Status                              |
| ---- | ------------------------------------------- | ----------------------------------- |
| 3    | `"name": "americas-blood-centers-frontend"` | ✅ → `"name": "blood-bank-frontend"` |
| 9    | `"name": "americas-blood-centers-frontend"` | ✅ → `"name": "blood-bank-frontend"` |

### `Frontend/public/index.html`

No references (already used "Blood Bank AI" before changes).

### `Frontend/public/manifest.json`

| Line | Original Snippet                | Status                                     |
| ---- | ------------------------------- | ------------------------------------------ |
| 3    | `"short_name": "ABC Assistant"` | ✅ → `"short_name": "Blood Bank Assistant"` |

### `Frontend/public/_redirects`

No references.

### `Frontend/src/index.js`

No references.

### `Frontend/src/index.css`

No references.

### `Frontend/src/App.js`

No references.

### `Frontend/src/theme.js`

No references.

### `Frontend/src/utilities/constants.js`

No references (already used "Blood Bank AI" before changes).

### `Frontend/src/Assets/AmericasBloodCentersLogo.jsx`

| Line | Original Snippet                           | Status                              |
| ---- | ------------------------------------------ | ----------------------------------- |
| 1    | `const AmericasBloodCentersLogo = (...)`   | ✅ → `const BloodBankLogo = (...)`   |
| 27   | `export default AmericasBloodCentersLogo;` | ✅ → `export default BloodBankLogo;` |

### `Frontend/src/Components/BotReply.jsx`

No references.

### `Frontend/src/Components/ChatBody.jsx`

No references (already used "Blood Bank AI" before changes).

### `Frontend/src/Components/FAQExamples.jsx`

No references.

### `Frontend/src/Components/LeftNav.jsx`

No references.

### `Frontend/src/Components/MainChat.jsx`

No references.

### `Frontend/src/Components/MarkdownContent.jsx`

No references.

### `Frontend/src/Components/UserReply.jsx`

No references.

### `Frontend/src/admin/index.js`

No references.

### `Frontend/src/admin/AdminLogin.jsx`

No references (already used "Blood Bank AI" before changes).

### `Frontend/src/admin/AdminPage.jsx`

| Line | Original Snippet                                    | Status                                     |
| ---- | --------------------------------------------------- | ------------------------------------------ |
| 616  | `Sync only America's Blood Centers website content` | ✅ → `Sync only Blood Bank website content` |

### `Frontend/src/admin/AdminWrapper.jsx`

No references.

### `Frontend/src/services/authService.js`

No references.

---

## docs/

### `docs/APIDoc.md`

| Line | Original Snippet                                                   | Status                                                    |
| ---- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| 6    | `The America's Blood Centers AI Chatbot provides a RESTful API...` | ✅ → `The Blood Bank AI Chatbot provides a RESTful API...` |
| 53   | `"title": "Blood Donation Eligibility - America's Blood Centers"`  | ✅ → `"Blood Donation Eligibility - Blood Bank"`           |
| 54   | `"url": "https://americasblood.org/for-donors/eligibility/"`       | 🔗 Left as-is (URL)                                        |

### `docs/architectureDeepDive.md`

| Line | Original Snippet         | Status                       |
| ---- | ------------------------ | ---------------------------- |
| 74   | `from americasblood.org` | 🔗 Left as-is (URL reference) |

### `docs/deploymentGuide.md`

| Line    | Original Snippet                                                          | Status                                   |
| ------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| 41      | `git clone https://github.com/your-org/America-Blood-Centers-chatbot.git` | 🔗 Left as-is (repo URL)                  |
| 42      | `cd America-Blood-Centers-chatbot`                                        | 🔗 Left as-is (repo path)                 |
| 68      | `https://github.com/yourorg/America-Blood-Centers-chatbot`                | 🔗 Left as-is (repo URL)                  |
| 69      | `blood-centers` (project name default)                                    | ✅ → `blood-bank`                         |
| 86      | `"blood-centers-deploy"`                                                  | ✅ → `"blood-bank-deploy"`                |
| 102     | `"blood-centers-documents-{account}-{region}"`                            | ✅ → `"blood-bank-documents-..."`         |
| 108-111 | `https://americasblood.org/...`                                           | 🔗 Left as-is (URLs)                      |
| 125     | `"blood-centers-admin-user-pool"`                                         | ✅ → `"blood-bank-admin-user-pool"`       |
| 156     | `--stack-name AmericasBloodCentersBedrockStack`                           | ✅ → `--stack-name BloodBankBedrockStack` |
| 186     | `--stack-name AmericasBloodCentersBedrockStack`                           | ✅ → `--stack-name BloodBankBedrockStack` |
| 192     | `--stack-name AmericasBloodCentersBedrockStack`                           | ✅ → `--stack-name BloodBankBedrockStack` |
| 330     | `cdk deploy AmericasBloodCentersBedrockStack`                             | ✅ → `cdk deploy BloodBankBedrockStack`   |

### `docs/userGuide.md`

| Line | Original Snippet                                                                 | Status                                         |
| ---- | -------------------------------------------------------------------------------- | ---------------------------------------------- |
| 75   | `Direct links to America's Blood Centers pages`                                  | ✅ → `Direct links to Blood Bank pages`         |
| 240  | `Visit americasblood.org`                                                        | 🔗 Left as-is (URL)                             |
| 276  | `**America's Blood Centers**: [americasblood.org](...)`                          | ✅ → `**Blood Bank**: [americasblood.org](...)` |
| 277  | `**Blood Center Locator**: [Find a Blood Center](https://americasblood.org/...)` | 🔗 Left as-is (URL)                             |

### `docs/modificationGuide.md`

| Line | Original Snippet                                                          | Status                   |
| ---- | ------------------------------------------------------------------------- | ------------------------ |
| 21   | `git clone https://github.com/your-org/America-Blood-Centers-chatbot.git` | 🔗 Left as-is (repo URL)  |
| 22   | `cd America-Blood-Centers-chatbot`                                        | 🔗 Left as-is (repo path) |
| 545  | `--context projectName=blood-centers-dev`                                 | ✅ → `blood-bank-dev`     |
| 554  | `--context projectName=blood-centers-prod`                                | ✅ → `blood-bank-prod`    |

### `docs/Architecture_Diagram.png`

Binary file — not searchable.

### `docs/AWS Prerequisites Guide.pdf`

Binary file — not searchable.

### `docs/media/Demo.gif`

Binary file — not searchable.

### `docs/media/.gitkeep`

No references.

---

## Summary of Changes

| Original Variant                   | Replaced With           | Notes                                         |
| ---------------------------------- | ----------------------- | --------------------------------------------- |
| `America's Blood Centers`          | `Blood Bank`            | Organization name in prose, comments, prompts |
| `AmericasBloodCenters`             | `BloodBank`             | Stack name, tag value (camelCase)             |
| `AmericasBloodCentersBedrockStack` | `BloodBankBedrockStack` | CDK stack identifier                          |
| `americas-blood-centers`           | `blood-bank`            | Package names (kebab-case)                    |
| `AmericasBloodCentersLogo`         | `BloodBankLogo`         | Component/variable name                       |
| `ABC Assistant`                    | `Blood Bank Assistant`  | manifest.json short_name                      |
| `blood-centers` (default)          | `blood-bank`            | Project name defaults in scripts/docs         |
| `America-Blood-Centers`            | *Left as-is*            | Repository/URL slug                           |
| `americasblood.org`                | *Left as-is*            | Website domain in URLs                        |
| `Blood Bank AI`                    | *Left as-is*            | Already the product name                      |
| `Blood Bank` (in docs/code)        | *Left as-is*            | Already correct                               |
| `Banco de Sangre IA`               | *Left as-is*            | Already correct Spanish translation           |
| PDF filenames (`ABC-...`)          | *Left as-is*            | Per instructions                              |
