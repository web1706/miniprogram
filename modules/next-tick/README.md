# 小程序`nextTick`

在下一个微任务中执行函数，类似`vue`的`nextTick`。并利用`nextTick`优化`setData`函数，在一个任务中多次执行`setData`时，只在下一个微任务中更新一次界面。

## 使用示例

```js
// 优化Page中的setData
const { replaceSetData } = require('next-tick')

Page({
  onLoad() {
    this.setData = replaceSetData(this.setData)
  }
})

// 优化Component中的setData
const { behavior } = require('next-tick')

Component({
  behaviors: [behavior]
})
```

## 此模块导出以下内容：

- `nextTick(cb, ctx)` 在下一个微任务中执行函数
- `replaceSetData(setData)` 优化`setData`函数
- `behavior` 用于替换`setData`的`behavior`
