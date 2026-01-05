#!/bin/bash
# 腾讯云轻量云服务器一键部署脚本
# 使用方法: ./scripts/deploy.sh [version]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置（请修改为你的服务器信息）
SERVER_HOST="${SERVER_HOST:-}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PORT="${SERVER_PORT:-22}"
PROJECT_DIR="${PROJECT_DIR:-/opt/snapmatch-platform}"
VERSION="${1:-latest}"

# 检查必要的环境变量
if [ -z "$SERVER_HOST" ]; then
    echo -e "${RED}错误: 请设置 SERVER_HOST 环境变量${NC}"
    echo "使用方法: SERVER_HOST=你的服务器IP ./scripts/deploy.sh [version]"
    echo "示例: SERVER_HOST=123.45.67.89 ./scripts/deploy.sh v1.1.7"
    exit 1
fi

echo -e "${GREEN}=== 开始部署 Backend $VERSION ===${NC}"
echo "服务器: $SERVER_USER@$SERVER_HOST:$PROJECT_DIR"
echo ""

# SSH 连接并在服务器上执行部署
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "set -e \
    && echo -e '${GREEN}→ 拉取最新代码...${NC}' \
    && cd $PROJECT_DIR \
    && git fetch --all \
    && git checkout origin/main \
    && echo -e '${GREEN}→ 进入 backend 目录...${NC}' \
    && cd apps/backend \
    && echo -e '${GREEN}→ 停止旧容器...${NC}' \
    && docker stop snapmatch-backend 2>/dev/null || true \
    && docker rm snapmatch-backend 2>/dev/null || true \
    && echo -e '${GREEN}→ 构建新镜像...${NC}' \
    && docker build -t snapmatch-backend:$VERSION . \
    && echo -e '${GREEN}→ 启动新容器...${NC}' \
    && docker run -d \
        --name snapmatch-backend \
        --restart unless-stopped \
        -p 3000:3000 \
        --env-file $PROJECT_DIR/.env \
        --health-cmd=\"node -e 'require(\\\"http\\\").get(\\\"http://localhost:3000/health\\\", (r) => process.exit(r.statusCode === 200 ? 0 : 1))'\" \
        --health-interval=30s \
        --health-timeout=3s \
        --health-retries=3 \
        snapmatch-backend:$VERSION \
    && echo -e '${GREEN}→ 清理旧镜像...${NC}' \
    && docker image prune -a --filter 'until=24h' -f \
    && echo -e '${GREEN}→ 查看容器状态...${NC}' \
    && docker ps --filter name=snapmatch-backend --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' \
    && echo -e '${GREEN}=== 部署完成！===${NC}' \
    && echo -e '${YELLOW}查看日志: docker logs -f snapmatch-backend${NC}'"

echo -e "${GREEN}✅ 部署成功！${NC}"
echo -e "${YELLOW}查看日志: ssh $SERVER_USER@$SERVER_HOST 'docker logs -f snapmatch-backend'${NC}"
