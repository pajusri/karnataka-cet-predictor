import { useState, useMemo } from 'react'

function RoundCell({ cutoff, rank }) {
  if (cutoff == null)
    return (
      <td className="px-3 py-4 text-center">
        <span className="text-gray-200 text-xs">—</span>
      </td>
    )

  const qualifies = cutoff >= rank
  const closeMiss = !qualifies && cutoff >= Math.floor(rank * 0.95)

  if (qualifies) {
    return (
      <td className="px-3 py-4 text-center bg-green-50">
        <span className="inline-flex flex-col items-center gap-0.5">
          <span className="text-green-700 font-bold text-sm">✓ Likely</span>
          <span className="text-green-500 text-xs">{cutoff.toLocaleString()}</span>
        </span>
      </td>
    )
  }

  if (closeMiss) {
    return (
      <td className="px-3 py-4 text-center bg-yellow-50">
        <span className="inline-flex flex-col items-center gap-0.5">
          <span className="text-yellow-700 font-bold text-sm">~ Close</span>
          <span className="text-yellow-500 text-xs">{cutoff.toLocaleString()}</span>
        </span>
      </td>
    )
  }

  // Out of range — too competitive for this round
  return (
    <td className="px-3 py-4 text-center">
      <span className="inline-flex flex-col items-center gap-0.5">
        <span className="text-gray-300 text-sm">✗</span>
        <span className="text-gray-300 text-xs">{cutoff.toLocaleString()}</span>
      </span>
    </td>
  )
}

function shortRound(label) {
  if (!label) return '?'
  if (/mock/i.test(label)) return 'Mock'
  const m = label.match(/Round\s+(\d)/i)
  return m ? `Round ${m[1]}` : label
}

export default function ResultsTable({ results, rank, category, roundKeys, roundLabels }) {
  const [branchFilter, setBranchFilter]   = useState('')
  const [collegeFilter, setCollegeFilter] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 50

  const displayRoundKeys = roundKeys.filter(rk => !rk.endsWith('_0'))
  const mockKey = roundKeys.find(rk => rk.endsWith('_0'))

  const filtered = useMemo(() => {
    return results.filter(r => {
      const mb = !branchFilter  || r.branch.toLowerCase().includes(branchFilter.toLowerCase())
      const mc = !collegeFilter || r.college_name.toLowerCase().includes(collegeFilter.toLowerCase())
      return mb && mc
    })
  }, [results, branchFilter, collegeFilter])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function onFilter(setter) {
    return e => { setter(e.target.value); setPage(1) }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          {results.length === 0 ? (
            <p className="text-red-600 font-medium">
              No colleges found near rank {rank} for {category}. Try adjusting your rank.
            </p>
          ) : (
            <div>
              <p className="text-gray-800 font-semibold">
                <span className="text-kea-blue text-xl">{results.length}</span>
                <span className="text-gray-600 text-sm"> colleges near rank <strong>{rank}</strong> · {category}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Showing ranks {Math.floor(rank * 0.95).toLocaleString()} – {Math.ceil(rank * 1.10).toLocaleString()} across all rounds
              </p>
            </div>
          )}
          {filtered.length !== results.length && (
            <p className="text-xs text-gray-400 mt-0.5">{filtered.length} shown after filters</p>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <input type="text" placeholder="Filter branch…"
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-kea-blue"
            value={branchFilter} onChange={onFilter(setBranchFilter)} />
          <input type="text" placeholder="Filter college…"
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-kea-blue"
            value={collegeFilter} onChange={onFilter(setCollegeFilter)} />
        </div>
      </div>

      {results.length > 0 && (
        <>
          {/* Legend */}
          <div className="px-6 py-2 border-b border-gray-50 flex flex-wrap gap-5 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="text-green-700 font-bold">✓ Likely</span> — cutoff ≥ your rank
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-yellow-700 font-bold">~ Close</span> — within 5% below your rank, may open later
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-gray-400 font-bold">✗</span> — too competitive this round
            </span>
            <span className="italic text-gray-400">Cutoffs rise R1→R2→R3 as top rankers leave</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-14">Code</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">College</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch</th>
                  {displayRoundKeys.map(rk => (
                    <th key={rk} className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center whitespace-nowrap min-w-[90px]">
                      {shortRound(roundLabels[rk])}
                    </th>
                  ))}
                  {mockKey && (
                    <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center whitespace-nowrap min-w-[80px]">
                      Mock
                    </th>
                  )}
                  <th className="px-3 py-3 text-xs font-semibold text-kea-blue uppercase tracking-wide text-center min-w-[90px]">
                    Best Shot
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((r, i) => {
                  const firstQualify = displayRoundKeys.find(rk => r.rounds[rk] != null && r.rounds[rk] >= rank)
                  const firstClose   = displayRoundKeys.find(rk => {
                    const c = r.rounds[rk]
                    return c != null && c >= Math.floor(rank * 0.95) && c < rank
                  })
                  const bestRound = firstQualify || firstClose

                  return (
                    <tr key={i} className="hover:bg-blue-50 transition-colors">
                      <td className="px-3 py-4 text-gray-400 text-xs font-mono">{r.college_code}</td>
                      <td className="px-3 py-4 text-gray-800 text-xs leading-snug max-w-[200px]">{r.college_name}</td>
                      <td className="px-3 py-4 text-gray-600 text-xs leading-snug max-w-[180px]">{r.branch}</td>
                      {displayRoundKeys.map(rk => (
                        <RoundCell key={rk} cutoff={r.rounds[rk]} rank={rank} />
                      ))}
                      {mockKey && <RoundCell cutoff={r.rounds[mockKey]} rank={rank} />}
                      <td className="px-3 py-4 text-center">
                        {bestRound ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap
                            ${firstQualify ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {shortRound(roundLabels[bestRound])}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-gray-500 text-xs">Page {page} of {totalPages} · {filtered.length} results</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1 rounded border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  Previous
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1 rounded border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
