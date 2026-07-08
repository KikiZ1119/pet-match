// components/animal-card/animal-card.js
const util = require('../../utils/util')

Component({
  properties: {
    animal: {
      type: Object,
      value: {}
    },
    matchRate: {
      type: Number,
      value: 0
    },
    colorLabel: String,
    sizeLabel: String,
    genderLabel: String
  },

  data: {
    relativeTime: '',
    defaultImage: '../../images/default-pet.png'
  },

  lifetimes: {
    attached() {
      if (this.properties.animal && this.properties.animal.createTime) {
        this.setData({
          relativeTime: util.formatRelativeTime(this.properties.animal.createTime)
        })
      }
    }
  },

  observers: {
    'animal.createTime'(time) {
      if (time) {
        this.setData({ relativeTime: util.formatRelativeTime(time) })
      }
    }
  },

  methods: {
    onClick() {
      this.triggerEvent('click', { animal: this.properties.animal })
    }
  }
})
