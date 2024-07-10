/**
 * 下载当前页标签页
 */
document.querySelector(".item:nth-child(1)").addEventListener("click", () => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, async ([tab]) => {
        chrome.windows.create({
            type: "popup",
            width: 700,
            height: 500,
            url: "/views/download/download.html?tabId=" + tab.id,
        });
    });
});

/**
 * 重新加载当前页
 */
document.querySelector(".item:nth-child(2)").addEventListener("click", () => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, async ([tab]) => {
        chrome.tabs.reload(tab.id), { bypassCache: true };
    });
});

/**
 * 设置
 */
document.querySelector(".item:nth-child(3)").addEventListener("click", () => {
    chrome.windows.create({
        type: "popup",
        width: 700,
        height: 500,
        url: "/views/setting/setting.html",
    });
});
