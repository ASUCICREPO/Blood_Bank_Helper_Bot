"""
Sync Operations Lambda
Simple functions for Step Functions to call - no complex logic
"""

import json
import logging
import os
import boto3
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
bedrock_agent = boto3.client('bedrock-agent')

# Environment variables
KNOWLEDGE_BASE_ID = os.environ.get('KNOWLEDGE_BASE_ID')
DOCUMENTS_DATA_SOURCE_NAME = os.environ.get('DOCUMENTS_DATA_SOURCE_NAME')
WEBSITE_DATA_SOURCE_NAME = os.environ.get('WEBSITE_DATA_SOURCE_NAME')
DAILY_SYNC_DATA_SOURCE_NAME = os.environ.get('DAILY_SYNC_DATA_SOURCE_NAME')

def lambda_handler(event, context):
    """
    Handle sync operations called by Step Functions
    """
    
    try:
        operation = event.get('operation')
        
        if operation == 'start_sync':
            return start_sync_job(event)
        elif operation == 'check_status':
            return check_job_status(event)
        elif operation == 'list_data_sources':
            return list_data_sources()
        else:
            raise ValueError(f"Unknown operation: {operation}")
            
    except Exception as e:
        logger.error(f"Error in sync operation: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def start_sync_job(event):
    """
    Start a sync job for a specific data source type
    """
    source_type = event.get('source_type')  # 'pdf', 'daily', 'web'
    
    # Get all data sources
    data_sources = get_all_data_sources()
    if not data_sources:
        return {
            'success': False,
            'error': 'No data sources found'
        }
    
    # Find the specific data source
    target_source = None
    for ds in data_sources:
        name = ds.get('name', '')
        if source_type == 'pdf' and name == DOCUMENTS_DATA_SOURCE_NAME:
            target_source = ds
            break
        elif source_type == 'daily' and name == DAILY_SYNC_DATA_SOURCE_NAME:
            target_source = ds
            break
        elif source_type == 'web' and name == WEBSITE_DATA_SOURCE_NAME:
            target_source = ds
            break
    
    if not target_source:
        return {
            'success': False,
            'error': f'No data source found for type: {source_type}'
        }
    
    try:
        # Start the ingestion job
        response = bedrock_agent.start_ingestion_job(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            dataSourceId=target_source['dataSourceId'],
            description=f"Step Functions sync - {source_type} - {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"
        )
        
        job_id = response['ingestionJob']['ingestionJobId']
        logger.info(f"Started sync job for {target_source['name']}: {job_id}")
        
        return {
            'success': True,
            'source_type': source_type,
            'dataSourceName': target_source['name'],
            'dataSourceId': target_source['dataSourceId'],
            'jobId': job_id,
            'status': 'STARTED'
        }
        
    except Exception as e:
        logger.error(f"Failed to start sync job: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def check_job_status(event):
    """
    Check the status of a sync job
    """
    data_source_id = event.get('dataSourceId')
    job_id = event.get('jobId')
    source_type = event.get('source_type')
    
    try:
        response = bedrock_agent.get_ingestion_job(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            dataSourceId=data_source_id,
            ingestionJobId=job_id
        )
        
        job = response.get('ingestionJob', {})
        status = job.get('status', 'UNKNOWN')
        
        return {
            'success': True,
            'source_type': source_type,
            'jobId': job_id,
            'status': status,
            'isComplete': status in ['COMPLETE', 'FAILED', 'STOPPED'],
            'isSuccess': status == 'COMPLETE'
        }
        
    except Exception as e:
        logger.error(f"Error checking job status: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def list_data_sources():
    """
    List all available data sources
    """
    try:
        data_sources = get_all_data_sources()
        
        source_map = {}
        for ds in data_sources:
            name = ds.get('name', '')
            if name == DOCUMENTS_DATA_SOURCE_NAME:
                source_map['pdf'] = ds
            elif name == WEBSITE_DATA_SOURCE_NAME:
                source_map['web'] = ds
            elif name == DAILY_SYNC_DATA_SOURCE_NAME:
                source_map['daily'] = ds
        
        return {
            'success': True,
            'dataSources': source_map
        }
        
    except Exception as e:
        logger.error(f"Error listing data sources: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def get_all_data_sources():
    """
    Get all data sources from the knowledge base
    """
    try:
        response = bedrock_agent.list_data_sources(
            knowledgeBaseId=KNOWLEDGE_BASE_ID
        )
        return response.get('dataSourceSummaries', [])
    except Exception as e:
        logger.error(f"Error listing data sources: {str(e)}")
        return []