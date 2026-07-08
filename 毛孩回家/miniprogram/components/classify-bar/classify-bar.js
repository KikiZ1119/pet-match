// components/classify-bar/classify-bar.js
Component({
  properties: {
    // 筛选分组配置
    filterGroups: {
      type: Array,
      value: []
    },
    currentTab: {
      type: String,
      value: 'all'
    }
  },

  data: {
    showFilter: false,
    sortBy: 'time',
    selectedFilters: {}
  },

  methods: {
    onTabChange(e) {
      const tab = e.currentTarget.dataset.tab
      this.setData({ currentTab: tab })
      this.triggerEvent('tabchange', { tab })
    },

    toggleFilter() {
      this.setData({ showFilter: !this.data.showFilter })
    },

    onFilterSelect(e) {
      const { group, value } = e.currentTarget.dataset
      const key = `selectedFilters.${group}`
      const current = this.data.selectedFilters[group]
      
      this.setData({
        [key]: current === value ? '' : value
      })
    },

    resetFilters() {
      this.setData({ selectedFilters: {} })
      this.triggerEvent('filterchange', { filters: {} })
    },

    confirmFilters() {
      this.setData({ showFilter: false })
      this.triggerEvent('filterchange', { filters: this.data.selectedFilters })
    },

    onSearch() {
      this.triggerEvent('search')
    },

    onSortChange(e) {
      const sort = e.currentTarget.dataset.sort
      this.setData({ sortBy: sort })
      this.triggerEvent('sortchange', { sort })
    }
  }
})
