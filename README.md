# 色阶生成工具

一个可直接在网页运行的色阶生成工具。

它的核心差异点是：

- 任意节点都可以替换成你的颜色
- 整条色阶会自动重算
- 支持浅色 / 深色模式
- 支持 `HEX / HSB / RGB / HSL`
- 支持变量输出和快速复制
- 支持 `APP / Site` 场景预览

## 在线访问

- 线上地址：`https://yu-git1.github.io/color07/`
- 仓库地址：`https://github.com/YU-Git1/color07`

## 当前版本

- `v1.0`：第一版稳定版本
- `v1.1`：当前版本

详细更新内容见：[CHANGELOG.md](./CHANGELOG.md)

## 技术栈

- `Vite`
- 原生 `HTML / CSS / JavaScript`
- `GitHub Pages` 自动部署

## 本地开发

安装依赖：

```bash
npm install
```

启动开发：

```bash
npm run dev
```

默认地址：

```text
http://127.0.0.1:4173/
```

## 构建

```bash
npm run build
```

构建产物输出到：

```text
dist/
```

## 分支约定

- `main`
  当前稳定版，也是 GitHub Pages 发布分支
- `develop`
  日常开发分支，需求和优化先在这里完成

## 发布方式

仓库内已经配置好 GitHub Actions。

当代码推送到 `main` 后，会自动部署到 GitHub Pages。

工作流文件：

```text
.github/workflows/deploy.yml
```

## 推荐工作流

1. 新需求先在 `develop` 开发
2. 本地确认无问题后提交
3. 合并到 `main`
4. 推送 `main`
5. GitHub Pages 自动更新线上版本

## 常用命令

切到开发分支：

```bash
git switch develop
```

切到稳定分支：

```bash
git switch main
```

查看改动：

```bash
git status
```

提交版本：

```bash
git add .
git commit -m "说明这次改了什么"
```

推送开发分支：

```bash
git push origin develop
```

推送稳定分支：

```bash
git push origin main
```
