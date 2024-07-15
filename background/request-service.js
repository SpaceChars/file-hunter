const temp_requests = [];
let timer = null;

/**
 * 请求回调
 * @param {*} details
 */
function requestCallback(info) {
    if (timer) {
        clearTimeout(timer);
        temp_requests.push(info);
    }

    timer = setTimeout(() => {
        if (!temp_requests.length) return;
        //拷贝数据
        const temp_requests_clone = JSON.parse(JSON.stringify(temp_requests));

        //处理数据
        chrome.storage.local.get(["tabs_request"]).then((storage) => {
            let storageTabs = storage["tabs_request"] || {};

            Promise.all(
                temp_requests_clone.map((el) =>
                    chrome.tabs.get(el.tabId).then((tab) => {
                        return {
                            name: tab.title,
                            icon: tab.favIconUrl,
                            id: tab.id,
                            requests: [],
                        };
                    })
                )
            )
                .then((tabs, index) => {
                    const details = temp_requests_clone[index];

                    let tabInfo =
                        storageTabs[details.tabId] || tabs.find((el) => el.id == details.tabId);

                    if (!tabInfo.requests.find((el) => el.url == details.url)) {
                        let fileName = "",
                            pathArray = new URL(details.url).pathname.split("/");
                        while (!fileName) {
                            fileName = pathArray.pop();
                        }
                        details.name = fileName;

                        tabInfo.requests.push(details);
                    }

                    storageTabs[details.tabId] = tabInfo;
                })
                .finally(() => {
                    storage["tabs_request"] = storageTabs;
                    chrome.storage.local.set(storage).then(() => {
                        chrome.runtime.sendMessage({
                            env: "refreshDownLoadList",
                            data: storageTabs,
                        });
                    });
                });
        });
    }, 2000);
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
    if (request.env == "reobserveWatch") {
        onWatchRequest(request.array);
    }
});

//获取当前过滤类型，并发起监听
chrome.storage.local.get("FileHunter_Filter").then((storage) => {
    onWatchRequest(storage["FileHunter_Filter"] || []);
});
