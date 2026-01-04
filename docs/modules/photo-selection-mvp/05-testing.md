# 端到端测试与优化任务清单

> **状态**: 🚧 开发中
> **预计时长**: 0.5 天
> **难度**: ⭐⭐⭐☆☆
> **依赖**: [管理后台UI](./03-admin-ui.md) ✅, [选片端UI](./04-viewer-ui.md) ✅

## 📊 开发进度

- [ ] Phase 1: 完整流程测试 (0/1)
- [ ] Phase 2: 边界情况测试 (0/4)
- [ ] Phase 3: Bug修复 (0/0)
- [ ] Phase 4: 性能优化 (0/2)
- [ ] Phase 5: 兼容性测试 (0/1)
- [ ] Phase 6: 安全测试 (0/4)
- [ ] Phase 7: 用户体验优化 (0/3)
- [ ] Phase 8: 上线检查 (0/3)

---

## Phase 1: 完整流程测试

### 1.1 完整的选片流程

**优先级**: 🔴 高
**依赖**: 前后端实现完成
**预计时间**: 30分钟

**前置条件**:

- [ ] 后端服务正常运行（http://localhost:3002）
- [ ] 管理后台正常运行（http://localhost:3000）
- [ ] 数据库连接正常
- [ ] 已有管理员账号并登录

**测试步骤**:

```
1. 管理员创建项目
   ├─ 打开 /dashboard/delivery/projects/new
   ├─ 填写名称：测试项目
   ├─ 填写描述：这是一个测试
   ├─ 点击提交
   └─ ✅ 验证：创建成功，跳转到列表页

2. 管理员上传照片
   ├─ 在列表页找到刚创建的项目
   ├─ 点击进入详情页
   ├─ 点击上传照片按钮
   ├─ 选择 10 张测试照片
   ├─ 等待上传完成
   └─ ✅ 验证：照片显示在列表中，数量正确

3. 管理员生成选片链接
   ├─ 在项目详情页
   ├─ 找到"生成选片链接"按钮
   ├─ 点击生成
   ├─ 复制链接（如：http://localhost:3000/viewer/abc123...）
   └─ ✅ 验证：链接成功复制到剪贴板

4. 客户打开选片链接
   ├─ 打开新的浏览器窗口（模拟客户）
   ├─ 粘贴链接并访问
   └─ ✅ 验证：正常打开，显示项目信息和照片网格

5. 客户浏览照片
   ├─ 滚动浏览照片
   ├─ 点击照片查看大图
   ├─ 使用键盘切换照片（← →）
   └─ ✅ 验证：大图模式正常，键盘操作正常

6. 客户标记照片
   ├─ 点击 5 张照片标记
   ├─ 查看选片统计
   └─ ✅ 验证：统计数字正确（5/10）

7. 客户查看已选照片
   ├─ 点击"查看已选"按钮
   ├─ 侧边面板打开
   └─ ✅ 验证：显示 5 张已选照片

8. 客户提交选片
   ├─ 点击"提交选片"按钮
   ├─ 确认对话框显示统计（已选 5 张）
   ├─ 点击确认提交
   └─ ✅ 验证：提交成功，页面锁定，无法继续操作

9. 管理员查看选片结果
   ├─ 回到管理后台
   ├─ 打开项目详情页
   └─ ✅ 验证：显示已提交，选片数量正确（5张）
```

**测试结果**:

- [ ] 完整流程测试通过
- [ ] 记录测试结果和问题

**状态**: ⬜ 待测试

---

## Phase 2: 边界情况测试

### 2.1 空项目

**优先级**: 🟡 中
**依赖**: 无
**预计时间**: 10分钟

- [ ] 创建项目但不上传照片
- [ ] 用客户链接访问
- [ ] 验证：显示空状态提示

**状态**: ⬜ 待测试

---

### 2.2 大量照片

**优先级**: 🟡 中
**依赖**: 无
**预计时间**: 15分钟

- [ ] 上传 200+ 张照片到项目
- [ ] 客户打开链接
- [ ] 验证：加载流畅，虚拟滚动正常

**性能指标**:

- [ ] 首屏加载 < 3秒
- [ ] 滚动无卡顿（60fps）
- [ ] 内存占用正常

**状态**: ⬜ 待测试

---

### 2.3 Token 过期

**优先级**: 🟡 中
**依赖**: 无
**预计时间**: 10分钟

- [ ] 创建项目，设置过期时间为 1 分钟后
- [ ] 等待过期
- [ ] 用链接访问
- [ ] 验证：显示"链接已过期"

**状态**: ⬜ 待测试

---

### 2.4 网络错误

**优先级**: 🟡 中
**依赖**: 无
**预计时间**: 10分钟

- [ ] 断开网络连接
- [ ] 尝试访问链接
- [ ] 验证：显示友好的网络错误提示
- [ ] 恢复网络后可重试

