#!/bin/bash

################################################################################
# SnapMatch 服务器环境快速配置脚本
################################################################################
# 用途: 在云服务器上一键配置部署所需的环境
# 使用方法:
#   1. 将此文件上传到服务器: scp server-setup.sh user@server-ip:~/
#   2. SSH 登录服务器
#   3. 添加执行权限: chmod +x server-setup.sh
#   4. 执行脚本: ./server-setup.sh
#
# 注意: 此脚本适用于 Ubuntu 20.04/22.04
################################################################################

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  SnapMatch 服务器环境配置脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印函数
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 检查是否为 root 用户
if [[ $EUID -eq 0 ]]; then
   print_error "请不要使用 root 用户运行此脚本"
   print_info "建议使用 ubuntu 或其他非 root 用户"
   exit 1
fi

# ========================================
# 步骤 1: 系统更新
# ========================================
echo ""
print_info "步骤 1/6: 更新系统软件包..."
sudo apt update && sudo apt upgrade -y
print_success "系统更新完成"

# ========================================
# 步骤 2: 安装 Docker
# ========================================
echo ""
print_info "步骤 2/6: 安装 Docker..."

if command -v docker &> /dev/null; then
    print_warning "Docker 已安装，跳过安装步骤"
    docker --version
else
    print_info "正在尝试使用官方脚本安装 Docker..."

    # 尝试官方安装脚本
    if curl -fsSL https://get.docker.com | sh; then
        print_success "Docker 安装完成（使用官方脚本）"
    else
        print_warning "官方脚本安装失败，尝试使用腾讯云镜像源..."

        # 卸载可能存在的旧版本
        sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

        # 安装依赖
        sudo apt update
        sudo apt install -y \
            apt-transport-https \
            ca-certificates \
            curl \
            gnupg \
            lsb-release

        # 添加腾讯云 Docker 镜像源
        curl -fsSL https://mirrors.cloud.tencent.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.cloud.tencent.com/docker-ce/linux/ubuntu \
          $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

        # 安装 Docker
        sudo apt update
        sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

        print_success "Docker 安装完成（使用腾讯云镜像源）"
    fi

    # 添加用户到 docker 组
    sudo usermod -aG docker $USER

    # 配置 Docker 镜像加速器（腾讯云）
    print_info "正在配置 Docker 镜像加速器..."
    sudo mkdir -p /etc/docker
    sudo tee /etc/docker/daemon.json > /dev/null <<-'DOCKEREOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
DOCKEREOF

    # 重启 Docker 服务
    sudo systemctl daemon-reload
    sudo systemctl restart docker
    sudo systemctl enable docker

    print_success "Docker 镜像加速器配置完成"
    print_warning "⚠️  请重新登录以使 Docker 用户组权限生效"

    # 验证配置
    if docker info | grep -q "Registry Mirrors"; then
        print_success "镜像加速器验证成功"
    fi
fi

# ========================================
# 步骤 3: 安装 Nginx
# ========================================
echo ""
print_info "步骤 3/6: 安装 Nginx..."

if command -v nginx &> /dev/null; then
    print_warning "Nginx 已安装，跳过安装步骤"
    nginx -v
else
    sudo apt install nginx -y
    print_success "Nginx 安装完成"
fi

# ========================================
# 步骤 4: 创建部署目录
# ========================================
echo ""
print_info "步骤 4/6: 创建部署目录..."

DEPLOY_DIR="/var/www/snapmatch"

if [ -d "$DEPLOY_DIR" ]; then
    print_warning "部署目录已存在: $DEPLOY_DIR"
else
    sudo mkdir -p $DEPLOY_DIR
    sudo chown -R $USER:$USER $DEPLOY_DIR
    print_success "部署目录创建完成: $DEPLOY_DIR"
fi

# 创建子目录
mkdir -p $DEPLOY_DIR/{web,admin,backend}
print_success "子目录创建完成: web, admin, backend"

# ========================================
# 步骤 5: 创建 Backend 环境变量模板
# ========================================
echo ""
print_info "步骤 5/6: 创建 Backend 环境变量模板..."

ENV_FILE="$DEPLOY_DIR/backend/.env.production"

if [ -f "$ENV_FILE" ]; then
    print_warning "环境变量文件已存在: $ENV_FILE"
    print_info "如需重新创建，请先删除: rm $ENV_FILE"
else
    cat > $ENV_FILE << 'EOF'
# ========================================
# SnapMatch Backend 生产环境配置
# ========================================
# ⚠️ 重要: 请替换所有 TODO_ 占位符

NODE_ENV=production
PORT=3000

