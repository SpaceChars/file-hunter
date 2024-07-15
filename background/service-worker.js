/**
 * 请求回调
 * @param {*} details
 */
function requestCallback(details) {
    const key = "TAB_" + details.tabId;

    chrome.storage.local.get([key]).then((result) => {
        let array = result[key] || [];

        if (!array.filter((el) => el.url == details.url).length) {
            let fileName = "",
                pathArray = new URL(details.url).pathname.split("/");
            while (!fileName) {
                fileName = pathArray.pop();
            }
            details.name = fileName;

            array.push(details);
        }
        result[key] = array;
        //更新列表值，刷新下载列表
        chrome.storage.local.set(result).then(() => {
            chrome.runtime.sendMessage({ env: "updateDonwloadList", data: details.tabId });
        });
    });
}

/**
 * 监听页面请求
 */
function onWatchRequest(types) {
    chrome.webRequest.onBeforeRequest.removeListener(requestCallback);

    chrome.webRequest.onBeforeRequest.addListener(
        requestCallback,
        { urls: ["<all_urls>"], types },
        []
    );
}

/**
 * 监听更新过滤请求事件
 */
chrome.runtime.onMessage.addListener((request) => {
    if (request.env == "updateRequestType") {
        onWatchRequest(request.array);
    }
});

//获取当前过滤类型，并发起监听
chrome.storage.local.get("FileHunter_Filter").then((storage) => {
    onWatchRequest(storage["FileHunter_Filter"] || []);
});

//监听激活得tab Id
chrome.tabs.onActivated.addListener((info) => {
    chrome.storage.local.set({ active_tab: info.tabId });
});
