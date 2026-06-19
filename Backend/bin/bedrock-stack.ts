#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BedrockChatbotStack } from '../lib/bedrock-chatbot-stack';

const app = new cdk.App();

// Get configuration from context or environment variables
const projectName = app.node.tryGetContext('projectName') || process.env.PROJECT_NAME;
const modelId = app.node.tryGetContext('modelId') || process.env.MODEL_ID;
const embeddingModelId = app.node.tryGetContext('embeddingModelId') || process.env.EMBEDDING_MODEL_ID;

// Validate required values
if (!projectName) {
  throw new Error('projectName is required. Pass it with --context projectName=your-value or set PROJECT_NAME environment variable');
}
if (!modelId) {
  throw new Error('modelId is required. Pass it with --context modelId=your-value or set MODEL_ID environment variable');
}
if (!embeddingModelId) {
  throw new Error('embeddingModelId is required. Pass it with --context embeddingModelId=your-value or set EMBEDDING_MODEL_ID environment variable');
}

new BedrockChatbotStack(app, 'BloodBankBedrockStack', {
  projectName,
  modelId,
  embeddingModelId,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Blood Bank Chatbot using Bedrock Knowledge Base and Foundation Models',
  tags: {
    Project: 'BloodBank',
    Environment: 'Production',
    Technology: 'Bedrock',
    CostCenter: 'IT',
  },
});