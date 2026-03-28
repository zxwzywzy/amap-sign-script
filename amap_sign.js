/**
 * 高德地图签到脚本 for Quantumult X
 * @version 1.0.0
 * @author 你的名字
 * @description 每日自动签到高德地图，获取积分
 * @supported Quantumult X (tested on version 1.0.0+)
 * 
 * 配置说明：
 * 1. 将本脚本添加到 Quantumult X 的脚本仓库
 * 2. 在脚本中配置 cookie（通过抓包获取）
 * 3. 配置签到通知（可选）
 * 
 * 如何获取 cookie：
 * 1. 打开高德地图 APP，进入签到页面
 * 2. 使用抓包工具（如 HTTP Catcher）捕获签到请求
 * 3. 复制请求头中的 Cookie 字段
 * 
 * 定时任务建议：每天 09:00 执行一次
 * [task_local]
 * 0 9 * * * https://raw.githubusercontent.com/你的仓库/amap_sign.js
 * 
 * 注意：请勿频繁执行，以免被限制。
 */

// 用户配置区 ============================================
const config = {
    // 高德地图签到所需的 Cookie，请务必填写
    cookie: 'guid=fa62-29d0-c2d0-4b64; _uab_collina=177469208047242977089148; passport_login=NzU2ODM3NzA0LGFtYXB1WnJjYktmeCxtNXVybmk1cm9nYWhpZ3dmdWJodWFsaHV4NG56MnJ3cSwxNzc0NjkyMTI4LFpqWmxaV1ZpWW1KallqazJNekppTUdVNVpqSTBPREJrWXpWbE1EQTNNR1k9; oauth_state=6395d2add6664a8eec2dc158970580e0',
    // 是否开启调试日志
    debug: false,
    // 签到失败重试次数
    retryCount: 3,
    // 重试延迟（毫秒）
    retryDelay: 1000,
};

// 常量定义 ============================================
const API = {
    // 签到接口（从抓包获取，以下为示例）
    signIn: 'https://mobile.amap.com/api/activity/signin',
    // 用户信息接口（可选）
    userInfo: 'https://mobile.amap.com/api/user/info',
};

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 AMap/9.0.0',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Referer': 'https://mobile.amap.com/',
    'Origin': 'https://mobile.amap.com',
    'Content-Type': 'application/json',
};

// 工具函数 ============================================
function log(message) {
    if (config.debug) {
        console.log(`[高德签到] ${message}`);
    }
}

function notify(title, subtitle = '', content = '') {
    $notify(title, subtitle, content);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 核心签到函数 ============================================
async function signIn() {
    if (!config.cookie) {
        throw new Error('未配置 Cookie，请先填写配置中的 cookie 字段');
    }

    const headers = {
        ...HEADERS,
        'Cookie': config.cookie,
    };

    // 构造签到请求体（根据实际接口调整）
    const body = JSON.stringify({
        // 可能的参数，根据抓包结果填写
        // 例如：'type': 'daily', 'token': 'xxx'
        // 目前留空，根据实际接口调整
    });

    const request = {
        url: API.signIn,
        method: 'POST',
        headers: headers,
        body: body,
    };

    log(`发送签到请求: ${API.signIn}`);
    const response = await $task.fetch(request);
    log(`响应状态: ${response.statusCode}`);
    log(`响应体: ${response.body}`);

    if (response.statusCode !== 200) {
        throw new Error(`签到请求失败，状态码: ${response.statusCode}`);
    }

    let result;
    try {
        result = JSON.parse(response.body);
    } catch (e) {
        throw new Error(`响应解析失败: ${e.message}`);
    }

    // 根据实际返回结构判断签到结果
    // 示例：假设返回中包含 code 字段，0 表示成功
    if (result.code !== undefined && result.code !== 0) {
        throw new Error(`签到失败: ${result.message || JSON.stringify(result)}`);
    }

    // 签到成功，解析积分信息
    const points = result.data?.points || result.points || 0;
    const totalPoints = result.data?.totalPoints || result.totalPoints || 0;
    const signDays = result.data?.signDays || result.signDays || 0;

    return {
        success: true,
        points,
        totalPoints,
        signDays,
        message: result.message || '签到成功',
        raw: result,
    };
}

// 重试机制 ============================================
async function signInWithRetry(retries = config.retryCount) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await signIn();
        } catch (error) {
            lastError = error;
            log(`签到失败，第 ${i + 1} 次重试: ${error.message}`);
            if (i < retries - 1) {
                await sleep(config.retryDelay);
            }
        }
    }
    throw lastError;
}

// 主函数 ============================================
async function main() {
    const startTime = Date.now();
    let success = false;
    let result = null;
    let errorMessage = '';

    try {
        result = await signInWithRetry();
        success = true;
    } catch (error) {
        errorMessage = error.message;
        log(`签到最终失败: ${errorMessage}`);
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // 发送通知
    if (success) {
        notify(
            '高德签到成功',
            `获得 ${result.points} 积分，累计 ${result.totalPoints} 积分`,
            `连续签到 ${result.signDays} 天，耗时 ${duration} 秒`
        );
        log(`签到成功: 获得 ${result.points} 积分，累计 ${result.totalPoints} 积分`);
    } else {
        notify(
            '高德签到失败',
            '请检查 Cookie 配置或网络',
            `错误信息: ${errorMessage}\n耗时: ${duration} 秒`
        );
        log(`签到失败: ${errorMessage}`);
    }

    // 返回结果供 Quantumult X 记录
    return {
        success,
        result,
        error: errorMessage,
        duration,
    };
}

// 执行主函数
main().then(result => {
    $done(result);
}).catch(error => {
    $done({ success: false, error: error.message });
});
