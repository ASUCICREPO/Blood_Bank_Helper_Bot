# Deployment Guide

## Prerequisites

### AWS Account Setup
1. **AWS Account**: Ensure you have an AWS account with appropriate permissions
2. **Bedrock Access**: Enable access to Amazon Bedrock models in your region
3. **AWS CLI**: Install and configure AWS CLI with your credentials
4. **Node.js**: Install Node.js (version 18 or later)
5. **Git**: Ensure Git is installed for repository cloning

### Required AWS Permissions
Your AWS user/role needs the following permissions:
- Full access to AWS CDK operations
- Bedrock model invocation and knowledge base management
- S3, Lambda, API Gateway, DynamoDB, and Cognito permissions
- CodeBuild and Amplify permissions for deployment

## Step-by-Step Deployment

## Deployment Using AWS CodeBuild and CloudShell

This is the **recommended deployment method**.

### Prerequisites

- Access to AWS CloudShell
- AWS account with CodeBuild permissions

### Deployment Steps

#### 1. Open AWS CloudShell

1. Log in to the AWS Console
2. Click the **CloudShell icon** in the AWS Console navigation bar (terminal icon)
3. Wait for the CloudShell environment to initialize

### 2. Clone the Repository
```bash
git clone https://github.com/your-org/America-Blood-Centers-chatbot.git
cd America-Blood-Centers-chatbot
```

### 3. Backend Deployment

#### Navigate to Backend Directory
```bash
cd Backend
```

#### Add Your Knowledge Base Reference URLs (Required)

Before deploying, you must add the reference URLs you want the Knowledge Base to crawl.

1. **Web crawler sources** — edit `Backend/data-sources/urls.txt` and add one URL
   per line. These pages are crawled once when the Knowledge Base is built.
   ```text
   https://your-organization.org/
   https://your-organization.org/faqs/
   ```
2. **Daily sync sources** — edit `Backend/data-sources/daily-sync.txt` and add one
   URL per line for pages that change frequently and should be re-crawled every
   day at 2 PM EST.
   ```text
   https://your-organization.org/live-status/
   ```

Notes:
- Lines beginning with `#` are treated as comments and ignored, as are blank lines.
- URLs are read at deploy time. To change the crawled sites later, edit these files
  and redeploy.
- If a file contains no URLs, that data source is skipped. PDF documents in
  `Backend/data-sources/pdfs/` are still ingested regardless.

#### Configure Environment
The deployment script will prompt you for:
- Project name (default: blood-bank) 
- Bedrock model ID (default: global.anthropic.claude-sonnet-4-5-20250929-v1:0)
- Embedding model ID (default: amazon.titan-embed-text-v1)
- AWS region (default: us-east-1)
- Source branch (default: master)

#### Run Deployment Script
```bash
chmod +x deploy.sh
./deploy.sh
```

The script will prompt you for:

| Prompt                | Description                                     | Default                                            | Example                                                    |
| --------------------- | ----------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| GitHub repository URL | Your repository URL containing the chatbot code | None (required)                                    | `https://github.com/yourorg/America-Blood-Centers-chatbot` |
| Project name          | Unique name for your deployment resources       | `blood-bank`                                       | `blood-bank`                                               |
| Bedrock model ID      | Claude model for chat responses                 | `global.anthropic.claude-sonnet-4-5-20250929-v1:0` | Press Enter for default                                    |
| Embedding model ID    | Model for text embeddings                       | `amazon.titan-embed-text-v1`                       | Press Enter for default                                    |
| AWS region            | Region to deploy resources into                 | `us-east-1`                                        | Press Enter for default                                    |
| Source branch         | Git branch to build and deploy                  | `master`                                           | `main`                                                     |
| Action                | Deploy or destroy the stack                     | None (required)                                    | `deploy`                                                   |


The script will:
1. Create necessary IAM roles
2. Set up CodeBuild project
3. Deploy infrastructure via CDK
4. Configure Knowledge Base and data sources
5. Deploy frontend to Amplify

### 4. Monitor Deployment

#### Check CodeBuild Progress
1. Go to AWS Console → CodeBuild
2. Find your project (e.g., "blood-bank-deploy")
3. Monitor the build logs for progress

