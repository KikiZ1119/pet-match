/**
 * 云函数：getAnimalDetail
 * 获取动物详情并递增浏览量
 * 
 * 参数：
 *  collection: string - 集合名
 *  id: string - 文档ID
 */
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { collection, id } = event

  if (!collection || !id) {
    return { code: -1, message: '参数不完整' }
  }

  try {
    const res = await db.collection(collection).doc(id).get()
    
    // 异步更新浏览量
    await db.collection(collection).doc(id).update({
      data: {
        viewCount: _.inc(1)
      }
    })

    return {
      code: 0,
      message: 'success',
      data: res.data
    }

  } catch (err) {
    console.error(err)
    return { code: -1, message: err.message }
  }
}
