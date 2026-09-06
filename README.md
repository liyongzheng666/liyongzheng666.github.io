# Ally · AI 与 CAD

以 AI Harness 工程实践为重点的个人知识站，使用 Hugo 0.157.0 与 Hextra。项目、指南和文章按主题连接；功能站与配套源码仍独立维护。

## 本地运行

安装 Hugo Extended 0.157.0，克隆时初始化主题子模块：

```sh
git submodule update --init --recursive
hugo server --disableFastRender
```

访问终端显示的本地地址，使用 Ctrl+C 关闭当前预览。

## 内容在哪里维护

| 内容 | 维护位置 |
|---|---|
| 主题、项目标题、介绍、入口、源码链接 | `data/library.json` |
| 首页排布 | `layouts/knowledge-home.html` |
| 内容目录 | `layouts/catalogue.html` |
| 主题页及其可搜索项目列表 | `content/<主题>/_index.md`、`layouts/topic.html`、`layouts/_shortcodes/topic-projects.html` |
| 文章 | `content/blog/*.md` |
| 全站导航与站点信息 | `hugo.yaml` |
| 共用样式 | `assets/css/custom.css` |

文章 front matter 的 `topic` 使用 `ai-cad`、`algorithms`、`tooling`、`english`（个人能力提升）或 `research`（研究资料）。专题会自动收录相应文章；近期文章与目录数量由内容生成。独立项目在统一清单维护一次，首页和专题复用。

AIwithCaD 提供独立研判站的直接阅读入口，其页面和源码在独立项目维护。刷题与背包静态应用保留原 URL。

## 构建与发布

```sh
hugo --gc --minify
```

生产站为 https://www.goudanx.top/ 。`.github/workflows/pages.yaml` 在 main 更新时构建并发布 GitHub Pages。改动应先在本地或工作分支验证；项目仓库与独立站的删除、改名、归档另行确认。
