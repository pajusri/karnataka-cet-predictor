/**
 * Scores each college+branch group and returns the top N picks.
 *
 * Scoring (out of 100):
 *   - Round coverage 40pts  : qualifies in more rounds = more reliable
 *   - Fit            35pts  : cutoff 1–8% above rank = sweet spot
 *   - Stability      25pts  : low variance across rounds = predictable
 */
export function getTopPicks(groups, rank, roundKeys, n = 5) {
  // Ignore mock (round 0) for scoring — use actual allotment rounds only
  const actualKeys = roundKeys.filter(rk => !rk.endsWith('_0'))
  if (actualKeys.length === 0) return []

  const scored = groups
    .filter(g =>
      actualKeys.some(rk => g.rounds[rk] != null && g.rounds[rk] >= rank)
    )
    .map(g => {
      const allCutoffs      = actualKeys.map(rk => g.rounds[rk]).filter(c => c != null)
      const qualifiedCutoffs = allCutoffs.filter(c => c >= rank)

      // ── Factor 1: Round coverage ──
      const coverageScore = (qualifiedCutoffs.length / actualKeys.length) * 40

      // ── Factor 2: Fit (gap between best cutoff and rank) ──
      const bestCutoff = Math.min(...qualifiedCutoffs)
      const gapPct     = (bestCutoff - rank) / rank
      let fitScore = 0
      if      (gapPct >= 0.01 && gapPct <= 0.05) fitScore = 35 // perfect
      else if (gapPct >  0.05 && gapPct <= 0.10) fitScore = 28 // good
      else if (gapPct >= 0    && gapPct <  0.01) fitScore = 18 // borderline
      else if (gapPct >  0.10)                   fitScore = 12 // too easy

      // ── Factor 3: Stability (coefficient of variation) ──
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

      return { ...g, score: totalScore, bestCutoff, firstRound, qualifiedCount: qualifiedCutoffs.length }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, n)

  return scored
}
