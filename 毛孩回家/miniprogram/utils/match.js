/**
 * 智能匹配算法
 * 
 * 匹配规则（权重越高越重要）：
 * - 动物类型（猫/狗）：30分 — 必须一致
 * - 颜色：15分 — 一致则满分，近似则部分得分
 * - 品种：15分 — 一致则满分
 * - 地点距离：15分 — 根据距离远近递减
 * - 体型：8分 — 一致则满分
 * - 花纹：5分
 * - 年龄：4分
 * - 特征组合（耳朵+尾巴+性格+绝育）：5分
 * - 项圈特征：3分
 */

// 颜色相似度映射（近似颜色也算部分匹配）
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

// 体型标准
const SIZE_ORDER = { 'small': 1, 'medium': 2, 'large': 3 }

/**
 * 计算两个动物的匹配得分
 * @param {Object} found - 捡到的动物
 * @param {Object} lost - 走丢的宠物
 * @returns {Object} 匹配结果 { score, details }
 */
function calculateMatch(found, lost) {
  let totalScore = 0
  const details = []
  const maxScore = 100

  // 1. 动物类型匹配（30分）
  if (found.animalType === lost.animalType) {
    totalScore += 30
    details.push({ item: '动物类型', score: 30, maxScore: 30, status: 'match' })
  } else {
    details.push({ item: '动物类型', score: 0, maxScore: 30, status: 'mismatch' })
    return { totalScore: 0, details, matchRate: 0 }
  }

  // 2. 颜色匹配（15分）
  const colorScore = calculateColorMatch(found.color, lost.color)
  totalScore += colorScore
  details.push({ item: '颜色', score: colorScore, maxScore: 15, status: colorScore >= 10 ? 'match' : 'partial' })

  // 3. 品种匹配（15分）
  const breedScore = found.breed && lost.breed && found.breed === lost.breed ? 15 : 0
  totalScore += breedScore
  details.push({ item: '品种', score: breedScore, maxScore: 15, status: breedScore >= 10 ? 'match' : 'partial' })

  // 4. 地点匹配（15分）
  const locationScore = calculateLocationMatch(found.location, lost.location, found.locationName, lost.locationName)
  totalScore += locationScore
  details.push({ item: '地点', score: locationScore, maxScore: 15, status: locationScore >= 8 ? 'match' : 'partial' })

  // 5. 体型匹配（8分）
  const sizeScore = calculateSizeMatch(found.size, lost.size)
  totalScore += sizeScore
  details.push({ item: '体型', score: sizeScore, maxScore: 8, status: sizeScore >= 5 ? 'match' : 'partial' })

  // 6. 花纹匹配（5分）
  const patternScore = found.pattern && lost.pattern && found.pattern === lost.pattern ? 5 : 0
  totalScore += patternScore
  details.push({ item: '花纹', score: patternScore, maxScore: 5 })

  // 7. 年龄匹配（4分）
  const ageScore = found.age && lost.age && found.age === lost.age ? 4 : 0
  totalScore += ageScore
  details.push({ item: '年龄', score: ageScore, maxScore: 4 })

  // 8. 特征组合（耳朵+尾巴+性格+绝育）（5分）
  let featureScore = 0
  if (found.earType && lost.earType && found.earType === lost.earType) featureScore += 1.25
  if (found.tailType && lost.tailType && found.tailType === lost.tailType) featureScore += 1.25
  if (found.personality && lost.personality && found.personality === lost.personality) featureScore += 1.25
  if (found.isNeutered && lost.isNeutered && found.isNeutered === lost.isNeutered) featureScore += 1.25
  totalScore += featureScore
  details.push({ item: '其他特征', score: Math.round(featureScore), maxScore: 5 })

  // 9. 项圈匹配（3分）
  const collarScore = calculateCollarMatch(found, lost)
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

/**
 * 计算颜色匹配得分
 */
function calculateColorMatch(color1, color2) {
  if (!color1 || !color2) return 0
  if (color1 === color2) return 15
  
  const sim = COLOR_SIMILARITY[color1]?.[color2] || COLOR_SIMILARITY[color2]?.[color1] || 0
  return Math.round(15 * sim)
}

/**
 * 计算地点匹配得分
 * 简单实现：比较地点名称，相同得满分，含关键字得部分分
 */
function calculateLocationMatch(loc1, loc2, name1, name2) {
  if (!loc1 && !loc2) return 8
  if (!loc1 || !loc2) return 0

  // 如果地点名称相同
  if (name1 === name2) return 15

  // 如果名称互相包含
  if ((name1 && name2) && (name1.includes(name2) || name2.includes(name1))) {
    return 12
  }

  // 有坐标的话计算距离
  if (loc1.latitude && loc1.longitude && loc2.latitude && loc2.longitude) {
    const distance = getDistance(loc1, loc2)
    if (distance <= 1) return 15       // 1公里内
    if (distance <= 3) return 12       // 3公里内
    if (distance <= 5) return 8        // 5公里内
    if (distance <= 10) return 5       // 10公里内
    if (distance <= 20) return 3       // 20公里内
    return 1                           // 更远
  }

  return 5 // 无法判断时给中间分
}

/**
 * 计算两点之间的距离（km）- Haversine公式
 */
function getDistance(loc1, loc2) {
  const R = 6371 // 地球半径 km
  const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180
  const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 计算体型匹配得分
 */
function calculateSizeMatch(size1, size2) {
  if (!size1 || !size2) return 4
  if (size1 === size2) return 8
  // 相邻的体型给部分分
  const diff = Math.abs(SIZE_ORDER[size1] - SIZE_ORDER[size2])
  if (diff === 1) return 5
  return 1
}

/**
 * 计算性别匹配得分
 */
function calculateGenderMatch(gender1, gender2) {
  if (!gender1 || !gender2) return 2
  if (gender1 === 'unknown' || gender2 === 'unknown') return 3
  if (gender1 === gender2) return 5
  return 0
}

/**
 * 计算项圈匹配得分
 */
function calculateCollarMatch(found, lost) {
  let score = 0

  // 都有项圈
  if (found.hasCollar === 'yes' && lost.hasCollar === 'yes') {
    score += 1
    // 项圈颜色匹配
    if (found.collarColor && lost.collarColor && found.collarColor === lost.collarColor) {
      score += 1.5
    } else if (found.collarColor && lost.collarColor) {
      score += 0.5
    }
    // 铃铛匹配
    if (found.hasCollarBell === lost.hasCollarBell && found.hasCollarBell === 'yes') {
      score += 0.5
    }
  } else if (found.hasCollar === 'no' && lost.hasCollar === 'no') {
    score += 2 // 都没项圈也是一种匹配
  } else {
    score += 0.5 // 不确定情况
  }

  return Math.min(3, score)
}

/**
 * 计算绝育匹配（加分项，最高5分）
 */
function calculateNeuteredMatch(found, lost) {
  if (!found || !lost) return 0
  if (found === 'unknown' || lost === 'unknown') return 2
  if (found === lost) return 3
  return 0
}

/**
 * 批量匹配：将一个动物与一堆候选动物匹配
 * @param {Object} target - 目标动物
 * @param {Array} candidates - 候选列表
 * @param {string} type - 'found_to_lost' 或 'lost_to_found'
 * @returns {Array} 按匹配度排序的结果
 */
function batchMatch(target, candidates, type = 'found_to_lost') {
  const results = candidates.map(candidate => {
    let matchResult
    if (type === 'found_to_lost') {
      matchResult = calculateMatch(target, candidate)
    } else {
      matchResult = calculateMatch(candidate, target)
    }
    return {
      animal: candidate,
      match: matchResult
    }
  })

  // 按匹配率从高到低排序
  results.sort((a, b) => b.match.matchRate - a.match.matchRate)

  // 过滤掉完全不匹配的（0分）
  return results.filter(r => r.match.totalScore > 0)
}

module.exports = {
  calculateMatch,
  batchMatch,
  getDistance
}
