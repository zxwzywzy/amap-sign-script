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
const USER_COOKIE = 'JSESSIONID-WYYY=iADBvNpQFwqJFoMaN8gRxf%2BRZ2CsV%2Be9WjAUfA3Rcxw8ROQa%2B3ijQnnWTT31sduNC%5CU%2Fgh2QIvZpOZqqrzj6HXEBP14%5CRYB%5C4wOYm53F41NvnhCpFY3A%2B0Mnq1DWMhtTBqYIj8MdlVyZD%2F4o1CuRpexwb0igyim%2BBRFriPgZOG1OMV%5Cj%3A1774771883315; _iuqxldmzr_=32; NMTID=00Ool6eFpNUUg9EH0cJkeSBM6UACSkAAAGdOIpbdA; WEVNSM=1.0.0; WNMCID=bbrqnd.1774770087101.01.0; sDeviceId=YD-iVD90bFBoSNEElFERFOH8x6F0Yx6jXTd; MUSIC_U=00A974E27AEFF80D4C1719A62DECE3A0AC087B0AA5CC8E88067A890BE1AC83B1B0EAB8C38BF4A7A685738432DAAEC054A98A3A1F6A72110F6BD7E8CB3B9AA5719B04BCE174488552FBBD649BD785D8693945548E7CBE5B39F6094815BD20B75E4BBDAF802AA5C2B7702DA7D8DC6D6402F6BCAF81772F67C2A8A4B55A50F804B7D7BD6CF5A5F3B2D26239B14FEF962D85A744B6D8F95083BB573C7879EBAA87C56F88517FFF8BA9B6FF0E95B7A3F32677C7D0A3E5DA98A76C57EC73F31FAA698C953EC3F3DBF833395C1FB19A4C846F2CA6AD3F3FDDFC6F3D398398E42D41E39377DCF5BA5038E68667B502D6F8822E50ACC653646160BD7DC4AD39A29B5FCA2886C459AB642C70F46418CAC0A1673D2FB262732B9825B7FBD201243D052E7E1EFF9650A7390A187A101056C3400CF0F7380897212C6EEE0A93544E3B3AEE84563A892766646A9135D60AF7CBBEF7B40038AD6580B1042E01B1C028E15EE53479896B447ECAA63300A1C2E7B15A8ED44C35B464418BF873543C3C84F1C24A90073E8B61A5062BD4ACA2F4CC1D0117D0EFA17C18E0C15D556B2C0116618C173674BB; __csrf=b441d05e052a2bd8759cec18a52e3cf5';

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
