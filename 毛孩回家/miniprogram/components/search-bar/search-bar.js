// components/search-bar/search-bar.js
Component({
  properties: {
    keyword: {
      type: String,
      value: ''
    },
    showCancel: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    onInput(e) {
      this.triggerEvent('input', { keyword: e.detail.value })
    },

    onSearch(e) {
      this.triggerEvent('search', { keyword: e.detail.value })
    },

    onClear() {
      this.setData({ keyword: '' })
      this.triggerEvent('clear')
    },

    onCancel() {
      this.triggerEvent('cancel')
    }
  }
})
