/*
 * 网易云音乐签到脚本 for Quantumult X
 * 版本：3.0 - 弹窗配置版
 * 功能：每日签到、云贝签到、自动完成任务
 * 配置：通过Quantumult X配置面板设置Cookie（弹窗形式）
 * 
 * 使用说明：
 * 1. 将脚本放入Quantumult X脚本目录
 * 2. 点击脚本右侧图标进行配置
 * 3. 添加Cookie（从浏览器获取）
 * 4. 设置定时任务或手动运行
 * 
 * Cookie获取方法：
 * 1. 访问 music.163.com 并登录
 * 2. 按F12打开开发者工具
 * 3. 切换到Network（网络）标签
 * 4. 刷新页面
 * 5. 复制任意请求中的Cookie值
 */

// ========== 配置管理 ==========
class ConfigManager {
    constructor() {
        this.config = {
            // Cookie配置 - 通过Quantumult X配置面板设置
            cookie: this.getCookie(),
            
            // 任务开关
            tasks: {
                dailySignIn: true,      // 每日签到
                yunbeiSign: true,       // 云贝签到
                autoTasks: true,        // 自动完成任务
                userInfo: true          // 获取用户信息
            },
            
            // 自定义任务ID（针对图片中的特定任务）
            // 示例：[123, 456, 789]
            customTaskIds: [],
            
            // 调试模式
            debug: true,
            
            // API配置
            api: {
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
            }
        };
        
        // 固定加密参数
        this.FIXED_ENCSECKEY = '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7';
    }
    
    getCookie() {
        // 从Quantumult X配置中获取Cookie
        // 用户可以在脚本配置界面中设置
        const cookie = $prefs.valueForKey('NeteaseMusicCookie');
        
        if (!cookie) {
            this.showConfigHelp();
            return '';
        }
        
        return cookie;
    }
    
    showConfigHelp() {
        const helpMessage = `🎵 网易云音乐签到脚本配置说明

⚠️ 未检测到Cookie配置，请按以下步骤设置：

1. 点击本脚本右侧的配置图标
2. 在配置界面中添加以下键值：
   - 键：NeteaseMusicCookie
   - 值：你的网易云Cookie

🔧 Cookie获取方法：
1. 浏览器访问 music.163.com 并登录
2. 按F12打开开发者工具
3. 切换到Network（网络）标签
4. 刷新页面
5. 找到任意请求，复制Cookie头的值

📝 配置完成后，脚本将自动运行签到任务。`;
        
        console.log(helpMessage);
        
        // 发送通知提醒用户配置
        if (typeof $notify !== 'undefined') {
            $notify(
                '网易云签到脚本配置提醒',
                '请配置Cookie以启用自动签到',
                helpMessage
            );
        }
    }
    
    // 检查配置是否有效
    isValid() {
        if (!this.config.cookie) {
            this.log('❌ Cookie未配置，请按照提示进行配置', 'error');
            return false;
        }
        return true;
    }
    
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleString();
        const prefix = {
            'info': '📝',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        }[type] || '📝';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
        
        // 如果是错误或重要信息，发送通知
        if (type === 'error' && typeof $notify !== 'undefined') {
            $notify('网易云签到脚本错误', message.substring(0, 50), message);
        }
    }
}

// ========== 网易云API客户端 ==========
class NeteaseClient {
    constructor(configManager) {
        this.config = configManager.config;
        this.log = configManager.log.bind(configManager);
    }
    
