# pdir

## 项目定位

The PotPvP Directory 是一个由 Markdown 内容驱动的静态知识站，包含公开阅读页和 Codeberg 管理后台。
公开渲染、后台预览与编辑都围绕同一份完整 Markdown 文档工作；修改时优先保持三者行为一致。

## 技术栈与结构

- 技术栈：原生 HTML、CSS、JavaScript；浏览器端使用 marked 与 highlight.js；无构建步骤。
- `index.html`、`js/app.js`、`css/main.css`：公开阅读、目录、搜索与 Markdown 渲染。
- `admin/`、`js/admin.js`、`css/admin.css`：Codeberg 登录、编辑、预览、维护与发布。
- `content/`：Markdown 内容及内容索引；`images/`、`assets/`：站点媒体资源。
- `.docs/`：活跃 issue、长期细则与历史归档。

## 常用命令

- 本地预览：`python -m http.server 8000`
- JavaScript 语法检查：`node --check js/app.js`、`node --check js/admin.js`
- 差异检查：`git diff --check`

## 常驻法则

- 改公开 Markdown 的渲染后处理时，同步检查并更新后台预览的对应处理。
- 编辑或发布逻辑始终维护一份完整 Markdown 源；模块编辑只替换所选范围，不建立第二份内容真源。
- 只对 Shimo/Shimonote 图片请求使用 no-referrer；主 fetch 与图片 fallback 使用相同策略，不扩大到其他远程图片。
- 修改 `index.html`、`admin/index.html` 引用的 CSS/JS 后，同步更新对应查询参数版本，避免客户端继续使用旧缓存。

## 按需读取索引

- 修改 `admin/`、`js/`、`css/`、Markdown 渲染或图片导入时，读 `.docs/frontend-quality-guidelines.md`。
- 开始或继续存量开发任务时，读 `.docs/issues/` 中对应的开放 issue。
- 需要追溯 Trellis 任务原始 PRD、设计或进度时，从 `.docs/archive/trellis-tasks/INDEX.md` 进入。

## 优先级

1. 用户当前明确指令。
2. 更近目录的 `AGENTS.md`。
3. 本文件。
4. 本文件路由到的 `.docs/*.md` 细则。
