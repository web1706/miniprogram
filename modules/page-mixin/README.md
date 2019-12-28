# 小程序`mixin`

为`Page`添加`mixin`方法，并为定义段添加`mixins`属性，字段的覆盖和组合规则同`behaviors`

## 示例1 局部引入

```js
// app.js
const { Page } = require('page-mixin')
Page.mixin({})

// page.js
const { Page } = require('page-mixin')
Page({})
```

## 示例2 全局引入

```js
// app.js
Page = require('page-mixin').Page
Page.mixin({})
```

## 示例3 页面添加`mixin`
```js
// page.js
Page({
  mixins: [mixin1, mixin2]
})
```