    getHeaders() {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://music.163.com',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://music.163.com',
            'Cookie': this.config.cookie,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        };
    }
    
    encryptParams(params) {
        // 简化版加密，实际使用时需要完整实现
        const text = JSON.stringify(params);
        return {
            params: encodeURIComponent(text),
            encSecKey: this.config.FIXED_ENCSECKEY
        };
    }
    
    async post(endpoint, params = {}) {
        const encrypted = this.encryptParams(params);
        const body = `params=${encrypted.params}&encSecKey=${encrypted.encSecKey}`;
        
        const url = this.config.api.baseURL + endpoint;
        
        try {
            const response = await $httpClient.post({
                url: url,
                headers: this.getHeaders(),
                body: body
            });
            
            return {
                success: response.statusCode === 200,
                statusCode: response.statusCode,
                data: JSON.parse(response.body)
            };
        } catch (error) {
            this.log(`请求失败: ${error}`, 'error');
            return { success: false, error: error };
        }
    }
    
    async get(endpoint) {
        const url = this.config.api.baseURL + endpoint;
        
        try {
            const response = await $httpClient.get({
                url: url,
                headers: this.getHeaders()
            });
            
            return {
                success: response.statusCode === 200,
                statusCode: response.statusCode,
                data: JSON.parse(response.body)
            };
        } catch (error) {
            this.log(`请求失败: ${error}`, 'error');
            return { success: false, error: error };
        }
    }
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ========== 签到管理器 ==========
class SignInManager {
    constructor(client, configManager) {
        this.client = client;
        this.config = configManager.config;
        this.log = configManager.log.bind(configManager);
    }
    
    async checkLogin() {
        this.log('检查登录状态...');
        
        const result = await this.client.get(this.config.api.endpoints.checkLogin);
        
        if (result.success && result.data.code === 200 && result.data.account) {
            this.log(`✅ 登录状态正常，用户ID: ${result.data.account.id}`);
            return true;
        } else {
            this.log('❌ 登录状态异常，请检查Cookie是否有效', 'error');
            return false;
        }
    }
    
    async dailySignIn() {
        if (!this.config.tasks.dailySignIn) {
            this.log('⏭️ 每日签到已禁用，跳过');
            return false;
        }
        
        this.log('开始每日签到...');
        
        const result = await this.client.post(this.config.api.endpoints.signIn, { type: 1 });
        
        if (!result.success) {
            this.log('❌ 每日签到请求失败', 'error');
            return false;
        }
        
        const data = result.data;
        
        if (data.code === 200) {
            this.log(`✅ 每日签到成功！获得积分: ${data.point || 0}`);
            return true;
        } else if (data.code === -2) {
            this.log('⏭️ 今日已签到');
            return true;
        } else {
            this.log(`❌ 每日签到失败: ${data.msg || '未知错误'}`, 'error');
            return false;
        }
    }
    
    async yunbeiSign() {
        if (!this.config.tasks.yunbeiSign) {
            this.log('⏭️ 云贝签到已禁用，跳过');
            return false;
        }
        
        this.log('开始云贝签到...');
        
        const result = await this.client.post(this.config.api.endpoints.yunbeiSign, {});
        
        if (!result.success) {
            this.log('❌ 云贝签到请求失败', 'error');
            return false;
        }
        
        const data = result.data;
        
        if (data.code === 200) {
            this.log(`✅ 云贝签到成功！获得云贝: ${data.point || 0}`);
            return true;
        } else if (data.code === -2) {
            this.log('⏭️ 今日已签到云贝');
            return true;
        } else {
            this.log(`❌ 云贝签到失败: ${data.msg || '未知错误'}`, 'error');
            return false;
        }
    }
    
    async getTaskList() {
        this.log('获取任务列表...');
        
        const result = await this.client.post(this.config.api.endpoints.taskList, {});
        
        if (!result.success || result.data.code !== 200 || !result.data.data) {
            this.log('❌ 获取任务列表失败', 'error');
            return [];
        }
        
        const tasks = result.data.data;
        this.log(`📋 发现 ${tasks.length} 个任务`);
        
        return tasks;
    }
    
    async completeTask(task) {
        this.log(`开始任务: ${task.name || '未知任务'}`);
        
        const result = await this.client.post(this.config.api.endpoints.completeTask, {
            taskId: task.id
        });
        
        if (!result.success) {
            this.log(`❌ 任务请求失败: ${task.name || '未知任务'}`, 'error');
            return false;
        }
        
        const data = result.data;
        
        if (data.code === 200) {
            this.log(`✅ 任务完成！获得积分: ${data.point || 0}`);
            return true;
        } else {
            this.log(`❌ 任务失败: ${data.msg || '未知错误'}`, 'error');
            return false;
        }
    }
    
