import {
  GetObjectCommand,
  PutObjectCommand,
  S3,
  type S3ClientConfig,
  DeleteObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

export const PUT_ASSETS_EXPIRES_IN = 4 * 60;
export const GET_ASSETS_EXPIRED_IN = 4 * 60 * 60;

export interface S3DriverOptions extends S3ClientConfig {
  bucketName: string;
  region: string;
}

export class S3Service {
  private s3Client: S3;
  private bucketName: string;

  constructor(options: S3DriverOptions) {
    const { bucketName, region, ...s3options } = options;
    if (!bucketName || !region) {
      throw new Error("Bucket name and region are required");
    }
    this.s3Client = new S3({ ...s3options, region });
    this.bucketName = bucketName;
  }

  async getUrlToUpload(
    params: { key: string; mimeType: string },
    folder: string
  ) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: `${folder}/${params.key}`,
        ContentType: params.mimeType,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: PUT_ASSETS_EXPIRES_IN,
      });
      return {
        url,
        path: `${folder}/${params.key}`,
      };
    } catch (error) {
      throw this.handleS3Error(error, "Failed to generate upload URL");
    }
  }

  async getSignedAssetUrl(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      return await getSignedUrl(this.s3Client, command, {
        expiresIn: GET_ASSETS_EXPIRED_IN,
      });
    } catch (error) {
      throw this.handleS3Error(error, "Failed to generate signed URL");
    }
  }

  async downloadFile(key: string, downloadPath: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const data = await this.s3Client.send(command);

      if (!data.Body) {
        throw new Error("No data returned from S3");
      }

      const stream = data.Body as Readable;
      const fileStream = createWriteStream(downloadPath);

      await pipeline(stream, fileStream);
      return downloadPath;
    } catch (error) {
      throw this.handleS3Error(error, `Failed to download file ${key}`);
    }
  }

  async deleteSignedFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
    } catch (error) {
      throw this.handleS3Error(error, `Failed to delete file ${key}`);
    }
  }

  private handleS3Error(error: unknown, contextMessage: string): Error {
    if (error instanceof S3ServiceException) {
      console.error(
        `S3 Error (${error.$metadata.httpStatusCode}): ${error.message}`
      );
      return new Error(`${contextMessage}: ${error.message}`);
    }

    if (error instanceof Error) {
      console.error(`Non-S3 Error: ${error.message}`);
      return new Error(`${contextMessage}: ${error.message}`);
    }

    console.error("Unknown error occurred");
    return new Error(`${contextMessage}: Unknown error occurred`);
  }
}
