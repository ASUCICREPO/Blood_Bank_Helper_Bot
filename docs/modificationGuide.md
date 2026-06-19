# Modification Guide

## Overview

This guide provides instructions for developers who want to extend, customize, or modify the Blood Bank AI Chatbot. The application is built with modularity and extensibility in mind.

## Development Environment Setup

### Prerequisites
- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- AWS CDK CLI installed globally
- Python 3.11+ for Lambda functions
- Git for version control

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/America-Blood-Centers-chatbot.git
cd America-Blood-Centers-chatbot

# Backend setup
cd Backend
npm install
npm run build

# Frontend setup
cd ../Frontend
npm install
npm start
```

## Architecture Overview

### Key Components
1. **CDK Stack** (`lib/bedrock-chatbot-stack.ts`): Infrastructure definition
2. **Lambda Functions** (`lambda/`): Serverless compute functions
3. **React Frontend** (`Frontend/src/`): User interface
4. **Data Sources** (`data-sources/`): Knowledge base content

## Common Modifications

### 1. Adding New Bedrock Models

#### Update CDK Stack
```typescript
// In lib/bedrock-chatbot-stack.ts
const modelId = props.modelId; // Support for new model IDs

// Update IAM permissions for new models
new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['bedrock:InvokeModel'],
  resources: [
    `arn:aws:bedrock:${this.region}::foundation-model/${modelId}`,
    // Add new model ARNs here
  ],
});
```

#### Update Lambda Function
```python
# In lambda/chat-lambda/lambda_function.py
def generate_response(user_message: str, context_results: List[Dict[str, Any]], language: str) -> Dict[str, Any]:
    # Modify request body based on model type
    if MODEL_ID.startswith('anthropic.claude'):
        request_body = {
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": MAX_TOKENS,
            "temperature": TEMPERATURE,
            "anthropic_version": "bedrock-2023-05-31"
        }
    elif MODEL_ID.startswith('amazon.titan'):
        # Add Titan model support
        request_body = {
            "inputText": prompt,
            "textGenerationConfig": {
                "maxTokenCount": MAX_TOKENS,
                "temperature": TEMPERATURE
            }
        }
```

### 2. Adding New Languages

#### Update Frontend Language Support
```javascript
// In Frontend/src/Utils/languageUtils.js
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Español',
  fr: 'Français', // Add new language
};

export const getLanguagePrompts = (language) => {
  const prompts = {
    en: { /* English prompts */ },
    es: { /* Spanish prompts */ },
    fr: { /* French prompts */ }, // Add French prompts
  };
  return prompts[language] || prompts.en;
};
```

#### Update Lambda Function Prompts
```python
# In lambda/chat-lambda/lambda_function.py
def create_prompt(user_message: str, context: str, language: str) -> str:
    if language == 'es':
        return f"""Eres un asistente experto..."""
    elif language == 'fr':
        return f"""Vous êtes un assistant expert..."""  # Add French prompt
    else:
        return f"""You are an expert blood donation assistant..."""
```

### 3. Customizing UI Components

#### Modify Chat Interface
```javascript
// In Frontend/src/Components/ChatBody.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

const ChatBody = ({ messages, isLoading }) => {
  return (
    <Box sx={{ 
      height: '400px', 
      overflowY: 'auto',
      // Add custom styling
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      padding: '16px'
    }}>
      {messages.map((message, index) => (
        <MessageBubble 
          key={index} 
          message={message}
          // Add custom props
          showTimestamp={true}
          showSources={true}
        />
      ))}
    </Box>
  );
};
```

#### Add New Components
```javascript
// Create new component: Frontend/src/Components/BloodCenterMap.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

const BloodCenterMap = ({ userLocation }) => {
  const [centers, setCenters] = useState([]);

  useEffect(() => {
    // Fetch nearby blood centers
    fetchNearbyBloodCenters(userLocation)
      .then(setCenters);
  }, [userLocation]);

  return (
    <Box>
      <Typography variant="h6">Nearby Blood Centers</Typography>
      {/* Add map implementation */}
    </Box>
  );
};

