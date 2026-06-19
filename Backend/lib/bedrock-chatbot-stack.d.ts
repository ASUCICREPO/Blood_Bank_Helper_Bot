import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export interface BedrockChatbotStackProps extends cdk.StackProps {
    readonly projectName: string;
    readonly modelId: string;
    readonly embeddingModelId: string;
}
export declare class BedrockChatbotStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: BedrockChatbotStackProps);
}
