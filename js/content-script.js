// 下载结果
function downloadResults(format) {
  if (collectKeywordList.length === 0) {
    alert("没有可下载的内容！");
    return;
  }
  
  var currentSite = getCurrentSiteName();
  var timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  
  if (format === 'md') {
    var markdown = convertToMindmap(collectKeywordList);
    downloadFile(markdown, currentSite + "_思维导图_" + timestamp + ".md", "text/markdown");
  } else {
    downloadFile("\ufeff" + csvContent, currentSite + "_关键词_" + timestamp + ".csv", "text/csv;charset=utf-8");
  }
}

// 获取当前网站名称
function getCurrentSiteName() {
  if (currentDomain.includes("douyin")) return "抖音";
  if (currentDomain.includes("xiaohongshu")) return "小红书";
  if (currentDomain.includes("bilibili")) return "B站";
  if (currentDomain.includes("zhihu")) return "知乎";
  if (currentDomain.includes("baidu")) return "百度";
  if (currentDomain.includes("google")) return "Google";
  return "搜索推荐词";
}

// 下载文件
function downloadFile(content, filename, type) {
  var blob = new Blob([content], { type: type });
  var link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 将采集的数据转换为思维导图格式的Markdown
function convertToMindmap(data) {
  var markdown = '# 搜索推荐词采集\n';
  
  for (var i = 0; i < data.length; i++) {
    var item = data[i];
    var level = item[0] + 1; // 增加一级作为Markdown标题层级
    var prefix = '';
    
    // 最多支持6级标题
    for (var j = 0; j < Math.min(level, 6); j++) {
      prefix += '#';
    }
    
    markdown += prefix + ' ' + item[1] + '\n';
  }
  
  return markdown;
}

// 获取搜索框和推荐列表的DOM元素
function getNeetElement(type) {
  var result;
  
  if (type === "search") {
    if (currentDomain.includes("douyin")) {
      result = document.querySelector('header input[data-e2e="searchbar-input"]');
    } else if (currentDomain.includes("xiaohongshu")) {
      result = document.querySelector('.search-input');
    } else if (currentDomain.includes("bilibili")) {
      result = document.querySelector('.nav-search-input');
    } else if (currentDomain.includes("zhihu")) {
      result = document.querySelector('form.SearchBar-tool input[type=text]');
    } else if (currentDomain.includes("baidu")) {
      result = document.querySelector('#kw');
    } else if (currentDomain.includes("google")) {
      result = document.querySelector('form[role="search"] textarea');
    }
  } else if (type === "recommend") {
    if (currentDomain.includes("douyin")) {
      result = document.querySelectorAll("header div[data-index]");
    } else if (currentDomain.includes("xiaohongshu")) {
      result = document.querySelectorAll("div.sug-item");
    } else if (currentDomain.includes("bilibili")) {
      result = document.querySelectorAll("div.suggestions div.suggest-item");
    } else if (currentDomain.includes("zhihu")) {
      result = document.querySelectorAll('div.Menu-item');
    } else if (currentDomain.includes("baidu")) {
      result = document.querySelectorAll('ul li.bdsug-overflow');
    } else if (currentDomain.includes("google")) {
      result = document.querySelectorAll('ul[role="listbox"] li[role="presentation"] div[role="option"] div[role="presentation"]:first-child');
    }
  }
  
  return result;
}
// 获取搜索关键词的推荐词
async function getSearchKeywords(q) {
  var searchInput = getNeetElement("search");
  if (!searchInput) return [];
  
  inputDispatchEvent(searchInput, q);
  await sleep(3000);
  
  var recommendElements = getNeetElement("recommend");
  var keywords = [];
  
  if (recommendElements && recommendElements.length > 0) {
    for (var i = 0; i < recommendElements.length; i++) {
      var element = recommendElements[i];
      var html = element.innerHTML;
      var text = html.replace(/<[^>]*>/g, "").trim();
      if (text) {
        keywords.push(text);
      }
    }
  }
  
  return keywords;
}

// 开始采集过程
async function startCollection(keywords, level) {
  if (isCollecting) {
    console.log('已有采集任务正在进行中');
    return false;
  }
  
  // 重置采集状态
  kwIndex = 0;
  csvContent = "层级,关键词\n"; // 添加CSV表头
  keywordList = [];
  collectKeywordList = [];
  collectLevel = level || 1;
  
  // 处理关键词
  var lines = keywords.split('\n').filter(function(item) { 
    return item.trim() !== '';
  });
  
  // 处理包含{c}通配符的关键词
  for (var i = 0; i < lines.length; i++) {
    var item = lines[i];
    if (item.includes("{c}")) {
      // 添加原始关键词
      keywordList.push(item.replace("{c}", ""));
      
      // 替换{c}为a-z的26个字母
      for (var j = 97; j <= 122; j++) {
        var character = String.fromCharCode(j);
        keywordList.push(item.replace("{c}", character));
      }
    } else {
      keywordList.push(item);
    }
  }
  
  if (keywordList.length === 0) {
    console.log('没有可采集的关键词');
    return false;
  }
  
  // 准备开始采集
  collectorUI.clearResults();
  collectorUI.updateTitle("搜索推荐词采集中...");
  collectorUI.setCollectingStatus(true);
  isCollecting = true;
  
  // 启动采集过程
  await searchByNextKeyword();
  return true;
}

// 采集下一个关键词
async function searchByNextKeyword() {
  if (kwIndex < keywordList.length && isCollecting) {
    var keyword = keywordList[kwIndex];
    await search(keyword);
  }
}

// 完成采集
function finishCollection() {
  isCollecting = false;
  collectorUI.updateTitle("搜索推荐词结果 (共" + collectKeywordList.length + "个)");
  collectorUI.setCollectingStatus(false);
  console.log("关键词采集完成！");
}

// 延时函数
function sleep(ms) {
  return new Promise(function(resolve) { 
    setTimeout(resolve, ms);
  });
}

// 输入关键词并触发相关事件
function inputDispatchEvent(input, value) {
  if (!input) return;
  
  // 聚焦事件
  var focusEvent = new Event('focus', {
    bubbles: true,
    cancelable: true
  });
  
  // 输入事件
  var inputEvent = new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: value
  });
  
  // 变化事件
  var changeEvent = new Event('change', {
    bubbles: true,
    cancelable: true
  });
  
  // 键盘事件
  var keyUpEvent = new KeyboardEvent('keyup', {
    key: '',
    bubbles: true,
    cancelable: true
  });
  
  // 设置值并触发事件
  input.value = value;
  input.focus();
  input.dispatchEvent(focusEvent);
  input.dispatchEvent(inputEvent);
  input.dispatchEvent(changeEvent);
  input.dispatchEvent(keyUpEvent);
  
  console.log("已输入关键词: " + value);
}

