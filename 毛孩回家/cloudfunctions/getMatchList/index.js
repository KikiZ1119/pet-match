/**
 * 云函数：getMatchList
 * 根据上传的动物ID，查找匹配的走丢/捡到动物
 * 
 * 参数：
 *  sourceId: string - 源动物ID
 *  sourceCollection: string - 源集合 (found_animals / lost_pets)
 *  limit: number - 返回结果数量（默认20）
 */

const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command

// 颜色相似度映射
const COLOR_SIMILARITY = {
  'white': { 'white': 1, 'gray': 0.3 },
  'black': { 'black': 1, 'gray': 0.3, 'brown': 0.2 },
  'yellow': { 'yellow': 1, 'brown': 0.4, 'multi': 0.2 },
  'gray': { 'gray': 1, 'white': 0.3, 'black': 0.3 },
  'multi': { 'multi': 1, 'tabby': 0.4, 'cow': 0.4 },
  'brown': { 'brown': 1, 'yellow': 0.4, 'black': 0.2 },
  'cow': { 'cow': 1, 'multi': 0.5, 'black': 0.3, 'white': 0.3 },
  'tabby': { 'tabby': 1, 'multi': 0.5, 'brown': 0.3 }
}

const SIZE_ORDER = { 'small': 1, 'medium': 2, 'large': 3 }

exports.main = async (event, context) => {
  const { sourceId, sourceCollection, limit = 20 } = event
  
  if (!sourceId || !sourceCollection) {
    return { code: -1, message: '参数不完整', data: [] }
  }

  try {
    // 1. 获取源动物信息
    const sourceRes = await db.collection(sourceCollection).doc(sourceId).get()
    const source = sourceRes.data
    if (!source) {
      return { code: -1, message: '源动物不存在', data: [] }
    }

    // 2. 确定目标集合
    const targetCollection = sourceCollection === 'found_animals' ? 'lost_pets' : 'found_animals'

    // 3. 先按动物类型筛选（必须一致）
    const targetRes = await db.collection(targetCollection)
      .where({
        animalType: source.animalType
      })
      .limit(100)
      .get()

    const candidates = targetRes.data || []

    // 4. 计算匹配度
    const results = candidates.map(candidate => {
      const match = calculateMatch(source, candidate)
      return {
        animal: candidate,
        match
      }
    })

    // 5. 按匹配率降序排列
    results.sort((a, b) => b.match.matchRate - a.match.matchRate)

    // 6. 更新源动物的匹配次数
    await db.collection(sourceCollection).doc(sourceId).update({
      data: {
        matchCount: _.inc(1),
        lastMatchTime: db.serverDate()
      }
    })

    return {
      code: 0,
      message: 'success',
      data: results.slice(0, limit),
      total: results.length,
      source: source
    }

  } catch (err) {
    console.error(err)
    return { code: -1, message: err.message, data: [] }
  }
}

/**
 * 计算两个动物的匹配得分
 */
function calculateMatch(source, target) {
  let totalScore = 0
  const details = []
  const maxScore = 100

  // 1. 动物类型匹配（30分）
  if (source.animalType === target.animalType) {
    totalScore += 30
    details.push({ item: '动物类型', score: 30, maxScore: 30, status: 'match' })
  } else {
    details.push({ item: '动物类型', score: 0, maxScore: 30, status: 'mismatch' })
    return { totalScore: 0, details, matchRate: 0 }
  }

  // 2. 颜色匹配（15分）
  const colorScore = calcColorMatch(source.color, target.color)
  totalScore += colorScore
  details.push({ item: '颜色', score: colorScore, maxScore: 15, status: colorScore >= 10 ? 'match' : 'partial' })

  // 3. 品种匹配（15分）
  const breedScore = source.breed && target.breed && source.breed === target.breed ? 15 : 0
  totalScore += breedScore
  details.push({ item: '品种', score: breedScore, maxScore: 15, status: breedScore >= 10 ? 'match' : 'partial' })

  // 4. 地点匹配（15分）
  const locationScore = calcLocationMatch(source, target)
  totalScore += locationScore
  details.push({ item: '地点', score: locationScore, maxScore: 15, status: locationScore >= 8 ? 'match' : 'partial' })

  // 5. 体型匹配（8分）
  const sizeScore = calcSizeMatch(source.size, target.size)
  totalScore += sizeScore
  details.push({ item: '体型', score: sizeScore, maxScore: 8, status: sizeScore >= 5 ? 'match' : 'partial' })

  // 6. 花纹匹配（5分）
  const patternScore = source.pattern && target.pattern && source.pattern === target.pattern ? 5 : 0
  totalScore += patternScore
  details.push({ item: '花纹', score: patternScore, maxScore: 5 })

  // 7. 年龄匹配（4分）
  const ageScore = source.age && target.age && source.age === target.age ? 4 : 0
  totalScore += ageScore
  details.push({ item: '年龄', score: ageScore, maxScore: 4 })

  // 8. 特征组合（耳朵+尾巴+性格+绝育）（5分）
  let featureScore = 0
  if (source.earType && target.earType && source.earType === target.earType) featureScore += 1.25
  if (source.tailType && target.tailType && source.tailType === target.tailType) featureScore += 1.25
  if (source.personality && target.personality && source.personality === target.personality) featureScore += 1.25
  if (source.isNeutered && target.isNeutered && source.isNeutered === target.isNeutered) featureScore += 1.25
  totalScore += featureScore
  details.push({ item: '其他特征', score: Math.round(featureScore), maxScore: 5 })

  // 9. 项圈匹配（3分）
  const collarScore = calcCollarMatch(source, target)
  totalScore += collarScore
  details.push({ item: '项圈', score: collarScore, maxScore: 3 })

  const matchRate = Math.min(100, Math.round((totalScore / maxScore) * 100))

  return {
    totalScore: Math.min(100, totalScore),
    matchRate,
    details,
    level: matchRate >= 80 ? 'high' : matchRate >= 60 ? 'medium' : matchRate >= 40 ? 'low' : 'very_low',
    levelText: matchRate >= 80 ? '高度匹配' : matchRate >= 60 ? '可能匹配' : matchRate >= 40 ? '低度匹配' : '不匹配'
  }
}

