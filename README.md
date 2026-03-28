# 高德地图签到脚本 for Quantumult X

自动每日签到高德地图，获取积分。

## 功能

- 每日自动签到高德地图
- 支持重试机制（失败自动重试）
- 签到成功/失败通知
- 调试日志开关

## 使用方法

### 1. 获取 Cookie

1. 在 iPhone 上安装抓包工具（如 HTTP Catcher、Thor 等）
2. 打开高德地图 APP，进入签到页面
3. 开始抓包，执行一次手动签到
4. 找到签到请求（通常是 `https://mobile.amap.com/api/activity/signin`）
5. 复制请求头中的 `Cookie` 字段

### 2. 配置脚本

1. 将 `amap_sign.js` 上传到你的 GitHub 仓库或直接放在 Quantumult X 的本地脚本目录
2. 打开脚本文件，找到配置部分：

```javascript
const config = {
    // 高德地图签到所需的 Cookie，请务必填写
    cookie: '你的Cookie在这里',
    // 是否开启调试日志
    debug: false,
    // 签到失败重试次数
    retryCount: 3,
    // 重试延迟（毫秒）
    retryDelay: 1000,
};
```

3. 将 `cookie` 替换为你抓包获取的 Cookie 值

### 3. 添加定时任务

在 Quantumult X 的配置文件中添加以下任务：

```
[task_local]
# 高德签到，每天上午9点执行
0 9 * * * https://raw.githubusercontent.com/你的用户名/你的仓库/分支/amap_sign.js
```

如果你将脚本放在本地，可以使用文件路径：

```
0 9 * * * script-path=amap_sign.js
```

### 4. 测试脚本

1. 在 Quantumult X 中手动运行一次脚本
2. 检查通知是否正常
3. 查看 Quantumult X 日志确认脚本执行情况

## 注意事项

1. **Cookie 有效期**：Cookie 可能会过期，需要定期更新
2. **签到频率**：每天只需签到一次，请勿设置过于频繁的定时任务
3. **账号安全**：请勿泄露你的 Cookie，避免账号被盗用
4. **接口变更**：如果高德地图更新接口，可能需要调整脚本中的 API 地址和参数

## 脚本结构

```
amap_sign.js
├── 配置区 (config)
├── 常量定义 (API, HEADERS)
├── 工具函数 (log, notify, sleep)
├── 核心签到函数 (signIn)
├── 重试机制 (signInWithRetry)
└── 主函数 (main)
```

## 常见问题

### Q1: 脚本执行失败，提示 "未配置 Cookie"

A: 请检查脚本中的 `cookie` 配置是否已填写。

### Q2: 签到失败，但手动签到成功

A: 可能是 Cookie 已过期，请重新抓包获取最新的 Cookie。

### Q3: 如何查看调试日志？

A: 将配置中的 `debug` 改为 `true`，然后在 Quantumult X 日志中查看。

### Q4: 可以多账号签到吗？

A: 目前脚本只支持单账号。如需多账号，可以复制脚本并配置不同的 Cookie，设置不同的定时任务。

## 更新日志

### v1.0.0 (2025-01-01)

- 初始版本发布
- 实现基础签到功能
- 添加重试机制和通知

## 免责声明

本脚本仅供学习交流使用，请勿用于非法用途。使用本脚本产生的一切后果由使用者自行承担。

## 贡献

欢迎提交 Issue 和 Pull Request 改进脚本。