#### Verify Resources
After deployment, verify these resources are created:
- **S3 Buckets**: Documents, supplemental data, builds
- **Lambda Functions**: Chat, sync operations, daily sync
- **API Gateway**: REST API with endpoints
- **Bedrock Knowledge Base**: With data sources configured
- **DynamoDB Table**: For conversation history
- **Amplify App**: Frontend hosting

### 4. Post-Deployment Configuration

#### Upload Initial Documents
1. Navigate to S3 console
2. Find the documents bucket (e.g., "blood-bank-documents-{account}-{region}")
3. Upload PDF files to the `pdfs/` folder
4. Trigger knowledge base ingestion

#### Configure Web Crawler
The web crawler ingests the URLs you added to `Backend/data-sources/urls.txt`
before deployment. To add or change crawled sites, edit that file and redeploy.
The daily sync crawler uses the URLs in `Backend/data-sources/daily-sync.txt`.

#### Set Up Daily Sync
Daily sync is automatically configured to run at 2 PM EST daily.

### 6. Admin User Management

After deployment, the Cognito User Pool will be empty. You need to manually add admin users who can access the admin dashboard.

#### Option 1: Using AWS Console (Recommended)

1. **Navigate to Cognito Console**:
   - Go to AWS Console → Amazon Cognito
   - Click "User pools"
   - Find your user pool (e.g., "blood-bank-admin-user-pool")

2. **Create Admin User**:
   - Click on your user pool name
   - Go to "Users" tab
   - Click "Create user"

3. **Configure User Details**:
   - **Username**: Enter desired admin username (e.g., "admin", "john.doe")
   - **Email**: Enter admin's email address (optional)
   - **Temporary password**: Create a secure temporary password
   - **Phone number**: Optional
   - **Mark email as verified**: Check this box (optional)
   - **Send invitation**: Uncheck if you want to share credentials manually

4. **Set Password Policy**:
   - Password must be at least 8 characters
   - Must contain uppercase letter (A-Z)
   - Must contain lowercase letter (a-z)
   - Must contain at least one number (0-9)

5. **Complete Setup**:
   - Click "Create user"
   - Share the username and temporary password with the admin
   - Admin will be prompted to change password on first login

#### Option 2: Using AWS CLI

```bash
# Get your User Pool ID from CDK outputs
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name BloodBankBedrockStack \
  --query 'Stacks[0].Outputs[?OutputKey==`AdminUserPoolId`].OutputValue' \
  --output text)

# Create admin user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username admin \
  --user-attributes Name=email,Value=admin@yourorganization.com Name=email_verified,Value=true \
  --temporary-password "TempPassword123!" \
  --message-action SUPPRESS

# Set permanent password (optional)
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username admin \
  --password "YourSecurePassword123!" \
  --permanent
```

#### Option 3: Using CDK Outputs

If you need to find your User Pool ID:

```bash
# Navigate to your Backend directory
cd Backend

# Get User Pool ID from CDK outputs
aws cloudformation describe-stacks \
  --stack-name BloodBankBedrockStack \
  --query 'Stacks[0].Outputs[?OutputKey==`AdminUserPoolId`].OutputValue' \
  --output text

# Get User Pool Client ID
aws cloudformation describe-stacks \
  --stack-name BloodBankBedrockStack \
  --query 'Stacks[0].Outputs[?OutputKey==`AdminUserPoolClientId`].OutputValue' \
  --output text
```

#### Managing Existing Users

**Reset User Password**:
```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username existing-admin \
  --password "NewSecurePassword123!" \
  --permanent
```

**Delete User**:
```bash
aws cognito-idp admin-delete-user \
  --user-pool-id $USER_POOL_ID \
  --username username-to-delete
```

**List All Users**:
```bash
aws cognito-idp list-users \
  --user-pool-id $USER_POOL_ID
```

#### First Login Process

1. **Access Admin Dashboard**:
   - Go to your deployed application URL
   - Navigate to `/admin` (e.g., `https://your-amplify-app-url/admin`)

2. **Login with Temporary Credentials**:
   - Enter the username and temporary password
   - Click "Access Dashboard"

3. **Change Password** (if using temporary password):
   - You'll be prompted to create a new password
   - Follow the password requirements
   - Complete the password change

4. **Access Dashboard**:
   - After successful login, you'll be redirected to the admin dashboard
   - You can now monitor conversations, trigger data sync, and view system status