**状态**: ⬜ 待测试

---

## Phase 3: Bug修复

### Bug 列表

使用以下格式记录发现的 Bug：

```markdown
#### Bug #1: [标题]

**描述**：简要描述问题

**复现步骤**：

1. 步骤1
2. 步骤2
3. 步骤3

**预期行为**：应该怎样

**实际行为**：实际怎样

**严重程度**：🔴 严重 / 🟡 中等 / 🟢 轻微

**状态**：⬜ 待修复 / 🔨 修复中 / ✅ 已修复

**修复方案**：如何修复
```

---

#### Bug #1: 照片上传后列表不刷新

**描述**：上传照片后，照片列表没有自动刷新

**复现步骤**：

1. 打开照片列表页
2. 上传 10 张照片
3. 上传完成后

**预期行为**：照片列表自动刷新，显示新上传的照片

**实际行为**：需要手动刷新页面才能看到

**严重程度**：🟡 中等

**状态**：⬜ 待修复

**修复方案**：在上传完成后调用 refetch 或刷新数据

---

#### Bug #2: 占位符

**状态**：⬜ 待发现

---

## Phase 4: 性能优化

### 4.1 性能指标记录

**优先级**: 🟡 中
**依赖**: 无
**预计时间**: 30分钟

| 指标                      | 目标值  | 实际值    | 状态      |
| ------------------------- | ------- | --------- | --------- |
| 项目列表加载时间          | < 500ms | \_\_\_ ms | ⬜ 待测试 |
| 照片列表加载时间（100张） | < 2s    | \_\_\_ s  | ⬜ 待测试 |
| Viewer 首次加载时间       | < 2s    | \_\_\_ s  | ⬜ 待测试 |
| 照片标记响应时间          | < 100ms | \_\_\_ ms | ⬜ 待测试 |
| 大图切换时间              | < 50ms  | \_\_\_ ms | ⬜ 待测试 |
| 提交选片响应时间          | < 500ms | \_\_\_ ms | ⬜ 待测试 |

---

### 4.2 后端优化

**优先级**: 🟡 中
**依赖**: 无
**预计时间**: 30分钟

- [ ] 数据库查询优化
  - [ ] 添加必要的索引
  - [ ] 避免 N+1 查询
  - [ ] 使用查询缓存（可选）

- [ ] API 响应优化
  - [ ] 减少 response 数据量
  - [ ] 启用 gzip 压缩
  - [ ] 添加 CDN 缓存头

- [ ] 照片处理优化
  - [ ] 缩略图异步生成
  - [ ] 批量处理照片
  - [ ] 错误重试机制

**状态**: ⬜ 待优化

---

### 4.3 前端优化

**优先级**: 🟡 中
**依赖**: 无
**预计时间**: 45分钟

- [ ] 加载优化
  - [ ] 图片懒加载（Intersection Observer）
  - [ ] 虚拟滚动（react-window）
  - [ ] 代码分割（dynamic import）

- [ ] 渲染优化
  - [ ] 使用 React.memo
  - [ ] 避免不必要的重渲染
  - [ ] 使用 useMemo / useCallback

- [ ] 网络优化
  - [ ] 请求去重
  - [ ] 请求合并
  - [ ] 响应缓存（React Query）

**状态**: ⬜ 待优化

---

## Phase 5: 兼容性测试

### 5.1 浏览器测试矩阵

**优先级**: 🟡 中
**依赖**: 无
**预计时间**: 30分钟

| 浏览器     | 版本   | 桌面端 | 移动端 | 状态      |
| ---------- | ------ | ------ | ------ | --------- |
| Chrome     | 最新版 | ✅     | ✅     | ⬜ 待测试 |
| Safari     | 最新版 | ✅     | ✅     | ⬜ 待测试 |
| Firefox    | 最新版 | ✅     | ❌     | ⬜ 待测试 |
| Edge       | 最新版 | ✅     | ❌     | ⬜ 待测试 |
| 微信浏览器 | -      | ❌     | ✅     | ⬜ 待测试 |

---

### 5.2 功能测试点

- [ ] 照片上传正常
- [ ] 照片展示正常
- [ ] 标记功能正常
- [ ] 键盘操作正常
- [ ] 触摸操作正常（移动端）
- [ ] 样式无异常

**状态**: ⬜ 待测试

---

## Phase 6: 安全测试

### 6.1 Token 安全

**优先级**: 🔴 高
**依赖**: 无
**预计时间**: 15分钟

- [ ] Token 足够随机（32位）
- [ ] Token 无法猜测
- [ ] Token 过期机制正常
- [ ] Token 撤销功能正常

**测试方法**:

