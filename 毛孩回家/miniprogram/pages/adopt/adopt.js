// pages/adopt/adopt.js - 领养区逻辑
const db = wx.cloud.database()
const _ = db.command

const PAGE_SIZE = 10

Page({
  data: {
    // Tab
    currentTab: 'all',
    tabIndex: 0,

    // 列表数据
    list: [],
    loading: false,
    loadingMore: false,
    refreshing: false,
    hasMore: true,
    page: 0
  },

  onLoad() {
    this.loadData(true)
  },

  onShow() {
    if (!this._firstLoad) {
      this.loadData(true)
    }
    this._firstLoad = false
  },

  onPullDownRefresh() {
    this.loadData(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMore()
    }
  },

  /**
   * 加载数据
   */
  async loadData(reset = false) {
    if (reset) {
      this.setData({ loading: true, page: 0, hasMore: true })
    }

    const { page, currentTab } = this.data

    try {
      // 查询 found_animals 中 status 为 "待领养" 的数据
      const conditions = { status: '待领养' }

      // Tab 筛选动物类型
      if (currentTab !== 'all') {
        conditions.animalType = currentTab
      }

      const res = await db.collection('found_animals')
        .where(conditions)
        .orderBy('createTime', 'desc')
        .skip(reset ? 0 : page * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .get()

      // 补充标签文字
      const app = getApp()
      const cats = app.globalData.categories
      const getLabel = (groupKey, value) => {
        if (!value) return ''
        const group = cats[groupKey]
        if (!group) return value
        const found = group.find(c => c.value === value)
        return found ? found.label : value
      }

      const newList = res.data.map(item => ({
        ...item,
        colorLabel: getLabel('color', item.color),
        sizeLabel: getLabel('size', item.size),
        genderLabel: getLabel('gender', item.gender)
      }))

      this.setData({
        list: reset ? newList : [...this.data.list, ...newList],
        hasMore: res.data.length >= PAGE_SIZE,
        loading: false,
        loadingMore: false
      })
    } catch (err) {
      console.error('加载领养列表失败:', err)
      this.setData({ loading: false, loadingMore: false })
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    }
  },

  /**
   * 加载更多
   */
  async loadMore() {
    if (this.data.loadingMore || !this.data.hasMore) return

    this.setData({
      loadingMore: true,
      page: this.data.page + 1
    })

    await this.loadData(false)
  },

  /**
   * 下拉刷新
   */
  onRefresh() {
    this.setData({ refreshing: true })
    this.loadData(true).then(() => {
      this.setData({ refreshing: false })
    })
  },

  /**
   * 上拉加载更多
   */
  onLoadMore() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMore()
    }
  },

  /**
   * Tab 切换
   */
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    const tabMap = { all: 0, cat: 1, dog: 2 }

    if (tab === this.data.currentTab) return

    this.setData({
      currentTab: tab,
      tabIndex: tabMap[tab]
    }, () => {
      this.loadData(true)
    })
  },

  /**
   * 点击卡片跳转到详情页
   */
  onCardClick(e) {
    const { animal } = e.detail
    wx.navigateTo({
      url: `/pages/detail/detail?collection=found_animals&id=${animal._id}`
    })
  }
})
