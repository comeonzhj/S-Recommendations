# 搜索推荐词采集助手

![版本](https://img.shields.io/badge/版本-1.0-blue)
![许可证](https://img.shields.io/badge/许可证-MIT-green)

一款强大的浏览器扩展，用于从主流社交媒体和搜索引擎中采集搜索推荐词，帮助内容创作者、市场营销人员和SEO优化专家发现热门话题和搜索趋势。

## 功能特点

- **多平台支持**：覆盖小红书、抖音、B站、百度、Google等主流平台
- **多级采集**：支持1-3级深度采集，挖掘更多相关推荐词
- **通配符功能**：使用`{c}`通配符可自动替换为a-z字母，批量采集更多关键词
- **自定义设置**：可设置采集面板位置、结果格式等
- **导出功能**：支持CSV表格格式和Markdown思维导图格式导出
- **美观界面**：采用现代化UI设计，操作简单直观

## 安装方式

### 从Chrome网上应用店安装

1. 访问[Chrome网上应用店](https://chrome.google.com/webstore/category/extensions)
2. 搜索"搜索推荐词采集助手"
3. 点击"添加至Chrome"按钮

### 手动安装

1. 下载此仓库的ZIP文件或克隆仓库
2. 解压缩文件（如果下载的是ZIP）
3. 打开Chrome浏览器，进入扩展管理页面 (`chrome://extensions/`)
4. 开启右上角的"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择解压后的文件夹

## 使用指南

### 基本使用

1. 点击浏览器工具栏中的扩展图标
2. 在弹出窗口中输入关键词（支持多行输入）
3. 选择采集层级（1-3级）
4. 点击"提取推荐词"按钮
5. 在网页侧边将显示采集结果面板
6. 点击"下载结果"可以导出数据

### 使用通配符

在关键词中添加`{c}`作为通配符，扩展将自动替换为a-z的26个字母：

```
手机{c}
```

这将同时采集"手机a"、"手机b"、"手机c"...直到"手机z"的推荐词。

### 设置选项

点击扩展图标右键菜单中的"选项"或在弹出窗口底部点击设置图标，可以进入设置页面：

- **默认采集层级**：设置默认的采集深度
- **采集结果格式**：选择CSV表格格式或Markdown思维导图格式
- **采集面板位置**：选择在页面左侧或右侧显示结果面板
- **自动打开采集结果**：设置是否自动显示结果面板

## 支持的网站

- 小红书 (xiaohongshu.com)
- 抖音 (douyin.com)
- B站 (bilibili.com)
- 百度 (baidu.com)
- Google (google.com / google.com.hk)

## 技术实现

- 基于Chrome扩展Manifest V3开发
- 使用原生JavaScript实现核心功能
- 响应式设计，适配不同尺寸的浏览器窗口

## 隐私说明

本扩展程序：
- 不会收集或传输用户的个人数据
- 不会向任何外部服务器发送数据
- 所有数据仅存储在用户的浏览器本地存储中
- 只在用户主动使用时才会访问网页内容

## 贡献指南

欢迎提交问题报告、功能请求或代码贡献。请遵循以下步骤：

1. Fork此仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开Pull Request

## 许可证

此项目采用MIT许可证 - 详情请查看LICENSE文件

## 致谢

此项目基于[https://github.com/niemingxing/search-recommendations](https://github.com/niemingxing/search-recommendations)项目的代码内容，由windsurf开发。
