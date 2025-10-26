import json
import os
import io
import base64
from typing import Dict, List, Literal, Optional

import boto3
import numpy as np
from decouple import config
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from PIL import Image
import tensorflow as tf

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

# ML Model Configuration
IMAGE_SIZE = 64
MODEL_DIR = "./models"

USED_DATASETS = [
    "bloodmnist",
    "breastmnist",
    "chestmnist",
    "dermamnist",
    "octmnist",
    "organamnist",
    "organcmnist",
    "organsmnist",
    "pathmnist",
    "pneumoniamnist",
    "retinamnist",
    "tissuemnist",
]

# Load stage1 model at startup
stage1_model = None
_stage2_cache = {}  # Cache for stage2 models

def load_stage1_model():
    """Load the stage1 routing model at startup"""
    global stage1_model
    if stage1_model is None:
        stage1_path = os.path.join(MODEL_DIR, "stage1_final.keras")
        if os.path.exists(stage1_path):
            print(f"Loading stage1 model from {stage1_path}")
            stage1_model = tf.keras.models.load_model(stage1_path)
            print("Stage1 model loaded successfully")
        else:
            print(f"Warning: Stage1 model not found at {stage1_path}")
    return stage1_model

def load_stage2_model(dataset_name: str):
    """Load stage2 expert model for a specific dataset"""
    if dataset_name in _stage2_cache:
        return _stage2_cache[dataset_name]
    
    stage2_path = os.path.join(MODEL_DIR, f"stage2_{dataset_name}_final.keras")
    if not os.path.exists(stage2_path):
        raise FileNotFoundError(
            f"Stage 2 model for dataset '{dataset_name}' not found at {stage2_path}"
        )
    
    print(f"Loading stage2 model for {dataset_name}")
    model = tf.keras.models.load_model(stage2_path)
    _stage2_cache[dataset_name] = model
    print(f"Stage2 model for {dataset_name} loaded successfully")
    return model

def preprocess_image(image_bytes: bytes, image_size: int = IMAGE_SIZE) -> np.ndarray:
    """Preprocess image bytes for model prediction"""
    image_stream = io.BytesIO(image_bytes)
    image_stream.seek(0)
    img = Image.open(image_stream)
    img = img.convert("RGB")
    img = img.resize((image_size, image_size))
    
    img_np = np.array(img, dtype="float32")
    img_np = np.expand_dims(img_np, axis=0)
    img_np = tf.keras.applications.resnet50.preprocess_input(img_np)
    
    return img_np

def route_dataset(img_batch: np.ndarray):
    """Use stage1 model to route to appropriate dataset"""
    model = load_stage1_model()
    if model is None:
        raise RuntimeError("Stage1 model not available")
    
    ds_probs = model.predict(img_batch, verbose=0)[0]
    ds_idx = int(np.argmax(ds_probs))
    routed_dataset = USED_DATASETS[ds_idx]
    routed_confidence = float(ds_probs[ds_idx])
    
    return routed_dataset, routed_confidence, ds_idx

def classify_with_stage2(img_batch: np.ndarray, dataset_name: str):
    """Classify image using stage2 expert model"""
    expert_model = load_stage2_model(dataset_name)
    
    class_probs = expert_model.predict(img_batch, verbose=0)[0]
    pred_class_idx = int(np.argmax(class_probs))
    pred_class_conf = float(np.max(class_probs))
    
    return pred_class_idx, pred_class_conf, class_probs.tolist()

# Load stage1 model at startup
try:
    load_stage1_model()
except Exception as e:
    print(f"Warning: Could not load stage1 model at startup: {e}")

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

class AnalyzeRequest(BaseModel):
    body: str  # base64 encoded image

@app.post('/analyze')
async def analyze_image(request: AnalyzeRequest):
    """
    Analyze uploaded medical image using two-stage ML model
    Returns dataset routing and classification results
    """
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(request.body)
        print(f"Decoded image size: {len(image_bytes)} bytes")
        
        # Preprocess image
        img_batch = preprocess_image(image_bytes, IMAGE_SIZE)
        
        # Stage 1: Route to appropriate dataset
        routed_dataset, routed_confidence, _ = route_dataset(img_batch)
        
        # Stage 2: Classify with expert model
        pred_class_idx, pred_class_conf, class_probs = classify_with_stage2(
            img_batch,
            routed_dataset
        )
        
        # Format user-friendly diagnosis message
        diagnosis = f"{routed_dataset} - Class {pred_class_idx} ({pred_class_conf*100:.1f}% confidence)"
        
        # Return plain text diagnosis
        return diagnosis
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error analyzing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")

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