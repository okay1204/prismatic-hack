# AWS Deployment Guide for Prismatic Backend

## 🚀 Best Options for AWS Hackathon

### Option 1: AWS App Runner (Recommended! ⭐)

**Perfect for hackathons:**
- ✅ Automatic HTTPS
- ✅ Auto-scaling
- ✅ Serverless (pay per use)
- ✅ Deploy from GitHub or ECR
- ✅ Built-in load balancing
- ✅ ~5 minutes to deploy

#### Step-by-Step Deployment

**1. Push your code to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

**2. Go to AWS App Runner Console**
- https://console.aws.amazon.com/apprunner/

**3. Create Service**
- Click **Create service**
- Source: **GitHub**
- Connect your GitHub account
- Select your repository: `prismatic`
- Branch: `main`
- Deployment trigger: **Automatic**

**4. Configure Build**
```yaml
# App Runner will auto-detect, but you can specify:
Build command: pip install -r backend/requirements.txt
Start command: uvicorn main:app --host 0.0.0.0 --port 8000
```

**5. Configure Service**
- Service name: `prismatic-backend`
- Port: `8000`
- CPU: `1 vCPU`
- Memory: `2 GB`

**6. Add Environment Variables**
```
AWS_DEFAULT_REGION=us-east-1
```

**7. Configure IAM Role**
- Create a new role with these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "*"
    }
  ]
}
```

**8. Deploy!**
- Click **Create & Deploy**
- Wait ~5 minutes
- Get your URL: `https://xxxxx.us-east-1.awsapprunner.com`

**9. Update Frontend**
```bash
# In frontend/.env.local or Vercel environment variables
NEXT_PUBLIC_CHATBOT_API_URL=https://your-app-runner-url.awsapprunner.com/chat
```

---

### Option 2: AWS Elastic Beanstalk (Classic Choice)

**Good for:**
- Familiar AWS service
- Easy management
- Automatic HTTPS with load balancer

#### Quick Deploy

**1. Install EB CLI**
```bash
pip install awsebcli
```

**2. Initialize**
```bash
cd backend
eb init -p python-3.11 prismatic-backend --region us-east-1
```

**3. Create Environment**
```bash
eb create prismatic-prod
```

**4. Configure Environment Variables**
```bash
eb setenv AWS_DEFAULT_REGION=us-east-1
```

**5. Get URL**
```bash
eb open
# Your app is at: http://prismatic-prod.us-east-1.elasticbeanstalk.com
```

**6. Add HTTPS (Optional but Recommended)**
- Go to EC2 → Load Balancers
- Find your EB load balancer
- Add HTTPS listener with ACM certificate

---

### Option 3: AWS ECS Fargate (Container-Based)

**Good for:**
- Full control
- Container orchestration
- Production-grade

#### Deployment Steps

**1. Create ECR Repository**
```bash
aws ecr create-repository --repository-name prismatic-backend --region us-east-1
```

**2. Build and Push Docker Image**
```bash
cd backend

# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build
docker build -t prismatic-backend .

# Tag
docker tag prismatic-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/prismatic-backend:latest

# Push
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/prismatic-backend:latest
```

**3. Create ECS Cluster**
```bash
aws ecs create-cluster --cluster-name prismatic-cluster --region us-east-1
```

**4. Create Task Definition**

Save as `task-definition.json`:
```json
{
  "family": "prismatic-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "prismatic-backend",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/prismatic-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "AWS_DEFAULT_REGION",
          "value": "us-east-1"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/prismatic-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/prismatic-bedrock-role"
}
```

**5. Register Task**
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

**6. Create ALB (Application Load Balancer)**
- Go to EC2 → Load Balancers → Create
- Type: Application Load Balancer
- Scheme: Internet-facing
- Add HTTPS listener (port 443)
- Create target group (port 8000)

**7. Create ECS Service**
```bash
aws ecs create-service \
  --cluster prismatic-cluster \
  --service-name prismatic-service \
  --task-definition prismatic-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=prismatic-backend,containerPort=8000"
```

---

### Option 4: AWS Lambda + Function URLs (Experimental)

**Pros:**
- Truly serverless
- Pay per request
- Auto HTTPS

**Cons:**
- Streaming is complex with Lambda
- 15-minute timeout
- May not work well with SSE

**Only use if:** You're comfortable with Lambda limitations

---

## 🎯 Recommendation for AWS Hackathon

### **Use AWS App Runner!**

**Why:**
1. ✅ **Fast deployment** (5 minutes)
2. ✅ **Automatic HTTPS** (no setup needed)
3. ✅ **Serverless** (impressive for judges)
4. ✅ **Native AWS** (shows AWS knowledge)
5. ✅ **Works perfectly** with Bedrock
6. ✅ **Auto-scales** (handles demo traffic spikes)

**Judges will love:**
- Fully AWS-native stack
- Bedrock + App Runner + S3
- Serverless architecture
- Production-ready deployment

---

## Complete Deployment Checklist

### Backend (AWS App Runner)

- [ ] Push code to GitHub
- [ ] Create App Runner service
- [ ] Connect GitHub repo
- [ ] Configure build settings
- [ ] Add IAM role with Bedrock permissions
- [ ] Deploy and get HTTPS URL
- [ ] Test endpoint: `https://your-url.awsapprunner.com/health`

### Frontend (Vercel - plays nice with AWS)

- [ ] Push code to GitHub
- [ ] Connect to Vercel
- [ ] Add environment variable:
  ```
  NEXT_PUBLIC_CHATBOT_API_URL=https://your-app-runner-url.awsapprunner.com/chat
  ```
- [ ] Deploy
- [ ] Test complete workflow

### AWS Services Used (for your presentation)

