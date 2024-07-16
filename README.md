# file-hunter

The File Hunter extension is a great browser extension that retrieves resources by intercepting Web requests

## Pull Code

```shell
git clone https://github.com/SpaceChars/file-hunter.git
```

## Build Project

1. Please read the Chrome Extension development documentation,👉[Chrome Extension development documentation ](https://developer.chrome.com/docs/extensions/how-to/distribute/host-on-linux?hl=zh-cn)

2. Copy the built (.crx,.pem) file to the Linux server directory

3. Change the `'codebase'` property value and `'version'` property value in the `'build/updates.xml'`,The `'codebase'` property value points to the address of the crx file on the server

4. Change the `'update_url'` property value in the `manifest.json` file,The value of the `'update_url'` property points to the address of the `'build/updates.xml'` file on the server
