//过滤类型 storage key
const filterStorageKey = "FileHunter_Filter";

/**
 * 初始化过滤类型
 */
function onInitFilterTypes() {
    chrome.storage.local.get(filterStorageKey).then((storage) => {
        let array = storage[filterStorageKey] || [];
        document.querySelectorAll(".setting-item .type-item input").forEach((el) => {
            el.checked = array.indexOf(el.name.split(",")[0]) >= 0;
        });
    });
    onWatchFilterTypes();
}

/**
 * 监听过滤类型
 */
function onWatchFilterTypes() {
    document.querySelectorAll(".setting-item .type-item input").forEach((el) => {
        el.addEventListener("change", (e) => {
            chrome.storage.local.get(filterStorageKey).then((storage) => {
                const filterTypes = e.target.name.split(",");
                let array = storage[filterStorageKey] || [];

                if (e.target.checked) {
                    array = array.concat(filterTypes);
                } else {
                    array = array.filter((type) => filterTypes.indexOf(type) < 0);
                }
                storage[filterStorageKey] = array;
                chrome.storage.local.set(storage);
                
                onWatchRequest(array);
            });
        });
    });
}

onInitFilterTypes();
