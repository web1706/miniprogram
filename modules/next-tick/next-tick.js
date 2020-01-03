/**
 * 在下一个微任务中执行函数，类似`vue`的`nextTick`
 *
 * @copyright web1706 2019
 * @author cxy930123 <mail@xingyu1993.cn>
 * @license MIT
 * @version 1.0.0
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
 * 读取或设置对象深层路径的值
 * @param {object} data 最外层对象
 * @param {string} path 路径
 * @param {any} [value] 写入的值（不传为读取值）
 * @returns {any} 读取到的值
 */
function value(data, path, value) {
  const isRead = typeof value === 'undefined'
  const keys = parse(path)
  if (isRead) {
    return keys
      .reduce((o, key) => {
        try {
          return o[key]
        } catch (err) {
          return void 0
        }
      }, data)
  }
  for (const [i, key] of keys.entries()) {
    if (typeof keys[i + 1] === 'undefined') {
      data[key] = value
    } else if (typeof keys[i + 1] === 'number') {
      if (!Array.isArray(data[key])) {
        data[key] = []
      }
    } else if (!data[key] || typeof data[key] !== 'object') {
      data[key] = {}
    }
    data = data[key]
  }
}

/**
 * 优化`setData`函数
 * @param {function} setData 原始`setData`函数
 * @returns {function} 优化后的`setData`函数
 */
function replaceSetData(setData) {
  const paths = new Set()
  const callbacks = []
  let needUpdate = false
  const update = function update() {
    needUpdate = false
    const data = {}
    paths.forEach(path => {
      data[path] = value(this.data, path)
    })
    const cbs = callbacks.slice()
    setData.call(this, data, function() {
      cbs.forEach(cb => cb.apply(this, arguments))
    })
    paths.clear()
    callbacks.length = 0
  }
  return function(data, callback) {
    for (const path in data) {
      if (data.hasOwnProperty(path)) {
        paths.add(path)
        value(this.data, path, data[path])
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
