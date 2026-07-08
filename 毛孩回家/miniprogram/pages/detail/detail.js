// pages/detail/detail.js - 动物详情页逻辑
const util = require('../../utils/util')
const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    animal: null,
    loading: true,
    images: [],
    // 标签文字
    colorLabel: '',
    sizeLabel: '',
    genderLabel: '',
    breedLabel: '',
    patternLabel: '',
    ageLabel: '',
    earTypeLabel: '',
    tailTypeLabel: '',
    personalityLabel: '',
    healthLabel: '',
    collarTypeLabel: '',
    createTime: '',
    // 评论相关
    animalId: '',
    collectionName: '',
    // 收藏状态
    isCollected: false
  },

  onLoad(options) {
    const { collection, id } = options
    if (!collection || !id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      wx.navigateBack()
      return
    }

    this.collectionName = collection
    this.animalId = id
    this.setData({
      animalId: id,
      collectionName: collection
    })
    this.loadDetail()
  },

  async loadDetail() {
    try {
      const res = await db.collection(this.collectionName).doc(this.animalId).get()
      const animal = res.data

      if (!animal) {
        wx.showToast({ title: '数据不存在', icon: 'none' })
        wx.navigateBack()
        return
      }

      // 加载标签文字
      const app = getApp()
      const cats = app.globalData.categories
      const getLabel = (groupKey, value) => {
        if (!value || !cats[groupKey]) return ''
        // breed 是对象 {cat: [], dog: []}，非数组
        if (groupKey === 'breed' && animal && animal.animalType) {
          const breedList = cats.breed[animal.animalType]
          if (!breedList) return value
          const found = breedList.find(c => c.value === value)
          return found ? found.label : value
        }
        const found = cats[groupKey].find(c => c.value === value)
        return found ? found.label : value
      }

      // 处理状态样式
      const statusMap = {
        '寻找中': 'searching',
        '待匹配': 'matching',
        '待领养': 'adopt'
      }
      const statusClass = statusMap[animal.status] || 'default'
      const images = animal.images && animal.images.length > 0
        ? animal.images
        : ['../../images/default-pet.png']

      this.setData({
        animal,
        images,
        loading: false,
        statusClass,
        colorLabel: getLabel('color', animal.color),
        sizeLabel: getLabel('size', animal.size),
        genderLabel: animal.gender === 'male' ? '公' : animal.gender === 'female' ? '母' : '未知',
        breedLabel: getLabel('breed', animal.breed) || '',
        patternLabel: getLabel('pattern', animal.pattern) || '',
        ageLabel: getLabel('age', animal.age) || '',
        earTypeLabel: getLabel('earType', animal.earType) || '',
        tailTypeLabel: getLabel('tailType', animal.tailType) || '',
        personalityLabel: getLabel('personality', animal.personality) || '',
        healthLabel: getLabel('healthStatus', animal.healthStatus) || '',
        collarTypeLabel: getLabel('collarType', animal.collarType) || '',
        createTime: util.formatTime(animal.createTime)
      })

      // 异步更新浏览量
      this.incrementViewCount()
    } catch (err) {
      console.error('加载详情失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  /**
   * 更新浏览量
   */
  async incrementViewCount() {
    try {
      await db.collection(this.collectionName).doc(this.animalId).update({
        data: {
          viewCount: _.inc(1)
        }
      })
    } catch (err) {
      console.error('更新浏览量失败:', err)
    }
  },

  /**
   * 复制联系方式
   */
  copyContact(e) {
    const contact = e.currentTarget.dataset.contact
    if (!contact) {
      wx.showToast({ title: '暂无联系方式', icon: 'none' })
      return
    }

    wx.setClipboardData({
      data: contact,
      success() {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
      }
    })
  },

  /**
   * 打开地图查看位置
   */
  openMap() {
    const { animal } = this.data
    if (!animal.locationLatitude || !animal.locationLongitude) {
      wx.showToast({ title: '暂无位置信息', icon: 'none' })
      return
    }

    wx.openLocation({
      latitude: animal.locationLatitude,
      longitude: animal.locationLongitude,
      name: animal.locationName || '',
      address: animal.locationAddress || '',
      scale: 15
    })
  },

  /**
   * 智能匹配 - 跳转到匹配结果页
   */
  goMatch() {
    // 根据集合类型判断匹配方向
    let targetCollection
    if (this.collectionName === 'lost_pets') {
      targetCollection = 'found_animals'
    } else if (this.collectionName === 'found_animals') {
      targetCollection = 'lost_pets'
    } else {
      wx.showToast({ title: '暂不支持匹配', icon: 'none' })
      return
    }

    wx.navigateTo({
      url: `/pages/match-result/match-result?sourceCollection=${this.collectionName}&sourceId=${this.animalId}&targetCollection=${targetCollection}`
    })
  },

  /**
   * 分享
   */
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  /**
   * 自定义分享
   */
  onShareAppMessage() {
    const { animal } = this.data
    return {
      title: animal.description ? animal.description.slice(0, 30) + '...' : '帮帮毛孩回家',
      path: `/pages/detail/detail?collection=${this.collectionName}&id=${this.animalId}`,
      imageUrl: animal.images && animal.images[0] || ''
    }
  },

  onShareTimeline() {
    const { animal } = this.data
    return {
      title: animal.description ? animal.description.slice(0, 30) + '...' : '帮帮毛孩回家'
    }
  }
})
