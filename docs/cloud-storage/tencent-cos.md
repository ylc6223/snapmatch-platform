# 腾讯云 COS：介绍与使用（产品/运营 + 开发）

本文面向两类读者：

- 产品/运营：理解 COS 是什么、适用场景、费用构成、如何用最佳实践控制成本和风险。
- 开发：掌握通用流程与 Node.js 相关用法（后端上传、前端直传、预签名 URL、临时密钥 STS、CDN、图片处理、防盗链）。

---

## 1. COS 是什么，适合解决什么问题

COS（Cloud Object Storage，对象存储）提供一种“海量文件/对象”的存储服务。你可以把它理解为：

- 以 **Bucket（存储桶）** 为容器，以 **Object（对象）** 为基本单位存储文件。
- 每个对象通过 `Key`（类似路径的字符串）唯一标识，例如 `images/2025/01/a.jpg`。
- 通过 HTTP/HTTPS（COS XML API）对对象进行上传、下载、删除、列举、权限控制等操作。
  ![alt text](Gemini_Generated_Image_59h0em59h0em59h0.png)

典型场景：

- 静态资源托管（网页/图片/JS/CSS/安装包）
- 用户上传（头像、图片、视频、附件）
- 内容分发（配合 CDN 加速）
- 图片处理与审计（缩放、裁剪、水印、WebP、鉴黄等）

---

## 2. 核心概念（给产品/运营的快速理解）

- **Bucket**：存储桶（强绑定地域），权限/生命周期/跨域/CORS/日志等很多配置以 Bucket 为单位。
- **Object / Key**：对象与对象键，Key 就是“文件在桶里的名字”，可以按业务约定做“目录化”。
- **Region（地域）**：桶创建时确定，影响时延、成本、合规；一般选离用户/业务最近的地域。
- **存储类型**：标准/低频/归档/智能分层等（成本、可用性、取回费用/延迟不同）。
- **权限控制**：公有读/私有读；配合 **预签名 URL** 或 **STS 临时密钥** 做安全访问。

---

## 3. 费用怎么理解（成本构成与控费思路）

COS 常见费用项（不同计费模式、地域、存储类型价格不同，以控制台价格为准）：

1. **存储费用**：按存储容量 × 存储类型计费（归档/低频更便宜，但有取回费用/时延）。
2. **请求费用**：PUT/GET/LIST/DELETE 等请求次数（高并发小文件要关注）。
3. **流量费用**：公网下行（用户下载）通常是大头；上行一般免费或较低。
4. **取回费用**：低频/归档取回会产生额外费用；归档还可能有最低存储周期。
5. **CDN 费用**（若使用）：CDN 下行流量 + 请求（通常比直接 COS 公网下行更适合大规模分发）。
6. **图片处理/增值服务费用**：如样式处理、智能压缩、内容审核等。

控费最佳实践（产品/运营侧优先）：

- 让“热点内容”走 **CDN**，减少 COS 公网回源流量。
- 对大文件/历史文件配置 **生命周期**：过期删除、转低频、转归档、到期清理。
- 关注“请求费用”：小文件大量 GET/HEAD/LIST 可能变贵；避免频繁 LIST，使用索引/数据库记录 Key。
- 上传/下载尽量使用 **分片上传**（提升成功率）与 **断点续传**（减少重传浪费）。

---

## 4. 安全模型（必须掌握）

### 4.1 不要把永久密钥放到前端

前端（浏览器/小程序）如果拿到 `SecretId/SecretKey`，相当于“拿到你账号的钥匙”，风险极高。

前端安全直传的正确路线是二选一（常用是 STS）：

1. **STS 临时密钥直传**：后端向 STS 申请短期凭证（带最小权限策略），前端用临时凭证调用 COS SDK 上传。
2. **预签名 URL 直传**：后端生成一个短期可用的签名 URL，前端对该 URL 直接 PUT/POST 上传。

两者对比：

- STS：适合“前端要做多次操作/分片/断点续传/列举”等，需要 SDK 能力时更方便。
- 预签名 URL：适合“单次上传/下载”或你想把权限收口到“单个 Key、单个方法、短期有效”。

### 4.2 最小权限策略（最重要的落地手段）

无论 STS 还是预签名，都要贯彻“最小权限”：

- 只允许指定 Bucket
- 只允许指定 Key 前缀（例如 `uploads/${userId}/*`）
- 只允许必要动作（例如上传只要 `PutObject`，不要给 `DeleteObject`）
- 凭证有效期尽量短（例如 5～30 分钟）

示例（策略思路，JSON 以腾讯云策略语法为准，需按业务替换）：

```json
{
  "version": "2.0",
  "statement": [
    {
      "effect": "allow",
      "action": [
        "name/cos:PutObject",
        "name/cos:InitiateMultipartUpload",
        "name/cos:UploadPart",
        "name/cos:CompleteMultipartUpload"
      ],
      "resource": [
        "qcs::cos:ap-guangzhou:uid/1250000000:example-bucket-1250000000/uploads/${userId}/*"
      ]
    }
  ]
}
```

