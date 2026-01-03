/**
 * Cloudflare R2 存储提供商实现（S3 兼容）
 *
 * 目标：
 * - 支持预签名 PUT（小文件直传）
 * - 支持分片上传（断点续传/更稳的重试）
 * - 支持私有读的预签名 GET（交付原图）
 *
 * 参考：
 * - Cloudflare R2 S3 API 兼容
 * - AWS SDK v3 + s3-request-presigner
 */
import { Injectable } from '@nestjs/common';
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListMultipartUploadsCommand,
  ListPartsCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  IMultipartUploadProvider,
  MultipartCompletedPart,
  MultipartUploadInitResult,
  MultipartUploadPartUrlResult,
  UploadTokenResult,
} from '../storage.interface';

const DEFAULT_REGION = 'auto';
const DEFAULT_PART_SIZE = 8 * 1024 * 1024; // 8MB（需 >= 5MB，最后一片可更小）

function normalizeDomain(domain: string) {
  return domain.replace(/\/$/, '');
}

function normalizeEtag(etag: string) {
  const trimmed = etag.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('"') && trimmed.endsWith('"') ? trimmed : `"${trimmed}"`;
}

@Injectable()
export class R2StorageProvider implements IMultipartUploadProvider {
  private client: S3Client;
  private bucket: string;
  private publicDomain: string | null;
  private partSize: number;

  constructor() {
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const endpoint = process.env.R2_ENDPOINT;
    const bucket = process.env.R2_BUCKET;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('R2 配置缺失：请设置 R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY');
    }
    if (!endpoint) {
      throw new Error(
        'R2 配置缺失：请设置 R2_ENDPOINT（例如 https://<accountid>.r2.cloudflarestorage.com）',
      );
    }
    if (!bucket) {
      throw new Error('R2 配置缺失：请设置 R2_BUCKET');
    }

    this.bucket = bucket;
    this.publicDomain = process.env.R2_PUBLIC_DOMAIN
      ? normalizeDomain(process.env.R2_PUBLIC_DOMAIN)
      : null;

    const configuredPartSize = Number(process.env.R2_PART_SIZE_BYTES ?? '');
    this.partSize =
      Number.isFinite(configuredPartSize) && configuredPartSize > 0
        ? configuredPartSize
        : DEFAULT_PART_SIZE;
    if (this.partSize < 5 * 1024 * 1024) {
      throw new Error('R2_PART_SIZE_BYTES 过小：S3 分片上传要求每片 >= 5MB（最后一片除外）');
    }

