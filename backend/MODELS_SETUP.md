# ML Models Setup for ECS Backend

## Model Files Structure

Your `backend/models/` folder should contain:

```
backend/
├── models/
│   ├── stage1_final.keras           # Router model (required)
│   ├── stage2_bloodmnist_final.keras
│   ├── stage2_breastmnist_final.keras
│   ├── stage2_chestmnist_final.keras
│   ├── stage2_dermamnist_final.keras
│   ├── stage2_octmnist_final.keras
│   ├── stage2_organamnist_final.keras
│   ├── stage2_organcmnist_final.keras
│   ├── stage2_organsmnist_final.keras
│   ├── stage2_pathmnist_final.keras
│   ├── stage2_pneumoniamnist_final.keras
│   ├── stage2_retinamnist_final.keras
│   └── stage2_tissuemnist_final.keras
└── main.py
```

## Setup Steps

### 1. Copy Models to Backend

```bash
# From your project root
mkdir -p backend/models

# Copy stage1 model from lambdas folder
cp lambdas/stage1_final.keras backend/models/

# Copy all stage2 models (when available)
# cp path/to/stage2_*_final.keras backend/models/
```

### 2. Test Locally

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Test the endpoint:
```bash
curl -X POST http://localhost:8000/analyze \
  -F "file=@test_image.jpg"
```

Expected response:
```json
{
  "success": true,
  "routed_dataset": "dermamnist",
  "router_confidence": 0.95,
  "predicted_class_index": 2,
  "predicted_class_confidence": 0.87,
  "all_class_probs": [0.02, 0.11, 0.87, ...]
}
```

### 3. Update .dockerignore

Make sure your `.dockerignore` does NOT exclude the models folder:

```bash
# In backend/.dockerignore - make sure this is NOT present:
# models/
```

### 4. Build and Deploy to ECS

```bash
cd backend

# Build for linux/amd64
docker build --platform linux/amd64 -t prismatic-backend .

# Tag and push to ECR
docker tag prismatic-backend:latest 754799739578.dkr.ecr.us-east-1.amazonaws.com/prismatic-backend:latest
docker push 754799739578.dkr.ecr.us-east-1.amazonaws.com/prismatic-backend:latest

# Update ECS service
cd ..
aws ecs update-service --cluster prismatic-cluster --service prismatic-service --force-new-deployment --region us-east-1
```

### 5. Update ECS Task Resources

The ML models require more memory. Update the task definition:

```bash
# Increase memory to 4GB and CPU to 1 vCPU
aws ecs update-service \
  --cluster prismatic-cluster \
  --service prismatic-service \
  --task-definition prismatic-backend \
  --region us-east-1
```

Or update `task-definition.json`:
```json
{
  "cpu": "1024",
  "memory": "4096",
  ...
}
```

## API Endpoints

### Analyze Image
- **URL**: `POST https://d1bkbsargynm0c.cloudfront.net/analyze`
- **Content-Type**: `multipart/form-data`
- **Body**: `file` (image file)

### Health Check
- **URL**: `GET https://d1bkbsargynm0c.cloudfront.net/health`

### Chat
- **URL**: `POST https://d1bkbsargynm0c.cloudfront.net/chat`
- **Content-Type**: `application/json`

## Performance Notes

- **First request (cold start)**: ~10-20 seconds (loads stage1 model)
- **Subsequent requests**: ~2-5 seconds (models cached in memory)
- **Stage2 models**: Loaded on-demand and cached
- **Memory usage**: ~2-3GB with models loaded

## Troubleshooting

### Model not found error
```
FileNotFoundError: Stage 2 model for dataset 'dermamnist' not found
```
**Solution**: Copy the missing stage2 model to `backend/models/`

### Out of memory
```
ResourceExhausted: OOM when allocating tensor
```
**Solution**: Increase ECS task memory to 4096MB or higher

### Slow predictions
- Models load on first use (expected)
- Use ECS Service with minimum 1 task to keep models warm
- Consider ECS Service Auto Scaling for high traffic

## Model Files Checklist

Before deploying, ensure you have:
- ✅ `stage1_final.keras` (router) - already in lambdas/
- ⏳ All 12 stage2 models (one per dataset)

Once all models are added, the system will support automatic routing and classification for all 12 medical datasets!

