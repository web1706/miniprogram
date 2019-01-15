/**
 * 在小程序中的路由功能上加入一些扩展：
 * - 支持向新打开的页面传入数据
 * - 支持在关闭页面时回传数据
 * - 阻止频繁打开或关闭页面（页面切换完成之前无法再次切换页面）
 *
 * @copyright web1706 2018
 * @author cxy930123 <mail@xingyu1993.cn>
 * @license MIT
 * @see {@link https://github.com/web1706/miniprogram/blob/master/modules/router/README.md}
 *
 * 导出以下函数：
 * - `open(url[, data])` 打开一个子页面，可传入数据
 * - `close([data[, delta]])` 关闭当前页面，可回传数据
 * - `replace(url[, data])` 替换当前页面，可向新页面传递数据
 * - `data(page)` 从上一个页面传递过来的数据
 *
 * @example
 * const router = require('router')
 * // 打开一个页面并接收回传的数据
 * const res = router.open(url, data)
 * // 新打开的页面中接收数据
 * const data = router.data(this)
 * // 关闭页面并回传数据
 * router.close(data)
**/

// 父页面映射到传到子页面的数据
const forwardMap = new WeakMap()
// 父页面映射到子页面回传的数据
const backwardMap = new WeakMap()
// 锁定时无法切换页面
let locked = false

/**
 * 保留当前页面，跳转到应用内的某个页面
 * @param {string} url 需要跳转的目标页面路径, 路径后可以带参数
 * @param {any} [data] 需要传给目标页面的数据
 * @returns {Promise<any>} 目标页面回传的数据
 */
const open = (url, data) => new Promise(
  (resolve, reject) => {
    // 检查锁状态
    if (locked) throw new Error('fail operation too frequent')
    // 获取当前页面
    const pages = getCurrentPages()
    if (pages.length === 0) {
      throw new Error('fail page not ready')
    }
    const page = pages.slice(-1)[0]
    // 存储数据
    forwardMap.set(page, data)
    // 加锁
    locked = true
    // 页面隐藏后解锁
    const onHide = page.onHide
    page.onHide = () => {
      locked = false
      page.onHide = onHide
      page.onHide()
    }
    // 打开子页面
    wx.navigateTo({
      url,
      success: () => {
        // 子页面关闭时获取回传数据
        const onShow = page.onShow
        page.onShow = () => {
          forwardMap.delete(page)
          // 判断是否回传了数据
          if (backwardMap.has(page)) {
            resolve(backwardMap.get(page))
            backwardMap.delete(page)
          } else {
            reject(new Error('fail page abort'))
          }
          // 执行原本的onShow方法
          page.onShow = onShow
          return page.onShow()
        }
      },
      fail: (err) => {
        // 失败时解锁
        locked = false
        page.onHide = onHide
        forwardMap.delete(page)
        reject(err)
      }
    })
  }
)

/**
 * 关闭当前页面，返回上一页面或多级页面
 * @param {any} [data] 需要回传的数据
 * @param {number} [delta] 返回的页面数，如果 delta 大于现有页面数，则返回到首页
 * @returns {Promise<any>} 代表是否关闭成功
 */
const close = (data, delta = 1) => new Promise(
  (resolve, reject) => {
    // 检查锁状态
    if (locked) throw new Error('fail operation too frequent')
    // 获取父页面和当前页面
    const pages = getCurrentPages();
    if (pages.length === 0) {
      throw new Error('fail page not ready')
    }
    if (pages.length === 1) {
      throw new Error('root page could not be closed')
    }
    const [page] = pages.slice(-1)
    const [parent] = pages.slice(-1 - delta)
    // 写入回传数据
    backwardMap.set(parent, data)
    // 加锁
    locked = true
    // 页面关闭后解锁
    const onUnload = page.onUnload
    page.onUnload = () => {
      locked = false
      page.onUnload = onUnload
      page.onUnload()
    }
    // 返回父页面
    wx.navigateBack({
      delta,
      success: resolve,
      fail: (err) => {
        backwardMap.delete(parent)
        page.onUnload = onUnload
        reject(err)
      }
    })
  }
)

/**
 * 关闭当前页面，跳转到应用内的某个页面
 * @param {string} url 需要跳转的目标页面路径, 路径后可以带参数
 * @param {any} [data] 需要传给目标页面的数据
 * @returns {Promise<any>} 代表是否跳转成功
 */
const replace = (url, data) => new Promise(
  (resolve, reject) => {
    // 检查锁状态
    if (locked) throw new Error('fail operation too frequent')
    // 获取父页面
    const pages = getCurrentPages();
    const parent = pages.length > 0 ? pages.slice(-2)[0] : forwardMap
    // 备份从父页面传递过来的数据
    const $data = forwardMap.get(parent)
    // 设置传给目标页面的数据
    forwardMap.set(parent, data)
    // 加锁
    locked = true
    // 页面卸载后解锁
    const onUnload = this.onUnload
    this.onUnload = () => {
      locked = false
      this.onUnload = onUnload
      this.onUnload()
    }
    // 跳转
    wx.redirectTo({
      url,
      success: resolve,
      fail: (err) => {
        forwardMap.set(parent, $data)
        this.onUnload = onUnload
        reject(err)
      }
    })
  }
)

/**
 * 获取传递给当前页面的数据
 * @param {Page} page 当前页面
 */
const data = (page) => {
  const pages = getCurrentPages()
  const index = pages.findIndex(item => item === page)
  if (index > 0) {
    const parent = pages[index - 1]
    return forwardMap.get(parent)
  }
  if (index === 0) {
    return forwardMap.get(forwardMap)
  }
  throw new Error('fail page not found')
}

exports.open = open
exports.close = close
exports.replace = replace
exports.data = data
