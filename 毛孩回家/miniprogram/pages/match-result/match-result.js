// pages/match-result/match-result.js - 智能匹配结果页逻辑
const db = wx.cloud.database()
const { batchMatch } = require('../../utils/match')

Page({
  data: {
    sourceId: '',
    sourceCollection: '',
    sourceAnimal: null,
    matchDirection: 'found_to_lost',
    matchResults: [],
    loading: true,
    refreshing: false
  },

  onLoad(options) {
    const { sourceId, sourceCollection } = options
    if (sourceId && sourceCollection) {
      this.setData({ sourceId, sourceCollection })
      this.doMatch()
    } else {
      // 如果没有传参，显示提示让用户选择
      this.setData({ loading: false })
    }
  },

  onPullDownRefresh() {
    this.doMatch().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 执行匹配
   */
  async doMatch() {
    const { sourceId, sourceCollection } = this.data

    try {
      this.setData({ loading: true })

      // 1. 获取源动物数据
      const sourceRes = await db.collection(sourceCollection).doc(sourceId).get()
      const sourceAnimal = sourceRes.data

      // 2. 确定匹配方向和目标集合
      let targetCollection, matchDirection
      if (sourceCollection === 'found_animals') {
        targetCollection = 'lost_pets'
        matchDirection = 'found_to_lost'
      } else {
        targetCollection = 'found_animals'
        matchDirection = 'lost_to_found'
      }

      // 3. 获取目标集合中的所有数据
      const targetRes = await db.collection(targetCollection)
        .where({
          animalType: sourceAnimal.animalType // 按动物类型预过滤
        })
        .get()
      const candidates = targetRes.data.map(item => ({
        ...item,
        colorLabel: this.getLabel('color', item.color),
        sizeLabel: this.getLabel('size', item.size),
        genderLabel: this.getLabel('gender', item.gender),
        breedLabel: this.getLabel('breed', item.breed, item.animalType)
      }))

      // 4. 执行批量匹配
      const matchResults = batchMatch(sourceAnimal, candidates, matchDirection)

      this.setData({
        sourceAnimal: {
          ...sourceAnimal,
          colorLabel: this.getLabel('color', sourceAnimal.color),
          sizeLabel: this.getLabel('size', sourceAnimal.size),
          genderLabel: this.getLabel('gender', sourceAnimal.gender),
          breedLabel: this.getLabel('breed', sourceAnimal.breed, sourceAnimal.animalType)
        },
        matchResults,
        matchDirection,
        loading: false,
        refreshing: false
      })
    } catch (err) {
      console.error('智能匹配失败:', err)
      this.setData({ loading: false, refreshing: false })
      wx.showToast({ title: '匹配失败，请重试', icon: 'none' })
    }
  },

  /**
   * 获取标签文字
   */
  getLabel(groupKey, value, animalType) {
    if (!value) return ''
    const app = getApp()
    const categories = app.globalData.categories[groupKey]
    if (!categories) return value
    
    // breed 是嵌套对象 {cat: [], dog: []}
    if (groupKey === 'breed') {
      if (!animalType) return value
      const breedList = categories[animalType]
      if (!breedList) return value
      const found = breedList.find(c => c.value === value)
      return found ? found.label : value
    }
    
    const found = categories.find(c => c.value === value)
    return found ? found.label : value
  },

  /**
   * 点击匹配结果
   */
  onResultClick(e) {
    const { index } = e.currentTarget.dataset
    const result = this.data.matchResults[index]
    const { sourceCollection } = this.data

    // 跳转到目标动物的详情页
    const targetCollection = sourceCollection === 'found_animals' ? 'lost_pets' : 'found_animals'
    wx.navigateTo({
      url: `/pages/detail/detail?collection=${targetCollection}&id=${result.animal._id}`
    })
  }
})