```typescript
// 1. 检查 Token 长度
const token = project.token;
console.assert(token.length === 32, 'Token should be 32 characters');

// 2. 测试过期机制
const expiredProject = await createProject({
  expiresAt: Date.now() + 60 * 1000, // 1分钟后过期
});

// 等待1分钟后访问
await sleep(60 * 1000);
const response = await viewerApi.getProject(expiredProject.token);
console.assert(response.error === 'Project has expired', 'Should return expired error');
```

**状态**: ⬜ 待测试

---

### 6.2 数据隔离

**优先级**: 🔴 高
**依赖**: 无
**预计时间**: 15分钟

- [ ] 客户A无法访问客户B的项目
- [ ] Token 错误时返回友好提示
- [ ] 无权限时返回 403/404

**测试方法**:

```typescript
// 创建两个项目
const projectA = await createProject({ name: 'Project A' });
const projectB = await createProject({ name: 'Project B' });

// 上传照片到项目A
await uploadPhotos(projectA.id, [photo1, photo2]);

// 使用项目B的token访问项目A的照片
const response = await fetch(`/api/viewer/${projectB.token}/selection`);
console.assert(response.status === 200, 'Should only return photos from projectB');
console.assert(response.data.length === 0, 'Project B has no photos');
```

**状态**: ⬜ 待测试

---

### 6.3 防盗链

**优先级**: 🟡 中
**依赖**: 无
**预计时间**: 10分钟

- [ ] 禁用右键菜单
- [ ] 禁用图片拖拽
- [ ] 不暴露原图 URL
- [ ] 预览图强制水印

**测试方法**:

```typescript
// 1. 测试右键菜单
document.addEventListener('contextmenu', (e) => {
  console.assert(e.defaultPrevented, 'Context menu should be prevented');
});

// 2. 测试图片拖拽
const img = document.querySelector('img');
img.dispatchEvent(new DragEvent('dragstart'));
console.assert(img.draggable === false, 'Image should not be draggable');

// 3. 检查图片URL
const photoUrl = img.src;
console.assert(!photoUrl.includes('original'), 'Should not expose original image URL');
```

**状态**: ⬜ 待测试

---

### 6.4 SQL 注入防护

**优先级**: 🔴 高
**依赖**: 无
**预计时间**: 10分钟

- [ ] 所有查询使用参数化
- [ ] TypeORM 自动转义
- [ ] 输入验证（DTO）

**测试方法**:

```typescript
// 尝试 SQL 注入
const maliciousInput = "'; DROP TABLE projects; --";

try {
  await projectsService.create({
    name: maliciousInput,
  });
  // 如果成功创建，说明输入被正确转义
  console.log('SQL Injection test passed');
} catch (error) {
  console.error('SQL Injection vulnerability detected!', error);
}

// 验证表单验证
const createDto = new CreateProjectDto();
createDto.name = ''; // 空字符串
const errors = validateSync(createDto);
console.assert(errors.length > 0, 'Should have validation errors');
```

**状态**: ⬜ 待测试

---

## Phase 7: 用户体验优化

### 7.1 视觉反馈

**优先级**: 🟡 中
**依赖**: 无
**预计时间**: 30分钟

- [ ] 按钮悬停效果
- [ ] 加载状态提示
- [ ] 成功/错误提示
- [ ] 照片标记动画
- [ ] 页面切换过渡

**实现要点**:

```css
/* 按钮悬停 */
.btn-primary {
  @apply transition-all duration-200;
  @apply hover:scale-105 active:scale-95;
}

/* 照片标记动画 */
@keyframes checkmark {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.photo-card.selected .checkmark {
  animation: checkmark 0.3s ease-out;
}
```

**状态**: ⬜ 待实现

---

### 7.2 错误提示

**优先级**: 🟡 中
**依赖**: 无
**预计时间**: 20分钟

- [ ] 网络错误提示友好
- [ ] Token 无效提示清晰
- [ ] 表单验证提示准确
- [ ] 操作失败有原因说明

**示例**:

```typescript
// Bad
const errorMessage = 'Error';

// Good
const errorMessage = {
  network: '网络连接失败，请检查您的网络设置后重试',
  invalidToken: '选片链接无效，请联系摄影师获取新的链接',
  expired: '此选片链接已过期，请联系摄影师',
  validation: {
    name: '项目名称不能为空',
    photos: '请至少选择一张照片',
  },
};
```

**状态**: ⬜ 待实现

---

### 7.3 帮助文档

**优先级**: 🟢 低
**依赖**: 无
**预计时间**: 30分钟

- [ ] 操作提示（首次访问）
- [ ] 快捷键说明
- [ ] FAQ 页面（可选）

**实现方式**:

