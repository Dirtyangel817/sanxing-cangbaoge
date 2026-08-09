# 潜入三星藏宝阁

像素风网页小游戏启动页（纯 HTML / CSS / JS）。

## 打开方式

双击 `index.html`，或本地起服务后访问：

```bash
# 若已安装 Python
python -m http.server 5173
```

## 视差分层

鼠标移动时三层背景会以不同幅度偏移，产生景深：

1. 后景 `assets/background2.png`（天空 / 远山）
2. 中景 `assets/background1.png`（藏宝阁）
3. 前景 `assets/foreground-clouds.png`（祥云）

合成观感参考 `assets/background3.png`，整体 UI 布局参考 `assets/ref-start.png`。

## 操作

- 移动鼠标：视差 + 自定义光标
- 点击角色 / 左右方向键：切换出战
- 空格 / 回车 / 点击「开始潜入」：开始