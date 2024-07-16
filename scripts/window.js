const routers = [
    {
        name: "setting",
        url: "/views/setting/setting.html",
        width: 700,
        height: 500,
        type: "popup",
    },
    {
        name: "download",
        type: "popup",
        state: "maximized",
        url: "/views/download/download.html",
    },
];

function getPageStorageKey(name) {
    return name + "_page";
}

/**
 * 创建窗体
 * @param {*} name
 */
function createWindow(name) {
    const info = JSON.parse(JSON.stringify(routers.find((el) => el.name == name) || {}));
    delete info.name;

    return chrome.windows.create(info, (window) => {
        let store = {};
        store[getPageStorageKey(name)] = window.id;
        chrome.storage.local.set(store);
    });
}

/**
 * 打开窗体
 * @param {*} name
 * @returns
 */
function openWindow(name) {
    const storageKey = getPageStorageKey(name);

    return chrome.storage.local.get(storageKey).then((storage) => {
        const windowId = storage[storageKey] || "";

        if (windowId) {
            chrome.windows.get(windowId, {}, (window) => {
                if (window) {
                    chrome.windows.update(windowId, { focused: true });
                } else {
                    createWindow(name);
                }
            });
        } else {
            createWindow(name);
        }
    });
}

/**
 * 获取窗体
 * @param {*} name
 * @returns
 */
function getWindow(name) {
    const storageKey = getPageStorageKey(name);
    return chrome.storage.local.get(storageKey).then((storage) => {
        return storage[storageKey] || "";
    });
}

/**
 * 删除窗口
 * @param {*} name
 * @returns
 */
function removeWindow(name) {
    const storageKey = getPageStorageKey(name);
    return chrome.storage.local.remove(storageKey);
}