# ========================================
# JWT 认证配置
# ========================================
# 生成方法（选择任一）:
#   推荐: openssl rand -hex 32
#   或:   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=TODO_生成的32字节随机密钥
JWT_EXPIRES_IN=12h
AUTH_REFRESH_TOKEN_TTL_DAYS=30

# ========================================
# CORS 配置
# ========================================
ADMIN_ORIGIN=https://TODO_你的域名

# ========================================
# CloudBase 配置
# ========================================
CLOUDBASE_ENV=TODO_环境ID
CLOUDBASE_REGION=ap-shanghai
CLOUDBASE_SECRET_ID=TODO_密钥ID
CLOUDBASE_SECRET_KEY=TODO_密钥Key

# ========================================
# RBAC 数据模型（保持默认）
# ========================================
CLOUDBASE_MODEL_USERS=rbac_users
CLOUDBASE_MODEL_AUTH_SESSIONS=auth_sessions
CLOUDBASE_MODEL_RBAC_ROLES=rbac_roles
CLOUDBASE_MODEL_RBAC_PERMISSIONS=rbac_permissions
CLOUDBASE_MODEL_RBAC_ROLE_PERMISSIONS=rbac_role_permissions
CLOUDBASE_MODEL_RBAC_USER_ROLES=rbac_user_roles
EOF

    chmod 600 $ENV_FILE
    print_success "环境变量模板创建完成: $ENV_FILE"
    print_warning "⚠️  请编辑此文件并替换所有 TODO_ 占位符"
fi

# ========================================
# 步骤 6: 创建 Nginx 配置模板
# ========================================
echo ""
print_info "步骤 6/6: 创建 Nginx 配置模板..."

NGINX_CONF="/etc/nginx/sites-available/snapmatch"

if [ -f "$NGINX_CONF" ]; then
    print_warning "Nginx 配置文件已存在: $NGINX_CONF"
    print_info "如需重新创建，请先删除: sudo rm $NGINX_CONF"
else
    sudo tee $NGINX_CONF > /dev/null << 'EOF'
# ========================================
# SnapMatch Nginx 配置
# ========================================
# ⚠️ 重要: 请替换所有 TODO_你的域名

server {
    listen 80;
    server_name TODO_你的域名;  # 例如: www.example.com

    # ========================================
    # Web 官网 (根路径)
    # ========================================
    location / {
        root /var/www/snapmatch/web;
        try_files $uri $uri.html $uri/ =404;
        add_header Cache-Control "public, max-age=3600";
    }

    # ========================================
    # Admin 后台 (/admin 路径)
    # ========================================
    location /admin {
        alias /var/www/snapmatch/admin;
        try_files $uri $uri.html $uri/ /admin/index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # ========================================
    # API（全量 BFF：先到 Admin(Next)，再由 Admin 转发到 Backend）
    # ========================================
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;

        # 代理头
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 缓存控制
        proxy_cache_bypass $http_upgrade;
    }

    # ========================================
    # 健康检查端点
    # ========================================
    location /health {
        proxy_pass http://localhost:3002/health;
        access_log off;
    }
}
EOF

    print_success "Nginx 配置模板创建完成: $NGINX_CONF"
    print_warning "⚠️  请编辑此文件并替换域名"
fi

# ========================================
# 完成提示
# ========================================
echo ""
echo "=========================================="
print_success "服务器环境配置完成！"
echo "=========================================="
echo ""
print_info "下一步操作:"
echo ""
echo "1. 编辑 Backend 环境变量文件:"
echo "   nano $ENV_FILE"
echo "   (替换所有 TODO_ 占位符)"
echo ""
echo "2. 编辑 Nginx 配置文件:"
echo "   sudo nano $NGINX_CONF"
echo "   (替换域名)"
echo ""
echo "3. 启用 Nginx 配置:"
echo "   sudo ln -s $NGINX_CONF /etc/nginx/sites-enabled/"
echo "   sudo nginx -t"
echo "   sudo systemctl restart nginx"
echo ""
echo "4. 配置防火墙:"
echo "   sudo ufw allow 22/tcp"
echo "   sudo ufw allow 80/tcp"
echo "   sudo ufw allow 443/tcp"
echo "   sudo ufw enable"
echo ""
echo "5. (可选) 配置 HTTPS:"
echo "   sudo apt install certbot python3-certbot-nginx -y"
echo "   sudo certbot --nginx -d 你的域名"
echo ""
echo "6. 在 GitHub 配置 Secrets:"
echo "   SERVER_HOST = $(hostname -I | awk '{print $1}')"
echo "   SERVER_USER = $USER"
echo "   SERVER_SSH_KEY = (私钥内容)"
echo ""
print_warning "⚠️  重要: 如果安装了 Docker，请重新登录以使用户组权限生效"
echo ""
print_success "祝部署顺利！"
echo ""
