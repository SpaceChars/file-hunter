/**
 * 下载当前页标签页
 */
document.querySelector(".item:nth-child(1)").addEventListener("click", () => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, async ([tab]) => {
        //获取下载列表页面
        const windowId = await getWindow("download");

        //设置当前下载得tab页
        chrome.storage.local.set({ download_page_tab: tab.id }).then(() => {
            openWindow("download").then(() => {
                if (windowId) {
                    chrome.runtime.sendMessage({ env: "updateDonwloadList", data: tab.id });
                }
            });
        });
    });
});

/**
 * 清除缓存
 */
document.querySelector(".item:nth-child(2)").addEventListener("click", () => {
    chrome.storage.local.get().then((storage) => {
        chrome.storage.local.remove(Object.keys(storage));
    });
});

/**
 * 设置
 */
document.querySelector(".item:nth-child(3)").addEventListener("click", () => {
    openWindow("setting");
});
