Component({
  properties: {
    animalId: { type: String, value: '' },
    collection: { type: String, value: 'found_animals' }
  },

  data: {
    comments: [],
    inputValue: '',
    loading: false
  },

  lifetimes: {
    attached() {
      this.loadComments()
    }
  },

  methods: {
    async loadComments() {
      if (!this.properties.animalId) return
      try {
        const { result } = await wx.cloud.callFunction({
          name: 'comment',
          data: {
            action: 'list',
            animalId: this.properties.animalId,
            collection: this.properties.collection
          }
        })
        if (result && result.code === 0) {
          this.setData({ comments: result.data || [] })
        }
      } catch (err) {
        console.error('加载评论失败', err)
      }
    },

    onInput(e) {
      this.setData({ inputValue: e.detail.value })
    },

    async onSubmit() {
      const content = this.data.inputValue.trim()
      if (!content) return

      this.setData({ loading: true })
      try {
        const { result } = await wx.cloud.callFunction({
          name: 'comment',
          data: {
            action: 'add',
            animalId: this.properties.animalId,
            collection: this.properties.collection,
            content
          }
        })
        if (result && result.code === 0) {
          this.setData({ inputValue: '' })
          wx.showToast({ title: '留言成功', icon: 'success' })
          this.loadComments()
        } else {
          wx.showToast({ title: result.message || '留言失败', icon: 'none' })
        }
      } catch (err) {
        wx.showToast({ title: '留言失败', icon: 'none' })
      } finally {
        this.setData({ loading: false })
      }
    }
  }
})
