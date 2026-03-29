/*
 * 网易云音乐签到脚本 for Quantumult X (简易版)
 * 无需配置界面，直接在代码中填写Cookie
 * 
 * 使用步骤：
 * 1. 获取Cookie（见下方说明）
 * 2. 在下面第15行填写你的Cookie
 * 3. 将脚本放入Quantumult X脚本目录
 * 4. 设置定时任务或手动运行
 * 
 * Cookie获取方法：
 * 1. 浏览器访问 music.163.com 并登录
 * 2. 按F12打开开发者工具
 * 3. 切换到Network（网络）标签
 * 4. 刷新页面
 * 5. 找到任意请求，复制Cookie请求头的值
 */

// ========== 用户配置区域 ==========
// 在这里填写你的网易云Cookie（必需）
const USER_COOKIE = '这里填写你的Cookie';

// 任务开关配置（true开启/false关闭）
const CONFIG = {
    dailySignIn: true,      // 每日签到
    yunbeiSign: true,       // 云贝签到
    autoTasks: true,        // 自动完成任务
    getUserInfo: true,      // 获取用户信息
    
    // 自定义任务ID（针对图片中的特定任务）
    // 如果你有图片中的任务ID，请在这里添加
    // 格式：[任务ID1, 任务ID2, ...]
    customTaskIds: [],
    
    // 调试模式（true显示详细日志/false只显示重要信息）
    debug: true
};

// ========== 固定配置 ==========
const API_CONFIG = {
    baseURL: 'https://music.163.com',
    endpoints: {
        signIn: '/weapi/point/dailyTask',
        yunbeiSign: '/weapi/point/sign',
        taskList: '/weapi/usertool/task/list',
        completeTask: '/weapi/usertool/task/complete',
        userInfo: '/weapi/nuser/account/get',
        userDetail: '/weapi/v1/user/info',
        checkLogin: '/weapi/nuser/account/get'
    }
};

// 固定加密参数
const FIXED_ENCSECKEY = '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7';

// ========== 工具函数 ==========
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleString();
    const prefix = {
        'info': '📝',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
    }[type] || '📝';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    // 发送错误通知
    if (type === 'error' && typeof $notify !== 'undefined') {
        $notify('网易云签到错误', message.substring(0, 50), message);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function encryptParams(params) {
    const text = JSON.stringify(params);
    return {
        params: encodeURIComponent(text),
        encSecKey: FIXED_ENCSECKEY
    };
}

function getHeaders() {
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://music.163.com',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://music.163.com',
        'Cookie': USER_COOKIE,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    };
}

async function postRequest(endpoint, params = {}) {
    const encrypted = encryptParams(params);
    const body = `params=${encrypted.params}&encSecKey=${encrypted.encSecKey}`;
    const url = API_CONFIG.baseURL + endpoint;
    
    try {
        const response = await $httpClient.post({
            url: url,
            headers: getHeaders(),
            body: body
        });
        
        return {
            success: response.statusCode === 200,
            statusCode: response.statusCode,
            data: JSON.parse(response.body)
        };
    } catch (error) {
        log(`请求失败: ${error}`, 'error');
        return { success: false, error: error };
    }
}

async function getRequest(endpoint) {
    const url = API_CONFIG.baseURL + endpoint;
    
    try {
        const response = await $httpClient.get({
            url: url,
            headers: getHeaders()
        });
        
        return {
            success: response.statusCode === 200,
            statusCode: response.statusCode,
            data: JSON.parse(response.body)
        };
    } catch (error) {
        log(`请求失败: ${error}`, 'error');
        return { success: false, error: error };
    }
}

// ========== 业务函数 ==========
async function checkLogin() {
    log('检查登录状态...');
    
    const result = await getRequest(API_CONFIG.endpoints.checkLogin);
    
    if (result.success && result.data.code === 200 && result.data.account) {
        log(`✅ 登录状态正常，用户ID: ${result.data.account.id}`);
        return true;
    } else {
        log('❌ 登录状态异常，请检查Cookie是否正确', 'error');
        return false;
    }
}

async function dailySignIn() {
    if (!CONFIG.dailySignIn) {
        log('⏭️ 每日签到已禁用，跳过');
        return false;
    }
    
    log('开始每日签到...');
    
    const result = await postRequest(API_CONFIG.endpoints.signIn, { type: 1 });
    
    if (!result.success) {
        log('❌ 每日签到请求失败', 'error');
        return false;
    }
    
    const data = result.data;
    
    if (data.code === 200) {
        log(`✅ 每日签到成功！获得积分: ${data.point || 0}`);
        return true;
    } else if (data.code === -2) {
        log('⏭️ 今日已签到');
        return true;
    } else {
        log(`❌ 每日签到失败: ${data.msg || '未知错误'}`, 'error');
        return false;
    }
}

async function yunbeiSign() {
    if (!CONFIG.yunbeiSign) {
        log('⏭️ 云贝签到已禁用，跳过');
        return false;
    }
    
    log('开始云贝签到...');
    
    const result = await postRequest(API_CONFIG.endpoints.yunbeiSign, {});
    
    if (!result.success) {
        log('❌ 云贝签到请求失败', 'error');
        return false;
    }
    
    const data = result.data;
    
    if (data.code === 200) {
        log(`✅ 云贝签到成功！获得云贝: ${data.point || 0}`);
        return true;
    } else if (data.code === -2) {
        log('⏭️ 今日已签到云贝');
        return true;
    } else {
        log(`❌ 云贝签到失败: ${data.msg || '未知错误'}`, 'error');
        return false;
    }
}

