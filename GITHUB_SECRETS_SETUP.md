# GitHub Secrets Setup for CI/CD

This document lists all the environment variables that need to be configured as GitHub Secrets for the CI/CD pipeline to work properly.

## Required GitHub Secrets

### Base Environment Variables (Fallback)

These are used as fallbacks when environment-specific secrets are not available.

| Secret Name            | Description                | Example                                           |
| ---------------------- | -------------------------- | ------------------------------------------------- |
| `PORT`                 | Backend server port        | `3000`                                            |
| `DATABASE_URL`         | Database connection URL    | `postgres://user:pass@localhost:5432/academic360` |
| `ACCESS_TOKEN_SECRET`  | JWT access token secret    | `your-access-token-secret`                        |
| `ACCESS_TOKEN_EXPIRY`  | JWT access token expiry    | `15m`                                             |
| `REFRESH_TOKEN_SECRET` | JWT refresh token secret   | `your-refresh-token-secret`                       |
| `REFRESH_TOKEN_EXPIRY` | JWT refresh token expiry   | `7d`                                              |
| `CORS_ORIGIN`          | CORS allowed origins       | `http://localhost:3000,https://yourdomain.com`    |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID     | `your-google-client-id`                           |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `your-google-client-secret`                       |
| `BACKEND_URL`          | Backend API URL            | `http://localhost:3000`                           |
| `AWS_REGION`           | AWS region (fallback)      | `ap-south-1`                                      |

### AWS S3 Configuration

#### Production AWS S3 Secrets

| Secret Name                  | Description                      | Example                      |
| ---------------------------- | -------------------------------- | ---------------------------- |
| `PROD_AWS_ACCESS_KEY_ID`     | Production AWS access key ID     | `AKIA...`                    |
| `PROD_AWS_SECRET_ACCESS_KEY` | Production AWS secret access key | `your-secret-key`            |
| `PROD_AWS_REGION`            | Production AWS region            | `ap-south-1`                 |
| `PROD_AWS_S3_BUCKET`         | Production S3 bucket name        | `academic360-prod-documents` |

#### Staging AWS S3 Secrets

| Secret Name                     | Description                   | Example                         |
| ------------------------------- | ----------------------------- | ------------------------------- |
| `STAGING_AWS_ACCESS_KEY_ID`     | Staging AWS access key ID     | `AKIA...`                       |
| `STAGING_AWS_SECRET_ACCESS_KEY` | Staging AWS secret access key | `your-secret-key`               |
| `STAGING_AWS_REGION`            | Staging AWS region            | `ap-south-1`                    |
| `STAGING_AWS_S3_BUCKET`         | Staging S3 bucket name        | `academic360-staging-documents` |

### Notification System Configuration

**Note**: The notification system uses the same environment variables as the backend. No separate notification system secrets are required. The notification system will automatically use the backend's environment variables including:

