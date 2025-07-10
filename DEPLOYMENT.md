# Tunnelmole Service AWS Deployment Guide

This guide will help you deploy the Tunnelmole service to AWS using a cost-optimized architecture that stays within or close to the free tier.

## Architecture Overview

- **EC2 t2.micro instance** (free tier eligible)
- **API Gateway** for HTTP/HTTPS traffic with SSL termination
- **ECR** for Docker image storage
- **Elastic IP** for consistent WebSocket endpoint
- **CloudFormation** for infrastructure as code
- **GitHub Actions** for CI/CD

## Cost Breakdown (Monthly)

- EC2 t2.micro: **$0** (free tier - 750 hours/month)
- Elastic IP: **$0** (free when attached to running instance)
- API Gateway: **$3.50/million requests** (1M free requests/month)
- ECR: **$0.10/GB/month** (500MB free/month)
- Data Transfer: **$0.09/GB** (15GB free/month)

**Estimated monthly cost: $0-5** for typical usage

## Prerequisites

1. AWS Account
2. GitHub repository
3. Domain name (optional, for custom domain)
4. AWS CLI installed and configured
5. Git and Docker installed locally

## Setup Instructions

### 1. Prepare GitHub Repository

1. Fork or clone this repository
2. Set up the following GitHub Secrets in your repository settings:

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
DOMAIN_NAME=your-domain.com (optional)
CERTIFICATE_ARN=arn:aws:acm:region:account:certificate/cert-id (optional)
KEY_PAIR_NAME=your-ec2-key-pair (optional)
MONITORING_PASSWORD=your-secure-password
```

### 2. Create AWS Resources

#### Option A: Using GitHub Actions (Recommended)
1. Push your code to the `main` branch
2. GitHub Actions will automatically:
   - Run tests
   - Build and push Docker image to ECR
   - Deploy CloudFormation stack
   - Update the EC2 instance

#### Option B: Manual Deployment
1. Create ECR repository:
```bash
aws ecr create-repository --repository-name tunnelmole-service
```

2. Build and push Docker image:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker build -t tunnelmole-service .
docker tag tunnelmole-service:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/tunnelmole-service:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/tunnelmole-service:latest
```

3. Deploy CloudFormation stack:
```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation-template.yaml \
  --stack-name tunnelmole-service-stack \
  --parameter-overrides \
    ECRRepositoryURI=<account-id>.dkr.ecr.us-east-1.amazonaws.com/tunnelmole-service \
    MonitoringPassword=your-secure-password \
  --capabilities CAPABILITY_IAM
```

### 3. SSL Certificate Setup (Optional)

For custom domains with HTTPS:

1. **Request SSL Certificate:**
```bash
aws acm request-certificate \
  --domain-name your-domain.com \
  --validation-method DNS \
  --region us-east-1
```

2. **Validate the certificate** by adding the DNS records shown in the AWS Console

3. **Update your GitHub secrets** with the certificate ARN

4. **Configure DNS** to point your domain to the API Gateway:
   - Create a CNAME record pointing to the API Gateway domain
   - Or use Route 53 for automatic setup

### 4. Configure Domain DNS

After deployment, you'll get several endpoints:

- **API Gateway URL**: `https://abc123.execute-api.us-east-1.amazonaws.com/prod`
- **WebSocket Endpoint**: `ws://your-elastic-ip:8080`
- **Dashboard**: `https://your-domain.com/dashboard/`

## Usage

### Access the Dashboard
Visit `https://your-domain.com/dashboard/` and enter your monitoring password to see active connections.

### Configure Tunnelmole Client
Update your tunnelmole client configuration:

```typescript
const instanceConfig = {
    hostip: {
        endpoint: "ws://your-elastic-ip:8080"
    },
    runtime: {
        debug: false,
        enableLogging: true
    }
}
```

### Client Usage
```bash
# Install tunnelmole client
npm install -g tunnelmole

# Configure for your server
tmole config set endpoint ws://your-elastic-ip:8080

# Create tunnel
tmole 3000
```

## Monitoring and Maintenance

### View Logs
```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-elastic-ip

# View Docker logs
cd /opt/tunnelmole
docker-compose logs -f
```

### Update Service
The service automatically updates every 30 minutes via cron job, or manually trigger via GitHub Actions.

### Scale Considerations
- **Free tier limits**: 750 hours/month EC2, 1M API Gateway requests
- **Upgrade to t3.micro** if you need more consistent performance
- **Add CloudWatch** monitoring for production use
- **Consider multiple AZs** for high availability

## Troubleshooting

### Common Issues

1. **Docker image not found**
   - Ensure ECR repository exists and image is pushed
   - Check IAM permissions for ECR access

2. **EC2 instance not accessible**
   - Verify security group allows required ports
   - Check if Elastic IP is attached

3. **API Gateway errors**
   - Verify EC2 instance is running and healthy
   - Check security group allows traffic from API Gateway

4. **SSL certificate issues**
   - Ensure certificate is validated
   - Verify certificate is in the correct region (us-east-1 for API Gateway)

### Cost Optimization Tips

1. **Monitor usage** with AWS Cost Explorer
2. **Use CloudWatch** to set up billing alerts
3. **Stop EC2 during development** to save costs
4. **Use API Gateway caching** for frequently accessed endpoints
5. **Implement connection limits** to prevent abuse

## Security Considerations

1. **Change default passwords** in the configuration
2. **Restrict SSH access** to specific IP ranges
3. **Enable CloudTrail** for API logging
4. **Use VPC endpoints** for ECR access to avoid data transfer costs
5. **Implement rate limiting** on API Gateway

## Support

For issues with this deployment:
1. Check the GitHub Actions logs
2. Review CloudFormation events in AWS Console
3. Check EC2 instance logs via SSH
4. Open an issue in the repository