import { S3Service } from "./s3.services";

export const s3Driver = new S3Service({
  region: process.env.AWS_REGION!,
  bucketName: process.env.AWS_BUCKET_NAME!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});
