/**
 * 为`Page`添加`mixin`方法，并为定义段添加`mixins`属性，字段的覆盖和组合规则同`behaviors`
 * 
 * @copyright web1706 2019
 * @author cxy930123 <mail@xingyu1993.cn>
 * @license MIT
 * @version 1.0.0
 * @see {@link https://github.com/web1706/miniprogram/blob/master/modules/page-mixin/README.md}
 * 
 * API:
 * - `Page.mixin({})` 为所有页面注入属性、数据或方法
 * 
 * @example 局部引入
 * // app.js
 * const { Page } = require('page-mixin')
 * Page.mixin({})
 * 
 * // page.js
 * const { Page } = require('page-mixin')
 * Page({})
 * 
 * @example 全局引入
 * // app.js
 * Page = require('page-mixin').Page
 * Page.mixin({})
 * 
 * @example 页面添加`mixin`
 * // page.js
 * Page({
 *   mixins: [mixin1, mixin2]
 * })
**/

const globalMixins = []

const oldPage = Page

// 白名单中的属性方法合并而不替换
const whitelist = new Set([
  'onLoad',
  'onShow',
  'onReady',
  'onHide',
  'onUnload'
])

/**
 * 深合并两个对象
 */
function mergeObject(obj1, obj2) {
  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 === null ||
    obj2 === null ||
    Array.isArray(obj1) ||
    Array.isArray(obj2)
  ) {
    return obj2
  }
  for (const key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      obj1[key] = mergeObject(obj1[key], obj2[key])
    }
  }
  return obj1
}

const mergedMixins = new Set()

/**
 * 合并两个配置项
 */
function mergeOptions(options, mixin) {
  if (Array.isArray(mixin && mixin.mixins)) {
    for (const opt of mixin.mixins) {
      options = mergeOptions(options, opt)
    }
  }
  for (const key in mixin) {
    if (mixin.hasOwnProperty(key)) {
      if (whitelist.has(key)) {
        if (!mergedMixins.has(mixin)) {
          const fn0 = options[key]
          const fn1 = mixin[key]
          options[key] = function () {
            if (typeof fn0 === 'function') fn0.apply(this, arguments)
            if (typeof fn1 === 'function') fn1.apply(this, arguments)
          }
        }
      } else {
        options[key] = mergeObject(options[key], mixin[key])
      }
    }
  }
  mergedMixins.add(mixin)
  return options
}

const newPage = function Page(options, ...args) {
  const mixins = globalMixins.concat(options)
  options = {}
  mergedMixins.clear()
  for (const mixin of mixins) {
    options = mergeOptions(options, mixin)
  }
  mergedMixins.clear()
  return oldPage.call(this, options, ...args)
}

newPage.mixin = mixin => void globalMixins.push(mixin)

Object.setPrototypeOf(newPage, oldPage)

module.exports = {
  Page: newPage
}