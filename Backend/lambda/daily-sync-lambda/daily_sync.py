"""
Daily Sync Lambda Function
Automatically triggers daily sync ingestion job for the daily-sync data source
"""

import json
import logging
import os
import boto3
from botocore.exceptions import ClientError
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
bedrock_agent = boto3.client('bedrock-agent')

# Environment variables
KNOWLEDGE_BASE_ID = os.environ.get('KNOWLEDGE_BASE_ID')
DAILY_SYNC_DATA_SOURCE_NAME = os.environ.get('DAILY_SYNC_DATA_SOURCE_NAME', 'daily-sync')

def lambda_handler(event, context):
    """
    Main Lambda handler for daily sync automation
    """
    logger.info("Starting daily sync automation")
    
    try:
        # Get the daily sync data source ID by name
        daily_sync_data_source_id = get_data_source_id_by_name(
            KNOWLEDGE_BASE_ID, 
            DAILY_SYNC_DATA_SOURCE_NAME
        )
        
        if not daily_sync_data_source_id:
            logger.error(f"Daily sync data source '{DAILY_SYNC_DATA_SOURCE_NAME}' not found")
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'success': False,
                    'error': f'Data source {DAILY_SYNC_DATA_SOURCE_NAME} not found'
                })
            }
        
        # Start the ingestion job for daily sync data source only
        ingestion_job_id = start_daily_sync_ingestion(
            KNOWLEDGE_BASE_ID,
            daily_sync_data_source_id
        )
        
        if ingestion_job_id:
            logger.info(f"Daily sync ingestion job started successfully: {ingestion_job_id}")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'message': 'Daily sync ingestion job started successfully',
                    'ingestion_job_id': ingestion_job_id,
                    'data_source_id': daily_sync_data_source_id,
                    'timestamp': datetime.utcnow().isoformat()
                })
            }
        else:
            logger.error("Failed to start daily sync ingestion job")
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'success': False,
                    'error': 'Failed to start daily sync ingestion job'
                })
            }
            
    except Exception as e:
        logger.error(f"Error in daily sync automation: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }

def get_data_source_id_by_name(knowledge_base_id, data_source_name):
    """
    Get data source ID by name
    """
    try:
        response = bedrock_agent.list_data_sources(
            knowledgeBaseId=knowledge_base_id
        )
        
        for data_source in response.get('dataSourceSummaries', []):
            if data_source.get('name') == data_source_name:
                logger.info(f"Found data source '{data_source_name}' with ID: {data_source['dataSourceId']}")
                return data_source['dataSourceId']
        
        logger.warning(f"Data source '{data_source_name}' not found")
        return None
        
    except ClientError as e:
        logger.error(f"Error listing data sources: {str(e)}")
        return None

def start_daily_sync_ingestion(knowledge_base_id, data_source_id):
    """
    Start ingestion job for the daily sync data source
    """
    try:
        response = bedrock_agent.start_ingestion_job(
            knowledgeBaseId=knowledge_base_id,
            dataSourceId=data_source_id,
            description=f"Automated daily sync - {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"
        )
        
        ingestion_job_id = response['ingestionJob']['ingestionJobId']
        logger.info(f"Started daily sync ingestion job: {ingestion_job_id}")
        
        return ingestion_job_id
        
    except ClientError as e:
        logger.error(f"Error starting daily sync ingestion job: {str(e)}")
        return None