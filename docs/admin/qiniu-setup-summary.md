# 七牛云存储配置完成总结

## ✅ 已完成的工作

### 1. 环境配置

- ✅ 在 `.env.example` 和 `.env.local` 中添加了七牛云配置项
- ✅ 添加了配置说明和获取方式指引

### 2. 依赖安装

- ✅ 安装了七牛云 Node.js SDK（`qiniu@7.14.0`）

### 3. 云存储抽象层

创建了完整的云存储抽象层，便于未来迁移到腾讯云 COS：

```
apps/backend/src/common/storage/
├── storage.interface.ts       # 云存储提供商接口
├── storage.service.ts          # 统一存储服务（根据环境变量选择提供商）
├── providers/
│   └── qiniu.provider.ts        # 七牛云实现
└── index.ts                     # 统一导出
```

### 4. 测试工具

- ✅ 创建了七牛云配置测试脚本 `src/scripts/test-qiniu.ts`
- ✅ 添加了 npm 脚本 `pnpm run test:qiniu`

---

## 🔧 下一步：配置七牛云账号

### 步骤 1：注册并登录七牛云

1. 访问七牛云官网：https://www.qiniu.com
2. 注册账号并登录
3. 进入控制台：https://portal.qiniu.com

### 步骤 2：获取 Access Key 和 Secret Key

1. 在七牛云控制台，点击右上角头像 → **「密钥管理」**
2. 复制你的 `Access Key` 和 `Secret Key`
3. 将这两个值填入 `apps/backend/.env.local` 文件：

```bash
QINIU_ACCESS_KEY=你的AccessKey
QINIU_SECRET_KEY=你的SecretKey
```

### 步骤 3：创建存储空间（Bucket）

1. 在七牛云控制台，点击左侧菜单 **「对象存储」**
2. 点击 **「新建存储空间」**
3. 填写配置：
   - **存储空间名称**：`snapmatch-photos`（或自定义名称）
   - **存储区域**：选择 `华东`（或其他区域，对应的区域代码见下方）
   - **访问控制**：选择 `公开空间`（作品集素材）或 `私有空间`（交付照片）
4. 点击 **「创建」**

### 步骤 4：配置域名

1. 存储空间创建后，七牛云会提供一个默认域名（如 `xxx.clouddn.com`）
2. 你可以：
   - **使用默认域名**（适合开发测试）
   - **绑定自定义域名**（生产环境推荐）
3. 将域名填入 `.env.local`：

```bash
# 如果使用默认域名
QINIU_DOMAIN=http://xxx.clouddn.com

# 如果使用自定义 CDN 域名
QINIU_DOMAIN=https://cdn.snapmatch.com
```

### 步骤 5：选择存储区域

根据你创建存储空间时选择的区域，配置 `QINIU_REGION`：

| 区域        | 区域代码 | 说明       |
| ----------- | -------- | ---------- |
| 华东-浙江   | `z0`     | 默认，推荐 |
| 华北-河北   | `z1`     |            |
| 华南-广东   | `z2`     |            |
| 北美-洛杉矶 | `na0`    |            |
| 亚太-新加坡 | `as0`    |            |

在 `.env.local` 中配置：

```bash
QINIU_REGION=z0  # 根据实际选择的区域填写
```

### 步骤 6：更新 Bucket 名称

将你创建的存储空间名称填入 `.env.local`：

```bash
QINIU_BUCKET=snapmatch-photos  # 替换为你的实际存储空间名称
```

---

## 📝 完整的 .env.local 配置示例

```bash
# ==================== 七牛云存储配置 ====================
STORAGE_PROVIDER=qiniu

# 从七牛云控制台「密钥管理」页面获取
QINIU_ACCESS_KEY=your_actual_access_key_here
QINIU_SECRET_KEY=your_actual_secret_key_here

# 你在七牛云创建的存储空间名称
QINIU_BUCKET=snapmatch-photos

# 存储区域（z0=华东, z1=华北, z2=华南, na0=北美, as0=亚太）
QINIU_REGION=z0

# 七牛云提供的默认域名或你绑定的自定义域名
QINIU_DOMAIN=https://cdn.snapmatch.com
```