export default BloodCenterMap;
```

### 4. Adding New Data Sources

#### S3 Document Source
```typescript
// In lib/bedrock-chatbot-stack.ts
const newDataSource = new bedrock.CfnDataSource(this, "NewDataSource", {
  name: "NewDocumentSource",
  description: "Additional document source",
  knowledgeBaseId: knowledgeBase.attrKnowledgeBaseId,
  dataSourceConfiguration: {
    type: "S3",
    s3Configuration: {
      bucketArn: newDocumentsBucket.bucketArn,
      inclusionPrefixes: ["new-docs/"],
    },
  },
  vectorIngestionConfiguration: {
    chunkingConfiguration: {
      chunkingStrategy: "SEMANTIC",
      semanticChunkingConfiguration: {
        maxTokens: 1500,
        bufferSize: 0,
        breakpointPercentileThreshold: 95,
      },
    },
  },
});
```

#### Web Crawler Source
```typescript
const webCrawlerDataSource = new bedrock.CfnDataSource(this, "NewWebSource", {
  name: "NewWebsiteSource",
  description: "Additional website content",
  knowledgeBaseId: knowledgeBase.attrKnowledgeBaseId,
  dataSourceConfiguration: {
    type: "WEB",
    webConfiguration: {
      sourceConfiguration: {
        urlConfiguration: {
          seedUrls: [
            { url: "https://new-website.org/" },
            { url: "https://new-website.org/resources/" },
          ],
        },
      },
      crawlerConfiguration: {
        crawlerLimits: {
          maxPages: 500,
          rateLimit: 300,
        },
        exclusionFilters: [
          ".*/admin/.*",
          ".*/private/.*",
        ],
      },
    },
  },
});
```

### 5. Adding Admin Features

#### New Admin API Endpoint
```python
# In lambda/chat-lambda/lambda_function.py
def handle_admin_request(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    path = event.get('path', '')
    http_method = event.get('httpMethod')
    
    # Add new admin endpoint
    if '/admin/analytics' in path and http_method == 'GET':
        return get_analytics_data(event, headers)
    elif '/admin/users' in path and http_method == 'GET':
        return get_user_statistics(event, headers)
    # ... existing endpoints

def get_analytics_data(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Get conversation analytics and usage statistics"""
    try:
        # Query DynamoDB for analytics data
        analytics = {
            'total_conversations': get_total_conversations(),
            'popular_topics': get_popular_topics(),
            'language_distribution': get_language_distribution(),
            'daily_usage': get_daily_usage_stats()
        }
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': analytics
            })
        }
    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Failed to get analytics'})
        }
```

#### Frontend Admin Dashboard
```javascript
// Create new admin component: Frontend/src/Components/AdminAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics().then(setAnalytics);
  }, []);

  const fetchAnalytics = async () => {
    const response = await fetch('/admin/analytics', {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return response.json();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Conversations</Typography>
              <Typography variant="h3">
                {analytics?.total_conversations || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* Add more analytics cards */}
      </Grid>
    </Box>
  );
};
```

### 6. Custom Prompt Engineering

#### Modify System Prompts
```python
# In lambda/chat-lambda/lambda_function.py
def create_prompt(user_message: str, context: str, language: str) -> str:
    # Add custom prompt templates
    custom_instructions = """
    Additional Instructions:
    - Emphasize the importance of regular blood donation
    - Provide specific eligibility criteria when asked
    - Include safety information for donor reassurance
    """
    
    if language == 'es':
        return f"""Eres un asistente experto en donación de sangre para Blood Bank.
        
        {custom_instructions}
        
        Contexto:
        {context}
        
        Pregunta del usuario: {user_message}
        
        Respuesta:"""
    else:
        return f"""You are an expert blood donation assistant for Blood Bank.
        
        {custom_instructions}
        
        Context:
        {context}
        
        User question: {user_message}
        
        Answer:"""
```

### 7. Adding Monitoring and Alerts

#### CloudWatch Alarms
```typescript
// In lib/bedrock-chatbot-stack.ts
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';

// Create SNS topic for alerts
const alertTopic = new sns.Topic(this, 'ChatbotAlerts', {
  topicName: `${projectName}-alerts`,
});

// Add CloudWatch alarms
const errorAlarm = new cloudwatch.Alarm(this, 'ChatLambdaErrors', {
  metric: chatLambda.metricErrors(),
  threshold: 10,
  evaluationPeriods: 2,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
});

errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
```

#### Custom Metrics
```python
# In lambda/chat-lambda/lambda_function.py
import boto3

cloudwatch = boto3.client('cloudwatch')

def publish_custom_metrics(conversation_count: int, response_time: float):
    """Publish custom metrics to CloudWatch"""
    try:
        cloudwatch.put_metric_data(
            Namespace='BloodCenters/Chatbot',
            MetricData=[
                {
                    'MetricName': 'ConversationCount',
                    'Value': conversation_count,
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'ResponseTime',
                    'Value': response_time,
                    'Unit': 'Seconds'
                }
            ]
        )
    except Exception as e:
        logger.error(f"Failed to publish metrics: {str(e)}")
```

## Testing

### Unit Tests

#### Lambda Function Tests
```python
# Create tests/test_lambda_function.py
import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Add lambda directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../lambda/chat-lambda'))

from lambda_function import lambda_handler, create_prompt

class TestLambdaFunction(unittest.TestCase):
    
    def test_create_prompt_english(self):
        prompt = create_prompt("Test question", "Test context", "en")
        self.assertIn("You are an expert", prompt)
        self.assertIn("Test question", prompt)
        self.assertIn("Test context", prompt)
    
    def test_create_prompt_spanish(self):
        prompt = create_prompt("Pregunta de prueba", "Contexto de prueba", "es")
        self.assertIn("Eres un asistente", prompt)
        self.assertIn("Pregunta de prueba", prompt)
    
    @patch('lambda_function.bedrock_runtime')
    def test_lambda_handler(self, mock_bedrock):
        # Mock Bedrock response
        mock_bedrock.invoke_model.return_value = {
            'body': MagicMock()
        }
        
        event = {
            'body': '{"message": "Test question", "language": "en"}'
        }
        
        response = lambda_handler(event, {})
        self.assertEqual(response['statusCode'], 200)

if __name__ == '__main__':
    unittest.main()
```

#### Frontend Tests
```javascript
// Create Frontend/src/Components/__tests__/ChatBody.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatBody from '../ChatBody';

describe('ChatBody Component', () => {
  const mockMessages = [
    {
      type: 'user',
      content: 'Test question',
      timestamp: new Date().toISOString()
    },
    {
      type: 'bot',
      content: 'Test response',
      sources: [],
      timestamp: new Date().toISOString()
    }
  ];

  test('renders messages correctly', () => {
    render(<ChatBody messages={mockMessages} />);
    
    expect(screen.getByText('Test question')).toBeInTheDocument();
    expect(screen.getByText('Test response')).toBeInTheDocument();
  });

  test('shows loading indicator', () => {
    render(<ChatBody messages={[]} isLoading={true} />);
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });
});
```

### Integration Tests

#### API Tests
```python
# Create tests/test_api_integration.py
import requests
import json
import unittest

class TestAPIIntegration(unittest.TestCase):
    
    def setUp(self):
        self.base_url = 'https://your-api-gateway-url/prod'
    
    def test_chat_endpoint(self):
        payload = {
            'message': 'What are blood donation requirements?',
            'language': 'en'
        }
        
        response = requests.post(self.base_url, json=payload)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('response', data)
        self.assertIn('sources', data)
    
    def test_health_endpoint(self):
        response = requests.get(f'{self.base_url}/health')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'healthy')
```

## Deployment

### Development Deployment
```bash
# Deploy to development environment
cd Backend
cdk deploy --context environment=dev \
  --context projectName=blood-bank-dev \
  --context modelId=anthropic.claude-3-haiku-20240307-v1:0
```

### Production Deployment
```bash
# Deploy to production environment
cd Backend
cdk deploy --context environment=prod \
  --context projectName=blood-bank-prod \
  --context modelId=anthropic.claude-3-sonnet-20240229-v1:0
```

### CI/CD Pipeline
```yaml
# Create .github/workflows/deploy.yml
name: Deploy Chatbot

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd Backend && npm install
          cd ../Frontend && npm install
      
      - name: Run tests
        run: |
          cd Backend && npm test
          cd ../Frontend && npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy
        run: |
          cd Backend
          npm install
          npm run build
          cdk deploy --require-approval never
```

## Best Practices

### Code Organization
- Keep Lambda functions focused and single-purpose
- Use TypeScript for CDK code for better type safety
- Implement proper error handling and logging
- Follow AWS Well-Architected Framework principles

### Security
- Use least privilege IAM policies
- Sanitize all user inputs
- Implement proper authentication for admin features
- Regular security audits and updates

### Performance
- Optimize Lambda cold starts
- Implement caching where appropriate
- Monitor and optimize Knowledge Base queries
- Use appropriate Bedrock models for different use cases

### Monitoring
- Implement comprehensive logging
- Set up CloudWatch alarms for critical metrics
- Monitor costs and optimize resource usage
- Track user experience metrics

## Troubleshooting

### Common Issues
1. **CDK Deployment Failures**: Check IAM permissions and resource limits
2. **Lambda Timeouts**: Optimize code and increase timeout if necessary
3. **Knowledge Base Issues**: Verify data source configurations and ingestion status
4. **Frontend Build Failures**: Check environment variables and dependencies

### Debug Tools
- CloudWatch Logs for Lambda function debugging
- AWS X-Ray for distributed tracing
- Browser developer tools for frontend issues
- CDK diff for infrastructure changes

## Contributing

### Code Style
- Use ESLint and Prettier for JavaScript/TypeScript
- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add comprehensive comments and documentation

### Pull Request Process
1. Create feature branch from main
2. Implement changes with tests
3. Update documentation
4. Submit pull request with detailed description
5. Address review feedback
6. Merge after approval

This modification guide provides a comprehensive foundation for extending and customizing the Blood Bank AI Chatbot. For specific implementation questions, refer to the existing codebase and AWS documentation.