    this.client = new S3Client({
      region: process.env.R2_REGION ?? DEFAULT_REGION,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      // R2 建议使用 path-style
      forcePathStyle: true,
    });
  }

  async generateUploadToken(objectKey: string, expiresIn: number): Promise<UploadTokenResult> {
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      { expiresIn },
    );
    return {
      token: '',
      uploadUrl: url,
      objectKey,
      expiresIn,
      uploadStrategy: 's3-presigned-put',
    };
  }

  getPublicUrl(objectKey: string): string {
    if (!this.publicDomain) {
      throw new Error(
        'R2 配置缺失：作品集素材需要 R2_PUBLIC_DOMAIN 用于公开访问 URL（或改为服务端签名访问）',
      );
    }
    const cleanKey = objectKey.replace(/^\//, '');
    return `${this.publicDomain}/${cleanKey}`;
  }

  async generatePrivateDownloadUrl(objectKey: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      { expiresIn },
    );
  }

  async deleteFile(objectKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
  }

  async deleteFiles(objectKeys: string[]): Promise<void> {
    await Promise.all(objectKeys.map((key) => this.deleteFile(key)));
  }

  async fileExists(objectKey: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }));
      return true;
    } catch {
      return false;
    }
  }

  async createMultipartUpload(
    objectKey: string,
    contentType: string,
    expiresIn: number,
  ): Promise<MultipartUploadInitResult> {
    const result = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: objectKey,
        ContentType: contentType,
      }),
    );
    if (!result.UploadId) {
      throw new Error('R2 创建分片上传失败：缺少 UploadId');
    }
    return { uploadId: result.UploadId, objectKey, partSize: this.partSize, expiresIn };
  }

  async signUploadPart(
    objectKey: string,
    uploadId: string,
    partNumber: number,
    expiresIn: number,
  ): Promise<MultipartUploadPartUrlResult> {
    const url = await getSignedUrl(
      this.client,
      new UploadPartCommand({
        Bucket: this.bucket,
        Key: objectKey,
        UploadId: uploadId,
        PartNumber: partNumber,
      }),
      { expiresIn },
    );
    return { url, expiresIn };
  }

  async completeMultipartUpload(
    objectKey: string,
    uploadId: string,
    parts: MultipartCompletedPart[],
  ): Promise<void> {
    await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: objectKey,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts
            .slice()
            .sort((a, b) => a.partNumber - b.partNumber)
            .map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })),
        },
      }),
    );
  }

  async abortMultipartUpload(objectKey: string, uploadId: string): Promise<void> {
    await this.client.send(
      new AbortMultipartUploadCommand({ Bucket: this.bucket, Key: objectKey, UploadId: uploadId }),
    );
  }

  async listUploadedParts(objectKey: string, uploadId: string): Promise<MultipartCompletedPart[]> {
    const parts: MultipartCompletedPart[] = [];
    let partNumberMarker: string | undefined;

    // R2 兼容 S3 的分页参数
    while (true) {
      const result = await this.client.send(
        new ListPartsCommand({
          Bucket: this.bucket,
          Key: objectKey,
          UploadId: uploadId,
          PartNumberMarker: partNumberMarker,
        }),
      );
      const page = (result.Parts ?? [])
        .map((p) => ({
          partNumber: p.PartNumber ?? 0,
          etag: normalizeEtag(p.ETag ?? ''),
        }))
        .filter((p) => p.partNumber > 0 && p.etag.length > 0);
      parts.push(...page);

      if (!result.IsTruncated) break;
      partNumberMarker = result.NextPartNumberMarker;
      if (!partNumberMarker) break;
    }

    return parts;
  }

  async listMultipartUploads(): Promise<
    Array<{
      objectKey: string;
      uploadId: string;
      initiated: Date;
    }>
  > {
    const uploads: Array<{ objectKey: string; uploadId: string; initiated: Date }> = [];
    let keyMarker: string | undefined;
    let uploadIdMarker: string | undefined;

    // R2 兼容 S3 的分页参数
    while (true) {
      const result = await this.client.send(
        new ListMultipartUploadsCommand({
          Bucket: this.bucket,
          KeyMarker: keyMarker,
          UploadIdMarker: uploadIdMarker,
        }),
      );

      // 调试日志
      console.log('[R2Provider] ListMultipartUploads result:', {
        bucket: this.bucket,
        uploadsCount: result.Uploads?.length || 0,
        isTruncated: result.IsTruncated,
        uploads: result.Uploads?.slice(0, 3), // 只打印前 3 个
      });

      const page = (result.Uploads ?? []).map((upload) => ({
        objectKey: upload.Key ?? '',
        uploadId: upload.UploadId ?? '',
        initiated: upload.Initiated ? new Date(upload.Initiated) : new Date(),
      }));
      uploads.push(...page);

      if (!result.IsTruncated) break;
      keyMarker = result.NextKeyMarker;
      uploadIdMarker = result.NextUploadIdMarker;
      if (!keyMarker && !uploadIdMarker) break;
    }

    console.log('[R2Provider] ListMultipartUploads total:', uploads.length);
    return uploads;
  }

  async cleanupIncompleteUploads(): Promise<{
    cleaned: number;
    failed: number;
    details: Array<{ objectKey: string; uploadId: string; success: boolean; error?: string }>;
  }> {
    // 1. 列出所有未完成的分片上传
    const uploads = await this.listMultipartUploads();

    const details: Array<{ objectKey: string; uploadId: string; success: boolean; error?: string }> =
      [];
    let cleaned = 0;
    let failed = 0;

    // 2. 逐个中止
    for (const upload of uploads) {
      try {
        await this.abortMultipartUpload(upload.objectKey, upload.uploadId);
        cleaned++;
        details.push({
          objectKey: upload.objectKey,
          uploadId: upload.uploadId,
          success: true,
        });
      } catch (error) {
        failed++;
        details.push({
          objectKey: upload.objectKey,
          uploadId: upload.uploadId,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { cleaned, failed, details };
  }
}
