/**
 * 云函数：getopenid
 * 获取当前用户的 OpenID
 */
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  return {
    openid: OPENID
  }
}