- Database connection (`DATABASE_URL`)
- JWT secrets (`ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`)
- Email configuration (`ZEPTO_URL`, `ZEPTO_FROM`, `ZEPTO_TOKEN`, `DEVELOPER_EMAIL`)
- WhatsApp configuration (`INTERAKT_API_KEY`, `INTERAKT_BASE_URL`, `DEVELOPER_PHONE`)
- AWS S3 configuration (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`)

The notification system will use `NOTIFICATION_SYSTEM_PORT` or fall back to `PORT` for its server port.

### Production Environment Secrets

#### Core Production Secrets

| Secret Name              | Description                     | Example                                         |
| ------------------------ | ------------------------------- | ----------------------------------------------- |
| `PROD_HOST`              | Production server host          | `your-prod-server.com`                          |
| `PROD_SSH_PRIVATE_KEY`   | Production SSH private key      | `-----BEGIN OPENSSH PRIVATE KEY-----...`        |
| `PROD_REMOTE_DEPLOY_DIR` | Production deployment directory | `/opt/academic360`                              |
| `PROD_DATABASE_URL`      | Production database URL         | `postgres://user:pass@prod-db:5432/academic360` |
| `PROD_PORT`              | Production backend port         | `3000`                                          |
| `PROD_BACKEND_URL`       | Production backend URL          | `https://api.yourdomain.com`                    |

#### Production Authentication Secrets

| Secret Name                 | Description                           | Example                                             |
| --------------------------- | ------------------------------------- | --------------------------------------------------- |
| `PROD_ACCESS_TOKEN_SECRET`  | Production JWT access token secret    | `prod-access-token-secret`                          |
| `PROD_ACCESS_TOKEN_EXPIRY`  | Production JWT access token expiry    | `15m`                                               |
| `PROD_REFRESH_TOKEN_SECRET` | Production JWT refresh token secret   | `prod-refresh-token-secret`                         |
| `PROD_REFRESH_TOKEN_EXPIRY` | Production JWT refresh token expiry   | `7d`                                                |
| `PROD_CORS_ORIGIN`          | Production CORS origins               | `https://yourdomain.com,https://www.yourdomain.com` |
| `PROD_GOOGLE_CLIENT_ID`     | Production Google OAuth client ID     | `prod-google-client-id`                             |
| `PROD_GOOGLE_CLIENT_SECRET` | Production Google OAuth client secret | `prod-google-client-secret`                         |

#### Production Email Configuration

| Secret Name      | Description              | Example                  |
| ---------------- | ------------------------ | ------------------------ |
| `PROD_SMTP_HOST` | Production SMTP host     | `smtp.gmail.com`         |
| `PROD_SMTP_PORT` | Production SMTP port     | `587`                    |
| `PROD_SMTP_USER` | Production SMTP username | `noreply@yourdomain.com` |
| `PROD_SMTP_PASS` | Production SMTP password | `your-smtp-password`     |

#### Production File Paths

| Secret Name                     | Description                    | Example                            |
| ------------------------------- | ------------------------------ | ---------------------------------- |
| `PROD_SETTINGS_PATH`            | Production settings path       | `/opt/academic360/settings`        |
| `PROD_DOCUMENTS_PATH`           | Production documents path      | `/opt/academic360/documents`       |
| `PROD_STUDY_MATERIAL_BASE_PATH` | Production study material path | `/opt/academic360/study-materials` |
| `PROD_LOG_DIRECTORY`            | Production log directory       | `/opt/academic360/logs`            |

#### Production Legacy Database

| Secret Name            | Description                   | Example                    |
| ---------------------- | ----------------------------- | -------------------------- |
| `PROD_OLD_DB_HOST`     | Production legacy DB host     | `legacy-db.yourdomain.com` |
| `PROD_OLD_DB_PORT`     | Production legacy DB port     | `5432`                     |
| `PROD_OLD_DB_USER`     | Production legacy DB user     | `legacy_user`              |
| `PROD_OLD_DB_PASSWORD` | Production legacy DB password | `legacy_password`          |
| `PROD_OLD_DB_NAME`     | Production legacy DB name     | `legacy_academic360`       |

#### Production Frontend Build Variables

| Secret Name                     | Description                      | Example                          |
| ------------------------------- | -------------------------------- | -------------------------------- |
| `PROD_VITE_APP_BACKEND_URL`     | Production Vite backend URL      | `https://api.yourdomain.com`     |
| `PROD_VITE_APP_PREFIX`          | Production Vite app prefix       | `/academic360`                   |
| `PROD_VITE_STUDENT_PROFILE_URL` | Production student profile URL   | `https://student.yourdomain.com` |
| `PROD_VITE_GOOGLE_CLIENT_ID`    | Production Vite Google client ID | `prod-google-client-id`          |
| `PROD_NEXT_PUBLIC_API_URL`      | Production Next.js API URL       | `https://api.yourdomain.com`     |
| `PROD_NEXT_PUBLIC_APP_BASE_URL` | Production Next.js app base URL  | `https://student.yourdomain.com` |
| `PROD_NEXT_PUBLIC_URL`          | Production Next.js public URL    | `https://student.yourdomain.com` |

#### Production Student Console Server Variables

| Secret Name              | Description                     | Example                                      |
| ------------------------ | ------------------------------- | -------------------------------------------- |
| `PROD_JWT_SECRET`        | Production JWT secret           | `prod-jwt-secret`                            |
| `PROD_ZEPTO_URL`         | Production ZeptoMail URL        | `https://api.zeptomail.in/v1.1`              |
| `PROD_ZEPTO_FROM`        | Production ZeptoMail from email | `noreply@yourdomain.com`                     |
| `PROD_ZEPTO_TOKEN`       | Production ZeptoMail token      | `your-zepto-token`                           |
| `PROD_INTERAKT_API_KEY`  | Production Interakt API key     | `your-interakt-api-key`                      |
| `PROD_INTERAKT_BASE_URL` | Production Interakt base URL    | `https://api.interakt.ai/v1/public/message/` |
| `PROD_DEVELOPER_PHONE`   | Production developer phone      | `+919999999999`                              |
| `PROD_DEVELOPER_EMAIL`   | Production developer email      | `dev@yourdomain.com`                         |

#### Production Student Database

| Secret Name                 | Description                     | Example                             |
| --------------------------- | ------------------------------- | ----------------------------------- |
| `PROD_DB_HOST`              | Production student DB host      | `student-db.yourdomain.com`         |
| `PROD_DB_PORT`              | Production student DB port      | `5432`                              |
| `PROD_DB_USER`              | Production student DB user      | `student_user`                      |
| `PROD_DB_PASSWORD`          | Production student DB password  | `student_password`                  |
| `PROD_DB_NAME`              | Production student DB name      | `student_academic360`               |
| `PROD_COURSE_MATERIAL_PATH` | Production course material path | `/opt/academic360/course-materials` |
| `PROD_DOCS_PATH`            | Production docs path            | `/opt/academic360/docs`             |
| `PROD_ACADEMIC_360_URL`     | Production Academic 360 URL     | `https://yourdomain.com`            |

#### Production Notification/RabbitMQ

| Secret Name                    | Description                     | Example                                         |
| ------------------------------ | ------------------------------- | ----------------------------------------------- |
| `PROD_RABBITMQ_URL`            | Production RabbitMQ URL         | `amqp://user:pass@rabbitmq.yourdomain.com:5672` |
| `PROD_RABBITMQ_PREFETCH`       | Production RabbitMQ prefetch    | `10`                                            |
| `PROD_RABBITMQ_RETRY_MAX`      | Production RabbitMQ max retries | `3`                                             |
| `PROD_RABBITMQ_RETRY_DELAY_MS` | Production RabbitMQ retry delay | `5000`                                          |

#### Production Docker Ports

| Secret Name                 | Description                     | Example |
| --------------------------- | ------------------------------- | ------- |
| `PROD_BACKEND_PORT`         | Production backend port         | `3000`  |
| `PROD_MAIN_CONSOLE_PORT`    | Production main console port    | `8081`  |
| `PROD_STUDENT_CONSOLE_PORT` | Production student console port | `3008`  |

### Staging Environment Secrets

#### Core Staging Secrets

| Secret Name                 | Description                  | Example                                            |
| --------------------------- | ---------------------------- | -------------------------------------------------- |
| `STAGING_HOST`              | Staging server host          | `staging.yourdomain.com`                           |
| `STAGING_SSH_PRIVATE_KEY`   | Staging SSH private key      | `-----BEGIN OPENSSH PRIVATE KEY-----...`           |
| `STAGING_REMOTE_DEPLOY_DIR` | Staging deployment directory | `/opt/academic360-staging`                         |
| `STAGING_DATABASE_URL`      | Staging database URL         | `postgres://user:pass@staging-db:5432/academic360` |
| `STAGING_PORT`              | Staging backend port         | `3000`                                             |
| `STAGING_BACKEND_URL`       | Staging backend URL          | `https://staging-api.yourdomain.com`               |

#### Staging Authentication Secrets

| Secret Name                    | Description                        | Example                          |
| ------------------------------ | ---------------------------------- | -------------------------------- |
| `STAGING_ACCESS_TOKEN_SECRET`  | Staging JWT access token secret    | `staging-access-token-secret`    |
| `STAGING_ACCESS_TOKEN_EXPIRY`  | Staging JWT access token expiry    | `15m`                            |
| `STAGING_REFRESH_TOKEN_SECRET` | Staging JWT refresh token secret   | `staging-refresh-token-secret`   |
| `STAGING_REFRESH_TOKEN_EXPIRY` | Staging JWT refresh token expiry   | `7d`                             |
| `STAGING_CORS_ORIGIN`          | Staging CORS origins               | `https://staging.yourdomain.com` |
| `STAGING_GOOGLE_CLIENT_ID`     | Staging Google OAuth client ID     | `staging-google-client-id`       |
| `STAGING_GOOGLE_CLIENT_SECRET` | Staging Google OAuth client secret | `staging-google-client-secret`   |

#### Staging Email Configuration

| Secret Name         | Description           | Example                  |
| ------------------- | --------------------- | ------------------------ |
| `STAGING_SMTP_HOST` | Staging SMTP host     | `smtp.gmail.com`         |
| `STAGING_SMTP_PORT` | Staging SMTP port     | `587`                    |
| `STAGING_SMTP_USER` | Staging SMTP username | `staging@yourdomain.com` |
| `STAGING_SMTP_PASS` | Staging SMTP password | `staging-smtp-password`  |

#### Staging File Paths

| Secret Name                        | Description                 | Example                                    |
| ---------------------------------- | --------------------------- | ------------------------------------------ |
| `STAGING_SETTINGS_PATH`            | Staging settings path       | `/opt/academic360-staging/settings`        |
| `STAGING_DOCUMENTS_PATH`           | Staging documents path      | `/opt/academic360-staging/documents`       |
| `STAGING_STUDY_MATERIAL_BASE_PATH` | Staging study material path | `/opt/academic360-staging/study-materials` |
| `STAGING_LOG_DIRECTORY`            | Staging log directory       | `/opt/academic360-staging/logs`            |

#### Staging Legacy Database

| Secret Name               | Description                | Example                            |
| ------------------------- | -------------------------- | ---------------------------------- |
| `STAGING_OLD_DB_HOST`     | Staging legacy DB host     | `staging-legacy-db.yourdomain.com` |
| `STAGING_OLD_DB_PORT`     | Staging legacy DB port     | `5432`                             |
| `STAGING_OLD_DB_USER`     | Staging legacy DB user     | `staging_legacy_user`              |
| `STAGING_OLD_DB_PASSWORD` | Staging legacy DB password | `staging_legacy_password`          |
| `STAGING_OLD_DB_NAME`     | Staging legacy DB name     | `staging_legacy_academic360`       |

#### Staging Frontend Build Variables

| Secret Name                        | Description                   | Example                                  |
| ---------------------------------- | ----------------------------- | ---------------------------------------- |
| `STAGING_VITE_APP_BACKEND_URL`     | Staging Vite backend URL      | `https://staging-api.yourdomain.com`     |
| `STAGING_VITE_APP_PREFIX`          | Staging Vite app prefix       | `/academic360`                           |
| `STAGING_VITE_STUDENT_PROFILE_URL` | Staging student profile URL   | `https://staging-student.yourdomain.com` |
| `STAGING_VITE_GOOGLE_CLIENT_ID`    | Staging Vite Google client ID | `staging-google-client-id`               |
| `STAGING_NEXT_PUBLIC_API_URL`      | Staging Next.js API URL       | `https://staging-api.yourdomain.com`     |
| `STAGING_NEXT_PUBLIC_APP_BASE_URL` | Staging Next.js app base URL  | `https://staging-student.yourdomain.com` |
| `STAGING_NEXT_PUBLIC_URL`          | Staging Next.js public URL    | `https://staging-student.yourdomain.com` |

#### Staging Student Console Server Variables

| Secret Name                 | Description                  | Example                                      |
| --------------------------- | ---------------------------- | -------------------------------------------- |
| `STAGING_JWT_SECRET`        | Staging JWT secret           | `staging-jwt-secret`                         |
| `STAGING_ZEPTO_URL`         | Staging ZeptoMail URL        | `https://api.zeptomail.in/v1.1`              |
| `STAGING_ZEPTO_FROM`        | Staging ZeptoMail from email | `staging@yourdomain.com`                     |
| `STAGING_ZEPTO_TOKEN`       | Staging ZeptoMail token      | `staging-zepto-token`                        |
| `STAGING_INTERAKT_API_KEY`  | Staging Interakt API key     | `staging-interakt-api-key`                   |
| `STAGING_INTERAKT_BASE_URL` | Staging Interakt base URL    | `https://api.interakt.ai/v1/public/message/` |
| `STAGING_DEVELOPER_PHONE`   | Staging developer phone      | `+919999999999`                              |
| `STAGING_DEVELOPER_EMAIL`   | Staging developer email      | `staging-dev@yourdomain.com`                 |

#### Staging Student Database

| Secret Name                    | Description                  | Example                                     |
| ------------------------------ | ---------------------------- | ------------------------------------------- |
| `STAGING_DB_HOST`              | Staging student DB host      | `staging-student-db.yourdomain.com`         |
| `STAGING_DB_PORT`              | Staging student DB port      | `5432`                                      |
| `STAGING_DB_USER`              | Staging student DB user      | `staging_student_user`                      |
| `STAGING_DB_PASSWORD`          | Staging student DB password  | `staging_student_password`                  |
| `STAGING_DB_NAME`              | Staging student DB name      | `staging_student_academic360`               |
| `STAGING_COURSE_MATERIAL_PATH` | Staging course material path | `/opt/academic360-staging/course-materials` |
| `STAGING_DOCS_PATH`            | Staging docs path            | `/opt/academic360-staging/docs`             |
| `STAGING_ACADEMIC_360_URL`     | Staging Academic 360 URL     | `https://staging.yourdomain.com`            |

#### Staging Notification/RabbitMQ

| Secret Name                       | Description                  | Example                                                 |
| --------------------------------- | ---------------------------- | ------------------------------------------------------- |
| `STAGING_RABBITMQ_URL`            | Staging RabbitMQ URL         | `amqp://user:pass@staging-rabbitmq.yourdomain.com:5672` |
| `STAGING_RABBITMQ_PREFETCH`       | Staging RabbitMQ prefetch    | `10`                                                    |
| `STAGING_RABBITMQ_RETRY_MAX`      | Staging RabbitMQ max retries | `3`                                                     |
| `STAGING_RABBITMQ_RETRY_DELAY_MS` | Staging RabbitMQ retry delay | `5000`                                                  |

#### Staging Docker Ports

| Secret Name                    | Description                  | Example |
| ------------------------------ | ---------------------------- | ------- |
| `STAGING_BACKEND_PORT`         | Staging backend port         | `3000`  |
| `STAGING_MAIN_CONSOLE_PORT`    | Staging main console port    | `8081`  |
| `STAGING_STUDENT_CONSOLE_PORT` | Staging student console port | `3008`  |

### Common Secrets (Used by both environments)

| Secret Name         | Description                         | Example            |
| ------------------- | ----------------------------------- | ------------------ |
| `SSH_USER`          | SSH username for deployment         | `deploy`           |
| `REMOTE_DEPLOY_DIR` | Default remote deployment directory | `/opt/academic360` |

## How to Add Secrets to GitHub

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click on **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter the secret name and value
6. Click **Add secret**

## Environment Variable Priority

The CI/CD pipeline uses the following priority order for environment variables:

1. **Environment-specific secrets** (e.g., `PROD_AWS_ACCESS_KEY_ID`, `STAGING_AWS_ACCESS_KEY_ID`)
2. **Base secrets** (e.g., `AWS_ACCESS_KEY_ID`) as fallback
3. **Default values** (hardcoded in the workflow)

## Validation

The CI/CD pipeline automatically validates that all critical environment variables are present:

- **Critical variables**: `NODE_ENV`, `PORT`, `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `CORS_ORIGIN`, `BACKEND_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `NOTIFICATION_SYSTEM_PORT`
- **Expected variables**: All variables listed in the expected variables array
- **Missing variables**: Will be reported in the deployment logs

## Security Notes

- Never commit secrets to the repository
- Use different secrets for production and staging environments
- Regularly rotate secrets, especially AWS credentials
- Use least-privilege access for AWS IAM users
- Monitor secret usage and access logs
