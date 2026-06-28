// District keyword map — matches against college_name which usually contains the address
const DISTRICT_KEYWORDS = {
  'Bangalore (Urban)': ['bangalore', 'bengaluru'],
  'Bangalore (Rural)': ['bangalore', 'bengaluru', 'ramanagara', 'kolar'],
  'Mysuru':            ['mysore', 'mysuru'],
  'Mangaluru':         ['mangalore', 'mangaluru'],
  'Hubli / Dharwad':   ['hubli', 'dharwad', 'hubballi'],
  'Belagavi':          ['belagavi', 'belgaum'],
  'Tumakuru':          ['tumkur', 'tumakuru'],
  'Davangere':         ['davangere', 'davanagere'],
  'Shivamogga':        ['shivamogga', 'shimoga'],
  'Kalaburagi':        ['kalaburagi', 'gulbarga'],
  'Ballari':           ['ballari', 'bellary'],
  'Hassan':            ['hassan'],
  'Mandya':            ['mandya'],
  'Udupi':             ['udupi'],
  'Chikmagalur':       ['chikmagalur', 'chikkamagaluru'],
  'Raichur':           ['raichur'],
  'Bidar':             ['bidar'],
  'Vijayapura':        ['vijayapura', 'bijapur'],
  'Bagalkot':          ['bagalkot'],
  'Chitradurga':       ['chitradurga'],
  'Kolar':             ['kolar'],
  'Ramanagara':        ['ramanagara', 'ramanagar'],
  'Gadag':             ['gadag'],
  'Haveri':            ['haveri'],
  'Koppal':            ['koppal'],
  'Yadgir':            ['yadgir'],
  'Chamarajanagar':    ['chamarajanagar', 'chamarajnagar'],
  'Chikkaballapur':    ['chikkaballapur', 'chikballapur'],
}

function matchesDistrict(collegeName, district) {
  const keywords = DISTRICT_KEYWORDS[district]
  if (!keywords) return false
  const name = collegeName.toLowerCase()
  return keywords.some(kw => name.includes(kw))
}

export function getTopPicks(groups, rank, roundKeys, n = 5, { branch = '', district = '' } = {}) {
  const actualKeys = roundKeys.filter(rk => !rk.endsWith('_0'))
  if (actualKeys.length === 0) return []

  // Only colleges where student qualifies in at least one actual round
  let pool = groups.filter(g =>
    actualKeys.some(rk => g.rounds[rk] != null && g.rounds[rk] >= rank)
  )

  const scored = pool.map(g => {
    const allCutoffs       = actualKeys.map(rk => g.rounds[rk]).filter(c => c != null)
    const qualifiedCutoffs = allCutoffs.filter(c => c >= rank)

    // Factor 1: Round coverage (40pts)
    const coverageScore = (qualifiedCutoffs.length / actualKeys.length) * 40

    // Factor 2: Fit — gap between best cutoff and rank (35pts)
    const bestCutoff = Math.min(...qualifiedCutoffs)
    const gapPct     = (bestCutoff - rank) / rank
    let fitScore = 0
    if      (gapPct >= 0.01 && gapPct <= 0.05) fitScore = 35
    else if (gapPct >  0.05 && gapPct <= 0.10) fitScore = 28
    else if (gapPct >= 0    && gapPct <  0.01) fitScore = 18
    else if (gapPct >  0.10)                   fitScore = 12

    // Factor 3: Stability — coefficient of variation (25pts)
    let stabilityScore = 25
    if (allCutoffs.length > 1) {
      const mean     = allCutoffs.reduce((a, b) => a + b, 0) / allCutoffs.length
      const variance = allCutoffs.reduce((s, c) => s + (c - mean) ** 2, 0) / allCutoffs.length
      const cv       = Math.sqrt(variance) / mean
      if      (cv < 0.03) stabilityScore = 25
      else if (cv < 0.07) stabilityScore = 18
      else if (cv < 0.15) stabilityScore = 10
      else                stabilityScore = 4
    }

    const totalScore = Math.round(coverageScore + fitScore + stabilityScore)
    const firstRound = actualKeys.find(rk => g.rounds[rk] != null && g.rounds[rk] >= rank)
    const inDistrict = district ? matchesDistrict(g.college_name, district) : false

    return { ...g, score: totalScore, bestCutoff, firstRound, qualifiedCount: qualifiedCutoffs.length, inDistrict }
  })

  // Sort by most selective first: lowest qualifying cutoff = hardest to get = top college
  const sorted = scored.sort((a, b) => a.bestCutoff - b.bestCutoff)

  const inBranch = g => branch ? g.branch.toLowerCase() === branch.toLowerCase() : true

  // Priority order: branch+district → branch only → district only → rest
  if (branch && district) {
    const g1 = sorted.filter(g =>  inBranch(g) &&  g.inDistrict)
    const g2 = sorted.filter(g =>  inBranch(g) && !g.inDistrict)
    const g3 = sorted.filter(g => !inBranch(g) &&  g.inDistrict)
    const g4 = sorted.filter(g => !inBranch(g) && !g.inDistrict)
    return [...g1, ...g2, ...g3, ...g4].slice(0, n)
  }

  if (branch) {
    const preferred = sorted.filter(g =>  inBranch(g))
    const others    = sorted.filter(g => !inBranch(g))
    return [...preferred, ...others].slice(0, n)
  }

  if (district) {
    const inDist  = sorted.filter(g =>  g.inDistrict)
    const outDist = sorted.filter(g => !g.inDistrict)
    return [...inDist, ...outDist].slice(0, n)
  }

  return sorted.slice(0, n)
}
