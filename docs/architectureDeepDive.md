# Architecture Deep Dive

## Overview

This document provides a detailed technical overview of the Blood Bank AI Chatbot architecture, including component interactions, data flow, and design decisions.

## System Architecture

### High-Level Architecture

The application follows a serverless, event-driven architecture on AWS, designed for scalability, cost-effectiveness, and maintainability.

### Core Components

#### 1. Frontend Layer
- **Technology**: React with Material-UI
- **Hosting**: AWS Amplify
- **Features**: 
  - Responsive design for mobile and desktop
  - Bilingual support (English/Spanish)
  - Real-time chat interface
  - Admin dashboard for monitoring

#### 2. API Layer
- **Technology**: Lambda Function URL (Direct invocation)
- **Features**:
  - Direct Lambda invocation without API Gateway
  - Built-in CORS configuration
  - Response streaming support (SSE)
  - Cost-effective alternative to API Gateway
  - Public access with authentication handled in Lambda code

#### 3. Compute Layer
- **Technology**: AWS Lambda Functions
- **Functions**:
  - **Chat Lambda**: Main conversation handler with streaming support (Node.js 22.x)
  - **Sync Operations**: Data source management for Step Functions workflow (Python 3.11)
  - **Daily Sync**: Automated content updates triggered by EventBridge (Python 3.11)

#### 4. AI/ML Layer
- **Technology**: AWS Bedrock
- **Components**:
  - Knowledge Base with vector search
  - Bedrock LLM models
  - Amazon Titan embeddings
  - OpenSearch Serverless

#### 5. Data Layer
- **Storage**: 
  - S3 buckets for documents and artifacts
  - DynamoDB for conversation history
  - OpenSearch for vector embeddings

#### 6. Automation Layer
- **Technology**: 
  - EventBridge for daily sync scheduling (2 PM EST / 7 PM UTC)
  - Step Functions for sequential data source synchronization workflow
  - CodeBuild for CI/CD deployment pipeline
  - Lambda Function URL for direct API access

## Data Flow

### User Interaction Flow
1. User sends message through React frontend hosted on AWS Amplify
2. Frontend calls Lambda Function URL directly (no API Gateway)
3. Lambda queries Bedrock Knowledge Base using retrieve_and_generate API
4. Knowledge Base performs semantic vector search in OpenSearch Serverless
5. Bedrock generates streaming response using retrieved context and Claude Sonnet model
6. Response streamed back to user via Server-Sent Events (SSE) with source citations

### Data Ingestion Flow
1. PDF documents uploaded to S3 bucket (pdfs/ folder)
2. Web crawler extracts content from americasblood.org (3 data sources: documents, website, daily-sync)
3. Bedrock Data Automation processes documents with multimodal parsing (extracts images and tables)
4. Content chunked using semantic chunking (1500 tokens, 95th percentile breakpoint)
5. Embeddings generated using Amazon Titan Text Embeddings v1 (1536 dimensions)
6. Embeddings stored in OpenSearch Serverless vector collection
7. Daily sync updates time-sensitive content automatically via EventBridge + Lambda

### Sequential Sync Workflow (Step Functions)
1. Step Functions State Machine orchestrates sequential data source synchronization
2. Sync order: PDF Documents → Daily Sync → Website Content
3. Each sync job waits for completion before starting the next
4. Prevents resource contention and ensures data consistency
5. Can run for up to 6 hours without Lambda timeout issues
6. Cost-optimized: Only pay for actual state transitions

## Security Considerations

### Authentication & Authorization
- Amazon Cognito for admin authentication (self-signup enabled)
- IAM roles with least privilege access for all Lambda functions
- Lambda Function URL with public access (authentication handled in Lambda code via Cognito JWT validation)
- No API Gateway authentication layer needed

### Data Protection
- Encryption at rest and in transit
- VPC endpoints for secure communication
- CloudWatch logging with sanitized data

### Compliance
- No PII stored in conversation logs
- HIPAA-compliant data handling practices
- Audit trails for admin actions

## Scalability & Performance

### Auto-scaling Components
- Lambda functions scale automatically (up to account concurrency limits)
- Lambda Function URL handles traffic spikes without API Gateway throttling
- OpenSearch Serverless scales based on usage automatically
- Amplify hosting scales with traffic

### Performance Optimizations
- Amplify CDN for frontend assets (built-in CloudFront distribution)
- Efficient semantic vector search with 1500-token chunking
- Response streaming via Lambda Function URL (Server-Sent Events)
- Bedrock Data Automation for multimodal document parsing
- Public S3 URLs for PDF citations (no presigned URL overhead)
- Step Functions for long-running sync workflows (no Lambda timeout issues)

## Cost Optimization

### Architecture Decisions
- **No API Gateway**: Lambda Function URL eliminates API Gateway costs (~$3.50/million requests saved)
- **Serverless Components**: Pay only for actual usage (Lambda, OpenSearch Serverless, Bedrock)
- **Step Functions**: Efficient orchestration for sequential sync (only pay for state transitions)
- **Amplify Hosting**: Cost-effective frontend hosting with built-in CDN
- **OpenSearch Standby Replicas**: Disabled for development to reduce costs

### Estimated Monthly Costs
- **Total**: $5-15/month for typical usage
- **Breakdown**:
  - AWS Bedrock (Claude) $20 - $200
  - OpenSearch Serverless $300 - $400
  - AWS Lambda $5 - $20
  - Amazon S3 $1 - $5
  - Amazon DynamoDB $5 - $20
  - AWS Amplify $5 - $15
  - Other Services $5 - $10




## Monitoring & Observability

### Logging
- CloudWatch Logs for all components
- Structured logging with correlation IDs
- Error tracking and alerting

### Metrics
- Lambda Function URL invocation metrics
- Lambda performance metrics (duration, errors, throttles, concurrent executions)
- Knowledge Base query analytics
- Step Functions execution metrics
- EventBridge rule invocation tracking

### Dashboards
- Admin dashboard for conversation analytics
- CloudWatch dashboards for system health
- Cost monitoring and optimization
