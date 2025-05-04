// 扩展安装或更新时
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    // 初次安装时设置默认配置
    chrome.storage.local.set({
      defaultLevel: '1',
      defaultFormat: 'csv',
      panelPosition: 'right',
      autoShowResults: 'yes'
    }, function() {
      console.log('已设置默认配置');
    });
    
    // 安装后打开选项页面
    chrome.runtime.openOptionsPage();
  }
});