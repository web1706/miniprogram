# 可传递参数的小程序路由功能

小程序路由，可用于取代 `wx.navigateTo` `wx.redirectTo` `wx.navigateBack` 等函数。

## 特性

- 支持向新打开的页面传入数据
- 支持在关闭页面时回传数据
- 阻止频繁打开或关闭页面（页面切换完成之前无法再次切换页面）

## 安装

下载 `router.js` 文件放入项目中，从 `router.js` 引入即可。

## 使用

父页面：

```js
// parent-page.js

const router = require('./path-to-router/router.js')

Page({
  async openSubPage() {
    // 打开新页面，并传递数据
    const data = ...
    const res = await router.open('./path-to-subpage/subpage.js', data)
    // 回传的数据
    console.log(res)
  }
})
```

子页面：

```js
// subpage.js

const router = require('./path-to-router/router.js')

Page({
  onLoad(options) {
    // 接收从父页面传递过来的数据
    const data = router.data(this)
    console.log(data)
  },

  onSelected(e) {
    // 关闭子页面并回传数据
    router.close(e.detail)
  }
})
```

## API

### router.open(url[, data])

打开一个新页面，并可向新页面传递数据。

参数：

- `url` 新打开的页面url
- `data` 向新页面传递的数据

返回值：一个 `Promise` 对象。如果子页面调用 `router.close` 关闭，则变为 `fulfilled` 状态，内容为子页面回传的数据。如果子页面用其他方式关闭（比如点击左上角返回按钮），则变为 `rejected` 状态。

### router.replace(url[, data])

替换当前的页面，并可向新页面传递数据。

参数：

- `url` 新打开的页面url
- `data` 向新页面传递的数据

返回值：一个 `Promise` 对象。若页面跳转成功则变为 `fulfilled` 状态，跳转失败则变为 `rejected` 状态。

### router.close([data[, delta]])

关闭当前页面，并可回传数据到关闭后页面栈顶的页面。

参数：

- `data` 回传的数据
- `delta` 关闭的页面数

返回值：一个 `Promise` 对象。若页面关闭成功则变为 `fulfilled` 状态，关闭失败则变为 `rejected` 状态。

### router.data(page)

获取父页面通过 `router.open` 传递过来的数据。

参数：

- `page` 当前页面的实例

返回值：父页面传递过来的数据。

## FAQ

1. 能否在组件中使用？

当然可以。使用 `open` `replace` 打开新页面，使用 `close` 关闭当前页面。但不推荐在页面以外的地方使用 `replace` `close` 和 `data` 函数。但如果非要使用 `data` 函数，可以先用小程序自带的 `getCurrentPages` 函数获取页面实例，再用 `data` 获取传递给页面的数据。

2. 如果在 A 页面中用 `open` 函数打开了 B 页面，B 页面中用 `replace` 函数把自己替换成 C 页面，会发生什么？

这时候在 C 页面中用 `data` 函数接收的数据是从 B 页面通过 `replace` 函数传递过来的，如果 B 页面没有传递数据，则接收到的是 `undefined`， __不会__ 接收 A 页面传递的数据。

当 C 页面调用 `close` 关闭页面后，页面栈顶端是 A 页面，所以数据会回传给 A 页面，A 页面通过 `open` 函数的返回值接收。

3. “阻止频繁打开或关闭页面”是什么意思？

当页面正在跳转时，再次调用跳转函数时，会失败。比如点击页面上的某个元素时，会调用 `open` 函数打开一个子页面。如果快速点击这个元素两次，可能导致连续调用 `open` 函数两次。这时，第二次调用会失败。

需要注意的是，只有使用本模块导出的函数时，才有这个特性。如果混合使用小程序原生的路由函数，是无法防止重复调用的。

4. 可以和小程序原生路由函数混合使用吗？

大部分情况下可以，但要避免一种情况，就是在子页面中使用 `wx.redirectTo` 函数，否则可能导致接收的数据不正确。

5. 页面之间传递的数据存放在哪？会不会导致内存泄漏？

无论是传递给子页面的数据，还是子页面回传的数据，都是存放在父页面中（页面栈从栈顶数第二层）。当子页面关闭时，在父页面的 `onShow` 函数中立刻将数据销毁。所以一般情况下不会造成内存泄漏，即使使用的是小程序原生路由函数关闭页面。

如果页面栈中只有一个页面时，调用 `replace` 函数，则数据会存储在本模块的一个内部对象中。