- ✅ **Amazon Bedrock** - Claude AI
- ✅ **AWS App Runner** - Backend hosting
- ✅ **Amazon S3** - Image storage (from Lambda)
- ✅ **AWS Lambda** - Image analysis
- ✅ **Amazon ECR** - Container registry (if using ECS)
- ✅ **AWS IAM** - Security & permissions
- ✅ **Amazon CloudWatch** - Logs & monitoring

---

## IAM Permissions Setup

### Create Bedrock Access Role

**1. Go to IAM Console**
- https://console.aws.amazon.com/iam/

**2. Create Policy**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:ListFoundationModels"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

**3. Create Role**
- Service: App Runner (or ECS/Lambda depending on choice)
- Attach the policy you created
- Name: `prismatic-bedrock-role`

---

## Testing After Deployment

### 1. Health Check
```bash
curl https://your-app-runner-url.awsapprunner.com/health
```

**Expected:**
```json
{"message":"Healthy"}
```

### 2. Test Chat Endpoint
```bash
curl -X POST https://your-app-runner-url.awsapprunner.com/chat \
  -H "Content-Type: application/json" \
  -d '{
    "diagnosis": "diabetes",
    "message": "What is diabetes?",
    "history": []
  }' \
  --no-buffer
```

**Expected:**
```
data: {"text":"Diabetes"}
data: {"text":" is"}
data: {"text":" a"}
...
data: {"done":true}
```

### 3. Update Frontend
```bash
# In frontend/.env.local
NEXT_PUBLIC_CHATBOT_API_URL=https://your-app-runner-url.awsapprunner.com/chat
```

### 4. Test Complete Flow
1. Upload image
2. Get diagnosis
3. Chat with AI
4. Verify streaming works

---

## Cost Estimate (During Hackathon)

### AWS App Runner
- **Provisioned resources**: ~$25/month (1 vCPU, 2GB RAM)
- **During hackathon**: ~$1-2 total
- **Free tier**: 2000 build minutes/month

### Amazon Bedrock
- **Claude Sonnet 4.5**: ~$3 per 1M input tokens
- **Typical conversation**: 1000 tokens
- **100 demo conversations**: ~$0.30
- **During hackathon**: ~$5-10 total

### AWS Lambda (for image analysis)
- **First 1M requests**: FREE
- **Your usage**: FREE

### Amazon S3
- **First 5GB**: FREE
- **Your usage**: FREE

**Total Hackathon Cost: $5-15** 💰

---

## Monitoring & Debugging

### CloudWatch Logs
```bash
# View logs
aws logs tail /aws/apprunner/prismatic-backend --follow
```

### App Runner Console
- Go to your service
- Click **Logs** tab
- See real-time logs

### Test Locally First
```bash
# Always test locally before deploying
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Test from another terminal
curl http://localhost:8000/health
```

---

## Troubleshooting

### "Connection refused" after deployment
- Check security groups allow port 8000
- Verify service is running in App Runner console
- Check CloudWatch logs for errors

### "Access Denied" from Bedrock
- Verify IAM role has Bedrock permissions
- Check role is attached to App Runner service
- Verify model is enabled in Bedrock console

### CORS errors
- Check `allow_origins=['*']` in main.py
- For production, change to your frontend domain

### Streaming not working
- App Runner supports SSE natively ✅
- Verify `text/event-stream` content type
- Test with curl first

---

## Quick Start Commands

### Deploy to AWS App Runner (Fastest)

```bash
# 1. Commit your code
git add .
git commit -m "Deploy to AWS"
git push

# 2. Go to AWS Console → App Runner
# 3. Click "Create service" → Connect GitHub
# 4. Select repo → Configure → Create
# 5. Get URL from dashboard

# 6. Update frontend
echo "NEXT_PUBLIC_CHATBOT_API_URL=https://your-url.awsapprunner.com/chat" > frontend/.env.local

# 7. Deploy frontend to Vercel
cd frontend
vercel
```

**Time: ~10 minutes total** ⚡

---

## Architecture Diagram for Presentation

```
┌─────────────────────────────────────────────┐
│           User's Browser                     │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│     Next.js Frontend (Vercel/CloudFront)    │
└────────────┬────────────────────────────────┘
             │
             ↓
     ┌───────┴───────┐
     │               │
     ↓               ↓
┌─────────┐    ┌─────────────┐
│  Lambda │    │ App Runner  │
│ (Image) │    │  (FastAPI)  │
└────┬────┘    └──────┬──────┘
     │                │
     ↓                ↓
┌─────────┐    ┌─────────────┐
│   S3    │    │   Bedrock   │
│ (Store) │    │  (Claude)   │
└─────────┘    └─────────────┘
```

**AWS Services Highlighted:**
- 🟢 AWS App Runner
- 🟢 Amazon Bedrock
- 🟢 AWS Lambda
- 🟢 Amazon S3
- 🟢 AWS IAM
- 🟢 Amazon CloudWatch

---

## Demo Script for Judges

1. **"We built on AWS's latest AI services"**
   - Show Bedrock integration
   - Show Claude Sonnet 4.5

2. **"Serverless architecture"**
   - Explain App Runner auto-scaling
   - Show CloudWatch metrics

3. **"Real-time streaming"**
   - Demo chat interface
   - Show text appearing in real-time

4. **"Complete AWS stack"**
   - Point to architecture diagram
   - Highlight each AWS service

5. **"Production-ready"**
   - Show HTTPS URL
   - Show monitoring dashboard

---

## Resources

- [App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

## 🎉 You're Ready!

**Recommended path:**
1. Deploy backend to **AWS App Runner** (10 min)
2. Deploy frontend to **Vercel** (5 min)
3. Test everything (5 min)
4. Practice demo (15 min)

**Total setup time: 35 minutes**

Good luck with your hackathon! 🚀

