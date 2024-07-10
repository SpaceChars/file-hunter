/**
 * 渲染文件列表
 * @param {*} files
 */
function createFileList(files) {
    const template = document.getElementById("item_template");

    document.querySelector(".content").innerHTML = "";

    files.forEach((url) => {
        const fileName = new URL(url).pathname.split("/").pop();

        const itemEl = template.content.firstElementChild.cloneNode(true);
        itemEl.querySelector(".name").innerText = fileName;

        itemEl.querySelector(".url").innerText = url;
        itemEl.querySelector(".icon").src = url;

        document.querySelector(".content").appendChild(itemEl);

        watchDownloadBtn(itemEl.querySelector(".download"), url);
    });
}

/**
 * 刷新文件列表
 */
function onRefresh() {
    const tabStorageKey = "TAB_" + tabId;
    chrome.storage.local.get(tabStorageKey).then((storage) => {
        const files = storage[tabStorageKey] || [];

        document.querySelector(".footer").innerText = "总计：" + files.length + "个文件";

        createFileList(files);
        watchDownloadAllBtn(files);
    });
}

/**
 * 监听刷新
 */
function watchRefreshBtn() {
    document.querySelector(".refresh").addEventListener("click", () => {
        onRefresh();
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
function watchDownloadAllBtn(files) {
    document.querySelector(".download-all").addEventListener("click", () => {
        if (allDownloading) return;
        allDownloading = true;

        document.querySelector(".download-all").innerText = "开始下载中";

        const zip = new JSZip(),
            folderName = "FileHunter_" + Date.now(),
            zipFileName = folderName + ".zip",
            zipFolder = zip.folder(folderName);

        files.forEach((url, index, array) => {
            //获取文件
            fetch(new Request(url))
                .then((response) => response.blob())
                .then((file) => {
                    //加载文件
                    var reader = new FileReader();
                    reader.onloadend = function (e) {
                        //将文件添加进压缩包
                        zipFolder.file(new URL(url).pathname.split("/").pop(), e.target.result);

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

const tabId = new URL(window.location.href).searchParams.get("tabId");
var allDownloading = false;

onRefresh();