---

## 5. 典型架构（建议按场景落地）

### 场景 A：静态资源托管

推荐方案：

- COS 作为源站（桶可设置为公有读，或私有读 + CDN + 鉴权）
- CDN 加速（强烈建议），并配置缓存策略（Cache-Control、版本号文件名）
- 防盗链：CDN Referer 白名单 / URL 鉴权 / Token 鉴权（视业务而定）

最佳实践：

- 文件名带 hash：`app.9c1d2a3.js`，可长缓存（1 年）而不怕更新不生效。
- HTML 短缓存或不缓存；静态资源长缓存。
- 需要权限控制的静态资源（例如付费内容）不要做“公有读”，用签名 URL/鉴权 CDN。

### 场景 B：用户上传（前端直传）

推荐方案：**STS 临时密钥 + 前端 SDK 分片上传**  
流程：

1. 前端向业务后端请求临时凭证（后端再向 STS 获取，带最小权限策略）。
2. 前端用临时凭证初始化 COS SDK（浏览器用 `cos-js-sdk-v5`）。
3. 前端上传（小文件 `putObject`，大文件 `sliceUploadFile` 分片上传）。
4. 后端记录对象 Key、大小、hash、用户信息等（做业务索引与审计）。

### 场景 C：后端上传（Node.js 服务端）

适用：服务端生成文件、转码/处理后落 COS、或你不想前端直传。  
流程：

1. 服务端用永久密钥或服务端 STS（更推荐）初始化 COS SDK（Node.js 用 `cos-nodejs-sdk-v5`）。
2. 上传文件（推荐 `uploadFile`，支持分片阈值）。
3. 按需生成下载链接（公有或私有签名链接）。

---

## 6. 开发：Node.js 后端上传（cos-nodejs-sdk-v5）

安装：

```bash
npm i cos-nodejs-sdk-v5 --save
```

初始化并上传（`uploadFile` 支持超过阈值自动分片）：

```js
// 引入模块
var COS = require('cos-nodejs-sdk-v5');
// 创建实例
var cos = new COS({
  SecretId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  SecretKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
});

var Bucket = 'test-1250000000';
var Region = 'ap-guangzhou';

cos.uploadFile(
  {
    Bucket: Bucket,
    Region: Region,
    Key: '1.zip',
    FilePath: './1.zip',
    SliceSize: 1024 * 1024 * 5,
  },
  function (err, data) {
    console.log(err, data);
  },
);
```

建议（后端上传侧）：

- 永久密钥只放在服务端环境变量/密钥管理中，避免写死在代码里。
- 大文件上传建议使用 `uploadFile` 的分片能力；失败可重试、提升成功率。
- 上传后将 `Bucket/Region/Key/ETag/Size/UserId` 等写入数据库，避免依赖 LIST。

---

## 7. 开发：前端直传（cos-js-sdk-v5 + STS 临时密钥）

### 7.1 用临时密钥初始化（前端 SDK 通用写法）

前端通过 `getAuthorization` 回调从你的后端拿临时凭证（后端对接 STS）：

```js
const cos = new COS({
  getAuthorization: function (options, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://example.com/sts-server', true);
    xhr.onload = function (e) {
      const data = JSON.parse(e.target.responseText);
      const credentials = data.credentials;

      callback({
        TmpSecretId: credentials.tmpSecretId,
        TmpSecretKey: credentials.tmpSecretKey,
        SecurityToken: credentials.sessionToken,
        StartTime: data.startTime,
        ExpiredTime: data.expiredTime,
      });
    };
    xhr.send();
  },
});
```

后端 `sts-server` 的职责（强烈建议这么做）：

- 校验用户身份（登录态/签名/风控）
- 生成“最小权限策略”（限制 bucket、key 前缀、动作）
- 请求 STS 获得临时密钥（短有效期）
- 返回给前端（注意不要返回永久密钥）

### 7.2 小文件直传：putObject

```js
cos.putObject(
  {
    Bucket: 'example-bucket-1250000000',
    Region: 'ap-guangzhou',
    Key: 'uploads/' + file.name,
    Body: file,
    Headers: {
      'Content-Type': file.type,
      'x-cos-meta-custom-field': 'custom-value',
    },
    onProgress: function (progressData) {
      console.log('Upload:', (progressData.percent * 100).toFixed(2) + '%');
    },
  },
  function (err, data) {
    if (err) return console.error('Upload failed:', err);
    console.log('Upload ok:', data.Location);
  },
);
```

### 7.3 大文件直传：sliceUploadFile（分片/并发/可暂停恢复）

