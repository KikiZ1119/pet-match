// pages/upload-lost/upload-lost.js
const app = getApp()

Page({
  data: {
    // 分类选项（从 app.globalData 获取）
    categories: {},

    // 今日日期，用于日期选择器上限
    today: '',

    // 已选图片临时路径
    images: [],

    // 表单数据
    formData: {
      animalType: '',
      color: '',
      size: '',
      gender: '',
      hasCollar: '',
      collarColor: '',
      hasCollarBell: '',
      isNeutered: '',
      latitude: '',
      longitude: '',
      locationName: '',
      locationAddress: '',
      lostDate: '',
      description: '',
      phone: '',
      wechat: '',
      reward: '',
      breed: '',        // 品种
      pattern: '',      // 花纹
      earType: '',      // 耳朵类型
      tailType: '',     // 尾巴类型
      age: '',          // 年龄
      healthStatus: '', // 健康状况
      personality: '',  // 性格
      collarType: '',   // 项圈类型
      hasTag: ''        // 有狗牌/铭牌
    },

    // 自定义品种输入
    customBreed: '',

    // 提交状态
    submitting: false
  },

  onLoad() {
    // 从 app.globalData 获取分类选项
    const categories = app.globalData.categories || {}

    // 获取今日日期，格式化为 YYYY-MM-DD
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const today = `${year}-${month}-${day}`

    this.setData({ categories, today })
  },

  // ===== 图片处理 =====

  /**
   * 选择照片（拍照或相册）
   */
  onChooseImage() {
    const remain = 3 - this.data.images.length
    if (remain <= 0) {
      wx.showToast({ title: '最多上传3张照片', icon: 'none' })
      return
    }

    wx.showActionSheet({
      itemList: ['拍照', '从手机相册选择'],
      success: (res) => {
        const isCamera = res.tapIndex === 0
        wx.chooseMedia({
          count: remain,
          mediaType: ['image'],
          sourceType: [isCamera ? 'camera' : 'album'],
          sizeType: ['compressed'],
          success: (mediaRes) => {
            const tempFiles = mediaRes.tempFiles || []
            const newImages = tempFiles.map(f => f.tempFilePath)
            this.setData({
              images: [...this.data.images, ...newImages]
            })
          },
          fail: () => {
            // 用户取消选择，不做处理
          }
        })
      }
    })
  },

  /**
   * 删除照片
   */
  onDeleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = [...this.data.images]
    images.splice(index, 1)
    this.setData({ images })
  },

  // ===== 标签选择 =====

  /**
   * 选择标签
   */
  onSelectTag(e) {
    const { group, value } = e.currentTarget.dataset
    const formData = { ...this.data.formData }

    // 如果点击已选中的标签，取消选中
    if (formData[group] === value) {
      formData[group] = ''
    } else {
      formData[group] = value
    }

    // 如果切换了"有项圈"状态，清选项圈颜色
    if (group === 'hasCollar' && value !== 'yes') {
      formData.collarColor = ''
    }

    this.setData({ formData })
  },

  // ===== 地点选择 =====

  /**
   * 选择走丢地点
   */
  onChooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        const formData = { ...this.data.formData }
        formData.latitude = res.latitude
        formData.longitude = res.longitude
        formData.locationName = res.name || ''
        formData.locationAddress = res.address || ''
        this.setData({ formData })
      },
      fail: () => {
        // 用户取消或定位失败，不做处理
      }
    })
  },

  // ===== 日期选择 =====

  /**
   * 选择走丢日期
   */
  onChooseDate(e) {
    const formData = { ...this.data.formData }
    formData.lostDate = e.detail.value
    this.setData({ formData })
  },

  // ===== 表单输入 =====

  /**
   * 输入描述
   */
  onInputDescription(e) {
    const formData = { ...this.data.formData }
    formData.description = e.detail.value
    this.setData({ formData })
  },

  /**
   * 输入手机号
   */
  onInputPhone(e) {
    const formData = { ...this.data.formData }
    formData.phone = e.detail.value
    this.setData({ formData })
  },

  /**
   * 输入微信号
   */
  onInputWechat(e) {
    const formData = { ...this.data.formData }
    formData.wechat = e.detail.value
    this.setData({ formData })
  },

  /**
   * 输入悬赏金额
   */
  onInputReward(e) {
    const formData = { ...this.data.formData }
    formData.reward = e.detail.value
    this.setData({ formData })
  },

  /**
   * 输入自定义品种
   */
  onInputCustomBreed(e) {
    this.setData({ customBreed: e.detail.value })
  },

  // ===== 表单验证 =====

  /**
   * 验证表单
   * @returns {boolean} 是否通过验证
   */
  validateForm() {
    const { formData, images } = this.data

    // 验证照片
    if (images.length === 0) {
      wx.showToast({ title: '请上传宠物照片', icon: 'none' })
      return false
    }

    // 验证动物类型
    if (!formData.animalType) {
      wx.showToast({ title: '请选择动物类型', icon: 'none' })
      return false
    }

    // 验证颜色
    if (!formData.color) {
      wx.showToast({ title: '请选择宠物颜色', icon: 'none' })
      return false
    }

    // 验证体型
    if (!formData.size) {
      wx.showToast({ title: '请选择宠物体型', icon: 'none' })
      return false
    }

    // 验证性别
    if (!formData.gender) {
      wx.showToast({ title: '请选择宠物性别', icon: 'none' })
      return false
    }

    // 验证走丢地点
    if (!formData.locationName) {
      wx.showToast({ title: '请选择走丢地点', icon: 'none' })
      return false
    }

    // 验证走丢时间
    if (!formData.lostDate) {
      wx.showToast({ title: '请选择走丢时间', icon: 'none' })
      return false
    }

    // 验证描述
    if (!formData.description || formData.description.trim().length === 0) {
      wx.showToast({ title: '请填写详细描述', icon: 'none' })
      return false
    }

    // 验证手机号
    if (!formData.phone) {
      wx.showToast({ title: '请填写手机号码', icon: 'none' })
      return false
    }

    if (!/^1\d{10}$/.test(formData.phone)) {
      wx.showToast({ title: '请输入正确的手机号码', icon: 'none' })
      return false
    }

    // 如果有项圈，验证项圈颜色
    if (formData.hasCollar === 'yes' && !formData.collarColor) {
      wx.showToast({ title: '请选择项圈颜色', icon: 'none' })
      return false
    }

    // 验证悬赏金额（如果填写了，必须是合法数字）
    if (formData.reward && (!/^\d+(\.\d{1,2})?$/.test(formData.reward) || parseFloat(formData.reward) <= 0)) {
      wx.showToast({ title: '请输入有效的悬赏金额', icon: 'none' })
      return false
    }

    return true
  },

  // ===== 提交 =====

  /**
   * 提交表单
   */
  async onSubmit() {
    if (this.data.submitting) return

    // 表单验证
    if (!this.validateForm()) return

    this.setData({ submitting: true })
    wx.showLoading({ title: '上传中...', mask: true })

    try {
      // 1. 上传图片到云存储
      const imageUrls = await this.uploadImages()

      // 2. 获取用户 openid
      const openid = await this.getOpenid()

      // 3. 提交数据到云数据库
      await this.submitToDatabase(imageUrls, openid)

      // 4. 提交成功
      wx.hideLoading()
      wx.showToast({ title: '发布成功！', icon: 'success', duration: 2000 })

      // 延迟跳转到首页
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 1500)
    } catch (err) {
      wx.hideLoading()
      console.error('发布失败：', err)
      wx.showToast({ title: err.message || '发布失败，请重试', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  /**
   * 上传图片到云存储
   * @returns {Promise<string[]>} 云存储 URL 列表
   */
  async uploadImages() {
    const { images } = this.data
    const cloudPath = `lost/${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const uploadTasks = images.map((filePath, index) => {
      return new Promise((resolve, reject) => {
        wx.cloud.uploadFile({
          cloudPath: `${cloudPath}_${index}.jpg`,
          filePath,
          success: res => resolve(res.fileID),
          fail: err => reject(new Error(`图片上传失败：${err.errMsg}`))
        })
      })
    })
    return Promise.all(uploadTasks)
  },

  /**
   * 获取用户 openid
   * @returns {Promise<string>}
   */
  async getOpenid() {
    // 优先使用已缓存的 openid
    if (app.globalData.openid) {
      return app.globalData.openid
    }

    try {
      const { result } = await wx.cloud.callFunction({ name: 'getopenid' })
      const openid = result && result.openid
      if (openid) {
        app.globalData.openid = openid
        return openid
      }
    } catch (err) {
      console.warn('获取 openid 失败，使用默认值：', err)
    }

    return ''
  },

  /**
   * 提交数据到云数据库
   */
  async submitToDatabase(imageUrls, openid) {
    const { formData } = this.data
    const db = wx.cloud.database()

    return db.collection('lost_pets').add({
      data: {
        // 照片
        images: imageUrls,

        // 基本信息
        animalType: formData.animalType,
        color: formData.color,
        size: formData.size,
        gender: formData.gender,

        // 特征标记
        hasCollar: formData.hasCollar,
        collarColor: formData.collarColor || '',
        hasCollarBell: formData.hasCollarBell,
        isNeutered: formData.isNeutered,

        // 走丢地点
        latitude: formData.latitude,
        longitude: formData.longitude,
        locationName: formData.locationName,
        locationAddress: formData.locationAddress || '',

        // 走丢时间
        lostDate: formData.lostDate,

        // 描述
        description: formData.description,

        // 悬赏金额
        reward: formData.reward ? parseFloat(formData.reward) : 0,

        // 新增特征
        breed: formData.breed === 'other_cat' || formData.breed === 'other_dog'
          ? (this.data.customBreed || '其他品种') : (formData.breed || ''),
        pattern: formData.pattern || '',
        earType: formData.earType || '',
        tailType: formData.tailType || '',
        age: formData.age || '',
        healthStatus: formData.healthStatus || '',
        personality: formData.personality || '',
        collarType: formData.collarType || '',
        hasTag: formData.hasTag || '',

        // 联系方式
        phone: formData.phone,
        wechat: formData.wechat || '',

        // 系统字段
        _openid: openid,
        status: '寻找中',
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
        viewCount: 0,
        matchCount: 0
      }
    })
  },

  // ===== 其他 =====

  onScrollToLower() {
    // 页面滚动到底部时的处理
  },

  onShareAppMessage() {
    return {
      title: '宠物走丢了，帮我找找！',
      path: '/pages/upload-lost/upload-lost'
    }
  }
})
