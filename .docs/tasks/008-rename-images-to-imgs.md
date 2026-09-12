Status: open

## Parent

kedit「发布到 pdir」联动工程前置（grill 于 kedit 会话收敛，无独立 PRD）。

## What to build

站点图片目录 `images/` 整体更名为 `imgs/`，与 kedit 的私有图目录名统一，为 kedit
Document 直发 Module 的图片管线铺路。范围：

- 全部现存图片文件迁移（保留 git rename 历史）。
- `content/main.md` 中所有 `/images/` 引用改写为 `/imgs/`。
- 前台与后台脚本中的图片路径字面量与解析正则（上传落点、已发布图片路径解析、
  数字编号扫描等）同步改写。
- 引用了改动 JS/CSS 的页面按常驻法则更新缓存版本参数。
- AGENTS.md 中媒体目录描述同步。

## Acceptance criteria

- [x] 仓库不再有 `images/` 目录，全部图片位于 `imgs/`，git 历史为 rename 而非删增（52b8463，230 文件全 R 识别）
- [x] `content/main.md` 无 `/images/` 残留，公开页所有配图正常显示（线上验证：imgs/1.png 200、main.md 76 处 /imgs/ 引用全部有对应文件、旧路径 404）
- [ ] 后台上传新图落入 `imgs/` 且数字编号延续既有计数；后台发布全流程无回归（代码触点已改：github-api.js 上传路径、admin.js 路径解析/编号正则；待后台真机走一遍）
- [x] 页面引用的 JS/CSS 缓存版本参数已更新（github-api v=2、admin v=35）
- [x] AGENTS.md 媒体目录描述与实际一致

## Blocked by

None - can start immediately
