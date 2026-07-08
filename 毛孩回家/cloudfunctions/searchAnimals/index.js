/**
 * 云函数：searchAnimals
 * 搜索动物（关键字搜索品种、颜色、地点、描述等）
 * 
 * 参数：
 *  keyword: string - 搜索关键词
 *  collection: string - 搜索的集合（found_animals / lost_pets）
 *  page: number - 页码
 *  pageSize: number - 每页数量
 */
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { keyword, collection = 'found_animals', page = 0, pageSize = 10 } = event

  if (!keyword) {
    return { code: -1, message: '请输入搜索关键词' }
  }

  try {
    // 使用正则表达式进行模糊搜索
    const regex = new RegExp(keyword, 'i')

    const res = await db.collection(collection)
      .where(_.or([
        { color: regex },
        { description: regex },
        { locationName: regex },
        { breed: regex },
        { collarColor: regex }
      ]))
      .orderBy('createTime', 'desc')
      .skip(page * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      message: 'success',
      data: res.data
    }

  } catch (err) {
    console.error(err)
    return { code: -1, message: err.message, data: [] }
  }
}
