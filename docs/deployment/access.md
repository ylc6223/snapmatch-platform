# SnapMatch 线上访问配置指南

## 📍 访问地址

| 应用            | 访问地址                         | 说明          |
| --------------- | -------------------------------- | ------------- |
| **Web 官网**    | https://www.thepexels.art/       | 前台展示页面  |
| **Admin 后台**  | https://www.thepexels.art/admin/ | 管理后台      |
| **Backend API** | https://www.thepexels.art/api/   | 后端 API 接口 |
| **健康检查**    | https://www.thepexels.art/health | 服务健康状态  |

---

## 🔍 验证部署

### 1. 检查 Backend 服务状态

```bash
# 查看 Backend 容器
docker ps | grep snapmatch-backend

# 查看容器日志
docker logs snapmatch-backend

# 检查健康状态
curl http://localhost:3002/health
```

**预期响应:**

```json
{
  "status": "ok",
  "timestamp": "2025-12-29T...",
  "uptime": 123.45
}
```

### 2. 检查 Admin 服务状态

**⚠️ Admin 需要 Node.js 运行时环境（PM2 管理）**

```bash
# 查看 PM2 进程状态
pm2 status snapmatch-admin

# 查看 Admin 日志
pm2 logs snapmatch-admin --lines 50

# 检查端口监听
netstat -tlnp | grep 3001

# 测试本地访问
curl http://localhost:3001/admin/
```

**预期 PM2 状态:**

```
┌─────┬──────────────────┬─────────┬─────────┬──────────┬────────┐
│ id  │ name             │ status  │ restart │ uptime   │ cpu    │
├─────┼──────────────────┼─────────┼─────────┼──────────┼────────┤
│ 0   │ snapmatch-admin  │ online  │ 0       │ 2h       │ 0.1%   │
└─────┴──────────────────┴─────────┴─────────┴──────────┴────────┘
```

**如果服务未启动:**

```bash
cd /opt/1panel/apps/snapmatch/admin
pm2 start ecosystem.config.js
pm2 save
```

### 测试访问

```bash
# 测试 Web 官网
curl https://www.thepexels.art/

# 测试 Admin 后台
curl https://www.thepexels.art/admin/

# 测试 API
curl https://www.thepexels.art/api/health

# 测试健康检查
curl https://www.thepexels.art/health
```

---

### 配置日志查看

```bash
# Backend 日志
docker logs -f snapmatch-backend

# OpenResty 访问日志
tail -f /opt/1panel/apps/openresty/openresty/logs/www.thepexels.art.access.log

# OpenResty 错误日志
tail -f /opt/1panel/apps/openresty/openresty/logs/www.thepexels.art.error.log
```

---

## 🔐 安全建议

1. **启用 HTTPS**
   - 通过 1Panel 面板申请 SSL 证书（Let's Encrypt）
   - 强制 HTTP 重定向到 HTTPS

2. **配置防火墙**

   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

---

## 📝 部署清单

- [ ] Backend 容器运行正常 (`docker ps`)
- [ ] 静态文件已部署到正确路径
- [ ] OpenResty 反向代理已配置
- [ ] SSL 证书已配置（如需 HTTPS）
- [ ] 健康检查端点可访问
- [ ] Web 官网可正常访问
- [ ] Admin 后台可正常访问
- [ ] API 接口可正常调用
- [ ] 日志监控已配置
- [ ] 备份策略已制定

---

**完成以上配置后，你的应用应该可以正常访问了！** 🎉
