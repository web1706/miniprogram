# regeneratorRuntime

## 简介

当在小程序里使用了Generator函数或async函数，并且启用ES6转ES5功能时，转换成的代码会查找一个名为 `regeneratorRuntime` 的变量。

此文件来自[facebook](https://github.com/facebook/regenerator/blob/master/packages/regenerator-runtime/runtime.js)，是 `regeneratorRuntime` 对象的一个实现。

## 安装

直接下载本目录下的 `runtime.js` 文件即可。

## 使用

只需要在使用异步函数的文件开头引入此文件，并将导出的值赋给 `regeneratorRuntime` 变量即可。

```js
const regeneratorRuntime = require('runtime.js')
```

也可以在通过全局变量引入：

```js
// app.js
global.regeneratorRuntime = require('runtime.js')

// other.js
const { regeneratorRuntime } = global
```