```js
let taskId;

cos.sliceUploadFile(
  {
    Bucket: 'example-bucket-1250000000',
    Region: 'ap-guangzhou',
    Key: 'large-files/video.mp4',
    Body: file,
    SliceSize: 1024 * 1024 * 5,
    ChunkSize: 1024 * 1024 * 5,
    AsyncLimit: 5,
    StorageClass: 'STANDARD',
    onTaskReady: function (tid) {
      taskId = tid;
    },
    onProgress: function (progressData) {
      console.log('Upload:', (progressData.percent * 100).toFixed(2) + '%');
    },
  },
  function (err, data) {
    if (err) return console.error('Upload error:', err);
    console.log('Upload complete:', data.Location);
  },
);
```

运营/产品侧建议（直传场景）：

- 上传文件类型、大小、数量要有产品策略（例如头像最大 5MB，视频最大 1GB）。
- 结合后端做“上传成功回调/审核流程/回收机制”。
- 防止滥用：限制 Key 前缀到用户目录、限制请求频率、上传前校验（MIME/后缀/内容审核）。

---

## 8. 开发：预签名 URL（下载/上传）

预签名 URL 的典型用途：

- 私有桶对象临时下载链接（分享链接、一次性下载）
- 无 SDK 的简单直传（后端签名一个 PUT URL，前端 `fetch(PUT)` 上传）

示例（浏览器 SDK 生成签名 URL）：

```js
cos.getObjectUrl(
  {
    Bucket: 'example-bucket-1250000000',
    Region: 'ap-guangzhou',
    Key: 'private/confidential.pdf',
    Sign: true,
    Expires: 3600,
    Method: 'GET',
    Query: {
      'response-content-disposition': 'attachment; filename="download.pdf"',
      'response-content-type': 'application/pdf',
    },
  },
  function (err, data) {
    if (err) return console.error('Generate URL failed:', err);
    console.log('Pre-signed URL:', data.Url);
  },
);
```

签名上传 URL（PUT）示例（生成 URL 后，前端用 `fetch` 上传）：

```js
cos.getObjectUrl(
  {
    Bucket: 'example-bucket-1250000000',
    Region: 'ap-guangzhou',
    Key: 'uploads/new-file.txt',
    Sign: true,
    Method: 'PUT',
    Expires: 1800,
  },
  function (err, data) {
    if (err) return console.error('Generate upload URL failed:', err);
    fetch(data.Url, {
      method: 'PUT',
      body: fileContent,
      headers: { 'Content-Type': 'text/plain' },
    }).then(() => console.log('Upload via signed URL ok'));
  },
);
```

注意事项：

- 预签名 URL 的有效期尽量短；Key 需要严格限制到业务允许范围。
- 如果你需要“分片、断点续传、进度”等能力，通常 STS + SDK 更合适。

---

## 9. CDN 加速、防盗链与图片处理（产品/运营与开发都需要）

### 9.1 CDN 加速（推荐默认方案）

建议把 COS 设置为 CDN 源站：

- 访问走 CDN 域名（例如 `static.example.com`）
- 回源到 COS（可配合私有桶 + 回源鉴权）

缓存策略建议：

- `*.js/*.css/*.png/*.jpg/*.webp`：长缓存 + 文件名 hash
- `index.html`：短缓存或不缓存

### 9.2 防盗链与访问控制

常见手段（按安全需求从低到高）：

- Referer 防盗链（白名单/黑名单）
- CDN URL 鉴权（时间戳/签名）
- COS 私有桶 + 预签名 URL（短期有效）

建议默认：对“公共静态资源”可公有读；对“用户隐私内容/付费内容”一律私有读 + 鉴权访问。

### 9.3 图片处理

常见能力（根据你是否开通对应服务）：

- 按需缩放/裁剪/水印，输出 WebP/AVIF（节省流量与加载时间）
- 智能压缩与质量自适应
- 内容安全审核（涉黄涉政等）

落地建议：

- 统一图片“样式参数”规范（例如 `?imageMogr2/thumbnail/!50p` 或预设样式名），避免随意拼接造成缓存击穿。
- 重要图片处理尽量走 CDN（缓存命中更高，降低回源与处理成本）。

---

## 10. 常见坑与排障清单

- CORS：前端直传跨域失败，优先检查桶的 CORS 配置（允许的方法、头、来源域名）。
- 403：通常是权限策略/签名过期/Key 不在允许前缀；检查 STS 策略与有效期。
- 429/超时：分片并发过高、网络抖动；降低并发、开启断点续传、重试。
- 成本异常：GET/HEAD 请求暴涨或带宽激增；检查是否被盗刷、是否缺少防盗链/鉴权、是否缺少 CDN 缓存。

---

## 11. 推荐的落地清单（可直接作为项目验收项）

- 桶：命名规范、地域选择、版本控制（视需求）、生命周期（必配）、日志（可选）
- 权限：默认私有读；公共资源专桶公有读；禁止前端持久密钥
- 上传：前端直传用 STS 临时密钥 + 最小权限；大文件分片；有进度与重试
- 分发：CDN + 缓存策略；静态资源 hash；必要时 URL 鉴权/Referer 防盗链
- 图片：统一样式规范；尽量走 CDN 缓存；必要时内容审核
