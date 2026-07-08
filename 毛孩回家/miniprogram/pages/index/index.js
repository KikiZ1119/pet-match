// pages/index/index.js - 首页
const app = getApp()

// Mock数据 - 首页轮播图
const MOCK_BANNERS = [
  {
    image: 'https://img.yzcdn.cn/vant/cat.jpeg',
    title: '小花在花丛中被发现',
    desc: '已经安全回到主人身边 ❤️',
    type: 'found',
    link: ''
  },
  {
    image: 'https://img.yzcdn.cn/vant/dog.jpeg',
    title: '豆豆走失第三天',
    desc: '主人非常着急，请大家帮忙留意',
    type: 'lost',
    link: ''
  },
  {
    image: 'https://img.yzcdn.cn/vant/cat-2.jpeg',
    title: '橘猫小胖等待领养',
    desc: '已驱虫疫苗，性格亲人',
    type: 'found',
    link: ''
  }
]

// Mock数据 - 最近动物列表
const MOCK_ANIMALS = [
  {
    id: '1',
    animalType: 'cat',
    images: ['https://img.yzcdn.cn/vant/cat.jpeg'],
    status: '待领养',
    locationName: '朝阳区望京SOHO',
    createTime: Date.now() - 3600000 * 2,
    description: '在小区门口捡到的橘猫，很亲人，有项圈，已做驱虫',
    colorLabel: '橘色',
    sizeLabel: '中型',
    genderLabel: '母'
  },
  {
    id: '2',
    animalType: 'dog',
    images: ['https://img.yzcdn.cn/vant/dog.jpeg'],
    status: '走丢',
    locationName: '海淀区中关村',
    createTime: Date.now() - 3600000 * 8,
    description: '白色萨摩耶，叫"团子"，背部有一块灰色毛发，走丢时戴蓝色项圈',
    colorLabel: '白色',
    sizeLabel: '大型',
    genderLabel: '公'
  },
  {
    id: '3',
    animalType: 'cat',
    images: ['https://img.yzcdn.cn/vant/cat-2.jpeg'],
    status: '捡到',
    locationName: '东城区王府井大街',
    createTime: Date.now() - 86400000 * 2,
    description: '黑色小猫，戴红色项圈，非常瘦，疑似走失',
    colorLabel: '黑色',
    sizeLabel: '小型',
    genderLabel: '母'
  },
  {
    id: '4',
    animalType: 'dog',
    images: ['https://img.yzcdn.cn/vant/dog-2.jpeg'],
    status: '待领养',
    locationName: '西城区什刹海',
    createTime: Date.now() - 86400000 * 5,
    description: '三个月大的金毛串串，已打完疫苗，非常活泼',
    colorLabel: '黄色',
    sizeLabel: '中型',
    genderLabel: '公'
  }
]

