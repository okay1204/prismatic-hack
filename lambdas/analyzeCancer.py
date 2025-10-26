import json
import base64
import boto3
import datetime
import os

def lambda_handler(event, context):
    file_content = base64.b64decode(event['body'])
    bucket_name = 'prismatic-uploads'
    object_key = f'uploads/cancer_analysis_{datetime.datetime.now().strftime("%Y%m%d%H%M%S")}.jpg'
    
    s3 = boto3.client('s3')
    s3.put_object(
        Bucket=bucket_name,
        Key=object_key,
        Body=file_content,
        ContentType='image/jpeg'
    )

    # TODO get actual analysis from the sagemaker model
    diagnosis = 'MRI of eyes- Glaucoma'
    
    return {
        'statusCode': 200,
        'body': diagnosis
    }
