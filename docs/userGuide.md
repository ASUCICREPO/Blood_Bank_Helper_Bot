# User Guide

## Getting Started

### Accessing the Chatbot

The Blood Bank AI Chatbot is accessible through your web browser at the deployed Amplify URL. The interface is optimized for both desktop and mobile devices.

### Main Interface

The chatbot interface consists of:
- **Chat Area**: Where conversations are displayed
- **Input Field**: Where you type your questions
- **Language Toggle**: Switch between English and Spanish
- **Source Citations**: Links to information sources

## Using the Chatbot

### Starting a Conversation

1. **Open the Application**: Navigate to the chatbot URL
2. **Choose Language**: Select English or Spanish using the language toggle
3. **Type Your Question**: Enter your blood donation question in the input field
4. **Send Message**: Press Enter or click the send button

### Example Questions

#### Blood Donation Eligibility
- "Am I eligible to donate blood?"
- "What are the requirements for blood donation?"
- "Can I donate if I have diabetes?"
- "How old do I need to be to donate blood?"

#### Donation Process
- "What happens during blood donation?"
- "How long does it take to donate blood?"
- "What should I do before donating blood?"
- "What should I eat before donating?"

#### Finding Donation Centers
- "Where can I donate blood near me?"
- "Find blood centers in my area"
- "What are the hours for blood donation?"
- "How do I schedule an appointment?"

#### Blood Supply Information
- "What is the current blood supply status?"
- "Which blood types are needed most?"
- "Is there a blood shortage?"
- "How often can I donate blood?"

### Language Support

#### English
The chatbot provides comprehensive responses in English, covering all aspects of blood donation information.

#### Spanish (Español)
Switch to Spanish mode for:
- "¿Soy elegible para donar sangre?"
- "¿Dónde puedo donar sangre cerca de mí?"
- "¿Cuáles son los requisitos para donar sangre?"
- "¿Cuál es el estado actual del suministro de sangre?"

### Understanding Responses

#### Response Format
Each response includes:
- **Main Answer**: Direct response to your question
- **Additional Information**: Relevant details and context
- **Source Citations**: Links to authoritative sources
- **Related Topics**: Suggestions for follow-up questions

#### Source Citations
- **Website Links**: Direct links to Blood Bank pages
- **Document References**: Links to official guidelines and reports
- **Blood Center Locator**: Direct link to find nearby donation centers

## Features

### Real-time Information
- Current blood supply status
- Updated donation center information
- Latest news and announcements
- Seasonal donation drives and events

### Smart Routing
The chatbot automatically:
- Detects location-related questions
- Provides blood center locator links
- Suggests relevant donation opportunities
- Connects users to appropriate resources

### Conversation History
- Previous questions and answers are maintained during your session
- Context is preserved for follow-up questions
- No personal information is stored permanently

## Admin Dashboard

### Accessing Admin Features

**Important**: Admin access is restricted to authorized users only. Admin accounts must be manually created by system administrators.

#### Getting Admin Access
1. **Contact System Administrator**: Request admin access from your IT team or system administrator
2. **Account Creation**: Administrator will create your account in AWS Cognito User Pool
3. **Receive Credentials**: You'll receive a username and temporary password
4. **First Login**: Access the admin dashboard and change your password

#### Login Process
1. **Navigate to Admin Panel**: Go to `/admin` on your application URL
   - Example: `https://your-amplify-app-url/admin`
2. **Enter Credentials**: Use the username and password provided by your administrator
3. **Change Password**: If using a temporary password, you'll be prompted to create a new one
4. **Access Dashboard**: Successfully login to view admin features

### Admin Capabilities

#### Conversation Monitoring
- **View Chat History**: Access anonymized conversation logs
- **Usage Analytics**: See conversation volume and trends
- **Popular Questions**: Identify frequently asked questions
- **Language Distribution**: Monitor English vs Spanish usage

#### Data Source Management
- **Manual Sync**: Trigger immediate data source updates
- **Sync Status**: Monitor ongoing ingestion jobs
- **Data Source Health**: Check status of PDF and web crawler sources
- **Sync History**: View past synchronization activities

#### System Health Monitoring
- **API Status**: Monitor API Gateway and Lambda function health
- **Knowledge Base Status**: Check Bedrock Knowledge Base availability
- **Database Health**: Monitor DynamoDB table status
- **Error Tracking**: View system errors and issues