Page({
  data: {
    // 轮播图
    banners: [],
    currentSwiperIndex: 0,

    // 分类筛选
    filterGroups: [],
    currentTab: 'all',

    // 动物列表
    animalList: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onLoad() {
    // 从 app.globalData 获取分类配置
    const categories = app.globalData.categories || {}
    const filterGroups = this.buildFilterGroups(categories)
    
    this.setData({ filterGroups })

    // 获取首页数据
    this.fetchBanners()
    this.fetchAnimals()
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (this.data.animalList.length > 0) {
      this.fetchAnimals(true)
    }
  },

  // ===== 数据加载 =====

  /**
   * 构建分类筛选组配置（供 classify-bar 组件使用）
   */
  buildFilterGroups(categories) {
    const groups = []
    
    if (categories.animalType) {
      groups.push({
        key: 'animalType',
        name: '宠物类型',
        options: categories.animalType.map(item => ({
          label: item.label,
          value: item.value,
          selected: false
        }))
      })
    }

    if (categories.color) {
      groups.push({
        key: 'color',
        name: '颜色',
        options: categories.color.map(item => ({
          label: item.label,
          value: item.value,
          selected: false
        }))
      })
    }

    if (categories.size) {
      groups.push({
        key: 'size',
        name: '体型',
        options: categories.size.map(item => ({
          label: item.label,
          value: item.value,
          selected: false
        }))
      })
    }

    return groups
  },

  /**
   * 获取轮播图数据
   */
  fetchBanners() {
    // 优先从云数据库获取，降级使用 Mock 数据
    wx.showLoading({ title: '加载中...', mask: true })

    if (wx.cloud) {
      const db = wx.cloud.database()
      db.collection('banners')
        .orderBy('sort', 'asc')
        .get()
        .then(res => {
          const banners = res.data && res.data.length > 0 ? res.data : MOCK_BANNERS
          this.setData({ banners })
          wx.hideLoading()
        })
        .catch(() => {
          // 云数据库不可用时使用 mock 数据
          this.setData({ banners: MOCK_BANNERS })
          wx.hideLoading()
        })
    } else {
      this.setData({ banners: MOCK_BANNERS })
      wx.hideLoading()
    }
  },

  /**
   * 获取动物列表
   */
  fetchAnimals(isRefresh = false) {
    if (this.data.loading) return

    this.setData({ loading: true })

    if (isRefresh) {
      this.setData({ page: 1, hasMore: true })
    }

    if (wx.cloud) {
      const db = wx.cloud.database()
      const query = { status: db.command.neq('已删除') }

      db.collection('animals')
        .where(query)
        .orderBy('createTime', 'desc')
        .limit(this.data.pageSize)
        .get()
        .then(res => {
          const list = res.data || []
          this.processAnimalData(list, isRefresh)
        })
        .catch(() => {
          // 使用 Mock 数据
          this.processAnimalData(MOCK_ANIMALS, isRefresh)
        })
    } else {
      // 使用 Mock 数据
      setTimeout(() => {
        this.processAnimalData(MOCK_ANIMALS, isRefresh)
      }, 300)
    }
  },

  /**
   * 处理动物数据
   */
  processAnimalData(list, isRefresh) {
    let animalList = isRefresh ? [] : [...this.data.animalList]
    
    // 如果当前没有更多数据
    if (list.length < this.data.pageSize) {
      this.setData({ hasMore: false })
    }

    // 去重合并
    const existingIds = new Set(animalList.map(item => item.id))
    const newItems = list.filter(item => !existingIds.has(item.id))
    animalList = [...animalList, ...newItems]

    this.setData({
      animalList,
      loading: false,
      page: isRefresh ? 2 : this.data.page + 1
    })
  },

  /**
   * 加载更多
   */
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.fetchAnimals()
  },

  // ===== 事件处理 =====

  onSwiperChange(e) {
    this.setData({ currentSwiperIndex: e.detail.current })
  },

  onBannerTap(e) {
    const index = e.currentTarget.dataset.index
    const banner = this.data.banners[index]
    if (banner.link) {
      wx.navigateTo({ url: banner.link })
    }
  },

  onTabChange(e) {
    const tab = e.detail.tab
    this.setData({ currentTab: tab })
    this.fetchAnimals(true)
  },

  onSearch() {
    wx.navigateTo({ url: '/pages/lost/lost' })
  },

  onAnimalClick(e) {
    const { animal } = e.detail
    wx.navigateTo({
      url: `/pages/detail/detail?id=${animal.id}`
    })
  },

  goMore() {
    wx.switchTab({ url: '/pages/lost/lost' })
  },

  goFound() {
    wx.navigateTo({ url: '/pages/upload-found/upload-found' })
  },

  goLost() {
    wx.navigateTo({ url: '/pages/upload-lost/upload-lost' })
  },

  goMatch() {
    wx.showModal({
      title: '智能匹配',
      content: '请先进入一条捡到或走丢信息的详情页，\n点击下方的"智能匹配"按钮进行匹配。',
      confirmText: '知道了',
      showCancel: false
    })
  },

  goAdopt() {
    wx.switchTab({ url: '/pages/adopt/adopt' })
  },

  // ===== 下拉刷新 =====
  onPullDownRefresh() {
    this.fetchBanners()
    this.fetchAnimals(true)
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    this.loadMore()
  },

  // ===== 分享 =====
  onShareAppMessage() {
    return {
      title: '毛孩回家 - 宠物走丢救助平台',
      path: '/pages/index/index'
    }
  }
})
