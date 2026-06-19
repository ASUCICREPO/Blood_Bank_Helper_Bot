#!/usr/bin/env bash
set -euo pipefail

# Blood Bank Bedrock Chatbot Deployment Script
# Uses CodeBuild for cloud-based deployment to avoid local permission issues

if [ -z "${GITHUB_URL:-}" ]; then
  read -rp "Enter source GitHub repository URL (e.g., https://github.com/OWNER/REPO): " GITHUB_URL
fi

clean_url=${GITHUB_URL%.git}
clean_url=${clean_url%/}

if [ -z "${PROJECT_NAME:-}" ]; then
  read -rp "Enter project name [default: blood-bank]: " PROJECT_NAME
  PROJECT_NAME=${PROJECT_NAME:-blood-bank}
fi

if [ -z "${MODEL_ID:-}" ]; then
  read -rp "Enter Bedrock model ID [default: global.anthropic.claude-sonnet-4-5-20250929-v1:0]: " MODEL_ID
  MODEL_ID=${MODEL_ID:-global.anthropic.claude-sonnet-4-5-20250929-v1:0}
fi

if [ -z "${EMBEDDING_MODEL_ID:-}" ]; then
  read -rp "Enter embedding model ID [default: amazon.titan-embed-text-v1]: " EMBEDDING_MODEL_ID
  EMBEDDING_MODEL_ID=${EMBEDDING_MODEL_ID:-amazon.titan-embed-text-v1}
fi

if [ -z "${AWS_REGION:-}" ]; then
  read -rp "Enter AWS region [default: us-east-1]: " AWS_REGION
  AWS_REGION=${AWS_REGION:-us-east-1}
fi

if [ -z "${BRANCH:-}" ]; then
  read -rp "Enter source branch [default: master]: " BRANCH
  BRANCH=${BRANCH:-master}
fi

if [ -z "${ACTION:-}" ]; then
  read -rp "Enter action [deploy/destroy]: " ACTION
  ACTION=$(printf '%s' "$ACTION" | tr '[:upper:]' '[:lower:]')
fi

if [[ "$ACTION" != "deploy" && "$ACTION" != "destroy" ]]; then
  echo "Invalid action: '$ACTION'. Choose 'deploy' or 'destroy'."
  exit 1
fi

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

ROLE_NAME="${PROJECT_NAME}-codebuild-service-role"
echo "Checking for IAM role: $ROLE_NAME"

if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  echo "✓ IAM role exists"
  ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
else
  echo "✱ Creating IAM role: $ROLE_NAME"
  TRUST_DOC='{
    "Version":"2012-10-17",
    "Statement":[{
      "Effect":"Allow",
      "Principal":{"Service":"codebuild.amazonaws.com"},
      "Action":"sts:AssumeRole"
    }]
  }'

  ROLE_ARN=$(aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_DOC" \
    --query 'Role.Arn' --output text)

  echo "Attaching policies..."
  aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

  echo "Waiting for IAM role to propagate..."
  sleep 10
fi

CODEBUILD_PROJECT_NAME="${PROJECT_NAME}-deploy"
echo "Creating CodeBuild project: $CODEBUILD_PROJECT_NAME"

ENV_VARS=$(cat <<EOF
[
  {"name": "PROJECT_NAME", "value": "$PROJECT_NAME", "type": "PLAINTEXT"},
  {"name": "MODEL_ID", "value": "$MODEL_ID", "type": "PLAINTEXT"},
  {"name": "EMBEDDING_MODEL_ID", "value": "$EMBEDDING_MODEL_ID", "type": "PLAINTEXT"},
  {"name": "ACTION", "value": "$ACTION", "type": "PLAINTEXT"},
  {"name": "CDK_DEFAULT_REGION", "value": "$AWS_REGION", "type": "PLAINTEXT"}
]
EOF
)

ENVIRONMENT=$(cat <<EOF
{
  "type": "LINUX_CONTAINER",
  "image": "aws/codebuild/standard:7.0",
  "computeType": "BUILD_GENERAL1_MEDIUM",
  "environmentVariables": $ENV_VARS
}
EOF
)

ARTIFACTS='{"type":"NO_ARTIFACTS"}'
SOURCE=$(cat <<EOF
{
  "type":"GITHUB",
  "location":"$GITHUB_URL",
  "buildspec":"Backend/buildspec.yml"
}
EOF
)

if aws codebuild batch-get-projects --names "$CODEBUILD_PROJECT_NAME" --query 'projects[0].name' --output text 2>/dev/null | grep -q "$CODEBUILD_PROJECT_NAME"; then
  echo "Deleting existing CodeBuild project..."
  aws codebuild delete-project --name "$CODEBUILD_PROJECT_NAME"
  sleep 5
fi

aws codebuild create-project \
  --name "$CODEBUILD_PROJECT_NAME" \
  --source "$SOURCE" \
  --artifacts "$ARTIFACTS" \
  --environment "$ENVIRONMENT" \
  --service-role "$ROLE_ARN" \
  --output json \
  --no-cli-pager

if [ $? -eq 0 ]; then
  echo "✓ CodeBuild project '$CODEBUILD_PROJECT_NAME' created."
else
  echo "✗ Failed to create CodeBuild project."
  exit 1
fi

echo "Starting Bedrock deployment..."
BUILD_ID=$(aws codebuild start-build \
  --project-name "$CODEBUILD_PROJECT_NAME" \
  --source-version "$BRANCH" \
  --query 'build.id' \
  --output text)

if [ $? -eq 0 ]; then
  echo "✓ Build started with ID: $BUILD_ID"
  echo "You can monitor the build progress in the AWS Console:"
  echo "https://console.aws.amazon.com/codesuite/codebuild/projects/$CODEBUILD_PROJECT_NAME/build/$BUILD_ID"
else
  echo "✗ Failed to start build."
  exit 1
fi

echo ""

echo "=== Deployment Information ==="
echo "Project Name: $PROJECT_NAME"
echo "GitHub Repo URL: $GITHUB_URL"
echo "Branch: $BRANCH"
echo "Model ID: $MODEL_ID"
echo "Embedding Model: $EMBEDDING_MODEL_ID"
echo "Region: $AWS_REGION"
echo "Action: $ACTION"
echo "Build ID: $BUILD_ID"
echo ""
echo "🚀 The Bedrock deployment will:"
echo "1. Deploy backend infrastructure via CDK"
echo "2. Create OpenSearch Serverless collection"
echo "3. Create Bedrock Knowledge Base with dual data sources:"
echo "   - S3 Data Source: PDFs with Bedrock Data Automation parser"
echo "   - Web Crawler Data Source: Websites with automatic crawling"
echo "4. Upload initial documents and trigger ingestion"
echo "5. Configure Lambda functions with environment variables"
echo ""
echo "📊 Data Sources:"
echo "- PDF URLs: Read from Backend/data-sources/urls.txt"
echo "- Website URLs: Crawled automatically from seed URLs"
echo "- Manual PDFs: Upload to Backend/data-sources/ folder"
echo ""
echo "⏱️ Total deployment time: ~15-25 minutes"
echo "📊 Monitor progress in CodeBuild console above"
echo ""
echo "💰 Expected monthly cost: \$8-20 (vs \$20+ for Q Business)"
echo "🎯 Features: Bilingual support, blood center detection, daily sync"

exit 0