function calcColorMatch(c1, c2) {
  if (!c1 || !c2) return 5
  if (c1 === c2) return 15
  const sim = COLOR_SIMILARITY[c1]?.[c2] || COLOR_SIMILARITY[c2]?.[c1] || 0
  return Math.round(15 * sim)
}

function calcLocationMatch(a, b) {
  if (!a.location || !b.location) return 5
  if (a.locationName === b.locationName) return 15
  if (a.locationName?.includes(b.locationName) || b.locationName?.includes(a.locationName)) {
    return 12
  }
  if (a.location.latitude && a.location.longitude && b.location.latitude && b.location.longitude) {
    const distance = getDistance(a.location, b.location)
    if (distance <= 1) return 15
    if (distance <= 3) return 12
    if (distance <= 5) return 8
    if (distance <= 10) return 5
    if (distance <= 20) return 3
    return 1
  }
  return 5
}

function getDistance(loc1, loc2) {
  const R = 6371
  const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180
  const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(loc1.latitude * Math.PI / 180) *
    Math.cos(loc2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function calcSizeMatch(s1, s2) {
  if (!s1 || !s2) return 4
  if (s1 === s2) return 8
  const diff = Math.abs(SIZE_ORDER[s1] - SIZE_ORDER[s2])
  if (diff === 1) return 5
  return 1
}

function calcCollarMatch(source, target) {
  let score = 0

  // 都有项圈
  if (source.hasCollar === 'yes' && target.hasCollar === 'yes') {
    score += 1
    // 项圈颜色匹配
    if (source.collarColor && target.collarColor && source.collarColor === target.collarColor) {
      score += 1.5
    } else if (source.collarColor && target.collarColor) {
      score += 0.5
    }
    // 铃铛匹配
    if (source.hasCollarBell === target.hasCollarBell && source.hasCollarBell === 'yes') {
      score += 0.5
    }
  } else if (source.hasCollar === 'no' && target.hasCollar === 'no') {
    score += 2 // 都没项圈也是一种匹配
  } else {
    score += 0.5 // 不确定情况
  }

  return Math.min(3, score)
}

function calcFeatureMatch(a, b) {
  let score = 0
  // 项圈匹配（5分）
  if (a.hasCollar === b.hasCollar) score += 3
  if (a.hasCollar === 'yes' && b.hasCollar === 'yes' && a.collarColor === b.collarColor) score += 2
  // 性别匹配（5分）
  if (a.gender === b.gender && a.gender !== 'unknown') score += 5
  else if (a.gender === 'unknown' || b.gender === 'unknown') score += 2
  // 绝育匹配（5分）
  if (a.isNeutered === b.isNeutered && a.isNeutered !== 'unknown') score += 5
  else if (a.isNeutered === 'unknown' || b.isNeutered === 'unknown') score += 2
  return Math.min(15, score)
}

function calcTimeMatch(source, target, sourceCollection) {
  // 捡到和走丢的时间越接近得分越高
  const sTime = new Date(source.createTime || source.foundDate || Date.now()).getTime()
  const tTime = new Date(target.createTime || target.lostDate || Date.now()).getTime()
  const diffDays = Math.abs(sTime - tTime) / (1000 * 60 * 60 * 24)
  
  if (diffDays <= 3) return 10
  if (diffDays <= 7) return 8
  if (diffDays <= 14) return 6
  if (diffDays <= 30) return 4
  return 2
}
