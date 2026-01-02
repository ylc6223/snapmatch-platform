/**
 * 七牛云存储提供商实现
 *
 * 实现基于七牛云对象存储（Kodo）的文件上传、下载、管理功能
 *
 * 官方文档：https://developer.qiniu.com/kodo/1289/nodejs
 */

import { Injectable } from '@nestjs/common';
import * as qiniu from 'qiniu';
import { IStorageProvider, UploadTokenResult } from '../storage.interface';

@Injectable()
export class QiniuStorageProvider implements IStorageProvider {
  private mac: qiniu.auth.digest.Mac;
  private config: qiniu.conf.Config;
  private bucketManager: qiniu.rs.BucketManager;

  constructor() {
    // 从环境变量读取七牛云配置
    const accessKey = process.env.QINIU_ACCESS_KEY;
    const secretKey = process.env.QINIU_SECRET_KEY;
    const region = process.env.QINIU_REGION || 'z0';

    if (!accessKey || !secretKey) {
      throw new Error('七牛云配置缺失：请在环境变量中设置 QINIU_ACCESS_KEY 和 QINIU_SECRET_KEY');
    }

    // 初始化认证对象
    this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

    // 初始化配置对象
    this.config = new qiniu.conf.Config();

    // 设置存储区域
    this.config.regionsProvider = qiniu.httpc.Region.fromRegionId(region);

    // 可选：使用 HTTPS 域名
    // this.config.useHttpsDomain = true;

    // 可选：上传使用 CDN 加速
    // this.config.useCdnDomain = true;

    // 初始化 BucketManager（用于文件管理）
    this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
  }