// 全局变量
var kwIndex = 0;                     // 当前处理的关键词索引
var csvContent = "";                 // CSV格式的结果
var keywordList = [];                // 处理后的关键词列表
var collectKeywordList = [];         // 采集到的关键词列表
var collectLevel = 1;                // 采集的层级深度
var currentDomain = window.location.hostname; // 当前网站域名
var collectorUI;                     // 采集器UI接口
var isCollecting = false;            // 是否正在采集中

// 在页面加载完成后初始化采集器UI
window.addEventListener('load', function() {
  if (isSearchSiteSupported()) {
    collectorUI = initCollectorUI();
    console.log('搜索推荐词采集插件已加载');
    
    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      if (message.type === 'collect_search_keywords') {
        console.log('收到采集请求:', message);
        
        startCollection(message.keywords, message.collectLevel).then(function(started) {
          if (started) {
            // 自动显示结果面板设置
            try {
              chrome.storage.local.get('autoShowResults', function(data) {
                if (!data || data.autoShowResults !== 'no') {
                  collectorUI.showResult(); // 显示结果面板
                }
              });
            } catch (e) {
              console.error('读取自动显示结果设置失败:', e);
              collectorUI.showResult(); // 默认显示结果面板
            }
            
            sendResponse({ status: 'started' });
          } else {
            sendResponse({ status: 'error', message: '无法启动采集任务' });
          }
        }).catch(function(err) {
          console.error('启动采集失败:', err);
          sendResponse({ status: 'error', message: err.message });
        });
        
        return true; // 保持消息通道开启，以便异步响应
      }
    });
  }
});

// 检查当前网站是否支持采集
function isSearchSiteSupported() {
  return currentDomain.includes("xiaohongshu") || 
         currentDomain.includes("douyin") || 
         currentDomain.includes("bilibili") || 
         currentDomain.includes("zhihu") || 
         currentDomain.includes("baidu") || 
         currentDomain.includes("google");
}

