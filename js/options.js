document.addEventListener('DOMContentLoaded', function() {
  // 加载保存的设置
  chrome.storage.local.get({
    // 默认设置值
    defaultLevel: '1',
    defaultFormat: 'csv',
    panelPosition: 'right',
    autoShowResults: 'yes'
  }, function(items) {
    // 设置单选框的状态
    document.querySelector('input[name="defaultLevel"][value="' + items.defaultLevel + '"]').checked = true;
    document.querySelector('input[name="defaultFormat"][value="' + items.defaultFormat + '"]').checked = true;
    document.querySelector('input[name="panelPosition"][value="' + items.panelPosition + '"]').checked = true;
    document.querySelector('input[name="autoShowResults"][value="' + items.autoShowResults + '"]').checked = true;
  });

  // 保存设置
  document.getElementById('saveSettings').addEventListener('click', function() {
    // 获取选择的值
    var defaultLevel = document.querySelector('input[name="defaultLevel"]:checked').value;
    var defaultFormat = document.querySelector('input[name="defaultFormat"]:checked').value;
    var panelPosition = document.querySelector('input[name="panelPosition"]:checked').value;
    var autoShowResults = document.querySelector('input[name="autoShowResults"]:checked').value;

    // 保存到 Chrome 存储
    chrome.storage.local.set({
      defaultLevel: defaultLevel,
      defaultFormat: defaultFormat,
      panelPosition: panelPosition,
      autoShowResults: autoShowResults
    }, function() {
      // 显示保存成功的消息
      var statusMessage = document.getElementById('statusMessage');
      statusMessage.textContent = '设置已保存！';
      statusMessage.className = 'status-message status-success';
      
      // 3秒后隐藏消息
      setTimeout(function() {
        statusMessage.className = 'status-message';
      }, 3000);
    });
  });
});