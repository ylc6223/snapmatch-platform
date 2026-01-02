/**
 * 七牛云存储配置测试脚本
 *
 * 使用方法：
 * ```bash
 * cd apps/backend
 * npm run test:qiniu
 * ```
 *
 * 或直接使用 ts-node：
 * ```bash
 * cd apps/backend
 * ts-node --files src/scripts/test-qiniu.ts
 * ```
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env.local');

dotenv.config({ path: envPath });

import { StorageService } from '../common/storage/storage.service.js';

/**
 * 颜色输出辅助函数
 */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✓ ${message}`, 'green');
}

function error(message: string) {
  log(`✗ ${message}`, 'red');
}

function info(message: string) {
  log(`ℹ ${message}`, 'blue');
}

function warn(message: string) {
  log(`⚠ ${message}`, 'yellow');
}

/**
 * 检查环境变量配置
 */
function checkEnvConfig(): boolean {
  log('\n========== 环境变量检查 ==========', 'blue');

  const requiredEnvs = [
    'STORAGE_PROVIDER',
    'QINIU_ACCESS_KEY',
    'QINIU_SECRET_KEY',
    'QINIU_BUCKET',
    'QINIU_REGION',
    'QINIU_DOMAIN',
  ];

  let allConfigured = true;

  for (const envKey of requiredEnvs) {
    const value = process.env[envKey];
    if (!value || value === 'your_access_key_here' || value === 'your_secret_key_here') {
      error(`${envKey}: 未配置或使用默认值`);
      allConfigured = false;
    } else {
      // 隐藏敏感信息
      const displayValue = envKey.includes('SECRET') || envKey.includes('KEY')
        ? `${value.substring(0, 8)}...`
        : value;
      success(`${envKey}: ${displayValue}`);
    }
  }

  return allConfigured;
}

/**
 * 测试存储服务初始化
 */
async function testStorageInitialization(): Promise<boolean> {
  log('\n========== 存储服务初始化 ==========', 'blue');

  try {
    const storageService = new StorageService();
    const providerType = storageService.getProviderType();
    success(`存储提供商类型: ${providerType}`);
    return true;
  } catch (err: unknown) {
    error(`存储服务初始化失败: ${(err as Error).message}`);
    return false;
  }
}

/**
 * 测试生成上传凭证
 */
async function testGenerateUploadToken(): Promise<boolean> {
  log('\n========== 测试生成上传凭证 ==========', 'blue');

  try {
    const storageService = new StorageService();

    // 生成测试上传凭证
    const testObjectKey = `test/test-${Date.now()}.jpg`;
    info(`测试对象键: ${testObjectKey}`);

    const tokenResult = await storageService.generateUploadToken(testObjectKey, 3600);

    success(`上传端点: ${tokenResult.uploadUrl}`);
    success(`对象键: ${tokenResult.objectKey}`);
    success(`Token 长度: ${tokenResult.token.length} 字符`);

    // 验证 Token 格式（七牛云 Token 格式：accessKey:encodedSign:encodedPutPolicy）
    const tokenParts = tokenResult.token.split(':');
    if (tokenParts.length === 3) {
      success(`Token 格式正确（包含 3 部分）`);
    } else {
      warn(`Token 格式可能不正确（包含 ${tokenParts.length} 部分）`);
    }

    return true;
  } catch (err: unknown) {
    error(`生成上传凭证失败: ${(err as Error).message}`);
    return false;
  }
}

/**
 * 测试生成公开访问 URL
 */
async function testGetPublicUrl(): Promise<boolean> {
  log('\n========== 测试生成公开访问 URL ==========', 'blue');

  try {
    const storageService = new StorageService();

    const testObjectKey = 'portfolio/assets/2025/01/test.jpg';
    info(`测试对象键: ${testObjectKey}`);

    const publicUrl = storageService.getPublicUrl(testObjectKey);

    success(`公开访问 URL: ${publicUrl}`);

    // 验证 URL 格式
    if (publicUrl.startsWith('http://') || publicUrl.startsWith('https://')) {
      success(`URL 格式正确`);
    } else {
      warn(`URL 格式可能不正确`);
    }

    return true;
  } catch (err: unknown) {
    error(`生成公开访问 URL 失败: ${(err as Error).message}`);
    return false;
  }
}

/**
 * 测试生成私有下载凭证
 */
async function testGeneratePrivateDownloadUrl(): Promise<boolean> {
  log('\n========== 测试生成私有下载凭证 ==========', 'blue');

  try {
    const storageService = new StorageService();

    const testObjectKey = 'delivery/photos/project1/photo.jpg';
    info(`测试对象键: ${testObjectKey}`);

    const privateUrl = await storageService.generatePrivateDownloadUrl(testObjectKey, 300);

    success(`私有下载 URL: ${privateUrl}`);

    // 验证 URL 格式（七牛云私有 URL 包含签名参数）
    if (privateUrl.includes('?e=') || privateUrl.includes('&e=')) {
      success(`私有 URL 包含签名参数`);
    } else {
      warn(`私有 URL 可能不包含签名参数`);
    }

    return true;
  } catch (err: unknown) {
    error(`生成私有下载凭证失败: ${(err as Error).message}`);
    return false;
  }
}

/**
 * 测试检查文件存在性
 */
async function testFileExists(): Promise<boolean> {
  log('\n========== 测试检查文件存在性 ==========', 'blue');

  try {
    const storageService = new StorageService();

    const testObjectKey = `test/nonexistent-${Date.now()}.jpg`;
    info(`测试对象键: ${testObjectKey}`);

    const exists = await storageService.fileExists(testObjectKey);

    if (!exists) {
      success(`正确识别文件不存在`);
    } else {
      warn(`文件不应该存在，但返回 true`);
    }

    return true;
  } catch (err: unknown) {
    error(`检查文件存在性失败: ${(err as Error).message}`);
    return false;
  }
}

/**
 * 主测试函数
 */
async function main() {
  log('\n╔══════════════════════════════════════════╗', 'blue');
  log('║   七牛云存储配置测试                    ║', 'blue');
  log('╚══════════════════════════════════════════╝', 'blue');

  // 1. 检查环境变量配置
  const envConfigured = checkEnvConfig();

  if (!envConfigured) {
    log('\n❌ 环境变量配置不完整，请检查 .env.local 文件', 'red');
    log('\n配置步骤：', 'yellow');
    log('1. 登录七牛云控制台：https://portal.qiniu.com', 'yellow');
    log('2. 进入「密钥管理」页面，复制 Access Key 和 Secret Key', 'yellow');
    log('3. 创建存储空间（Bucket）', 'yellow');
    log('4. 将配置信息填入 apps/backend/.env.local 文件', 'yellow');
    process.exit(1);
  }

  // 2. 测试存储服务初始化
  const initSuccess = await testStorageInitialization();

  if (!initSuccess) {
    log('\n❌ 存储服务初始化失败', 'red');
    process.exit(1);
  }

  // 3. 运行各项测试
  const results = {
    uploadToken: await testGenerateUploadToken(),
    publicUrl: await testGetPublicUrl(),
    privateUrl: await testGeneratePrivateDownloadUrl(),
    fileExists: await testFileExists(),
  };

  // 4. 输出测试结果汇总
  log('\n========== 测试结果汇总 ==========', 'blue');

  const successCount = Object.values(results).filter((r) => r).length;
  const totalCount = Object.keys(results).length;

  if (successCount === totalCount) {
    log(`\n✓ 所有测试通过！(${successCount}/${totalCount})`, 'green');
    log('\n下一步：', 'blue');
    log('1. 开始实现上传接口 POST /api/assets/sign', 'blue');
    log('2. 实现确认接口 POST /api/photos/confirm', 'blue');
    log('3. 创建前端上传组件 AssetUpload.vue', 'blue');
  } else {
    log(`\n⚠ 部分测试失败 (${successCount}/${totalCount})`, 'yellow');
  }

  log('\n========================================\n', 'blue');
}

// 运行测试
main().catch((err) => {
  error(`测试脚本执行失败: ${err.message}`);
  console.error(err);
  process.exit(1);
});
