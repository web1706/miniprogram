/**
 * 在下一个微任务中执行函数，类似`vue`的`nextTick`
 *
 * @copyright web1706 2019
 * @author cxy930123 <mail@xingyu1993.cn>
 * @license MIT
 * @version 1.0.1
 * @see {@link https://github.com/web1706/miniprogram/blob/master/modules/next-tick/README.md}
 *
 * 此模块导出以下内容：
 *
 * - `nextTick(cb, ctx)` 在下一个微任务中执行函数
 * - `replaceSetData(setData)` 优化`setData`函数
 * - `behavior` 用于替换`setData`的`behavior`
 *
 * `setData`函数的优化方式是，多次调用该函数时，只在下一个微任务中统一更新一次界面
 *
 * @example
 * // 优化Page中的setData
 * const { replaceSetData } = require('next-tick')
 *
 * Page({
 *   onLoad() {
 *     this.setData = replaceSetData(this.setData)
 *   }
 * })
 *
 * @example
 * // 优化Component中的setData
 * const { behavior } = require('next-tick')
 *
 * Component({
 *   behaviors: [behavior]
 * })
**/

const callbacks = []

let pending = false

function flushCallbacks() {
  pending = false
  const copies = callbacks.slice()
  callbacks.length = 0
  for (const cb of copies) {
    cb()
  }
}

/**
 * 在下一个微任务中执行函数
 * @param {function} cb 待执行的函数
 * @param {any} ctx 绑定到函数的`this`对象
 * @returns {void}
 */
function nextTick(cb, ctx) {
  callbacks.push(() => cb.call(ctx))
  if (!pending) {
    pending = true
    Promise.resolve().then(flushCallbacks)
  }
}

let pendingData = {}
let keyMap = {}

/**
 * 解析路径到数组
 * @param {string} path 完整路径
 * @returns {string[]} 解析后的路径数组
 * @example
 * parse('a[0].b.c[2]')
 * // => ['a', 0, 'b', 'c', 2]
 */
function parse(path) {
  if (!/^[^\[\]\.]+(\[\d+\]|\.[^\[\]\.]+)*$/.test(path)) {
    throw new Error(`Invalid path string in setData: ${path}`)
  }
  return Array.from(path.match(/[^\[\]\.]+|\[\d+\]/g)).map(item =>
    item.startsWith('[') ? Number(item.slice(1, -1)) : item
  )
}

/**
 * 清理对象中以特定路径开头的属性
 * @param {object} data 要清理的对象
 * @param {string} prefix 要清理的路径
 * @returns {void}
 */
function clean(data, prefix) {
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      if (key.startsWith(prefix)) {
        if (key.startsWith(prefix + '.')) {
          delete data[key]
        }
        if (key.startsWith(prefix + '[')) {
          delete data[key]
        }
      }
    }
  }
}

/**
 * 设置对象深层路径的值
 * @param {object} data 最外层对象
 * @param {string} path 写入的路径
 * @param {any} value 写入的值
 * @returns {void}
 */
function batch(data, path, value) {
  const keys = parse(path)
  let keyData = data
  // 设置data对象中对应路径的值
  for (const [i, key] of keys.entries()) {
    switch (typeof keys[i + 1]) {
      case 'undefined':
        keyData[key] = value
        break
      case 'string':
        if (!keyData[key] || typeof keyData[key] !== 'object') {
          keyData[key] = {}
        }
        break
      case 'number':
        if (!Array.isArray(keyData[key])) {
          keyData[key] = []
        }
        break
    }
    keyData = keyData[key]
  }
  // 更新pendingData和keyMap的值
  let currentPath = ''
  let mapData = keyMap
  keyData = data
  for (const [i, key] of keys.entries()) {
    if (i === 0) {
      currentPath = key
    } else if (typeof key === 'string') {
      currentPath += `.${key}`
    } else if (typeof key === 'number') {
      currentPath += `[${key}]`
    }
    switch (typeof keys[i + 1]) {
      case 'undefined':
        if (typeof mapData[key] === 'object') {
          clean(pendingData, currentPath)
        }
        mapData[key] = true
        pendingData[path] = value
        break
      case 'string':
        if (Array.isArray(mapData[key])) {
          clean(pendingData, currentPath)
          mapData[key] = true
          pendingData[currentPath] = keyData[key]
          return
        }
        if (mapData[key] === true) {
          pendingData[currentPath] = keyData[key]
          return
        }
        if (typeof mapData[key] === 'undefined') {
          mapData[key] = {}
        }
        break
      case 'number':
        if (typeof mapData[key] === 'object' && !Array.isArray(mapData[key])) {
          clean(pendingData, currentPath)
          mapData[key] = true
          pendingData[currentPath] = keyData[key]
          return
        }
        if (mapData[key] === true) {
          pendingData[currentPath] = keyData[key]
          return
        }
        if (typeof mapData[key] === 'undefined') {
          mapData[key] = []
        }
        break
    }
    mapData = mapData[key]
    keyData = keyData[key]
  }
}

/**
 * 优化`setData`函数
 * @param {function} setData 原始`setData`函数
 * @returns {function} 优化后的`setData`函数
 */
function replaceSetData(setData) {
  const callbacks = []
  let needUpdate = false
  const update = function update() {
    needUpdate = false
    const cbs = callbacks.slice()
    callbacks.length = 0
    setData.call(this, pendingData, function() {
      cbs.forEach(cb => cb.apply(this, arguments))
    })
    pendingData = {}
    keyMap = {}
  }
  return function(data, callback) {
    for (const path in data) {
      if (data.hasOwnProperty(path)) {
        batch(this.data, path, data[path])
      }
    }
    if (typeof callback === 'function') {
      callbacks.push(callback)
    }
    if (!needUpdate) {
      needUpdate = true
      nextTick(update, this)
    }
  }
}

/**
 * 用于替换`setData`的`behavior`
 */
const behavior = Behavior({
  created() {
    this.setData = replaceSetData(this.setData)
  }
})

module.exports = {
  nextTick,
  replaceSetData,
  behavior
}
