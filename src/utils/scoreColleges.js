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

    // District bonus: +20pts if college is in preferred district
    const districtBonus = (district && matchesDistrict(g.college_name, district)) ? 20 : 0

    const totalScore = Math.round(coverageScore + fitScore + stabilityScore + districtBonus)
    const firstRound = actualKeys.find(rk => g.rounds[rk] != null && g.rounds[rk] >= rank)

    return { ...g, score: totalScore, bestCutoff, firstRound, qualifiedCount: qualifiedCutoffs.length }
  })

  // For very high ranks (rank <= 500), every college qualifies — sort by most selective
  // (lowest cutoff = hardest to get = most prestigious)
  const sorted = rank <= 500
    ? scored.sort((a, b) => a.bestCutoff - b.bestCutoff)
    : scored.sort((a, b) => b.score - a.score)

  // Preferred branch always comes first; fill remaining spots with other branches
  if (branch) {
    const b = branch.toLowerCase()
    const preferred = sorted.filter(g => g.branch.toLowerCase() === b)
    const others    = sorted.filter(g => g.branch.toLowerCase() !== b)
    return [...preferred, ...others].slice(0, n)
  }

  return sorted.slice(0, n)
}
