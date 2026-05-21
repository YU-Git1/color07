# 色阶生成工具

一个可直接在网页运行的色阶生成工具，支持浅色/深色模式、彩色色阶与灰色色阶、变量输出和复制。

## 技术方案

这个版本使用 `Vite + 原生 HTML/CSS/JavaScript` 封装。

这样做的原因：

- 当前第一版已经是完整产品形态，不需要为了部署强行迁到 React 或 Vue。
- Vite 本地开发快，打包简单，后续继续加功能也方便。
- 非常适合部署到 GitHub Pages，直接发链接给朋友测试。

## 本地运行

```bash
npm install
npm run dev
```

默认开发地址：

```text
http://127.0.0.1:4173/
```

## 打包

```bash
npm run build
```

打包产物会输出到：

```text
dist/
```

## 部署到 GitHub Pages

仓库里已经带好了 GitHub Actions 工作流。

你只需要：

1. 在你自己的 GitHub 账号下新建仓库
2. 把这个项目推上去
3. 打开 GitHub 仓库的 `Settings > Pages`
4. 在 `Source` 里选择 `GitHub Actions`

之后每次你往 `main` 或 `master` 推送代码，GitHub 都会自动重新部署。

## 访问地址

有两种情况：

1. 如果仓库名是 `你的用户名.github.io`

访问地址就是：

```text
https://你的用户名.github.io/
```

2. 如果仓库名是普通项目名，比如 `color-scale-generator`

访问地址就是：

```text
https://你的用户名.github.io/color-scale-generator/
```

当前工作流已经兼容这两种地址，不需要你手改 base 配置。

## 版本管理建议

为了避免“这次改动把之前已经好的内容改坏”，这个项目后面建议固定用下面这套方式：

- `main`
  用来放当前稳定、可访问、可发给朋友测试的版本。
- `develop`
  用来放日常开发中的版本。后续新需求、新样式调整、新交互优化，先在这里做。

### 推荐工作流

1. 日常开发先切到 `develop`
2. 功能改完后，先本地确认
3. 确认没问题，再合并到 `main`
4. 推送 `main` 后，GitHub Pages 自动更新线上版本

### 你以后只需要记住

- 想继续开发新功能：在 `develop`
- 想保留稳定版本：看 `main`
- 想上线给别人看：把确认好的内容合并到 `main`

### 常用命令

切到开发分支：

```bash
git switch develop
```

切回稳定分支：

```bash
git switch main
```

查看当前改了什么：

```bash
git status
```

保存一个版本：

```bash
git add .
git commit -m "写清楚这次改了什么"
```

推送开发分支：

```bash
git push origin develop
```

推送稳定分支：

```bash
git push origin main
```

## 后续协作约定

后面我帮你继续开发时，默认遵守这套规则：

- 不随便动已经确认好的部分
- 每次改完告诉你：
  - 修改了什么
  - 新增了啥
  - 删除了啥
  - 目前进度
- 重要版本优先保留在 `main`
- 新功能和试验性改动优先放在 `develop`