  /**
   * 生成上传凭证
   *
   * 七牛云上传策略文档：https://developer.qiniu.com/kodo/manual/1206/put-policy
   *
   * @param objectKey 对象存储路径
   * @param expiresIn 过期时间（秒）
   * @returns 上传凭证信息
   */
  async generateUploadToken(objectKey: string, expiresIn: number): Promise<UploadTokenResult> {
    const bucket = process.env.QINIU_BUCKET;

    if (!bucket) {
      throw new Error('七牛云配置缺失：请在环境变量中设置 QINIU_BUCKET');
    }

    // 创建上传策略
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: `${bucket}:${objectKey}`, // 限制只能上传到指定文件名
      expires: expiresIn, // 过期时间
      // 可选：返回内容自定义
      // returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)"}',
    });

    // 生成上传 Token
    const token = putPolicy.uploadToken(this.mac);

    return {
      token,
      uploadUrl: this.getUploadUrl(),
      objectKey,
      expiresIn,
    };
  }

  /**
   * 获取公开访问 URL
   *
   * @param objectKey 对象存储路径
   * @returns 公开访问的完整 URL
   */
  getPublicUrl(objectKey: string): string {
    const domain = process.env.QINIU_DOMAIN;

    if (!domain) {
      throw new Error('七牛云配置缺失：请在环境变量中设置 QINIU_DOMAIN');
    }

    // 去掉域名末尾的斜杠，避免双斜杠
    const cleanDomain = domain.replace(/\/$/, '');
    // 去掉对象键开头的斜杠
    const cleanKey = objectKey.replace(/^\//, '');

    return `${cleanDomain}/${cleanKey}`;
  }

  /**
   * 生成私有下载凭证（临时签名 URL）
   *
   * 七牛云私有下载文档：https://developer.qiniu.com/kodo/manual/1652/download-token
   *
   * @param objectKey 对象存储路径
   * @param expiresIn 过期时间（秒），默认 3600（1小时）
   * @returns 临时签名的下载 URL
   */
  async generatePrivateDownloadUrl(objectKey: string, expiresIn = 3600): Promise<string> {
    const publicUrl = this.getPublicUrl(objectKey);
    const deadline = Math.floor(Date.now() / 1000) + expiresIn;

    // 生成私有下载 URL（使用七牛云 util API）
    const privateDownloadUrl = (
      qiniu.util as unknown as {
        privateDownloadUrl: (
          mac: qiniu.auth.digest.Mac,
          publicUrl: string,
          deadline: number,
        ) => string;
      }
    ).privateDownloadUrl;
    return privateDownloadUrl(this.mac, publicUrl, deadline);
  }

  /**
   * 删除文件
   *
   * 七牛云删除文档：https://developer.qiniu.com/kodo/1289/resource-management#delete
   *
   * @param objectKey 对象存储路径
   */
  async deleteFile(objectKey: string): Promise<void> {
    const bucket = process.env.QINIU_BUCKET;

    if (!bucket) {
      throw new Error('七牛云配置缺失：请在环境变量中设置 QINIU_BUCKET');
    }

    return new Promise((resolve, reject) => {
      void this.bucketManager.delete(bucket, objectKey, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
        } else if (respInfo.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(respBody?.error || '删除文件失败'));
        }
      });
    });
  }

  /**
   * 批量删除文件
   *
   * 七牛云批量操作文档：https://developer.qiniu.com/kodo/1289/resource-management#batch
   *
   * @param objectKeys 对象存储路径数组
   */
  async deleteFiles(objectKeys: string[]): Promise<void> {
    const bucket = process.env.QINIU_BUCKET;

    if (!bucket) {
      throw new Error('七牛云配置缺失：请在环境变量中设置 QINIU_BUCKET');
    }

    // 构建批量删除操作（每次最多 1000 个）
    const deleteOperations = objectKeys.map((key) => qiniu.rs.deleteOp(bucket, key));

    return new Promise((resolve, reject) => {
      void this.bucketManager.batch(deleteOperations, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
        } else if (Math.floor(respInfo.statusCode / 100) === 2) {
          // 200 是完全成功，298 是部分成功
          resolve();
        } else {
          reject(new Error(respBody?.toString() || '批量删除文件失败'));
        }
      });
    });
  }

  /**
   * 检查文件是否存在
   *
   * 七牛云文件信息查询文档：https://developer.qiniu.com/kodo/1289/resource-management#stat
   *
   * @param objectKey 对象存储路径
   * @returns 文件是否存在
   */
  async fileExists(objectKey: string): Promise<boolean> {
    const bucket = process.env.QINIU_BUCKET;

    if (!bucket) {
      throw new Error('七牛云配置缺失：请在环境变量中设置 QINIU_BUCKET');
    }

    return new Promise((resolve, reject) => {
      void this.bucketManager.stat(bucket, objectKey, (err, respBody, respInfo) => {
        if (err) {
          // 七牛云错误码 612 表示文件不存在
          const errorMessage = err.message || String(err);
          if (errorMessage.includes('612') || errorMessage.includes('no such file')) {
            resolve(false);
          } else {
            reject(err);
          }
        } else if (respInfo.statusCode === 200) {
          resolve(true);
        } else if (respInfo.statusCode === 612 || respBody?.error === 'no such file or directory') {
          resolve(false);
        } else {
          reject(new Error(respBody?.error || '检查文件存在性失败'));
        }
      });
    });
  }

  /**
   * 获取上传端点 URL
   *
   * 根据配置的区域返回对应的上传域名
   * 如果未配置，返回七牛云默认上传端点
   *
   * @returns 上传端点 URL
   */
  private getUploadUrl(): string {
    // 如果在环境变量中配置了上传端点，使用配置的
    const uploadUrl = process.env.QINIU_UPLOAD_URL;
    if (uploadUrl) {
      return uploadUrl;
    }

    // 否则根据区域选择上传端点
    const region = process.env.QINIU_REGION || 'z0';

    // 华东区域
    if (region === 'z0') {
      return 'https://upload.qiniup.com';
    }

    // 华北区域
    if (region === 'z1') {
      return 'https://upload-z1.qiniup.com';
    }

    // 华南区域
    if (region === 'z2') {
      return 'https://upload-z2.qiniup.com';
    }

    // 北美区域
    if (region === 'na0') {
      return 'https://upload-na0.qiniup.com';
    }

    // 亚太区域
    if (region === 'as0') {
      return 'https://upload-as0.qiniup.com';
    }

    // 默认上传端点
    return 'https://upload.qiniup.com';
  }
}
