var allDownloading = false;
let activeTab = null;

/**
 * 刷新文件列表
 */
function onRefresh(tabs) {
    createView(tabs);
    watchDownloadAllBtn(tabs);

    watchSettingBtn();
}

/**
 * 创建Tab视图
 * @param {*} tabs
 */
function createTabsView(tabs) {
    const template = document.getElementById("item_template");

    document.querySelector(".tabs").innerHTML = "";
    const list = Object.values(tabs);

    list.forEach((tabInfo) => {
        const tabEl = template.content.querySelector(".tab").cloneNode(true);
        tabEl.querySelector("icon").src = tabInfo.icon;
        tabEl.querySelector(".name").innerText = tabInfo.name;

        tabEl.addEventListener("click", () => {
            activeTab = tabInfo.id;
            createTabsView(tabs);
        });

        document.querySelector(".tabs").appendChild(tabEl);
    });
    createRequestListView((tabs[activeTab] || tabs[(list[0] || {}).id] || {}).requests || []);
}

/**
 * 创建请求列表视图
 * @param {*} requests
 */
function createRequestListView(requests) {
    const template = document.getElementById("item_template");

    document.querySelector(".content").innerHTML = "";
    if (!requests.length) return;

    requests.forEach((details) => {
        const dataItemEl = template.content.querySelector(".item").cloneNode(true);

        dataItemEl.querySelector(".name").innerText = details.name;

        dataItemEl.querySelector(".url").innerText = details.url;
        dataItemEl.querySelector(".url").title = details.url;

        dataItemEl.querySelector(".type").title = details.type;
        dataItemEl.querySelector(".type").method = details.method;

        dataItemEl.querySelector(".icon").src =
            details.type == "image" ? details.url : "/images/logo.png";
        dataItemEl.querySelector(".icon").addEventListener("error", () => {
            dataItemEl.querySelector(".icon").src = "/images/logo.png";
        });

        //操作按钮权限
        dataItemEl.querySelectorAll(".opration .btn").forEach((node) => {
            if (
                node.classList.contains("download") &&
                (details.type == "image" || details.type == "font")
            ) {
                node.style.display = "block";
                dataItemEl.querySelector(".download").addEventListener("click", () => {
                    chrome.downloads.download(
                        {
                            url: details.url,
                        },
                        () => {}
                    );
                });
            } else if (
                node.classList.contains("fetch") &&
                details.type != "image" &&
                details.type != "font" &&
                details.method == "GET"
            ) {
                node.style.display = "block";
                dataItemEl.querySelector(".fetch").addEventListener("click", () => {
                    chrome.tabs.create({
                        url,
                    });
                });
            }
        });
        document.querySelector(".content").appendChild(dataItemEl);
    });
}

/**
 * 监听刷新
 */
function watchRefreshBtn() {
    document.querySelector(".refresh").addEventListener("click", () => {
        //获取需要下载tab页
        chrome.storage.local.get("download_page_tab").then((storage) => {
            onRefresh(storage["download_page_tab"] || 0);
        });
    });
}

/**
 * 监听下载全部按钮
 * @param  files
 */
function watchDownloadAllBtn(requests) {
    document.querySelector(".download-all").addEventListener("click", () => {
        if (allDownloading) return;
        allDownloading = true;

        //筛选可下载请求
        const files = requests.filter(
            (details) => details.type == "image" || details.type == "font"
        );
        if (!files.length) return alert("无可下载资源！");

        document.querySelector(".download-all").innerText = "开始下载中";

        const zip = new JSZip(),
            folderName = "FileHunter_" + Date.now(),
            zipFileName = folderName + ".zip",
            zipFolder = zip.folder(folderName);

        files.forEach((details, index, array) => {
            //获取文件
            fetch(new Request(details.url))
                .then((response) => response.blob())
                .then((file) => {
                    //加载文件
                    var reader = new FileReader();
                    reader.onloadend = function (e) {
                        //将文件添加进压缩包
                        zipFolder.file(details.name, e.target.result);

                        //判断是否是最后一个文件，如果是，则下载压缩包
                        if (index == array.length - 1) {
                            zip.generateAsync({ type: "blob" }).then(function (blob) {
                                chrome.downloads.download(
                                    {
                                        filename: zipFileName,
                                        url: URL.createObjectURL(blob),
                                    },
                                    () => {}
                                );
                                document.querySelector(".download-all").innerText = "开始下载";
                                allDownloading = false;
                            });
                        }
                    };
                    reader.readAsArrayBuffer(file);
                });
        });
    });
}

/**
 * 监听设置按钮
 * @param  files
 */
function watchSettingBtn() {
    document.querySelector(".setting").addEventListener("click", () => {
        openWindow("setting");
    });
}

/**
 * 监听更新下载列表事件
 */
chrome.runtime.onMessage.addListener((res) => {
    if (res.env == "refreshDownLoadList") {
        onRefresh(res.data);
    }
});

chrome.storage.local.get("tabs_request").then((storage) => {
    onRefresh(storage);
});
