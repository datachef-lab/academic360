# Deploying Academic360 with Docker Compose

## Prerequisites on EC2 (staging and production)

1. Install Docker and compose plugin

```bash
sudo apt update && sudo apt install -y ca-certificates curl gnupg
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo apt-add-repository "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

2. Create deploy directory and env files

```bash
sudo mkdir -p /opt/academic360 && sudo chown -R $USER:$USER /opt/academic360
cd /opt/academic360
# copy compose file for this env (staging or prod)
# place .env.staging or .env.production here
```

3. Optional: Nginx reverse proxy and TLS

- Point DNS to the EC2 public IP for each domain
- Install nginx and certbot, create sites pointing to localhost ports:
  - api.<env>.yourdomain → http://127.0.0.1:8080
  - app.<env>.yourdomain → http://127.0.0.1:8081
  - student.<env>.yourdomain → http://127.0.0.1:3008

## First time pull

```bash
export AWS_REGION=your-region
export AWS_ACCOUNT_ID=123456789012
export ECR_REGISTRY=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
# For staging
docker compose -f docker-compose.staging.yml pull && docker compose -f docker-compose.staging.yml up -d
# For production
# docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d
```

## Env files

- .env.staging and .env.production should include:
  - Backend: PORT=8080, database creds, JWT secrets, mail creds, etc.
  - Student Console: PORT=3008, NEXT*PUBLIC*\* variables and server-only secrets
  - Main Console: VITE\_\* variables needed at build time (avoid secrets)
