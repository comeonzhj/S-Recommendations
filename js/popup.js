document.addEventListener('DOMContentLoaded', function() {
  var submitButton = document.getElementById('submit');
  var keywordsTextarea = document.getElementById('keywords');
  var statusDiv = document.getElementById('status');
  var levelRadios = document.querySelectorAll('input[name="level"]');
  
  // 加载上次使用的关键词
  chrome.storage.local.get('keywords', function(data) {
    if (data.keywords) {
      keywordsTextarea.value = data.keywords;
    }
  });
  
  // 加载默认采集层级
  chrome.storage.local.get('defaultLevel', function(data) {
    if (data.defaultLevel) {
      var levelRadio = document.querySelector('input[name="level"][value="' + data.defaultLevel + '"]');
      if (levelRadio) levelRadio.checked = true;
    }
  });
  
  // 弹窗相关元素
  var popup = document.getElementById('popup');
  var closeButton = document.getElementById('closePopupBtn');
  var errorText = document.getElementById('message');
  
  // 显示弹窗
  function showPopup(message) {
    errorText.textContent = message;
    popup.style.display = 'block';
  }
  
  // 关闭弹窗
  function closePopup() {
    popup.style.display = 'none';
  }
  
  // 设置关闭按钮点击事件
  closeButton.addEventListener('click', closePopup);
  
  // 提交按钮点击事件
  submitButton.addEventListener('click', function() {
    var keywords = keywordsTextarea.value.trim();
    
    // 检查关键词是否为空
    if (!keywords) {
      showPopup('请输入关键词！');
      return;
    }
    
    // 禁用按钮，显示加载状态
    submitButton.disabled = true;
    setStatus('正在收集推荐词...', 'loading');
    
    // 获取选择的采集层级
    var level = document.querySelector('input[name="level"]:checked').value;
    
    // 保存关键词到本地存储
    chrome.storage.local.set({ 'keywords': keywords }, function() {
      // 发送消息到内容脚本
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (!tabs[0]) {
          showPopup('无法获取当前标签页，请重试！');
          submitButton.disabled = false;
          clearStatus();
          return;
        }
        
        chrome.tabs.sendMessage(
          tabs[0].id, 
          { 
            type: 'collect_search_keywords', 
            keywords: keywords,
            collectLevel: parseInt(level)
          },
          function(response) {
            if (chrome.runtime.lastError) {
              console.error("发送消息错误:", chrome.runtime.lastError);
              showPopup('无法连接到当前页面，请确保您在支持的网站上：小红书、抖音、B站、百度或Google');
              submitButton.disabled = false;
              clearStatus();
            } else if (response && response.status === 'started') {
              setStatus('收集已开始，请查看页面侧边', 'success');
              setTimeout(function() {
                submitButton.disabled = false;
                clearStatus();
              }, 3000);
            } else if (response && response.status === 'error') {
              showPopup(response.message || '启动采集任务失败');
              submitButton.disabled = false;
              clearStatus();
            }
          }
        );
      });
    });
  });
  
  // 设置状态消息
  function setStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status-message ' + (type || '');
  }
  
  // 清除状态消息
  function clearStatus() {
    statusDiv.textContent = '';
    statusDiv.className = 'status-message';
  }
});