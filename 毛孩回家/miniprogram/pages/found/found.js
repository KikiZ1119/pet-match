// pages/found/found.js - 捡到动物浏览列表页逻辑
const db = wx.cloud.database()
const _ = db.command

const PAGE_SIZE = 10

Page({
  data: {
    // 筛选
    filterGroups: [],
    currentTab: 'all',
    filters: {},
    sortBy: 'time',
    hasActiveFilters: false,
    activeFilterTags: [],

    // 列表数据
    list: [],
    loading: false,
    loadingMore: false,
    refreshing: false,
    hasMore: true,
    page: 0
  },

  onLoad() {
    this.initFilterGroups()
    this.loadData(true)
  },

  onShow() {
    // 从其他页面返回时刷新（如发布页面）
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
   * 初始化筛选分组
   */
  initFilterGroups() {
    const app = getApp()
    const cats = app.globalData.categories

    const filterGroups = [
      { 
        name: '动物类型', 
        key: 'animalType', 
        options: cats.animalType.map(t => ({ label: t.icon + ' ' + t.label, value: t.value }))
      },
      { 
        name: '颜色', 
        key: 'color', 
        options: cats.color.map(t => ({ label: t.label, value: t.value }))
      },
      { 
        name: '体型', 
        key: 'size', 
        options: cats.size.map(t => ({ label: t.label, value: t.value }))
      },
      { 
        name: '性别', 
        key: 'gender', 
        options: cats.gender.map(t => ({ label: t.label, value: t.value }))
      },
      {
        name: '项圈',
        key: 'hasCollar',
        options: cats.hasCollar.map(t => ({ label: t.label, value: t.value }))
      },
      {
        name: '绝育',
        key: 'isNeutered',
        options: cats.isNeutered.map(t => ({ label: t.label, value: t.value }))
      }
    ]

    this.setData({ filterGroups })
  },

  /**
   * 加载数据
   */
  async loadData(reset = false) {
    if (reset) {
      this.setData({ loading: true, page: 0, hasMore: true })
    }

    const { page, filters, sortBy } = this.data
    const queryFilters = { ...filters }

    // 根据currentTab筛选动物类型
    if (this.data.currentTab !== 'all') {
      queryFilters.animalType = this.data.currentTab
    }

    try {
      const dbQuery = db.collection('found_animals')
      let query = dbQuery.where(this.buildConditions(queryFilters))

      // 排序
      if (sortBy === 'time') {
        query = query.orderBy('createTime', 'desc')
      } else {
        // 距离排序需要根据location计算，这里用createTime降序作为保底
        query = query.orderBy('createTime', 'desc')
      }

      const res = await query
        .skip(reset ? 0 : page * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .get()

      const newList = res.data.map(item => ({
        ...item,
        colorLabel: this.getLabel('color', item.color),
        sizeLabel: this.getLabel('size', item.size),
        genderLabel: this.getLabel('gender', item.gender)
      }))

      this.setData({
        list: reset ? newList : [...this.data.list, ...newList],
        hasMore: res.data.length >= PAGE_SIZE,
        loading: false,
        loadingMore: false
      })
    } catch (err) {
      console.error('加载捡到列表失败:', err)
      this.setData({ loading: false, loadingMore: false })
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    }
  },

  /**
   * 构建查询条件
   */
  buildConditions(filters) {
    const conditions = {}
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        conditions[key] = value
      }
    }
    return conditions
  },

  /**
   * 获取标签文字
   */
  getLabel(groupKey, value) {
    if (!value) return ''
    const app = getApp()
    const categories = app.globalData.categories[groupKey]
    if (!categories) return value
    const found = categories.find(c => c.value === value)
    return found ? found.label : value
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

  // ===== 筛选事件处理 =====

  onTabChange(e) {
    const { tab } = e.detail
    this.setData({ currentTab: tab }, () => {
      this.loadData(true)
    })
  },

  onFilterChange(e) {
    const { filters } = e.detail
    this.updateFilters(filters)
    this.loadData(true)
  },

  onSortChange(e) {
    const { sort } = e.detail
    this.setData({ sortBy: sort }, () => {
      this.loadData(true)
    })
  },

  onSearch() {
    wx.navigateTo({
      url: '/pages/search/search?type=found'
    })
  },

  /**
   * 更新筛选条件
   */
  updateFilters(newFilters) {
    const app = getApp()
    const cats = app.globalData.categories

    // 生成激活的筛选标签
    const activeFilterTags = []
    for (const [key, value] of Object.entries(newFilters)) {
      if (value && cats[key]) {
        const item = cats[key].find(c => c.value === value)
        if (item) {
          activeFilterTags.push({ key, label: item.label })
        }
      }
    }

    this.setData({
      filters: newFilters,
      hasActiveFilters: activeFilterTags.length > 0,
      activeFilterTags
    })
  },

  /**
   * 移除单个筛选条件
   */
  removeFilter(e) {
    const { group } = e.currentTarget.dataset
    const newFilters = { ...this.data.filters }
    delete newFilters[group]
    this.updateFilters(newFilters)
    this.loadData(true)

    // 通知classify-bar重置
    this.setData({ filters: newFilters })
  },

  /**
   * 清空所有筛选
   */
  clearAllFilters() {
    this.updateFilters({})
    this.loadData(true)
    this.setData({ filters: {} })
  },

  // ===== 页面跳转 =====

  /**
   * 点击卡片跳转到详情页
   */
  onCardClick(e) {
    const { animal } = e.detail
    wx.navigateTo({
      url: `/pages/detail/detail?collection=found_animals&id=${animal._id}`
    })
  },

  /**
   * 跳转到发布页面
   */
  goPublish() {
    wx.navigateTo({
      url: '/pages/upload-found/upload-found'
    })
  }
})
