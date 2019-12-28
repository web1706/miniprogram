# 为`Component`添加全局注入`behavior`的方法

## 示例1 局部引入

```js
// app.js
const { Component } = require('global-behavior')
Component.behavior(Behavior({}))

// page.js
const { Component } = require('global-behavior')
Component({})
```

## 示例2 全局引入

```js
// app.js
Component = require('global-behavior').Component
Component.behavior(Behavior({}))
```