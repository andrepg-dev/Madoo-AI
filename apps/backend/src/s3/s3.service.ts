import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";

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
    const extByType: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const key = `${folder}/${uuidv4()}.${extByType[contentType] ?? "jpg"}`;
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: "public-read",
      });
      await this.client.send(command);
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    } catch (err) {
      this.logger.error("S3 upload failed", err);
      throw new InternalServerErrorException("Failed to upload file to S3.");
    }
  }
}
