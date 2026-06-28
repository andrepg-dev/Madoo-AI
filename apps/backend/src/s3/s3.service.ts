import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import { isEmailSafeImageType, toEmailSafeImage } from "../common/image-transcode";

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>("AWS_REGION");
    const accessKeyId = this.configService.get<string>("AWS_ACCESS_KEY_ID");
    const secretAccessKey = this.configService.get<string>("AWS_SECRET_ACCESS_KEY");
    const bucketName = this.configService.get<string>("AWS_BUCKET_NAME");

    if (!region) throw new Error("AWS_REGION not found in environment variables");
    if (!accessKeyId || !secretAccessKey)
      throw new Error("AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not found in environment variables");
    if (!bucketName) throw new Error("AWS_BUCKET_NAME not found in environment variables");

    this.region = region;
    this.bucketName = bucketName;
    this.client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async uploadBuffer(buffer: Buffer, contentType: string, folder = "previews"): Promise<string> {
    // Normalize images to an email-safe format before hosting. AVIF/WEBP render
    // in a desktop browser (so the in-app editor preview looks fine) but come
    // out blank in the Alpine headless-Chromium screenshot and in most inboxes.
    // JPEG/PNG/GIF (incl. our PNG screenshots) pass through untouched.
    let body = buffer;
    let type = contentType;
    if (type.startsWith("image/") && !isEmailSafeImageType(type)) {
      try {
        const safe = await toEmailSafeImage(buffer, type);
        body = safe.buffer;
        type = safe.contentType;
      } catch (err) {
        this.logger.warn(
          `Image transcode failed for ${type}; uploading original bytes.`,
          err as Error,
        );
      }
    }

    const key = `${folder}/${uuidv4()}.${EXT_BY_TYPE[type] ?? "jpg"}`;
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: type,
        ACL: "public-read",
      });
      await this.client.send(command);
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    } catch (err) {
      this.logger.error("S3 upload failed", err);
      throw new InternalServerErrorException("Failed to upload file to S3.");
    }
  }

  /** List every object key under a prefix (paginated). For maintenance scripts. */
  async listKeys(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let continuationToken: string | undefined;
    do {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      for (const obj of res.Contents ?? []) {
        if (obj.Key) keys.push(obj.Key);
      }
      continuationToken = res.IsTruncated
        ? res.NextContinuationToken
        : undefined;
    } while (continuationToken);
    return keys;
  }

  /** Fetch an object's bytes + content type by exact key. For maintenance scripts. */
  async getObject(key: string): Promise<{ buffer: Buffer; contentType: string }> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucketName, Key: key }),
    );
    const bytes = await res.Body!.transformToByteArray();
    return {
      buffer: Buffer.from(bytes),
      contentType: res.ContentType ?? "",
    };
  }

  /** Overwrite an object at an exact key, keeping its URL stable. */
  async putObjectAtKey(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: "public-read",
      }),
    );
  }
}
