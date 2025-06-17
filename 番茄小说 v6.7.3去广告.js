// 番茄小说 v6.7.3 去广告脚本 for Quantumult X
// 更新日期：2025-06-17
// 支持功能：移除启动广告、阅读页广告、章节间广告、弹窗广告、VIP提示

const $ = new Env('番茄小说去广告');
const VERSION = "v6.7.3";
const AD_KEYWORDS = [
  'ad.', 'ads.', 'advert', 'adx.', 'adserver', 'adservice', 
  'splashad', 'banner', 'popupad', 'adresources', 'advertorial',
  'promotion', 'adimg', 'tracking', 'sdkad', 'adnexus', 'adthor',
  'bytedance', 'pangle', 'union', 'mi.gdt', 'adapi', 'adn.',
  'adcs', 'adpush', 'adinf', 'adcdn', 'advertise', 'adsdk'
];

// 主处理函数
(async () => {
  const req = $.request;
  const res = $.response;
  
  if (req.url.includes('fanqienovel')) {
    // 拦截广告请求
    if (isAdRequest(req.url)) {
      $.log(`🚫 拦截广告请求: ${req.url}`);
      $.done({ status: 404 });
      return;
    }
    
    // 处理JSON响应
    if (res.headers['Content-Type']?.includes('application/json')) {
      let body = res.body;
      
      // 处理启动广告
      if (req.url.includes('splash') || req.url.includes('launch')) {
        body = handleSplashAds(body);
      }
      // 处理阅读页广告
      else if (req.url.includes('reader') || req.url.includes('chapter')) {
        body = handleReaderAds(body);
      }
      // 处理弹窗广告
      else if (req.url.includes('popup') || req.url.includes('dialog')) {
        body = handlePopupAds(body);
      }
      // 处理用户信息（移除VIP提示）
      else if (req.url.includes('user/me') || req.url.includes('user/info')) {
        body = handleUserInfo(body);
      }
      
      if (body !== res.body) {
        $.done({ body });
        return;
      }
    }
    
    // 处理HTML响应
    if (res.headers['Content-Type']?.includes('text/html')) {
      let body = res.body;
      body = cleanHtmlAds(body);
      $.done({ body });
      return;
    }
  }
  $.done({});
})();

// 广告请求检测
function isAdRequest(url) {
  return AD_KEYWORDS.some(kw => url.includes(kw)) || 
         /\/v\d\/(ad|ads|advert)\//.test(url);
}

// 启动广告处理
function handleSplashAds(json) {
  try {
    const data = JSON.parse(json);
    // 清除启动广告数据
    if (data.data?.splash_ad) {
      $.log('✅ 清除启动广告');
      data.data.splash_ad = null;
    }
    // 清除开屏广告配置
    if (data.data?.ad_config) {
      data.data.ad_config = [];
    }
    return JSON.stringify(data);
  } catch (e) {
    return json;
  }
}

// 阅读页广告处理
function handleReaderAds(json) {
  try {
    const data = JSON.parse(json);
    
    // 移除章节间广告
    if (data.data?.content?.includes('<div class="chapter-ad')) {
      $.log('✅ 移除章节间广告');
      data.data.content = data.data.content.replace(
        /<div class="chapter-ad[\s\S]*?<\/div>/g, 
        ''
      );
    }
    
    // 移除底部横幅广告
    if (data.data?.ad_modules) {
      $.log('✅ 移除底部横幅广告');
      data.data.ad_modules = data.data.ad_modules.filter(
        mod => !mod.module_type.includes('ad')
      );
    }
    
    // 移除视频广告
    if (data.data?.video_ads) {
      $.log('✅ 移除视频广告');
      data.data.video_ads = [];
    }
    
    return JSON.stringify(data);
  } catch (e) {
    return json;
  }
}

// 弹窗广告处理
function handlePopupAds(json) {
  try {
    const data = JSON.parse(json);
    // 清除所有广告弹窗
    if (data.data?.popups) {
      $.log(`✅ 清除 ${data.data.popups.length} 个弹窗广告`);
      data.data.popups = data.data.popups.filter(
        pop => !pop.is_ad && !pop.content?.includes('ad')
      );
    }
    return JSON.stringify(data);
  } catch (e) {
    return json;
  }
}

// 用户信息处理（移除VIP提示）
function handleUserInfo(json) {
  try {
    const data = JSON.parse(json);
    // 移除VIP到期提示
    if (data.data?.vip_expire_tips) {
      data.data.vip_expire_tips = '';
    }
    // 移除特权提示
    if (data.data?.privilege_tips) {
      data.data.privilege_tips = '';
    }
    return JSON.stringify(data);
  } catch (e) {
    return json;
  }
}

// HTML页面广告清理
function cleanHtmlAds(html) {
  // 移除顶部横幅广告
  html = html.replace(/<div class="header-ad[\s\S]*?<\/div>/g, '');
  
  // 移除悬浮广告球
  html = html.replace(/<div id="float-ball[\s\S]*?<\/div>/g, '');
  
  // 移除阅读页广告占位符
  html = html.replace(/<div class="ad-placeholder[\s\S]*?<\/div>/g, '');
  
  // 移除底部广告栏
  html = html.replace(/<footer class="ad-footer[\s\S]*?<\/footer>/g, '');
  
  // 移除广告插入脚本
  html = html.replace(/<script[^>]*ad-sdk[^>]*><\/script>/g, '');
  
  return html;
}

// Quantumult X 环境兼容
function Env(name) {
  this.name = name;
  this.request = typeof $request !== "undefined" ? $request : {};
  this.response = typeof $response !== "undefined" ? $response : {};
  
  this.done = (content = {}) => {
    if (typeof $done === "function") {
      const response = { ...this.response };
      if (content.body) response.body = content.body;
      if (content.status) response.status = content.status;
      $done(response);
    }
  };
  
  this.log = (msg) => console.log(`[${this.name} ${VERSION}] ${msg}`);
}