import json
from typing import Dict, List, Literal, Optional

import boto3
from decouple import config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI(title='Prismatic API', version='0.1.0', description='Backend API for Prismatic')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token"
    ],
)

# Initialize Bedrock client
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-east-1')

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    diagnosis: str
    message: str
    history: Optional[List[ChatMessage]] = []

# Health check
@app.get('/health')
async def health():
    return {
        'message': 'Healthy'
    }

@app.post('/chat')
async def chat(chat_request: ChatRequest):
    """
    Streaming chat endpoint using Amazon Bedrock (Claude AI)
    Returns a Server-Sent Events (SSE) stream
    """
    
    async def generate():
        try:
            # Build messages array for Converse API
            messages = []
            
            # Add conversation history
            for msg in chat_request.history:
                messages.append({
                    "role": msg.role,
                    "content": [{"text": msg.content}]
                })
            
            # Add current user message
            messages.append({
                "role": "user",
                "content": [{"text": chat_request.message}]
            })
            
            # System prompt for Converse API
            system_prompt = [
                {
                    "text": f"You are a helpful medical assistant. You are in a chat with a patient diagnosed with {chat_request.diagnosis}. Explain to them what the disease is and their options as a doctor."
                }
            ]
            
            # Configure Bedrock Converse Stream request
            model_id = 'arn:aws:bedrock:us-east-1:754799739578:inference-profile/us.anthropic.claude-sonnet-4-5-20250929-v1:0'
            
            # Invoke Bedrock with Converse Stream API
            response = bedrock_runtime.converse_stream(
                modelId=model_id,
                messages=messages,
                system=system_prompt,
                inferenceConfig={
                    "maxTokens": 2048,
                    "temperature": 0.7
                }
            )
            
            # Stream the response chunks
            for event in response['stream']:
                if 'contentBlockDelta' in event:
                    delta = event['contentBlockDelta']['delta']
                    if 'text' in delta:
                        text = delta['text']
                        # Send as SSE format
                        yield f"data: {json.dumps({'text': text})}\n\n"
                
                # Handle stream end
                elif 'messageStop' in event:
                    yield f"data: {json.dumps({'done': True})}\n\n"
            
        except Exception as e:
            error_msg = f"data: {json.dumps({'error': str(e)})}\n\n"
            yield error_msg
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )