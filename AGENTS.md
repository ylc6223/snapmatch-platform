---
description: CloudBase AI Development Rules Guide - Provides scenario-based best practices to ensure development quality
globs: *
alwaysApply: true
inclusion: always
---

# CloudBase AI Development Rules Guide

## Communication

- 永远使用简体中文进行思考和对话,输出的文档文字说明保持使用简体中文

## 🗂️ Rule File Path Resolution Strategy

**CRITICAL: All rule file paths in this document follow a smart resolution strategy to support multiple AI editors.**

### Path Resolution Rules

When this document references a rule file, try locations in this order:

1. **CodeBuddy Path**: `.codebuddy/rules/tcb/rules/{rule-name}/rule.md`
2. **Universal Path**: `rules/{rule-name}/rule.md`
3. **Fallback Search**: Use `search_file` with pattern `*{rule-name}*rule.md`

### Rule Name Mapping

| Rule Shorthand | Full Rule Name |
|----------------|----------------|
| `auth-tool` | Authentication Tool Configuration |
| `auth-web` | Web Authentication |
| `auth-wechat` | WeChat Mini Program Authentication |
| `auth-nodejs` | Node.js Authentication |
| `auth-http-api` | HTTP API Authentication |
| `web-development` | Web Platform Development |
| `miniprogram-development` | Mini Program Platform Development |
| `cloudrun-development` | CloudRun Backend Development |
| `http-api` | HTTP API Usage |
| `relational-database-tool` | MySQL Database Tool Operations |
| `relational-database-web` | MySQL Web SDK |
| `no-sql-web-sdk` | NoSQL Web SDK |
| `no-sql-wx-mp-sdk` | NoSQL WeChat Mini Program SDK |
| `cloudbase-platform` | CloudBase Platform Knowledge |
| `cloud-storage-web` | Cloud Storage Web SDK |
| `ui-design` | UI Design Guidelines |
| `spec-workflow` | Software Engineering Workflow |
| `data-model-creation` | Data Model Creation |

### Usage Example

When you see "Read `{auth-web}` rule file" in this document:
- Try: `.codebuddy/rules/tcb/rules/auth-web/rule.md` first
- Then: `rules/auth-web/rule.md`
- Finally: Search with pattern `*auth-web*rule.md`

**Note**: Files already using `rules/` prefix (like `rules/ui-design/rule.md`) work universally across all editors and don't need path resolution.

---

## Quick Reference for AI

**⚠️ CRITICAL: Read this section first based on your project type**

### When Developing a Web Project:
1. **Environment Check**: Call `envQuery` tool first (applies to all interactions)
2. **⚠️ Template Download (MANDATORY for New Projects)**: **MUST call `downloadTemplate` tool FIRST when starting a new project** - Do NOT create files manually. Use `downloadTemplate` with `template="react"` or `template="vue"` to get the complete project structure. Only proceed with manual file creation if template download fails or user explicitly requests it.
3. **⚠️ UI Design (CRITICAL)**: **MUST read `rules/ui-design/rule.md` FIRST before generating any page, interface, component, or style** - This is NOT optional. You MUST explicitly read this file and output the design specification before writing any UI code.
4. **Core Capabilities**: Read Core Capabilities section below (especially UI Design and Database + Authentication for Web)
5. **⚠️ Authentication Configuration Check (MANDATORY)**: **When user mentions ANY login/authentication requirement, MUST FIRST read `{auth-tool}` rule file (using path resolution strategy) and check/configure authentication providers BEFORE implementing frontend code**
6. **Platform Rules**: Read `{web-development}` rule file (using path resolution strategy) for platform-specific rules (SDK integration, static hosting, build configuration)
7. **Authentication**: Read `{auth-web}` rule file (using path resolution strategy) and `{auth-tool}` - **MUST use Web SDK built-in authentication**
8. **Database**: 
   - NoSQL: `rules/no-sql-web-sdk/rule.md`
   - MySQL: `rules/relational-database-web/rule.md` + `rules/relational-database-tool/rule.md`

### When Developing a Mini Program Project:
1. **Environment Check**: Call `envQuery` tool first (applies to all interactions)
2. **⚠️ Template Download (MANDATORY for New Projects)**: **MUST call `downloadTemplate` tool FIRST when starting a new project** - Do NOT create files manually. Use `downloadTemplate` with `template="miniprogram"` to get the complete project structure. Only proceed with manual file creation if template download fails or user explicitly requests it.
3. **⚠️ UI Design (CRITICAL)**: **MUST read `rules/ui-design/rule.md` FIRST before generating any page, interface, component, or style** - This is NOT optional. You MUST explicitly read this file and output the design specification before writing any UI code.
4. **Core Capabilities**: Read Core Capabilities section below (especially UI Design and Database + Authentication for Mini Program)
5. **Platform Rules**: Read `rules/miniprogram-development/rule.md` for platform-specific rules (project structure, WeChat Developer Tools, wx.cloud usage)
6. **Authentication**: Read `rules/auth-wechat/rule.md` - **Naturally login-free, get OPENID in cloud functions**
7. **Database**: 
   - NoSQL: `rules/no-sql-wx-mp-sdk/rule.md`
   - MySQL: `rules/relational-database-tool/rule.md` (via tools)

### When Developing a Native App Project (iOS/Android/Flutter/React Native/etc.):
1. **Environment Check**: Call `envQuery` tool first (applies to all interactions)
2. **⚠️ Platform Limitation**: **Native apps (iOS, Android, Flutter, React Native, and other native mobile frameworks) do NOT support CloudBase SDK** - Must use HTTP API to call CloudBase capabilities
3. **⚠️ UI Design (CRITICAL)**: **MUST read `rules/ui-design/rule.md` FIRST before generating any page, interface, component, or style** - This is NOT optional. You MUST explicitly read this file and output the design specification before writing any UI code.
4. **Required Rules**: 
   - **MUST read** `{http-api}` rule file (using path resolution strategy) - HTTP API usage for all CloudBase operations
   - **MUST read** `{relational-database-tool}` rule file (using path resolution strategy) - MySQL database operations (via tools)
   - **MUST read** `{auth-tool}` rule file (using path resolution strategy) - Authentication configuration
5. **Optional Rules**:
   - `rules/cloudbase-platform/rule.md` - Universal CloudBase platform knowledge
   - `rules/ui-design/rule.md` - UI design guidelines (if UI is involved)
6. **⚠️ Database Limitation**: **Only MySQL database is supported** for native apps. If users need to use MySQL database, **MUST prompt them to enable it in the console first**:
   - Enable MySQL database at: [CloudBase Console - MySQL Database](https://tcb.cloud.tencent.com/dev?envId=${envId}#/db/mysql/table/default/)
   - Replace `${envId}` with the actual environment ID

---

## Core Capabilities (Must Be Done Well)

### 0. ⚠️ Configuration-First Principle (NEW - HIGHEST PRIORITY)

**🚨 MANDATORY: Always check and configure CloudBase services BEFORE implementing code**

**Authentication Trigger Words Detection:**

When user mentions ANY of these words, immediately read the auth-tool rule file:

- Phone login / SMS login / Mobile login
- Email login
- WeChat login / Wechat auth
- Username password login / User/pass login
- Anonymous login / Guest login
- Login / Register / Auth / Authentication / Sign in / Sign up

**Rule File Location Strategy:**

When you see `{rule-name}` notation in this document, apply the path resolution strategy from the top of this file:
1. Try `.codebuddy/rules/tcb/rules/{rule-name}/rule.md` first (CodeBuddy)
2. Then try `rules/{rule-name}/rule.md` (Other editors)
3. Use `search_file` with pattern `*{rule-name}*rule.md` if both fail

**Specific example for auth-tool:**
1. `.codebuddy/rules/tcb/rules/auth-tool/rule.md` (CodeBuddy)
2. `rules/auth-tool/rule.md` (Other editors: Cursor, WindSurf, etc.)
3. Use `search_file` with pattern `*auth-tool*rule.md` if both fail

**Execution Sequence:**

1. **FIRST**: Read `{auth-tool}` rule file using the path resolution strategy
2. **SECOND**: Use `callCloudApi` to check current authentication configuration
3. **THIRD**: Enable required authentication methods (if not configured)
4. **FOURTH**: Verify configuration is effective
5. **FIFTH**: Implement frontend authentication code

As the most important part of application development, the following four core capabilities must be done well, without needing to read different rules for different platforms:

### 1. ⚠️ UI Design (CRITICAL - Highest Priority)
**⚠️ MANDATORY: Must strictly follow `rules/ui-design/rule.md` rules for ALL design work**

**🚨 CRITICAL ENFORCEMENT: You MUST explicitly read the file `rules/ui-design/rule.md` before generating ANY UI code. This is NOT a suggestion - it is a MANDATORY requirement.**

**Before generating ANY page, interface, component, or style:**
1. **MUST FIRST explicitly read `rules/ui-design/rule.md` file** - Use file reading tools to read this file, do NOT skip this step
2. **MUST complete design specification output** before writing any code:
   - Purpose Statement
   - Aesthetic Direction (choose from specific options, NOT generic terms)
   - Color Palette (with hex codes, avoid forbidden colors)
   - Typography (specific font names, avoid forbidden fonts)
   - Layout Strategy (asymmetric/creative approach, avoid centered templates)
3. **MUST ensure** generated interfaces have distinctive aesthetic styles and high-quality visual design
4. **MUST avoid** generic AI aesthetics (common fonts, clichéd color schemes, templated designs)

**This applies to ALL tasks involving:**
- Page generation
- Interface creation
- Component design
- Style/visual effects
- Any frontend visual elements

**⚠️ VIOLATION DETECTION: If you find yourself writing UI code without first reading `rules/ui-design/rule.md`, STOP immediately and read the file first.**

### 2. Database + Authentication
**Strengthen database and authentication capabilities**

**Authentication**:
- **Web Projects**: 
  - Must use CloudBase Web SDK built-in authentication, refer to `rules/auth-web/rule.md`
  - Platform development rules: Refer to `rules/web-development/rule.md` for Web SDK integration, static hosting deployment, and build configuration
- **Mini Program Projects**: 
  - Naturally login-free, get `wxContext.OPENID` in cloud functions, refer to `rules/auth-wechat/rule.md`
  - Platform development rules: Refer to `rules/miniprogram-development/rule.md` for mini program project structure, WeChat Developer Tools integration, and CloudBase capabilities
- **Node.js Backend**: Refer to `rules/auth-nodejs/rule.md`

**Database Operations**:
- **Web Projects**:
  - NoSQL Database: Refer to `rules/no-sql-web-sdk/rule.md`
  - MySQL Relational Database: Refer to `rules/relational-database-web/rule.md` (Web application development) and `rules/relational-database-tool/rule.md` (Management via tools)
  - Platform development rules: Refer to `rules/web-development/rule.md` for Web SDK database integration patterns
- **Mini Program Projects**:
  - NoSQL Database: Refer to `rules/no-sql-wx-mp-sdk/rule.md`
  - MySQL Relational Database: Refer to `rules/relational-database-tool/rule.md` (via tools)
  - Platform development rules: Refer to `rules/miniprogram-development/rule.md` for mini program database integration and wx.cloud usage

### 3. Static Hosting Deployment (Web)
**Refer to deployment process in `rules/web-development/rule.md`**
- Use CloudBase static hosting after build completion
- Deploy using `uploadFiles` tool
- Remind users that CDN has a few minutes of cache after deployment
- Generate markdown format access links with random queryString

### 4. Backend Deployment (Cloud Functions or CloudRun)
**Refer to `rules/cloudrun-development/rule.md`**
- **Cloud Function Deployment**: Use `getFunctionList` to query, then call `createFunction` or `updateFunctionCode` to deploy
- **CloudRun Deployment**: Use `manageCloudRun` tool for containerized deployment
- Ensure backend code supports CORS, prepare Dockerfile (for container type)

## Development Process Standards

**Important: To ensure development quality, AI must complete the following steps before starting work:**

### 0. Environment Check (First Step)
After user inputs any content, first check CloudBase environment status:
- Ensure current CloudBase environment ID is known
- If not present in conversation history, must call `envQuery` tool with parameter `action=info` to query current environment information and environment ID
- **Important**: When environment ID configuration is involved in code later, automatically use the queried environment ID, no need for manual user input

### 1. Scenario Identification
Identify current development scenario type, mainly for understanding project type, but core capabilities apply to all projects:
- **Web Projects**: React/Vue/native JS frontend projects
- **WeChat Mini Programs**: Mini program CloudBase projects
- **Native Apps**: Native mobile applications (iOS, Android, Flutter, React Native, etc.) that use HTTP API (no SDK support)
- **CloudRun Projects**: CloudBase Run backend service projects (supports any language: Java/Go/Python/Node.js/PHP/.NET, etc.)
- **Database Related**: Projects involving data operations
- **UI Design/Interface Generation**: Projects requiring interface design, page generation, prototype creation, component design, etc.

### 2. Platform-Specific Quick Guide

**Web Projects - Required Rule Files:**
- `rules/web-development/rule.md` - Platform development rules (SDK integration, static hosting, build configuration)
- `rules/auth-web/rule.md` - Authentication (MUST use Web SDK built-in authentication)
- `rules/no-sql-web-sdk/rule.md` - NoSQL database operations
- `rules/relational-database-web/rule.md` - MySQL database operations (Web)
- `rules/relational-database-tool/rule.md` - MySQL database management (tools)
- `rules/cloud-storage-web/rule.md` - Cloud storage operations (upload, download, file management)
- `rules/cloudbase-platform/rule.md` - Universal CloudBase platform knowledge

**Mini Program Projects - Required Rule Files:**
- `rules/miniprogram-development/rule.md` - Platform development rules (project structure, WeChat Developer Tools, wx.cloud)
- `rules/auth-wechat/rule.md` - Authentication (naturally login-free, get OPENID in cloud functions)
- `rules/no-sql-wx-mp-sdk/rule.md` - NoSQL database operations
- `rules/relational-database-tool/rule.md` - MySQL database operations (via tools)
- `rules/cloudbase-platform/rule.md` - Universal CloudBase platform knowledge

**Native App Projects (iOS/Android/Flutter/React Native/etc.) - Required Rule Files:**
- **⚠️ `rules/http-api/rule.md`** - **MANDATORY** - HTTP API usage for all CloudBase operations (SDK not supported)
- **⚠️ `rules/relational-database-tool/rule.md`** - **MANDATORY** - MySQL database operations (via tools)
- **⚠️ Database Limitation**: Only MySQL database is supported. If users need MySQL, **MUST prompt them to enable it in console**: [Enable MySQL Database](https://tcb.cloud.tencent.com/dev?envId=${envId}#/db/mysql/table/default/)

**Native App Projects (iOS/Android/Flutter/React Native/etc.) - Optional Rule Files:**
- `rules/cloudbase-platform/rule.md` - Universal CloudBase platform knowledge
- `rules/ui-design/rule.md` - UI design guidelines (if UI is involved)

**Universal Rule Files (All Projects):**
- **⚠️ `rules/ui-design/rule.md`** - **MANDATORY - HIGHEST PRIORITY** - Must read FIRST before any UI/page/component/style generation
- `rules/spec-workflow/rule.md` - Standard software engineering process (if needed)

### 3. Development Confirmation
Before starting work, suggest confirming with user:
1. "I identify this as a [scenario type] project"
2. "I will strictly follow core capability requirements and refer to relevant rule files"
3. "Please confirm if my understanding is correct"

## Core Behavior Rules
1. **Tool Priority**: For Tencent CloudBase operations, must prioritize using CloudBase tools
2. **⚠️ Template Download (MANDATORY)**: **When starting a new project or when user requests to develop an application, MUST FIRST call `downloadTemplate` tool** - Do NOT manually create project files. Use `downloadTemplate` with appropriate template type (`react`, `vue`, `miniprogram`, `uniapp`). Only create files manually if template download fails or user explicitly requests manual creation. This ensures proper project structure, configuration files, and best practices.
3. **Project Understanding**: First read current project's README.md, follow project instructions for development
4. **Directory Standards**: Before outputting project code in current directory, first check current directory files
5. **Development Order**: When developing, prioritize frontend first, then backend, ensuring frontend interface and interaction logic are completed first, then implement backend business logic
6. **⚠️ UI Design Rules Mandatory Application**: When tasks involve generating pages, interfaces, components, styles, or any frontend visual elements, **MUST FIRST explicitly read the file `rules/ui-design/rule.md` using file reading tools**, then strictly follow the rule file, ensuring generated interfaces have distinctive aesthetic styles and high-quality visual design, avoiding generic AI aesthetics. **You MUST output the design specification before writing any UI code.**
7. **Backend Development Priority Strategy**: When developing backend, prioritize using SDK to directly call CloudBase database, rather than through cloud functions, unless specifically needed (such as complex business logic, server-side computation, calling third-party APIs, etc.)
8. **Deployment Order**: When there are backend dependencies, prioritize deploying backend before previewing frontend
9. **Interactive Confirmation**: Use interactiveDialog to clarify when requirements are unclear, must confirm before executing high-risk operations
10. **Real-time Communication**: Use CloudBase real-time database watch capability
11. **⚠️ Authentication Rules**: When users develop projects, if user login authentication is needed, must use built-in authentication functions, must strictly distinguish authentication methods by platform
   - **Web Projects**: **MUST use CloudBase Web SDK built-in authentication** (e.g., `auth.toDefaultLoginPage()`), refer to `rules/auth-web/rule.md`
   - **Mini Program Projects**: **Naturally login-free**, get `wxContext.OPENID` in cloud functions, refer to `rules/auth-wechat/rule.md`
   - **Native Apps (iOS/Android)**: **MUST use HTTP API** for authentication, refer to `rules/http-api/rule.md` and Authentication API swagger
12. **⚠️ Authentication Configuration Mandatory Check**: When user mentions any authentication-related requirements:
   - **MUST FIRST read** `{auth-tool}` rule file using the path resolution strategy at the top of this document
   - **MUST FIRST check** current authentication configuration status
   - **MUST FIRST enable** required authentication methods
   - **MUST verify** configuration is effective
   - **ONLY THEN implement** frontend authentication code
13. **⚠️ Native App Development Rules**: When developing native mobile applications (iOS, Android, Flutter, React Native, and other native mobile frameworks):
   - **SDK Not Supported**: CloudBase SDK is NOT available for native apps, MUST use HTTP API
   - **Database Limitation**: Only MySQL database is supported via HTTP API
   - **MySQL Database Setup**: If users need MySQL database, MUST prompt them to enable it in console first at: [CloudBase Console - MySQL Database](https://tcb.cloud.tencent.com/dev?envId=${envId}#/db/mysql/table/default/) (replace `${envId}` with actual environment ID)
   - **Required Rules**: MUST read `rules/http-api/rule.md` and `rules/relational-database-tool/rule.md`

## Development Workflow

### Development

1. **⚠️ Download CloudBase Templates (MANDATORY for New Projects)**: 
   - **MUST call `downloadTemplate` tool FIRST when starting a new project** - Do NOT manually create project files
   - For Web projects: Use `downloadTemplate` with `template="react"` or `template="vue"`
   - For Mini Program projects: Use `downloadTemplate` with `template="miniprogram"`
   - For UniApp projects: Use `downloadTemplate` with `template="uniapp"`
   - **Only proceed with manual file creation if template download fails or user explicitly requests manual creation**
   - If unable to download to current directory, can use scripts to copy, note that hidden files also need to be copied

2. **⚠️ UI Design Document Reading (MANDATORY)**: 
   - **Before generating ANY page, interface, component, or style, MUST FIRST explicitly read the file `rules/ui-design/rule.md` using file reading tools**
   - **MUST output the design specification** (Purpose Statement, Aesthetic Direction, Color Palette, Typography, Layout Strategy) before writing any UI code
   - This is NOT optional - you MUST read the file and follow the design thinking framework and frontend aesthetics guidelines
   - Avoid generating generic AI aesthetic style interfaces

3. **Mini Program TabBar Material Download - Download Remote Material Links**: Mini program Tabbar and other material images must use **png** format, must use downloadRemoteFile tool to download files locally. Can select from Unsplash, wikimedia (generally choose 500 size), Pexels, Apple official UI and other resources

If remote links are needed in the application, can continue to call uploadFile to upload and obtain temporary access links and cloud storage cloudId

3. **Query Professional Knowledge from Knowledge Base**: If uncertain about any CloudBase knowledge, can use searchKnowledgeBase tool to intelligently search CloudBase knowledge base (supports CloudBase and cloud functions, mini program frontend knowledge, etc.), quickly obtain professional documents and answers through vector search

4. **WeChat Developer Tools Open Project Workflow**:
- When detecting current project is a mini program project, suggest user to use WeChat Developer Tools for preview, debugging, and publishing
- Before opening, confirm project.config.json has appid field configured. If not configured, must ask user to provide it
- Use WeChat Developer built-in CLI command to open project (pointing to directory containing project.config.json):
  - Windows: `"C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat" open --project "项目根目录路径"`
  - macOS: `/Applications/wechatwebdevtools.app/Contents/MacOS/cli open --project "/path/to/project/root"`
- Project root directory path is the directory containing project.config.json file

### Deployment Process

1. **Cloud Function Deployment Process**: Can use getFunctionList tool to query if there are cloud functions, then directly call createFunction or updateFunctionCode to update cloud function code. Only need to point functionRootPath to parent directory of cloud function directory (e.g., absolute path of cloudfunctions directory). No need for code compression and other operations. The above tools will automatically read files from cloud function subdirectories with same name under parent directory and automatically deploy

2. **CloudRun Deployment Process**: For non-cloud function backend services (Java, Go, PHP, Python, Node.js, etc.), use manageCloudRun tool for deployment. Ensure backend code supports CORS, prepare Dockerfile, then call manageCloudRun for containerized deployment. For details, refer to `rules/cloudrun-development/rule.md`

3. **Static Hosting Deployment Process**: Deploy using uploadFiles tool. After deployment, remind users that CDN has a few minutes of cache. Can generate markdown format access links with random queryString. For details, refer to `rules/web-development/rule.md`

### Documentation Generation Rules

1. You will generate a README.md file after generating the project, containing basic project information, such as project name, project description. Most importantly, clearly explain the project architecture and involved CloudBase resources, so maintainers can refer to it for modification and maintenance
2. After deployment, if it's a web project, can write the official deployment access address in the documentation

### Configuration File Rules

1. To help others who don't use AI understand what resources are available, can generate a cloudbaserc.json file after generation

### Tool Interface Call Rules
When calling tool services, you need to fully understand the data types of all interfaces to be called, as well as return value types. If you're not sure which interface to call, first check the documentation and tool descriptions, then determine which interface and parameters to call based on the documentation and tool descriptions. Do not have incorrect method parameters or parameter type errors.

For example, many interfaces require a confirm parameter, which is a boolean type. If you don't provide this parameter, or provide incorrect data type, the interface will return an error.

### Environment ID Auto-Configuration Rules
- When generating project configuration files (such as `cloudbaserc.json`, `project.config.json`, etc.), automatically use the environment ID queried by `envQuery`
- In code examples involving environment ID, automatically fill in current environment ID, no need for manual user replacement
- In deployment and preview related operations, prioritize using already queried environment information

## Professional Rule File Reference

**Note**: For detailed information, refer to the specific skill files. This section provides quick reference only.

### Platform Development Skills
- **Web**: `rules/web-development/rule.md` - SDK integration, static hosting, build configuration
- **Mini Program**: `rules/miniprogram-development/rule.md` - Project structure, WeChat Developer Tools, wx.cloud
- **CloudRun**: `rules/cloudrun-development/rule.md` - Backend deployment (functions/containers)
- **Platform (Universal)**: `rules/cloudbase-platform/rule.md` - Environment, authentication, services

### Authentication Skills
- **Web**: `rules/auth-web/rule.md` - **MUST use Web SDK built-in authentication**
- **Mini Program**: `rules/auth-wechat/rule.md` - **Naturally login-free, get OPENID in cloud functions**
- **Node.js**: `rules/auth-nodejs/rule.md`
- **HTTP API**: `rules/auth-http-api/rule.md`
- **Auth Tool (MCP)**: `rules/auth-tool/rule.md` - Configure and manage authentication providers (enable/disable login methods, setup provider settings) via MCP tools

### Database Skills
- **NoSQL (Web)**: `rules/no-sql-web-sdk/rule.md`
- **NoSQL (Mini Program)**: `rules/no-sql-wx-mp-sdk/rule.md`
- **MySQL (Web)**: `rules/relational-database-web/rule.md`
- **MySQL (Tool)**: `rules/relational-database-tool/rule.md`

### Storage Skills
- **Cloud Storage (Web)**: `rules/cloud-storage-web/rule.md` - Upload, download, temporary URLs, file management using Web SDK

### 🎨 ⚠️ UI Design Skill (CRITICAL - Read FIRST)
- **`rules/ui-design/rule.md`** - **MANDATORY - HIGHEST PRIORITY**
  - **MUST read FIRST before generating ANY interface/page/component/style**
  - Design thinking framework, complete design process, frontend aesthetics guidelines
  - **NO EXCEPTIONS**: All UI work requires reading this file first

### Workflow Skills
- **Spec Workflow**: `rules/spec-workflow/rule.md` - Standard software engineering process (requirements, design, tasks)

## Development Quality Checklist

To ensure development quality, recommend completing the following checks before starting tasks:

### Recommended Steps
0. **[ ] Environment Check**: Call `envQuery` tool to check CloudBase environment status (applies to all interactions)
1. **[ ] Template Download Check (MANDATORY for New Projects)**: If starting a new project, have you called `downloadTemplate` tool FIRST? Do NOT manually create project files - use templates.
2. **[ ] Scenario Identification**: Clearly identify what type of project this is (Web/Mini Program/Database/UI)
3. **[ ] Core Capability Confirmation**: Confirm all four core capabilities have been considered
   - UI Design: Have you explicitly read the file `rules/ui-design/rule.md` using file reading tools?
   - Database + Authentication: Have you referred to corresponding authentication and database skills?
   - Static Hosting Deployment: Have you understood the deployment process?
   - Backend Deployment: Have you understood cloud function or CloudRun deployment process?
4. **[ ] UI Design Rules Check (MANDATORY)**: If task involves generating pages, interfaces, components, or styles:
   - Have you explicitly read the file `rules/ui-design/rule.md` using file reading tools? (Required: YES)
   - Have you output the design specification before writing code? (Required: YES)
   - Have you understood and will follow the design thinking framework? (Required: YES)
5. **[ ] User Confirmation**: Confirm with user whether scenario identification and core capability understanding are correct
6. **[ ] Rule Execution**: Strictly follow core capability requirements and relevant rule files for development

### ⚠️ Common Issues to Avoid
- **❌ DO NOT manually create project files** - Always use `downloadTemplate` tool first for new projects
- **❌ DO NOT skip reading UI design document** - Must explicitly read `rules/ui-design/rule.md` file before generating any UI code
- Avoid skipping core capabilities and starting development directly
- Avoid mixing APIs and authentication methods from different platforms
- Avoid ignoring UI design rules: All tasks involving interfaces, pages, components, styles must explicitly read and strictly follow `rules/ui-design/rule.md`
- Avoid ignoring database and authentication standards: Must use correct authentication methods and database operation methods
- Important technical solutions should be confirmed with users

### Quality Assurance
If development is found to not comply with standards, can:
- Point out specific issues
- Require re-execution of rule check process
- Clearly specify rule files that need to be followed

## CloudBase Console Entry Points

After creating/deploying resources, provide corresponding console management page links. All console URLs follow the pattern: `https://tcb.cloud.tencent.com/dev?envId=${envId}#/{path}`

### Core Function Entry Points

1. **Overview (概览)**: `#/overview` - Main dashboard
2. **Template Center (模板中心)**: `#/template` - Project templates
3. **Document Database (文档型数据库)**: `#/db/doc` - NoSQL collections: `#/db/doc/collection/${collectionName}`, Models: `#/db/doc/model/${modelName}`
4. **MySQL Database (MySQL 数据库)**: `#/db/mysql` - Tables: `#/db/mysql/table/default/`
5. **Cloud Functions (云函数)**: `#/scf` - Function detail: `#/scf/detail?id=${functionName}&NameSpace=${envId}`
6. **CloudRun (云托管)**: `#/cloudrun` - Container services
7. **Cloud Storage (云存储)**: `#/storage` - File storage
8. **AI+**: `#/ai` - AI capabilities
9. **Static Website Hosting (静态网站托管)**: `#/hosting`
10. **Identity Authentication (身份认证)**: `#/identity` - Login: `#/identity/login-manage`, Tokens: `#/identity/token-management`
11. **Weida Low-Code (微搭低代码)**: `#/weida`
12. **Logs & Monitoring (日志监控)**: `#/logs`
13. **Extensions (扩展功能)**: `#/extensions`
14. **Environment Settings (环境配置)**: `#/settings`


## 编码风格与命名约定
- 统一使用 2 空格缩进、行宽 100；保存前运行 Prettier，并修复 ESLint 警告。
- 命名遵循 `camelCase` 变量/函数、`PascalCase` 组件/类、`SCREAMING_SNAKE_CASE` 常量，文件使用 `kebab-case`。
- 涉及固定状态、类别等场景时以 TypeScript `enum`（数值成员）建模，避免散落字符串或裸数字。


## 提交与 Pull Request 指南
- 提交信息遵循 Conventional Commits，例如 `feat(web): 支持深色模式切换`、`fix(web-admin): 修正表单验证`。
- PR 需包含变更摘要、关联问题编号（如 `Closes #123`）、测试结果说明及必要截图。
- 在发起评审前确认 `pnpm lint` 与相关构建、测试全部通过，并在描述中标注额外风险或待办事项。

## 安全与配置提示
- 机密变量放入 `.env.local`，并在根目录维护安全脱敏的 `.env.example`。
- 定期更新依赖并关注 Turbo/TypeScript 的版本公告，避免引入不必要的第三方工具带来复杂度。


## Documentation

- 编写 .md 文档时，也要用中文
- 正式文档写到项目的 docs/ 目录下
- 用于讨论和评审的计划、方案等文档，写到项目的 discuss/ 目录下

## Code Architecture

- 编写代码的硬性指标，包括以下原则：（1）对于 Python、JavaScript、TypeScript 等动态语言，尽可能确保每个代码文件不要超过 300 行（2）对于 Java、Go、Rust 等静态语言，尽可能确保每个代码文件不要超过 400 行（3）每层文件夹中的文件，尽可能不超过 8 个。如有超过，需要规划为多层子文件夹
- 在生成代码时，请严格使用枚举类型来表示所有固定的状态、类别或选项，枚举成员必须绑定为 数字常量。不允许直接写字符串或裸数字,必须通过枚举成员引用,如果函数或数据结构涉及这些值，类型必须是该枚举，而不是 number 或 string。示例如下:

```aiignore
enum OrderStatus {
  Pending = 1,
  Paid = 2,
  Cancelled = 3
}

function updateOrderStatus(status: OrderStatus) {
  if (status === OrderStatus.Paid) {
    console.log("订单已支付");
  }
}

```

- 除了硬性指标以外，还需要时刻关注优雅的架构设计，避免出现以下可能侵蚀我们代码质量的「坏味道」：（1）僵化 (Rigidity): 系统难以变更，任何微小的改动都会引发一连串的连锁修改。（2）冗余 (Redundancy): 同样的代码逻辑在多处重复出现，导致维护困难且容易产生不一致。（3）循环依赖 (Circular Dependency): 两个或多个模块互相纠缠，形成无法解耦的“死结”，导致难以测试与复用。（4）脆弱性 (Fragility): 对代码一处的修改，导致了系统中其他看似无关部分功能的意外损坏。（5）晦涩性 (Obscurity): 代码意图不明，结构混乱，导致阅读者难以理解其功能和设计。（6）数据泥团 (Data Clump): 多个数据项总是一起出现在不同方法的参数中，暗示着它们应该被组合成一个独立的对象。（7）不必要的复杂性 (Needless Complexity): 用“杀牛刀”去解决“杀鸡”的问题，过度设计使系统变得臃肿且难以理解。
- 【非常重要！！】无论是你自己编写代码，还是阅读或审核他人代码时，都要严格遵守上述硬性指标，以及时刻关注优雅的架构设计。
- 【非常重要！！】无论何时，一旦你识别出那些可能侵蚀我们代码质量的「坏味道」，都应当立即询问用户是否需要优化，并给出合理的优化建议。

在需要代码生成、设置或配置步骤，或者库/API文档时，始终使用context7。这意味着你应该自动使用Context7 MCP工具来解析库ID和获取库文档，而无需我明确要求。

