/**
 * 云函数：uploadAnimal
 * 上传动物信息到数据库（含图片处理）
 * 
 * 参数：
 *  type: 'found' | 'lost' - 类型
 *  data: Object - 动物信息
 *  images: [string] - 图片fileID列表
 */
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { type, data, images } = event
  const { OPENID } = cloud.getWXContext()

  if (!type || !data) {
    return { code: -1, message: '参数不完整' }
  }

  try {
    const collection = type === 'found' ? 'found_animals' : 'lost_pets'
    const baseData = {
      ...data,
      images: images || [],
      _openid: OPENID,
      viewCount: 0,
      matchCount: 0,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }

    if (type === 'found') {
      baseData.status = data.status || '待匹配'
    } else {
      baseData.status = data.status || '寻找中'
    }

    const result = await db.collection(collection).add({ data: baseData })

    return {
      code: 0,
      message: '上传成功',
      data: { id: result._id }
    }

  } catch (err) {
    console.error(err)
    return { code: -1, message: err.message }
  }
}
