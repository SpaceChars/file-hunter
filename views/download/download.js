var allDownloading = false;

/**
 * 刷新文件列表
 */
function onRefresh(tabId) {
    const tabStorageKey = "TAB_" + tabId;
    chrome.storage.local.get(tabStorageKey).then((storage) => {
        const requests = storage[tabStorageKey] || [];

        document.querySelector(".footer").innerText = "总计：" + requests.length + "个文件";

        createFileList(requests);
        watchDownloadAllBtn(requests);
    });
    watchSettingBtn();
}

/**
 * 渲染文件列表
 * @param {*} files
 */
function createFileList(requests) {
    const template = document.getElementById("item_template");

    document.querySelector(".content").innerHTML = "";

    requests.forEach((details) => {
        const itemEl = template.content.firstElementChild.cloneNode(true);

        //基础信息
        itemEl.querySelector(".name").innerText = details.name;
        itemEl.querySelector(".url").innerText = details.url;
        itemEl.querySelector(".url").title = details.url;
        itemEl.querySelector(".type").innerText = details.type;
        itemEl.querySelector(".method").innerText = details.method;

        itemEl.querySelector(".icon").src = details.type == "image" ? details.url : "/logo.png";
        itemEl.querySelector(".icon").addEventListener("error", () => {
            itemEl.querySelector(".icon").src = "/logo.png";
        });

        //操作按钮权限
        itemEl.querySelectorAll(".opration .btn").forEach((node) => {
            if (
                node.classList.contains("download") &&
                (details.type == "image" || details.type == "font")
            ) {
                node.style.display = "block";
                watchDownloadBtn(itemEl.querySelector(".download"), details.url);
            } else if (
                node.classList.contains("fetch") &&
                details.type != "image" &&
                details.type != "font" &&
                details.method == "GET"
            ) {
                node.style.display = "block";
                watchFetchBtn(itemEl.querySelector(".fetch"), details.url);
            }
        });

        document.querySelector(".content").appendChild(itemEl);
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

//监听访问事件
function watchFetchBtn(el, url) {
    el.addEventListener("click", () => {
        chrome.windows.create({
            url,
        });
    });
}

//监听下载事件
function watchDownloadBtn(el, url) {
    el.addEventListener("click", () => {
        chrome.downloads.download(
            {
                url,
            },
            () => {}
        );
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
chrome.runtime.onMessage.addListener((request) => {
    if (request.env == "updateDonwloadList") {
        onRefresh(request.data);
    }
});

//获取需要下载tab页
chrome.storage.local.get("download_page_tab").then((storage) => {
    onRefresh(storage["download_page_tab"] || 0);
});
