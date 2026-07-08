/**
 * 通用工具函数
 */

/**
 * 格式化时间
 */
function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = padZero(d.getMonth() + 1)
  const day = padZero(d.getDate())
  const hour = padZero(d.getHours())
  const min = padZero(d.getMinutes())
  return `${year}-${month}-${day} ${hour}:${min}`
}

/**
 * 相对时间（如：3天前）
 */
function formatRelativeTime(date) {
  if (!date) return ''
  const now = Date.now()
  const diff = now - new Date(date).getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}

function padZero(n) {
  return n < 10 ? '0' + n : '' + n
}

/**
 * 选择图片
 */
function chooseImage(count = 3) {
  return new Promise((resolve, reject) => {
    wx.chooseMedia({
      count,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: resolve,
      fail: reject
    })
  })
}

/**
 * 上传图片到云存储
 */
async function uploadImages(filePaths) {
  const uploadTasks = filePaths.map((path, index) => {
    const ext = path.match(/\.(\w+)$/)?.[1] || 'jpg'
    const cloudPath = `animals/${Date.now()}_${index}.${ext}`
    return wx.cloud.uploadFile({
      cloudPath,
      filePath: path
    })
  })
  
  const results = await Promise.all(uploadTasks)
  return results.map(r => r.fileID)
}

/**
 * 显示Toast提示
 */
function showToast(title, icon = 'none') {
  wx.showToast({ title, icon, duration: 2000 })
}

/**
 * 显示加载中
 */
function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true })
}

/**
 * 获取当前位置
 */
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'wgs84',
      success: resolve,
      fail: reject
    })
  })
}

/**
 * 选择位置（通过地图）
 */
function chooseLocation() {
  return new Promise((resolve, reject) => {
    wx.chooseLocation({
      success: resolve,
      fail: reject
    })
  })
}

module.exports = {
  formatTime,
  formatRelativeTime,
  chooseImage,
  uploadImages,
  showToast,
  showLoading,
  getCurrentLocation,
  chooseLocation
}
