// app.js
App({
  globalData: {
    userInfo: null,
    openid: '',
    // 分类标签定义 - 像淘宝服装店那样按特征分类
    categories: {
      animalType: [
        { label: '猫', value: 'cat', icon: '🐱' },
        { label: '狗', value: 'dog', icon: '🐕' }
      ],
      color: [
        { label: '白色', value: 'white' },
        { label: '黑色', value: 'black' },
        { label: '黄色/橘色', value: 'yellow' },
        { label: '灰色', value: 'gray' },
        { label: '花色', value: 'multi' },
        { label: '棕色', value: 'brown' },
        { label: '奶牛色', value: 'cow' },
        { label: '狸花色', value: 'tabby' }
      ],
      size: [
        { label: '小型', value: 'small', desc: '5kg以下' },
        { label: '中型', value: 'medium', desc: '5-15kg' },
        { label: '大型', value: 'large', desc: '15kg以上' }
      ],
      gender: [
        { label: '公', value: 'male' },
        { label: '母', value: 'female' },
        { label: '未知', value: 'unknown' }
      ],
      hasCollar: [
        { label: '有项圈', value: 'yes' },
        { label: '无项圈', value: 'no' },
        { label: '不确定', value: 'unknown' }
      ],
      collarColor: [
        { label: '红色', value: 'red' },
        { label: '蓝色', value: 'blue' },
        { label: '黑色', value: 'black' },
        { label: '绿色', value: 'green' },
        { label: '黄色', value: 'yellow' },
        { label: '花色', value: 'multi' }
      ],
      isNeutered: [
        { label: '已绝育', value: 'yes' },
        { label: '未绝育', value: 'no' },
        { label: '不确定', value: 'unknown' }
      ],
      hasCollarBell: [
        { label: '有铃铛', value: 'yes' },
        { label: '无铃铛', value: 'no' },
        { label: '不确定', value: 'unknown' }
      ],
      // ===== 新增字段 =====

      // 品种（常见品种快速选择）
      breed: {
        cat: [
          { label: '中华田园猫', value: 'chinese_garden' },
          { label: '橘猫', value: 'orange_cat' },
          { label: '狸花猫', value: 'tabby_cat' },
          { label: '暹罗猫', value: 'siamese' },
          { label: '布偶猫', value: 'ragdoll' },
          { label: '英短', value: 'british_shorthair' },
          { label: '美短', value: 'american_shorthair' },
          { label: '波斯猫', value: 'persian' },
          { label: '缅因猫', value: 'maine_coon' },
          { label: '折耳猫', value: 'scottish_fold' },
          { label: '无毛猫', value: 'sphynx' },
          { label: '其他品种', value: 'other_cat' }
        ],
        dog: [
          { label: '中华田园犬', value: 'chinese_garden_dog' },
          { label: '金毛', value: 'golden_retriever' },
          { label: '拉布拉多', value: 'labrador' },
          { label: '柯基', value: 'corgi' },
          { label: '泰迪', value: 'poodle' },
          { label: '哈士奇', value: 'husky' },
          { label: '萨摩耶', value: 'samoyed' },
          { label: '柴犬', value: 'shiba_inu' },
          { label: '边牧', value: 'border_collie' },
          { label: '博美', value: 'pomeranian' },
          { label: '吉娃娃', value: 'chihuahua' },
          { label: '其他品种', value: 'other_dog' }
        ]
      },

      // 花纹/花色图案
      pattern: [
        { label: '纯色', value: 'solid' },
        { label: '虎斑/狸花', value: 'tabby' },
        { label: '奶牛黑白', value: 'cow' },
        { label: '三花', value: 'calico' },
        { label: '玳瑁', value: 'tortoiseshell' },
        { label: '双色/燕尾', value: 'bicolor' },
        { label: '重点色', value: 'point' },
        { label: '烟色', value: 'smoke' },
        { label: '其他花纹', value: 'other_pattern' }
      ],

      // 耳朵类型
      earType: [
        { label: '立耳', value: 'erect' },
        { label: '折耳', value: 'fold' },
        { label: '垂耳（狗）', value: 'floppy' },
        { label: '断耳/剪耳', value: 'cropped' },
        { label: '其他', value: 'other_ear' }
      ],

      // 尾巴类型
      tailType: [
        { label: '长尾', value: 'long' },
        { label: '短尾', value: 'short' },
        { label: '断尾', value: 'docked' },
        { label: '卷尾', value: 'curled' },
        { label: '麒麟尾', value: 'kinked' },
        { label: '无尾', value: 'tailless' },
        { label: '其他', value: 'other_tail' }
      ],

      // 体型/特殊标记
      specialMark: [
        { label: '无特殊标记', value: 'none' },
        { label: '白色围脖', value: 'white_collar' },
        { label: '白手套（白爪）', value: 'white_paws' },
        { label: '白口罩（白嘴）', value: 'white_muzzle' },
        { label: '白腹', value: 'white_belly' },
        { label: '眉斑/眉点', value: 'eyebrow_spot' },
        { label: '单/双眼皮', value: 'eyeliner' },
        { label: '其他标记', value: 'other_mark' }
      ],

      // 年龄估计
      age: [
        { label: '幼年（<1岁）', value: 'baby' },
        { label: '青年（1-3岁）', value: 'young' },
        { label: '中年（3-7岁）', value: 'adult' },
        { label: '老年（7岁+）', value: 'senior' },
        { label: '不确定', value: 'unknown_age' }
      ],

      // 健康状况
      healthStatus: [
        { label: '健康', value: 'healthy' },
        { label: '受伤', value: 'injured' },
        { label: '生病', value: 'sick' },
        { label: '怀孕', value: 'pregnant' },
        { label: '不确定', value: 'unknown_health' }
      ],

      // 性格特征
      personality: [
        { label: '亲人', value: 'friendly' },
        { label: '胆小', value: 'shy' },
        { label: '凶/警惕', value: 'aggressive' },
        { label: '活泼', value: 'active' },
        { label: '安静', value: 'quiet' },
        { label: '不确定', value: 'unknown_personality' }
      ],

      // 项圈形状/材质
      collarType: [
        { label: '普通织带', value: 'fabric' },
        { label: '皮质', value: 'leather' },
        { label: '链条', value: 'chain' },
        { label: '反光', value: 'reflective' },
        { label: '除蚤项圈', value: 'flea' },
        { label: '其他', value: 'other_collar' }
      ],

      // 是否佩戴狗牌
      hasTag: [
        { label: '有狗牌/铭牌', value: 'yes' },
        { label: '无狗牌', value: 'no' },
        { label: '不确定', value: 'unknown_tag' }
      ]
    }
  },

  onLaunch() {
    // 获取用户openid
    wx.cloud.init({
      env: 'cloudbase-d1grwg48id0ed6a9e',
      traceUser: true
    })
  }
})
