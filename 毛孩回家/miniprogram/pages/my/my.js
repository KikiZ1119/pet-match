const app = getApp()

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    openid: '',
    stats: {
      foundCount: 0,
      lostCount: 0,
      totalCount: 0
    },
    menuList: [
      { icon: '📋', text: '我发布的', url: '' },
      { icon: '🤝', text: '匹配记录', url: '' },
      { icon: '⭐', text: '我的收藏', url: '' },
      { icon: '📞', text: '联系方式管理', url: '' }
    ]
  },

  onShow() {
    this.loadUserInfo()
    this.loadStats()
  },

  // 获取用户信息
  loadUserInfo() {
    // 尝试从缓存获取
    const userInfo = wx.getStorageSync('userInfo')
    const openid = wx.getStorageSync('openid')
    if (userInfo) {
      this.setData({ userInfo, hasUserInfo: true, openid })
    } else {
      // 尝试获取微信用户信息
      this.getUserProfile()
    }
  },

  getUserProfile() {
    // 新版微信：用 button open-type 获取，这里不主动调
    // 只是尝试从云函数获取 openid
    this.getOpenidFromCloud()
  },

  async getOpenidFromCloud() {
    try {
      const { result } = await wx.cloud.callFunction({ name: 'getopenid' })
      if (result && result.openid) {
        const openid = result.openid
        wx.setStorageSync('openid', openid)
        app.globalData.openid = openid
        this.setData({ openid })
      }
    } catch (err) {
      console.warn('获取openid失败', err)
    }
  },

  // 用户点击授权按钮
  onGetUserInfo(e) {
    if (e.detail && e.detail.userInfo) {
      const userInfo = e.detail.userInfo
      wx.setStorageSync('userInfo', userInfo)
      this.setData({ userInfo, hasUserInfo: true })
    }
  },

  // 加载统计数据
  async loadStats() {
    const openid = wx.getStorageSync('openid') || app.globalData.openid
    if (!openid) {
      // 等 openid 获取后再加载
      setTimeout(() => this.loadStats(), 1000)
      return
    }

    try {
      const db = wx.cloud.database()
      const [foundRes, lostRes] = await Promise.all([
        db.collection('found_animals').where({ _openid: openid }).count(),
        db.collection('lost_pets').where({ _openid: openid }).count()
      ])
      this.setData({
        stats: {
          foundCount: foundRes.total || 0,
          lostCount: lostRes.total || 0,
          totalCount: (foundRes.total || 0) + (lostRes.total || 0)
        }
      })
    } catch (err) {
      console.warn('加载统计数据失败', err)
    }
  },

  // 点击菜单项
  onMenuTap(e) {
    const { text } = e.currentTarget.dataset
    wx.showToast({ title: `功能开发中：${text}`, icon: 'none' })
    // 后续可扩展跳转到对应页面
  },

  // 关于我们
  onAbout() {
    wx.showModal({
      title: '关于毛孩回家',
      content: '毛孩回家 v1.0\n一款帮助流浪动物与主人重新团聚的微信小程序。\n\n功能特色：\n• 智能匹配捡到/走丢宠物\n• 特征分类筛选浏览\n• 领养专区\n\n如有问题或建议，欢迎反馈！',
      showCancel: false
    })
  },

  onShareAppMessage() {
    return {
      title: '毛孩回家 - 帮流浪动物找到家',
      path: '/pages/index/index'
    }
  }
})
