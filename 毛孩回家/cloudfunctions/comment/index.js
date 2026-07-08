const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, animalId, content, commentId, collection } = event
  const { OPENID } = cloud.getWXContext()

  try {
    // 添加评论
    if (action === 'add') {
      if (!animalId || !content) {
        return { code: -1, message: '参数不完整' }
      }
      const res = await db.collection('comments').add({
        data: {
          animalId,
          collection: collection || 'found_animals',
          content,
          _openid: OPENID,
          createTime: db.serverDate(),
          likeCount: 0
        }
      })
      return { code: 0, message: '评论成功', data: { id: res._id } }
    }

    // 获取评论列表
    if (action === 'list') {
      const { page = 0, pageSize = 20 } = event
      const res = await db.collection('comments')
        .where({ animalId })
        .orderBy('createTime', 'desc')
        .skip(page * pageSize)
        .limit(pageSize)
        .get()
      
      // 获取评论者的用户信息
      const openids = [...new Set(res.data.map(c => c._openid))]
      // 简单处理，直接返回
      return { code: 0, data: res.data, total: res.data.length }
    }

    return { code: -1, message: '未知操作' }

  } catch (err) {
    return { code: -1, message: err.message }
  }
}