#### Security Best Practices

- **Use Strong Passwords**: Ensure all admin passwords meet security requirements
- **Limit Admin Users**: Only create accounts for users who need admin access
- **Regular Audits**: Periodically review and remove unused admin accounts
- **Email Verification**: Always verify admin email addresses
- **Monitor Access**: Check CloudWatch logs for admin login activities

## Environment Variables

### Backend Environment Variables
These are automatically set during deployment:
```bash
PROJECT_NAME=your-project-name
MODEL_ID=your-bedrock-model-id
EMBEDDING_MODEL_ID=your-embedding-model-id
CDK_DEFAULT_REGION=your-aws-region
```

### Frontend Environment Variables
These are automatically configured in Amplify:
```bash
REACT_APP_API_BASE_URL=your-api-gateway-url
REACT_APP_CHAT_ENDPOINT=your-api-gateway-url
REACT_APP_USER_POOL_ID=your-cognito-user-pool-id
REACT_APP_USER_POOL_CLIENT_ID=your-cognito-client-id
REACT_APP_AWS_REGION=your-aws-region
```

## Troubleshooting

### Common Issues

#### 1. Bedrock Model Access Denied
**Error**: "Access denied to Bedrock model"
**Solution**: 
1. Go to AWS Bedrock console
2. Navigate to "Model access"
3. Request access to required models
4. Wait for approval (usually immediate for standard models)

#### 2. CDK Bootstrap Failed
**Error**: "CDK bootstrap failed"
**Solution**:
```bash
# Ensure AWS CLI is configured
aws sts get-caller-identity

# Force re-bootstrap
cdk bootstrap --force
```

#### 3. Knowledge Base Ingestion Stuck
**Error**: "Ingestion job stuck in progress"
**Solution**:
```bash
# Check ingestion status
aws bedrock-agent list-ingestion-jobs \
  --knowledge-base-id YOUR_KB_ID \
  --region us-east-1

# Cancel stuck job if needed
aws bedrock-agent stop-ingestion-job \
  --knowledge-base-id YOUR_KB_ID \
  --data-source-id YOUR_DATA_SOURCE_ID \
  --ingestion-job-id YOUR_JOB_ID \
  --region us-east-1
```

#### 4. Frontend Build Failed
**Error**: "Frontend build failed in Amplify"
**Solution**:
1. Check Amplify console for build logs
2. Verify environment variables are set correctly
3. Ensure API Gateway URL is accessible

### Deployment Logs
Monitor deployment progress in:
- **CodeBuild Console**: Real-time build logs
- **CloudFormation**: Stack creation progress
- **Amplify Console**: Frontend deployment status

## Manual Deployment (Alternative)

If the automated script fails, you can deploy manually:

### 1. Deploy Backend Infrastructure
```bash
cd Backend
npm run build
cdk deploy BloodBankBedrockStack --require-approval never \
  --context projectName="your-project-name" \
  --context modelId="your-model-id" \
  --context embeddingModelId="your-embedding-model-id"
```

### 2. Deploy Frontend
```bash
cd Frontend
npm install
npm run build

# Upload to Amplify or S3 bucket
```

### 3. Configure Data Sources
Use AWS CLI or console to:
1. Upload documents to S3
2. Start knowledge base ingestion
3. Configure web crawler data sources

## Security Considerations

### IAM Roles
- Ensure least privilege access for all roles
- Regularly review and audit permissions
- Use temporary credentials where possible

### API Security
- Enable API Gateway throttling
- Configure CORS appropriately
- Monitor for unusual traffic patterns

### Data Protection
- Enable S3 bucket encryption
- Use VPC endpoints for internal communication
- Implement proper logging without sensitive data

## Cost Optimization

### Expected Monthly Costs
- **Development**: $10-30/month
- **Production**: $50-200/month (depending on usage)

### Cost Factors
- Bedrock model invocations
- OpenSearch Serverless usage
- Lambda function executions
- S3 storage and requests
- API Gateway requests

### Optimization Tips
1. Use appropriate Bedrock models (Haiku for simple queries, Sonnet for complex)
2. Implement caching for frequently asked questions
3. Monitor and optimize Lambda memory allocation
4. Use S3 lifecycle policies for old documents
5. Set up billing alerts and cost monitoring
