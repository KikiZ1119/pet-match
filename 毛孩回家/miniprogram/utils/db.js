/**
 * 数据库操作工具
 * 封装了云开发数据库的常用操作
 */

const DB = wx.cloud.database()
const _ = DB.command

const COLLECTIONS = {
  FOUND: 'found_animals',      // 捡到的动物
  LOST: 'lost_pets',          // 走丢的宠物
  ADOPT: 'adopt_animals'      // 待领养的动物
}

/**
 * 上传捡到的动物信息
 */
async function uploadFoundAnimal(data) {
  const db = wx.cloud.database()
  return db.collection('found_animals').add({
    data: {
      ...data,
      status: '待匹配',       // 初始状态
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
      viewCount: 0,
      matchCount: 0
    }
  })
}

/**
 * 上传走丢宠物信息
 */
async function uploadLostPet(data) {
  const db = wx.cloud.database()
  return db.collection('lost_pets').add({
    data: {
      ...data,
      status: '寻找中',
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
      viewCount: 0
    }
  })
}

/**
 * 分页查询捡到的动物
 */
async function getFoundAnimals({ page = 0, pageSize = 10, filters = {} } = {}) {
  const db = wx.cloud.database()
  let query = db.collection('found_animals')
  
  // 构建筛选条件
  const conditions = buildFilterConditions(filters)
  
  return query
    .where(conditions)
    .orderBy('createTime', 'desc')
    .skip(page * pageSize)
    .limit(pageSize)
    .get()
}

/**
 * 分页查询走丢的宠物
 */
async function getLostPets({ page = 0, pageSize = 10, filters = {} } = {}) {
  const db = wx.cloud.database()
  let query = db.collection('lost_pets')
  
  const conditions = buildFilterConditions(filters)
  
  return query
    .where(conditions)
    .orderBy('createTime', 'desc')
    .skip(page * pageSize)
    .limit(pageSize)
    .get()
}

/**
 * 构建筛选条件
 */
function buildFilterConditions(filters) {
  const conditions = {}
  
  if (filters.animalType) {
    conditions.animalType = filters.animalType
  }
  if (filters.color) {
    conditions.color = filters.color
  }
  if (filters.size) {
    conditions.size = filters.size
  }
  if (filters.gender) {
    conditions.gender = filters.gender
  }
  if (filters.hasCollar) {
    conditions.hasCollar = filters.hasCollar
  }
  if (filters.isNeutered) {
    conditions.isNeutered = filters.isNeutered
  }
  
  return conditions
}

/**
 * 根据ID获取详情
 */
async function getAnimalDetail(collection, id) {
  const db = wx.cloud.database()
  return db.collection(collection).doc(id).get()
}

/**
 * 更新浏览量
 */
async function incrementViewCount(collection, id) {
  const db = wx.cloud.database()
  return db.collection(collection).doc(id).update({
    data: {
      viewCount: _.inc(1)
    }
  })
}

/**
 * 获取我的发布记录
 */
async function getMyPosts(openid) {
  const db = wx.cloud.database()
  const [found, lost] = await Promise.all([
    db.collection('found_animals').where({ _openid: openid }).orderBy('createTime', 'desc').get(),
    db.collection('lost_pets').where({ _openid: openid }).orderBy('createTime', 'desc').get()
  ])
  
  return {
    found: found.data,
    lost: lost.data
  }
}

module.exports = {
  COLLECTIONS,
  uploadFoundAnimal,
  uploadLostPet,
  getFoundAnimals,
  getLostPets,
  getAnimalDetail,
  incrementViewCount,
  getMyPosts,
  buildFilterConditions
}
