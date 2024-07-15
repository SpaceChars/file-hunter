//监听激活得tab Id
chrome.tabs.onActivated.addListener((info) => {
  chrome.storage.local.set({ active_tab: info.tabId });
});