```typescript
// 首次访问提示
export function FirstVisitTooltip() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem('viewer-has-visited');
    if (!hasVisited) {
      setShow(true);
    }
  }, []);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem('viewer-has-visited', 'true');
  };

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>欢迎使用选片系统</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>• 点击照片进行选择</p>
          <p>• 按空格键快速标记</p>
          <p>• 使用方向键切换大图</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**状态**: ⬜ 待实现

---

## Phase 8: 上线检查

### 8.1 代码质量检查

**优先级**: 🔴 高
**依赖**: 所有开发完成
**预计时间**: 15分钟

- [ ] ESLint 无错误

```bash
cd apps/backend && npm run lint
cd apps/admin && npm run lint
```

- [ ] TypeScript 无编译错误

```bash
cd apps/backend && npm run build
cd apps/admin && npm run build
```

- [ ] 代码已提交到 Git

```bash
git status
git add .
git commit -m "feat: 实现照片上传与选片功能"
```

- [ ] 关键代码有注释

**状态**: ⬜ 待检查

---

### 8.2 功能完整性检查

**优先级**: 🔴 高
**依赖**: 代码质量检查通过
**预计时间**: 20分钟

- [ ] 所有核心功能已实现
  - [ ] 项目创建/编辑/删除
  - [ ] 照片上传/删除
  - [ ] 选片链接生成
  - [ ] 客户选片功能
  - [ ] 选片结果查看

- [ ] 所有阻塞 Bug 已修复
- [ ] 所有测试用例通过
- [ ] 性能指标达标

**测试命令**:

```bash
# 运行单元测试
npm run test

# 运行E2E测试
npm run test:e2e
```

**状态**: ⬜ 待检查

---

### 8.3 部署准备

**优先级**: 🔴 高
**依赖**: 功能完整性检查通过
**预计时间**: 30分钟

- [ ] 环境变量已配置

```bash
# .env.production
DATABASE_URL=mysql://...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=...
BASE_URL=https://your-domain.com
```

- [ ] 数据库迁移已执行

```bash
cd apps/backend
npm run migration:run
```

- [ ] 生产环境构建成功

```bash
cd apps/backend && npm run build
cd apps/admin && npm run build
```

- [ ] 静态资源已上传 CDN（如有）

**状态**: ⬜ 待准备

---

## 📊 测试结果汇总

### 测试统计

- [ ] 总测试用例数：\_\_
- [ ] 通过数：\_\_
- [ ] 失败数：\_\_
- [ ] 阻塞问题数：\_\_
- [ ] 通过率：\_\_%

---

### 阻塞问题列表

| 问题ID | 描述 | 严重程度 | 状态 | 负责人 | 预计修复时间 |
| ------ | ---- | -------- | ---- | ------ | ------------ |
| #1     | -    | 🔴🟡🟢   | ⬜   | -      | -            |

---

### 已知问题（可后续优化）

- [ ] 问题1
- [ ] 问题2
- [ ] 问题3

---

## ✅ 上线检查清单

### 代码质量

- [ ] ESLint 无错误
- [ ] TypeScript 无编译错误
- [ ] 代码已提交到 Git
- [ ] 关键代码有注释

### 功能完整性

- [ ] 所有核心功能已实现
- [ ] 所有阻塞 Bug 已修复
- [ ] 所有测试用例通过
- [ ] 性能指标达标

### 部署准备

- [ ] 环境变量已配置
- [ ] 数据库迁移已执行
- [ ] 生产环境构建成功
- [ ] 静态资源已上传 CDN（如有）

### 文档准备

- [ ] API 文档已更新
- [ ] 用户使用手册已编写（可选）
- [ ] 部署文档已准备

---

## 🎉 完成标志

当以上所有检查都通过时，照片上传与选片 MVP 就正式完成了！

### 🎊 庆祝一下

- [ ] ✅ 数据模型设计完成
- [ ] ✅ 后端 API 实现完成
- [ ] ✅ 管理后台 UI 实现完成
- [ ] ✅ 选片端 UI 实现完成
- [ ] ✅ 端到端测试通过
- [ ] ✅ 性能优化完成
- [ ] ✅ 安全测试通过

---

## 🚀 后续扩展方向

### Phase 2 功能（可选）

- [ ] 客户管理（CRM）
- [ ] 套餐限制（精修张数）
- [ ] 多相册分组
- [ ] 精修交付流程
- [ ] 加片订单与支付
- [ ] 通知系统
- [ ] 数据统计与报表

### 技术优化（可选）

- [ ] 图片处理自动化（AI 增强、智能选片）
- [ ] 实时协作（WebSocket）
- [ ] 移动端 App
- [ ] 离线下载功能

---

## 🔗 相关文档

- [Jest 测试框架](https://jestjs.io/)
- [Playwright E2E 测试](https://playwright.dev/)
- [Lighthouse 性能测试](https://developer.chrome.com/docs/lighthouse/)
- [OWASP 安全检查清单](https://owasp.org/www-project-web-security-testing-guide/)

---

**最后更新**: 2026-01-04
**状态**: 📝 已重构为任务清单格式