---

## 🧪 测试配置

配置完成后，运行测试脚本验证配置是否正确：

```bash
cd apps/backend
pnpm run test:qiniu
```

测试脚本会检查：

1. ✅ 环境变量是否完整
2. ✅ 存储服务是否能正常初始化
3. ✅ 能否生成上传凭证
4. ✅ 能否生成公开访问 URL
5. ✅ 能否生成私有下载凭证
6. ✅ 能否检查文件是否存在

### 预期输出

如果配置正确，你会看到：

```
╔══════════════════════════════════════════╗
║   七牛云存储配置测试                    ║
╚══════════════════════════════════════════╝

========== 环境变量检查 ==========
✓ STORAGE_PROVIDER: qiniu
✓ QINIU_ACCESS_KEY: N7i5YHk...
✓ QINIU_SECRET_KEY: P8j6ZI...
✓ QINIU_BUCKET: snapmatch-photos
✓ QINIU_REGION: z0
✓ QINIU_DOMAIN: https://cdn.snapmatch.com

========== 存储服务初始化 ==========
✓ 存储提供商类型: qiniu

========== 测试生成上传凭证 ==========
✓ 上传端点: https://upload.qiniup.com
✓ 对象键: test/test-1234567890.jpg
✓ Token 长度: 156 字符
✓ Token 格式正确（包含 3 部分）

========== 测试生成公开访问 URL ==========
✓ 公开访问 URL: https://cdn.snapmatch.com/portfolio/assets/2025/01/test.jpg
✓ URL 格式正确

========== 测试生成私有下载凭证 ==========
✓ 私有下载 URL: https://cdn.snapmatch.com/delivery/photos/project1/photo.jpg?e=...
✓ 私有 URL 包含签名参数

========== 测试检查文件存在性 ==========
✓ 正确识别文件不存在

========== 测试结果汇总 ==========
✓ 所有测试通过！(5/5)

下一步：
1. 开始实现上传接口 POST /api/assets/sign
2. 实现确认接口 POST /api/photos/confirm
3. 创建前端上传组件 AssetUpload.vue

========================================
```

---

## ❓ 常见问题

### Q1: 测试脚本报错 "七牛云配置缺失"

**原因**：环境变量未配置或使用了默认值

**解决**：

1. 检查 `.env.local` 文件是否存在
2. 确保所有七牛云相关的环境变量都已填写真实的值
3. 不要使用 `your_access_key_here` 或 `your_secret_key_here`

### Q2: 报错 "no such bucket"

**原因**：存储空间名称错误或存储空间不存在

**解决**：

1. 确认 `QINIU_BUCKET` 的值与七牛云控制台中的存储空间名称完全一致
2. 检查存储空间是否已创建成功

### Q3: 报错 "incorrect region"

**原因**：存储区域配置与实际创建的存储空间区域不一致

**解决**：

1. 在七牛云控制台查看存储空间所在的区域
2. 修改 `QINIU_REGION` 为正确的区域代码

### Q4: 上传凭证生成失败

**原因**：Access Key 或 Secret Key 错误

**解决**：

1. 重新登录七牛云控制台，复制正确的密钥
2. 确认密钥没有被截断或包含多余的空格

---

## 📚 参考资源

- **七牛云 Node.js SDK 文档**：https://developer.qiniu.com/kodo/1289/nodejs
- **七牛云控制台**：https://portal.qiniu.com
- **七牛云存储区域文档**：https://developer.qiniu.com/kodo/1672/region-endpoint-faq
- **七牛云上传策略文档**：https://developer.qiniu.com/kodo/manual/1206/put-policy

---

**下一步**：配置完成后，请运行 `pnpm run test:qiniu` 验证配置是否正确。
