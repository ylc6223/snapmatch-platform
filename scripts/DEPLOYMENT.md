# 腾讯云轻量云服务器部署指南

## 方案概述

**推荐方案**：GitHub Actions 自动部署（无需手动上传镜像）

- ✅ **直接在服务器构建**（避免传输大镜像）
- ✅ **自动化部署**（push tag 自动触发）
- ✅ **零传输成本**（利用服务器带宽）

---

## 方案 A：GitHub Actions 自动部署（推荐）

### 步骤 1：配置 GitHub Secrets

在 GitHub 仓库中配置以下 Secrets：

- `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

需要配置的 Secrets：

| Secret 名称       | 说明             | 示例值             |
| ----------------- | ---------------- | ------------------ |
| `SERVER_HOST`     | 服务器 IP 地址   | `123.45.67.89`     |
| `SERVER_USER`     | SSH 用户名       | `root` 或 `ubuntu` |
| `SSH_PRIVATE_KEY` | SSH 私钥         | 你的私钥内容       |
| `SERVER_PORT`     | SSH 端口（可选） | `22`               |

### 生成 SSH 密钥对

在**本地电脑**运行：

```bash
# 生成 SSH 密钥对
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# 查看私钥（复制到 GitHub Secrets -> SSH_PRIVATE_KEY）
cat ~/.ssh/github_deploy_key

# 查看公钥（添加到服务器）
cat ~/.ssh/github_deploy_key.pub
```

### 在服务器上添加公钥

SSH 登录到服务器：

```bash
# 方法1: 添加到 authorized_keys
mkdir -p ~/.ssh
echo "你的公钥内容" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# 方法2: 使用 ssh-copy-id（在本地运行）
ssh-copy-id -i ~/.ssh/github_deploy_key.pub root@你的服务器IP
```

测试 SSH 连接（在本地运行）：

```bash
ssh -i ~/.ssh/github_deploy_key root@你的服务器IP
```

### 首次部署 - 服务器准备

SSH 登录服务器，执行以下命令：

```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# 2. 创建项目目录
mkdir -p /opt/snapmatch-platform
cd /opt/snapmatch-platform

# 3. 克隆代码
git clone https://github.com/ylc6223/snapmatch-platform.git .

# 4. 创建环境变量文件
cat > .env << EOF
# 数据库配置
DB_HOST=your-db-host
DB_PORT=3306
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password
DB_DATABASE=snapmatch

# JWT 密钥
JWT_SECRET=your-jwt-secret-key

# 其他配置
PORT=3000
NODE_ENV=production
EOF

# 5. 首次手动构建（测试）
cd apps/backend
docker build -t snapmatch-backend:latest .
docker run -d --name snapmatch-backend -p 3000:3000 --env-file /opt/snapmatch-platform/.env snapmatch-backend:latest

# 6. 验证部署
curl http://localhost:3000/health
```

### 自动部署

现在每次推送 tag 就会自动部署：

```bash
# 本地打 tag 推送，自动触发部署
git tag v1.1.7
git push origin v1.1.7

# 在 GitHub Actions 页面查看部署进度
# https://github.com/ylc6223/snapmatch-platform/actions
```

---

## 方案 B：手动部署（备选方案）

如果你想手动控制部署时机，可以使用这个脚本：

### 本地一键部署脚本

创建文件 `scripts/deploy-to-server.sh`：

```bash
#!/bin/bash
set -e

SERVER_HOST="你的服务器IP"
SERVER_USER="root"
PROJECT_DIR="/opt/snapmatch-platform"
VERSION=${1:-latest}

echo "=== 开始部署 Backend $VERSION ==="

# SSH 连接并在服务器上执行部署
ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
set -e

cd /opt/snapmatch-platform

# 拉取最新代码
echo "→ 拉取最新代码..."
git fetch --all
git checkout origin/main

# 进入 backend 目录
cd apps/backend

# 停止并删除旧容器
echo "→ 停止旧容器..."
docker stop snapmatch-backend 2>/dev/null || true
docker rm snapmatch-backend 2>/dev/null || true

# 构建新镜像
echo "→ 构建新镜像..."
docker build -t snapmatch-backend:$VERSION .

# 启动新容器
echo "→ 启动新容器..."
docker run -d \
  --name snapmatch-backend \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file /opt/snapmatch-platform/.env \
  snapmatch-backend:$VERSION

# 清理旧镜像
echo "→ 清理旧镜像..."
docker image prune -a --filter "until=24h" -f

echo "=== 部署完成！==="
docker ps --filter name=snapmatch-backend
ENDSSH

echo "✅ 部署成功！"
```

使用方法：

```bash
chmod +x scripts/deploy-to-server.sh
./scripts/deploy-to-server.sh v1.1.7
```

---

## 监控和日志

### 查看容器状态

```bash
# SSH 登录服务器后执行
docker ps                          # 查看运行中的容器
docker logs snapmatch-backend      # 查看日志
docker logs -f snapmatch-backend   # 实时查看日志
docker stats snapmatch-backend     # 查看资源使用

# 查看健康状态
docker inspect snapmatch-backend | grep -A 10 Health
```

### 重启容器

```bash
# 重启
docker restart snapmatch-backend

# 停止
docker stop snapmatch-backend

# 启动
docker start snapmatch-backend
```

---

## 性能优化建议

### 1. 使用 Docker BuildKit 加速构建

在服务器上设置：

```bash
echo "DOCKER_BUILDKIT=1" >> /etc/environment
source /etc/environment
```

### 2. 配置镜像加速（可选）

```bash
# 创建或编辑 Docker 配置
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com"
  ]
}
EOF

# 重启 Docker
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 3. 限制日志大小

```bash
# 修改 docker 日志配置
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

sudo systemctl restart docker
```

---

## 故障排查

### 问题 1: 容器启动失败

```bash
# 查看详细日志
docker logs snapmatch-backend

# 检查端口占用
netstat -tlnp | grep 3000

# 检查环境变量
docker exec snapmatch-backend env | grep NODE_ENV
```

### 问题 2: SSH 连接失败

```bash
# 测试 SSH 连接
ssh -v root@你的服务器IP

# 检查服务器防火墙
sudo ufw status
sudo firewall-cmd --list-all
```

### 问题 3: GitHub Actions 失败

- 检查 Secrets 配置是否正确
- 查看 Actions 日志：`Actions` → 点击失败的 workflow
- 确认服务器 Docker 已安装

---

## 安全建议

1. **使用非 root 用户运行容器**
2. **配置防火墙规则**（只开放必要端口）
3. **定期更新镜像**
4. **使用 secrets 管理敏感信息**
5. **配置 SSL 证书**（使用 Nginx 反向代理）

---

## 总结

**推荐流程**：

1. ✅ 配置 GitHub Secrets（一次性）
2. ✅ 服务器首次准备（一次性）
3. ✅ 开发完成后打 tag：`git tag v1.1.7 && git push origin v1.1.7`
4. ✅ GitHub Actions 自动部署
5. ✅ 访问服务器验证：`curl http://服务器IP:3000/health`

**部署时间**：约 3-5 分钟（包括构建时间）
**传输数据**：0 MB（直接在服务器构建）
