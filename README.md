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