// 初始化采集器UI
function initCollectorUI() {
  // 创建采集结果展示面板
  const container = document.createElement('div');
  container.className = 'search-collector-container';
  
  // 默认使用右侧面板
  var panelPosition = 'right';
  var sidebarClass = 'search-collector-sidebar';
  var toggleClass = 'search-collector-toggle';
  var popupClass = 'search-collector-popup';
  var activeClass = 'active';
  
  // 尝试从存储中读取面板位置设置
  try {
    chrome.storage.local.get('panelPosition', function(data) {
      if (data && data.panelPosition === 'left') {
        // 如果是左侧面板，更新类名
        sidebarClass = 'search-collector-sidebar-left';
        toggleClass = 'search-collector-toggle-left';
        popupClass = 'search-collector-popup-left';
        activeClass = 'active-left';
        
        // 更新已创建元素的类名
        const sidebar = container.querySelector('.search-collector-sidebar');
        const toggle = container.querySelector('.search-collector-toggle');
        const popup = container.querySelector('.search-collector-popup');
        
        if (sidebar) sidebar.className = sidebarClass;
        if (toggle) toggle.className = toggleClass;
        if (popup) popup.className = popupClass;
      }
    });
  } catch (e) {
    console.error('读取面板位置设置失败:', e);
  }
  
  container.innerHTML = `
    <div class="${sidebarClass}">
      <button class="${toggleClass}">关键词采集</button>
    </div>
    <div class="${popupClass}">
      <div class="search-collector-content">
        <div class="search-collector-title">
          <span>搜索推荐词结果</span>
          <button class="search-collector-close">×</button>
        </div>
        <ul class="search-collector-list"></ul>
        <div class="search-collector-format-options">
          <label><input type="radio" name="format" value="csv" checked> CSV格式</label>
          <label><input type="radio" name="format" value="md"> 思维导图格式</label>
        </div>
        <button class="search-collector-download">下载结果</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(container);
  
  // 绑定事件
  const toggleButton = container.querySelector(`.${toggleClass}`);
  const closeButton = container.querySelector('.search-collector-close');
  const popup = container.querySelector(`.${popupClass}`);
  const downloadButton = container.querySelector('.search-collector-download');
  
  toggleButton.addEventListener('click', () => {
    popup.classList.toggle(activeClass);
  });
  
  closeButton.addEventListener('click', () => {
    popup.classList.remove(activeClass);
  });
  
  downloadButton.addEventListener('click', () => {
    const formatType = container.querySelector('input[name="format"]:checked').value;
    downloadResults(formatType);
  });
  
  // 防止点击面板内容时关闭面板
  popup.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // 点击页面其他区域关闭面板
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target) && popup.classList.contains(activeClass)) {
      popup.classList.remove(activeClass);
    }
  });
  
  // 获取默认的格式设置
  chrome.storage.local.get('defaultFormat', function(data) {
    if (data.defaultFormat) {
      const formatRadio = container.querySelector(`input[name="format"][value="${data.defaultFormat}"]`);
      if (formatRadio) formatRadio.checked = true;
    }
  });
  
  return {
    showResult: function() {
      popup.classList.add(activeClass);
    },
    
    addKeyword: function(level, keyword) {
      const list = container.querySelector('.search-collector-list');
      const item = document.createElement('li');
      item.className = 'search-collector-item';
      
      // 对不同层级使用不同的样式
      const levelClass = `search-collector-level-${Math.min(level, 4)}`;
      item.innerHTML = `<span class="search-collector-level ${levelClass}">${level}级</span> ${keyword}`;
      
      list.appendChild(item);
      
      // 自动滚动到底部
      list.scrollTop = list.scrollHeight;
    },
    
    clearResults: function() {
      const list = container.querySelector('.search-collector-list');
      list.innerHTML = '';
    },
    
    updateTitle: function(text) {
      const title = container.querySelector('.search-collector-title span');
      title.textContent = text;
    },
    
    setCollectingStatus: function(collecting) {
      const downloadBtn = container.querySelector('.search-collector-download');
      if (collecting) {
        downloadBtn.textContent = '采集中...';
        downloadBtn.disabled = true;
      } else {
        downloadBtn.textContent = '下载结果';
        downloadBtn.disabled = false;
      }
    }
  };
}

// 获取搜索框和推荐列表的DOM元素
function getNeetElement(type) {
  let result;
  
  if (type === "search") {
    if (currentDomain.includes("douyin")) {
      result = document.querySelector('header input[data-e2e="searchbar-input"]');
    } else if (currentDomain.includes("xiaohongshu")) {
      result = document.querySelector('.search-input');
    } else if (currentDomain.includes("bilibili")) {
      result = document.querySelector('.nav-search-input');
    } else if (currentDomain.includes("zhihu")) {
      result = document.querySelector('form.SearchBar-tool input[type=text]');
    } else if (currentDomain.includes("baidu")) {
      result = document.querySelector('#kw');
    } else if (currentDomain.includes("google")) {
      result = document.querySelector('form[role="search"] textarea');
    }
  } else if (type === "recommend") {
    if (currentDomain.includes("douyin")) {
      result = document.querySelectorAll("header div[data-index]");
    } else if (currentDomain.includes("xiaohongshu")) {
      result = document.querySelectorAll("div.sug-item");
    } else if (currentDomain.includes("bilibili")) {
      result = document.querySelectorAll("div.suggestions div.suggest-item");
    } else if (currentDomain.includes("zhihu")) {
      result = document.querySelectorAll('div.Menu-item');
    } else if (currentDomain.includes("baidu")) {
      result = document.querySelectorAll('ul li.bdsug-overflow');
    } else if (currentDomain.includes("google")) {
      result = document.querySelectorAll('ul[role="listbox"] li[role="presentation"] div[role="option"] div[role="presentation"]:first-child');
    }
  }
  
  return result;
}

// 搜索关键词并采集推荐词
async function search(q) {
  if (!isCollecting) return;
  
  try {
    // 记录并显示一级关键词
    csvContent += "1," + q + "\n";
    collectKeywordList.push([1, q]);
    collectorUI.addKeyword(1, q);
    collectorUI.updateTitle(`搜索推荐词采集中... (${kwIndex+1}/${keywordList.length})`);
    
    let searchInput = getNeetElement("search");
    if (!searchInput) {
      console.error("无法找到搜索输入框");
      return;
    }
    
    // 输入关键词并等待推荐结果
    inputDispatchEvent(searchInput, q);
    await sleep(3000);
    
    // 获取推荐元素
    let recommendElements = getNeetElement("recommend");
    if (!recommendElements || recommendElements.length === 0) {
      console.log(`关键词 "${q}" 没有推荐结果`);
      return;
    }
    
    // 遍历推荐元素并收集二级关键词
    for (let element of recommendElements) {
      if (!isCollecting) return; // 如果中途取消采集
      
      let html = element.innerHTML;
      let text = html.replace(/<[^>]*>/g, "").trim();
      
      if (text && text !== q) { // 确保不重复添加相同关键词
        csvContent += "2," + text + "\n";
        collectKeywordList.push([2, text]);
        collectorUI.addKeyword(2, text);
        
        // 如果需要采集更深层级的关键词
        if (collectLevel >= 2) {
          try {
            let keywords = await getSearchKeywords(text);
            for (let kw of keywords) {
              if (!isCollecting) return; // 如果中途取消采集
              
              if (kw.trim() && kw !== text && kw !== q) {
                csvContent += "3," + kw + "\n";
                collectKeywordList.push([3, kw]);
                collectorUI.addKeyword(3, kw);
                
                // 获取4级关键词
                if (collectLevel >= 3) {
                  try {
                    let keywords2 = await getSearchKeywords(kw);
                    for (let kw2 of keywords2) {
                      if (!isCollecting) return; // 如果中途取消采集
                      
                      if (kw2.trim() && kw2 !== kw && kw2 !== text && kw2 !== q) {
                        csvContent += "4," + kw2 + "\n";
                        collectKeywordList.push([4, kw2]);
                        collectorUI.addKeyword(4, kw2);
                      }
                    }
                  } catch (err) {
                    console.error(`获取第4级关键词时出错: ${err.message}`);
                  }
                }
              }
            }
          } catch (err) {
            console.error(`获取第3级关键词时出错: ${err.message}`);
          }
        }
      }
    }
  } catch (err) {
    console.error(`搜索关键词 "${q}" 时出错: ${err.message}`);
  } finally {
    // 继续处理下一个关键词
    kwIndex++;
    if (kwIndex >= keywordList.length) {
      // 采集完成
      finishCollection();
    } else {
      // 处理下一个关键词
      await searchByNextKeyword();
    }
  }
}

// 完成采集
function finishCollection() {
  isCollecting = false;
  collectorUI.updateTitle(`搜索推荐词结果 (共${collectKeywordList.length}个)`);
  collectorUI.setCollectingStatus(false);
  console.log("关键词采集完成！");
}

// 延时函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 获取搜索关键词的推荐词
async function getSearchKeywords(q) {
  let searchInput = getNeetElement("search");
  if (!searchInput) return [];
  
  inputDispatchEvent(searchInput, q);
  await sleep(3000);
  
  let recommendElements = getNeetElement("recommend");
  let keywords = [];
  
  if (recommendElements && recommendElements.length > 0) {
    for (let element of recommendElements) {
      let html = element.innerHTML;
      let text = html.replace(/<[^>]*>/g, "").trim();
      if (text) {
        keywords.push(text);
      }
    }
  }
  
  return keywords;
}

// 开始采集过程
async function startCollection(keywords, level) {
  if (isCollecting) {
    console.log('已有采集任务正在进行中');
    return false;
  }
  
  // 重置采集状态
  kwIndex = 0;
  csvContent = "层级,关键词\n"; // 添加CSV表头
  keywordList = [];
  collectKeywordList = [];
  collectLevel = level || 1;
  
  // 处理关键词
  let lines = keywords.split('\n').filter(item => item.trim() !== '');
  
  // 处理包含{c}通配符的关键词
  lines.forEach(item => {
    if (item.includes("{c}")) {
      // 添加原始关键词
      keywordList.push(item.replace("{c}", ""));
      
      // 替换{c}为a-z的26个字母
      for (let i = 97; i <= 122; i++) {
        let character = String.fromCharCode(i);
        keywordList.push(item.replace("{c}", character));
      }
    } else {
      keywordList.push(item);
    }
  });
  
  if (keywordList.length === 0) {
    console.log('没有可采集的关键词');
    return false;
  }
  
  // 准备开始采集
  collectorUI.clearResults();
  collectorUI.updateTitle(`搜索推荐词采集中...`);
  collectorUI.setCollectingStatus(true);
  isCollecting = true;
  
  // 启动采集过程
  await searchByNextKeyword();
  return true;
}

// 采集下一个关键词
async function searchByNextKeyword() {
  if (kwIndex < keywordList.length && isCollecting) {
    let keyword = keywordList[kwIndex];
    await search(keyword);
  }
}

// 下载结果
function downloadResults(format) {
  if (collectKeywordList.length === 0) {
    alert("没有可下载的内容！");
    return;
  }
  
  const currentSite = getCurrentSiteName();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  
  if (format === 'md') {
    let markdown = convertToMindmap(collectKeywordList);
    downloadFile(markdown, `${currentSite}_思维导图_${timestamp}.md`, "text/markdown");
  } else {
    downloadFile("\ufeff" + csvContent, `${currentSite}_关键词_${timestamp}.csv`, "text/csv;charset=utf-8");
  }
}

// 获取当前网站名称
function getCurrentSiteName() {
  if (currentDomain.includes("douyin")) return "抖音";
  if (currentDomain.includes("xiaohongshu")) return "小红书";
  if (currentDomain.includes("bilibili")) return "B站";
  if (currentDomain.includes("zhihu")) return "知乎";
  if (currentDomain.includes("baidu")) return "百度";
  if (currentDomain.includes("google")) return "Google";
  return "搜索推荐词";
}

// 下载文件
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type: type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 将采集的数据转换为思维导图格式的Markdown
function convertToMindmap(data) {
  let markdown = '# 搜索推荐词采集\n';
  
  data.forEach(item => {
    let level = item[0] + 1; // 增加一级作为Markdown标题层级
    let prefix = '#'.repeat(Math.min(level, 6)); // Markdown最多支持6级标题
    
    markdown += `${prefix} ${item[1]}\n`;
  });
  
  return markdown;
}

// 输入关键词并触发相关事件
function inputDispatchEvent(input, value) {
  if (!input) return;
  
  // 聚焦事件
  let focusEvent = new Event('focus', {
    bubbles: true,
    cancelable: true
  });
  
  // 输入事件
  let inputEvent = new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: value
  });
  
  // 变化事件
  let changeEvent = new Event('change', {
    bubbles: true,
    cancelable: true
  });
  
  // 键盘事件
  let keyUpEvent = new KeyboardEvent('keyup', {
    key: '',
    bubbles: true,
    cancelable: true
  });
  
  // 设置值并触发事件
  input.value = value;
  input.focus();
  input.dispatchEvent(focusEvent);
  input.dispatchEvent(inputEvent);
  input.dispatchEvent(changeEvent);
  input.dispatchEvent(keyUpEvent);
  
  console.log(`已输入关键词: ${value}`);
}