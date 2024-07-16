var downloading = false;
let activeTab = null;
let tabsMapping = {};

/**
 * 创建Tab视图
 * @param {*} tabs
 */
function createTabsView() {
    const tabs = Object.values(tabsMapping);

    const template = document.getElementById("template");

    document.querySelector(".tabs").innerHTML = "";

    tabs.forEach((tabInfo) => {
        const tabEl = template.content.querySelector(".tab").cloneNode(true);
        tabEl.querySelector(".icon").src = tabInfo.icon;
        tabEl.querySelector(".name").innerText = tabInfo.name;

        tabInfo.id == activeTab ? tabEl.classList.add("active") : tabEl.classList.remove("active");

        tabEl.addEventListener("click", () => {
            activeTab = tabInfo.id;
            createTabsView(Object.values(tabsMapping));
        });

        document.querySelector(".tabs").appendChild(tabEl);
    });

    createRequestListView();
}

/**
 * 创建请求列表视图
 * @param {*} requests
 */
function createRequestListView() {
    const requests = (tabsMapping[activeTab] || {}).requests || [];

    const template = document.getElementById("template");

    document.querySelector(".content").innerHTML = "";
    if (!requests.length) return;

    document.querySelector(".footer").innerHTML = "总共：" + requests.length + "个请求";

    requests.forEach((details) => {
        const dataItemEl = template.content.querySelector(".item").cloneNode(true);

        dataItemEl.querySelector(".name").innerText = details.name;

        dataItemEl.querySelector(".url").innerText = details.url;
        dataItemEl.querySelector(".url").title = details.url;

        dataItemEl.querySelector(".type").innerText = details.type;
        dataItemEl.querySelector(".method").innerText = details.method;

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
 * 初始化渲染
 */
chrome.storage.local.get("tabs_request").then((storage) => {
    tabsMapping = storage["tabs_request"] || {};

    const list = Object.values(tabsMapping);
    activeTab = (list[0] || {}).id;
    createTabsView();
});

/**
 * 监听更新下载列表事件
 */
chrome.runtime.onMessage.addListener((res) => {
    if (res.env == "refreshDownLoadList") {
        console.log('------refresh');
        
        tabsMapping = res.data;
        createTabsView();
    }
});

/**
 * 监听重新加载标签页按钮
 */
document.querySelector(".reload-tab").addEventListener("click", () => {
    chrome.tabs.reload(activeTab, { bypassCache: true }).then(() => {
        alert("已重新加载");
    });
});

/**
 * 监听下载全部按钮
 * @param  files
 */

document.querySelector(".download-all").addEventListener("click", () => {
    if (downloading) return;

    //筛选可下载请求
    const requests = (tabsMapping[activeTab] || {}).requests || [];
    const files = requests.filter((details) => details.type == "image" || details.type == "font");
    if (!files.length) return alert("无可下载资源！");

    //设置下载状态
    downloading = true;
    const downloadBtnEl = document.querySelector(".download-all span");
    downloadBtnEl.innerText = "开始下载中";

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
                            downloadBtnEl.innerText = "开始下载";
                            downloading = false;
                        });
                    }
                };
                reader.readAsArrayBuffer(file);
            });
    });
});

/**
 * 监听刷新按钮
 */
document.querySelector(".refresh").addEventListener("click", () => {
    if (!tabsMapping[activeTab]) return;
    createRequestListView(tabsMapping[activeTab].requests);
});

/**
 * 监听删除当前标签页数据按钮
 */
document.querySelector(".delelete").addEventListener("click", () => {
    delete tabsMapping[activeTab];
    chrome.storage.local.set({ tabs_request: tabsMapping });

    const list = Object.values(tabsMapping);
    activeTab = (list[0] || {}).id;
    createTabsView();
});

/**
 * 监听设置按钮
 */
document.querySelector(".setting").addEventListener("click", () => {
    openWindow("setting");
});