#### User Analytics
- **Traffic Patterns**: Monitor daily and hourly usage
- **Response Quality**: Track user satisfaction metrics
- **Source Citations**: See which sources are most referenced
- **Geographic Distribution**: Understand user locations (if available)

### Admin User Management

**Note**: Admin users cannot create other admin users through the dashboard. All user management must be done through AWS Cognito.

#### For System Administrators

If you're a system administrator who needs to add new admin users:

1. **Access AWS Console**: Log into AWS Console with appropriate permissions
2. **Navigate to Cognito**: Go to Amazon Cognito → User Pools
3. **Find User Pool**: Locate your project's admin user pool
4. **Create User**: Follow the detailed steps in the [Deployment Guide](deploymentGuide.md#5-admin-user-management)

#### Password Management
- **Change Password**: Use the admin dashboard settings to update your password
- **Forgot Password**: Contact your system administrator for password reset
- **Security**: Use strong passwords meeting the security requirements

#### Account Security
- **Logout**: Always logout when finished using the admin dashboard
- **Session Timeout**: Sessions automatically expire for security
- **Access Monitoring**: Admin access is logged for security auditing

## Best Practices

### Getting Better Responses

#### Be Specific
- ❌ "Tell me about blood"
- ✅ "What are the eligibility requirements for blood donation?"

#### Ask Follow-up Questions
- Build on previous responses for more detailed information
- Ask for clarification on specific points
- Request additional resources or links

#### Use Natural Language
- Ask questions as you would to a human expert
- Don't worry about perfect grammar or formatting
- The AI understands context and conversational flow

### Common Use Cases

#### First-time Donors
- Learn about the donation process
- Understand eligibility requirements
- Find nearby donation centers
- Prepare for first donation

#### Regular Donors
- Check current blood supply needs
- Find donation opportunities
- Learn about special drives or events
- Understand donation frequency guidelines

#### Healthcare Professionals
- Access official guidelines and protocols
- Find educational materials
- Get current supply status information
- Access professional resources

## Troubleshooting

### Common Issues

#### Slow Responses
- Check your internet connection
- Refresh the page if responses are delayed
- Try rephrasing your question if no response

#### Unclear Answers
- Ask for clarification or more specific information
- Rephrase your question with more context
- Try breaking complex questions into smaller parts

#### Language Issues
- Ensure the correct language is selected
- Refresh the page if language toggle isn't working
- Try typing your question in the selected language

#### Missing Information
- Check the source citations for additional details
- Ask follow-up questions for more specific information
- Contact 1-800-733-2767 (American Red Cross Blood Services) directly for urgent inquiries

### Getting Help

#### Technical Issues
- Refresh the browser page
- Clear browser cache and cookies
- Try a different browser or device
- Contact technical support if issues persist

#### Content Questions
- Use the blood center locator for local information
- Contact your local blood center directly
- Visit americasblood.org for comprehensive information
- Consult with healthcare providers for medical questions

## Privacy and Data

### Information Collection
- No personal information is required to use the chatbot
- Conversations are anonymized for system improvement
- No health information is stored permanently
- Session data is cleared when you close the browser

### Data Usage
- Conversation patterns help improve responses
- Popular questions guide content updates
- Usage analytics inform system enhancements
- All data handling follows privacy best practices

### Security
- All communications are encrypted
- No sensitive information should be shared
- Admin access is secured with authentication
- System logs are sanitized to protect privacy

## Contact and Support

### For Users
- **Technical Issues**: Contact system administrators
- **Blood Donation Questions**: Use the chatbot or contact local blood centers
- **Emergency**: Contact your local blood center directly

### For Administrators
- **System Issues**: Check CloudWatch logs and system status
- **Content Updates**: Use admin dashboard or manual sync
- **User Feedback**: Monitor conversation analytics for improvement opportunities

### Additional Resources
- **Blood Bank**: [americasblood.org](https://americasblood.org)
- **Blood Center Locator**: [Find a Blood Center](https://americasblood.org/for-donors/find-a-blood-center/)
- **Donation Guidelines**: Official eligibility and safety information
- **Emergency Contact**: Local blood center emergency numbers