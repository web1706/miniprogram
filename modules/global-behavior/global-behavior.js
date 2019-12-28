/**
 * 为`Component`添加全局注入`behavior`的方法
 * 
 * @copyright web1706 2019
 * @author cxy930123 <mail@xingyu1993.cn>
 * @license MIT
 * @version 1.0.0
 * @see {@link https://github.com/web1706/miniprogram/blob/master/modules/global-behavior/README.md}
 * 
 * API:
 * - `Component.behavior(behavior)` 为所有组件注入`behavior`
 * 
 * @example 局部引入
 * // app.js
 * const { Component } = require('global-behavior')
 * Component.behavior(Behavior({}))
 * 
 * // page.js
 * const { Component } = require('global-behavior')
 * Component({})
 * 
 * @example 全局引入
 * // app.js
 * Component = require('global-behavior').Component
 * Component.behavior(Behavior({}))
**/

const globalBehaviors = []

const oldComponent = Component

const newComponent = function Component(options, ...args) {
  const behaviors = globalBehaviors.slice()
  if (Array.isArray(options && options.behaviors)) {
    behaviors.push(...options.behaviors)
  }
  const originalOptions = options
  options = { ...originalOptions, behaviors }
  Object.setPrototypeOf(options, originalOptions)
  return oldComponent.call(this, options, ...args)
}

newComponent.behavior = behavior => void globalBehaviors.push(behavior)

Object.setPrototypeOf(newComponent, oldComponent)

module.exports = {
  Component: newComponent
}