import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";

/**
 * S3 client with optional static credentials.
 * When AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY are unset, uses the default
 * credential provider chain (EC2/ECS IAM role, instance profile, etc.).
 */
export function createS3Client(): S3Client {
  const region = process.env.AWS_REGION || "ap-south-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim() || "";
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim() || "";

  const config: S3ClientConfig = { region };

  if (accessKeyId && secretAccessKey) {
    config.credentials = { accessKeyId, secretAccessKey };
  }

  return new S3Client(config);
}
