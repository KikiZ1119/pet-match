/**
 * 云函数：getAdoptList
 * 获取待领养动物列表
 * 
 * 参数：
 *  page: number - 页码（从0开始）
 *  pageSize: number - 每页数量（默认10）
 *  animalType: string - 筛选动物类型（可选）
 */
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { page = 0, pageSize = 10, animalType } = event

  try {
    const whereCondition = { status: '待领养' }
    if (animalType && animalType !== 'all') {
      whereCondition.animalType = animalType
    }

    // 查询总数
    const countRes = await db.collection('found_animals')
      .where(whereCondition)
      .count()

    // 查询列表
    const listRes = await db.collection('found_animals')
      .where(whereCondition)
      .orderBy('createTime', 'desc')
      .skip(page * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      message: 'success',
      data: {
        list: listRes.data,
        total: countRes.total,
        hasMore: (page + 1) * pageSize < countRes.total
      }
    }

  } catch (err) {
    console.error(err)
    return { code: -1, message: err.message, data: { list: [], total: 0, hasMore: false } }
  }
}