async function getTaskList() {
    log('获取任务列表...');
    
    const result = await postRequest(API_CONFIG.endpoints.taskList, {});
    
    if (!result.success || result.data.code !== 200 || !result.data.data) {
        log('❌ 获取任务列表失败', 'error');
        return [];
    }
    
    const tasks = result.data.data;
    log(`📋 发现 ${tasks.length} 个任务`);
    
    return tasks;
}

async function completeTask(task) {
    log(`开始任务: ${task.name || '未知任务'}`);
    
    const result = await postRequest(API_CONFIG.endpoints.completeTask, {
        taskId: task.id
    });
    
    if (!result.success) {
        log(`❌ 任务请求失败: ${task.name || '未知任务'}`, 'error');
        return false;
    }
    
    const data = result.data;
    
    if (data.code === 200) {
        log(`✅ 任务完成！获得积分: ${data.point || 0}`);
        return true;
    } else {
        log(`❌ 任务失败: ${data.msg || '未知错误'}`, 'error');
        return false;
    }
}

async function completeAllTasks() {
    if (!CONFIG.autoTasks) {
        log('⏭️ 自动完成任务已禁用，跳过');
        return 0;
    }
    
    const tasks = await getTaskList();
    let completedCount = 0;
    
    for (const task of tasks) {
        if (task.status === 0) { // 未完成的任务
            await completeTask(task);
            completedCount++;
            await sleep(1500); // 避免请求过快
        }
    }
    
    // 处理自定义任务（针对图片中的特定任务）
    if (CONFIG.customTaskIds.length > 0) {
        log(`处理 ${CONFIG.customTaskIds.length} 个自定义任务`);
        
        for (const taskId of CONFIG.customTaskIds) {
            const customTask = { id: taskId, name: '自定义任务' };
            await completeTask(customTask);
            completedCount++;
            await sleep(1500);
        }
    }
    
    if (completedCount > 0) {
        log(`🎯 共完成 ${completedCount} 个任务`);
    } else {
        log('📭 没有需要完成的任务');
    }
    
    return completedCount;
}

async function getUserInfo() {
    if (!CONFIG.getUserInfo) {
        log('⏭️ 获取用户信息已禁用，跳过');
        return null;
    }
    
    log('获取用户信息...');
    
    const result = await getRequest(API_CONFIG.endpoints.userDetail);
    
    if (!result.success || result.data.code !== 200 || !result.data.data) {
        log('❌ 获取用户信息失败', 'error');
        return null;
    }
    
    const user = result.data.data;
    
    log('👤 用户信息：');
    log(`   昵称: ${user.nickname || '未知'}`);
    log(`   等级: ${user.level || '未知'}`);
    log(`   云贝: ${user.yunbei || '未知'}`);
    log(`   积分: ${user.point || '未知'}`);
    
    return user;
}

// ========== 主函数 ==========
async function main() {
    // 检查Cookie是否已填写
    if (!USER_COOKIE || USER_COOKIE === '这里填写你的Cookie') {
        log('❌ 请先在代码中填写你的Cookie（第15行）', 'error');
        log('🔧 Cookie获取方法：', 'info');
        log('1. 浏览器访问 music.163.com 并登录', 'info');
        log('2. 按F12打开开发者工具', 'info');
        log('3. 切换到Network（网络）标签', 'info');
        log('4. 刷新页面', 'info');
        log('5. 复制任意请求中的Cookie值', 'info');
        
        if (typeof $notify !== 'undefined') {
            $notify(
                '网易云签到脚本配置',
                '请填写Cookie',
                '请在脚本第15行填写你的网易云Cookie。\n\n获取方法：\n1. 访问 music.163.com 并登录\n2. 按F12打开开发者工具\n3. 切换到Network标签\n4. 刷新页面\n5. 复制Cookie值'
            );
        }
        return;
    }
    
    log('🎵 网易云音乐签到脚本启动');
    log(`📅 运行时间: ${new Date().toLocaleString()}`);
    
    // 检查登录状态
    const isLoggedIn = await checkLogin();
    if (!isLoggedIn) {
        return;
    }
    
    // 执行签到任务
    await dailySignIn();
    await sleep(1000);
    
    await yunbeiSign();
    await sleep(1000);
    
    // 完成任务
    await completeAllTasks();
    
    // 获取用户信息
    await getUserInfo();
    
    log('🎉 所有任务执行完成！');
    
    // 发送完成通知
    if (typeof $notify !== 'undefined') {
        $notify(
            '🎵 网易云签到完成',
            '所有任务已执行完毕',
            `执行时间: ${new Date().toLocaleString()}\n请检查日志查看详细结果`
        );
    }
}

// ========== 脚本执行 ==========
// Quantumult X自动执行
if (typeof $task !== 'undefined') {
    main();
} else if (typeof $httpClient !== 'undefined') {
    main();
}

// 导出供测试使用
if (typeof module !== 'undefined') {
    module.exports = { main, CONFIG, API_CONFIG };
}
