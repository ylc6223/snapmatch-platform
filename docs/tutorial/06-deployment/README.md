# 第六阶段：部署上线

> **学习目标**：将应用部署到生产环境  
> **预计时长**：4-5 小时  
> **难度等级**：⭐⭐⭐☆☆

## 本阶段内容

### 1. [Docker 容器化](./01-docker-containerization.md)

**大纲**：

- Docker 基础概念
- 后端 Dockerfile 编写
  - 多阶段构建
  - 镜像优化
- 前端 Dockerfile 编写
  - Nginx 配置
  - 静态资源优化
- Docker Compose 编排
  - 本地开发环境
  - 生产环境配置

**实践任务**：编写应用 Dockerfile

---

### 2. [CI/CD 流水线](./02-ci-cd-pipeline.md)

**大纲**：

- CI/CD 概念
- GitHub Actions 配置
  - 自动化测试
  - 自动构建
  - 自动部署
- 环境变量管理
  - 开发/测试/生产环境
- 部署策略
  - 蓝绿部署
  - 金丝雀发布

**实践任务**：配置 GitHub Actions

---

### 3. [云服务部署](./03-cloud-deployment.md)

**大纲**：

- 云托管平台介绍
  - CloudBase CloudRun
  - Docker 部署
- 后端服务部署
  - 容器配置
  - 环境变量
  - 健康检查
- 前端静态部署
  - CDN 配置
  - 缓存策略
- 数据库迁移
- 生产环境验证

**实践任务**：部署应用到生产环境

---

### 4. [域名与 SSL 配置](./04-domain-and-ssl.md)

**大纲**：

- 域名购买与解析
  - A 记录
  - CNAME 记录
- SSL 证书申请
  - Let's Encrypt
  - 云服务商证书
- HTTPS 配置
  - Nginx SSL 配置
  - 强制 HTTPS
- 安全头设置

**实践任务**：配置域名与 HTTPS

---

### 5. [监控告警配置](./05-monitoring-setup.md)

**大纲**：

- 日志收集
  - 应用日志
  - 访问日志
- 监控指标
  - CPU/内存
  - 请求量
  - 错误率
- 告警配置
  - 邮件告警
  - 短信告警
- 性能监控
  - APM 工具
  - 前端性能监控

**实践任务**：配置基础监控

---

### 6. [备份策略](./06-backup-strategy.md)

**大纲**：

- 数据备份方案
  - 自动备份
  - 手动备份
- 备份存储
  - 本地存储
  - 云存储
- 恢复测试
- 灾难恢复预案

**学习成果**：建立可靠的数据备份体系

---

## 🎯 阶段性目标

完成本阶段后，你将拥有：

- ✅ 容器化的应用
- ✅ 自动化的 CI/CD 流水线
- ✅ 生产环境运行的应用
- ✅ 完善的监控体系
- ✅ 可靠的备份策略

## 📚 延伸阅读

- [Docker 官方文档](https://docs.docker.com/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Nginx SSL 配置](https://nginx.org/en/docs/http/ngx_http_ssl_module.html)

## ⏭️ 下一阶段

完成本阶段后，进入[第七阶段：运维与优化](../07-operations/README.md)

---

**返回目录**：[教程首页](../README.md)
