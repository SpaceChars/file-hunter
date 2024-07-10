/**
 * 请求回调
 * @param {*} details
 */
function requestCallback(details) {
    const key = "TAB_" + details.tabId;

    chrome.storage.local.get([key]).then((result) => {
        let array = result[key] || [];

        if (array.indexOf(details.url) < 0) {
            array.push(details.url);
        }
        result[key] = array;
        chrome.storage.local.set(result);
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

//获取当前过滤类型，并发起监听
chrome.storage.local.get("FileHunter_Filter").then((storage) => {
    onWatchRequest(storage["FileHunter_Filter"] || []);
});
