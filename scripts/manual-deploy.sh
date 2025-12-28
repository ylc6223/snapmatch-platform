#!/bin/bash
################################################################################
# 手动部署脚本 - 当 GitHub Actions 失败时使用
################################################################################
# 使用方法：
#   1. 在本地项目根目录执行：chmod +x scripts/manual-deploy.sh
#   2. 配置 SERVER_HOST 和 SERVER_USER 环境变量
#   3. 运行：./scripts/manual-deploy.sh
################################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 配置（从环境变量读取或使用默认值）
SERVER_HOST="${SERVER_HOST:-}"
SERVER_USER="${SERVER_USER:-root}"
DEPLOY_PATH="/opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art"
WEB_DEPLOY_PATH="$DEPLOY_PATH/index"

# 检查必需的环境变量
if [ -z "$SERVER_HOST" ]; then
  echo -e "${RED}错误: 未设置 SERVER_HOST 环境变量${NC}"
  echo "使用方法: SERVER_HOST=your-server-ip ./scripts/manual-deploy.sh"
  exit 1
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  SnapMatch 手动部署脚本${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "服务器: $SERVER_USER@$SERVER_HOST"
echo "部署路径: $DEPLOY_PATH"
echo "Web 根目录: $WEB_DEPLOY_PATH"
echo ""

# 1. 构建 Web 前端
echo -e "${YELLOW}步骤 1/4: 构建 Web 前端...${NC}"
pnpm -C apps/web build
echo -e "${GREEN}✓ Web 前端构建完成${NC}"
echo ""

# 2. 构建 Admin 后台
echo -e "${YELLOW}步骤 2/4: 构建 Admin 后台...${NC}"
pnpm -C apps/admin build
echo -e "${GREEN}✓ Admin 后台构建完成${NC}"
echo ""

# 3. 部署 Web
echo -e "${YELLOW}步骤 3/4: 部署 Web 到服务器...${NC}"
echo "目标：$SERVER_USER@$SERVER_HOST:$WEB_DEPLOY_PATH"

# 确保远程 Web 根目录存在
ssh "$SERVER_USER@$SERVER_HOST" "
  mkdir -p $WEB_DEPLOY_PATH && \
  echo '远程 Web 根目录已准备'
"

# 仅清空远程 Web 根目录内容（不动站点其他目录：admin/log/rewrite/proxy 等）
ssh "$SERVER_USER@$SERVER_HOST" "
  cd $WEB_DEPLOY_PATH && \
  find . -mindepth 1 -maxdepth 1 -exec rm -rf {} + && \
  echo '远程 Web 根目录已清理'
"

# 上传 Web 文件
rsync -avz --progress apps/web/out/ "$SERVER_USER@$SERVER_HOST:$WEB_DEPLOY_PATH/"
echo -e "${GREEN}✓ Web 文件部署完成${NC}"
echo ""

# 4. 部署 Admin
echo -e "${YELLOW}步骤 4/4: 部署 Admin 到服务器...${NC}"

# 清空 admin 目录
ssh "$SERVER_USER@$SERVER_HOST" "
  rm -rf $DEPLOY_PATH/admin/* && \
  mkdir -p $DEPLOY_PATH/admin && \
  echo 'Admin 目录已清理'
"

# 上传 Admin 文件
rsync -avz --progress apps/admin/out/ "$SERVER_USER@$SERVER_HOST:$DEPLOY_PATH/admin/"
echo -e "${GREEN}✓ Admin 文件部署完成${NC}"
echo ""

# 5. 设置文件权限
echo -e "${YELLOW}设置文件权限...${NC}"
ssh "$SERVER_USER@$SERVER_HOST" "
  chown -R www-data:www-data $WEB_DEPLOY_PATH && \
  chmod -R 755 $WEB_DEPLOY_PATH && \
  echo '权限设置完成'
"
echo -e "${GREEN}✓ 权限设置完成${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}验证部署：${NC}"
echo "  Web 官网: https://www.thepexels.art/"
echo "  Admin 后台: https://www.thepexels.art/admin/"
echo "  健康检查: https://www.thepexels.art/health"
echo ""
echo -e "${YELLOW}检查文件：${NC}"
echo "  ssh $SERVER_USER@$SERVER_HOST 'ls -la $WEB_DEPLOY_PATH'"
