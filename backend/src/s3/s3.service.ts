import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream';

@Injectable()
export class S3Service implements OnModuleInit {
  private minioClient: Minio.Client;
  private bucketName: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT', 'localhost');
    const port = this.configService.get<number>('S3_PORT', 9000);
    const useSSL =
      this.configService.get<string>('S3_USE_SSL', 'false') === 'true';
    const accessKey = this.configService.get<string>('S3_ACCESS_KEY', '');
    const secretKey = this.configService.get<string>('S3_SECRET_KEY', '');
    this.bucketName = this.configService.get<string>(
      'S3_BUCKET_NAME',
      'uploads',
    );

    this.minioClient = new Minio.Client({
      endPoint: endpoint,
      port: port,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey,
    });
  }

  async onModuleInit() {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName);
        this.logger.log(`Bucket '${this.bucketName}' created successfully`);
      } else {
        this.logger.log(`Bucket '${this.bucketName}' already exists`);
      }
    } catch (error) {
      this.logger.warn(
        `Could not connect to S3/MinIO: ${(error as Error).message}. ` +
          `File uploads will fail until S3 is available.`,
      );
    }
  }

  /**
   * Upload file to S3
   * @param file Multer file object with buffer
   * @param folder Optional folder path in bucket
   * @returns Object key (path) of uploaded file
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'materi',
  ): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split('.').pop();
    const objectName = `${folder}/${uniqueSuffix}.${ext}`;

    await this.minioClient.putObject(
      this.bucketName,
      objectName,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
        'X-Original-Name': encodeURIComponent(file.originalname),
      },
    );

    this.logger.log(`File uploaded: ${objectName}`);
    return objectName;
  }

  /**
   * Get file as readable stream from S3
   * @param objectName Object key (path) in bucket
   * @returns Readable stream
   */
  async getFileStream(objectName: string): Promise<Readable> {
    return await this.minioClient.getObject(this.bucketName, objectName);
  }

  /**
   * Get file stats from S3
   * @param objectName Object key (path) in bucket
   * @returns File stats including size and content type
   */
  async getFileStat(objectName: string): Promise<Minio.BucketItemStat> {
    return await this.minioClient.statObject(this.bucketName, objectName);
  }

  /**
   * Delete file from S3
   * @param objectName Object key (path) in bucket
   */
  async deleteFile(objectName: string): Promise<void> {
    await this.minioClient.removeObject(this.bucketName, objectName);
    this.logger.log(`File deleted: ${objectName}`);
  }

  /**
   * Check if file exists in S3
   * @param objectName Object key (path) in bucket
   * @returns Boolean indicating if file exists
   */
  async fileExists(objectName: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(this.bucketName, objectName);
      return true;
    } catch {
      return false;
    }
  }
}
