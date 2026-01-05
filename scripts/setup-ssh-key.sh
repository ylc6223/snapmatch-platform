#!/bin/bash
# SSH 密钥配置脚本
# 用于为 GitHub Actions 配置 SSH 访问

set -e

echo "=== GitHub Actions SSH 密钥配置 ==="
echo ""

# 1. 生成新的 SSH 密钥对
KEY_FILE="$HOME/.ssh/github_actions_snapmatch"
echo "1. 生成 SSH 密钥对..."
ssh-keygen -t ed25519 -C "github-actions-snapmatch" -f "$KEY_FILE" -N ""

echo ""
echo "✅ 密钥对已生成！"
echo ""

# 2. 显示私钥（用于 GitHub Secrets）
echo "=========================================="
echo "2. 复制以下私钥内容到 GitHub Secrets:"
echo "=========================================="
echo ""
echo "Secret 名称: SERVER_SSH_KEY"
echo ""
cat "$KEY_FILE"
echo ""
echo "=========================================="
echo "↑ 复制上面所有内容（包括 BEGIN 和 END 行）"
echo "=========================================="
echo ""

# 3. 显示公钥（用于添加到服务器）
echo "=========================================="
echo "3. 复制以下公钥到服务器的 authorized_keys:"
echo "=========================================="
echo ""
cat "$KEY_FILE.pub"
echo ""
echo "=========================================="
echo "↑ 复制上面的一行内容"
echo "=========================================="
echo ""

# 4. 提供添加到服务器的命令
echo "=========================================="
echo "4. 在服务器上执行以下命令添加公钥:"
echo "=========================================="
echo ""
echo "# SSH 登录到服务器后执行:"
echo "mkdir -p ~/.ssh"
echo "echo \"$(cat $KEY_FILE.pub)\" >> ~/.ssh/authorized_keys"
echo "chmod 700 ~/.ssh"
echo "chmod 600 ~/.ssh/authorized_keys"
echo ""
echo "=========================================="
echo "或使用 ssh-copy-id（推荐）:"
echo "=========================================="
echo ""
echo "ssh-copy-id -i $KEY_FILE.pub root@你的服务器IP"
echo ""
echo "=========================================="
echo ""

# 5. 测试连接
echo "5. 测试 SSH 连接..."
echo ""
echo "在本地执行以下命令测试连接:"
echo ""
echo "ssh -i $KEY_FILE root@你的服务器IP"
echo ""
echo "如果成功登录，说明配置正确！"
echo ""

# 6. GitHub Secrets 配置清单
echo "=========================================="
echo "6. 需要在 GitHub 配置的 Secrets:"
echo "=========================================="
echo ""
echo "访问: https://github.com/ylc6223/snapmatch-platform/settings/secrets/actions"
echo ""
echo "需要添加的 Secrets:"
echo "  - SERVER_HOST: 你的服务器 IP"
echo "  - SERVER_USER: root (或其他用户)"
echo "  - SERVER_SSH_KEY: 上面第 2 步的私钥内容"
echo "  - API_BASE_URL: https://www.thepexels.art/api (可选)"
echo ""
echo "=========================================="