    async completeAllTasks() {
        if (!this.config.tasks.autoTasks) {
            this.log('⏭️ 自动完成任务已禁用，跳过');
            return 0;
        }
        
        const tasks = await this.getTaskList();
        let completedCount = 0;
        
        for (const task of tasks) {
            // 只处理未完成的任务
            if (task.status === 0) {
                await this.completeTask(task);
                completedCount++;
                
                // 避免请求过快
                await this.client.sleep(1500);
            }
        }
        
        // 处理自定义任务（针对图片中的特定任务）
        if (this.config.customTaskIds.length > 0) {
            this.log(`处理 ${this.config.customTaskIds.length} 个自定义任务`);
            
            for (const taskId of this.config.customTaskIds) {
                const customTask = { id: taskId, name: '自定义任务' };
                await this.completeTask(customTask);
                completedCount++;
                await this.client.sleep(1500);
            }
        }
        
        if (completedCount > 0) {
            this.log(`🎯 共完成 ${completedCount} 个任务`);
        } else {
            this.log('📭 没有需要完成的任务');
        }
        
        return completedCount;
    }
    
    async getUserInfo() {
        if (!this.config.tasks.userInfo) {
            this.log('⏭️ 获取用户信息已禁用，跳过');
            return null;
        }
        
        this.log('获取用户信息...');
        
        const result = await this.client.get(this.config.api.endpoints.userDetail);
        
        if (!result.success || result.data.code !== 200 || !result.data.data) {
            this.log('❌ 获取用户信息失败', 'error');
            return null;
        }
        
        const user = result.data.data;
        
        this.log('👤 用户信息：');
        this.log(`   昵称: ${user.nickname || '未知'}`);
        this.log(`   等级: ${user.level || '未知'}`);
        this.log(`   云贝: ${user.yunbei || '未知'}`);
        this.log(`   积分: ${user.point || '未知'}`);
        
        return user;
    }
}

// ========== 主程序 ==========
class MainApp {
    constructor() {
        this.configManager = new ConfigManager();
        this.client = new NeteaseClient(this.configManager);
        this.signInManager = new SignInManager(this.client, this.configManager);
    }
    
    async run() {
        this.configManager.log('🎵 网易云音乐签到脚本启动');
        this.configManager.log(`📅 运行时间: ${new Date().toLocaleString()}`);
        
        // 检查配置
        if (!this.configManager.isValid()) {
            return;
        }
        
        // 检查登录状态
        const isLoggedIn = await this.signInManager.checkLogin();
        if (!isLoggedIn) {
            return;
        }
        
        // 执行签到任务
        await this.signInManager.dailySignIn();
        await this.client.sleep(1000);
        
        await this.signInManager.yunbeiSign();
        await this.client.sleep(1000);
        
        // 完成任务
        await this.signInManager.completeAllTasks();
        
        // 获取用户信息
        await this.signInManager.getUserInfo();
        
        // 发送完成通知
        this.sendCompletionNotification();
        
        this.configManager.log('🎉 所有任务执行完成！');
    }
    
    sendCompletionNotification() {
        if (typeof $notify !== 'undefined') {
            $notify(
                '🎵 网易云签到完成',
                '所有任务已执行完毕',
                `执行时间: ${new Date().toLocaleString()}\n请检查日志查看详细结果`
            );
        }
    }
}

// ========== 脚本入口 ==========
(async () => {
    try {
        const app = new MainApp();
        await app.run();
    } catch (error) {
        console.log(`❌ 脚本执行出错: ${error}`);
        console.log(error.stack);
        
        if (typeof $notify !== 'undefined') {
            $notify('网易云签到脚本错误', '执行过程中出现异常', error.message);
        }
    }
})();

// Quantumult X 导出
if (typeof $task !== 'undefined') {
    // 作为定时任务运行
    (async () => {
        const app = new MainApp();
        await app.run();
    })();
}

// 模块导出（用于测试）
if (typeof module !== 'undefined') {
    module.exports = {
        ConfigManager,
        NeteaseClient,
        SignInManager,
        MainApp
    };
}
