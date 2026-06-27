import { useState, useMemo } from 'react'

function RoundCell({ cutoff, rank }) {
  if (cutoff == null)
    return <td className="px-3 py-3 text-center text-gray-300 text-xs">—</td>
  const qualifies = cutoff >= rank
  return (
    <td className={`px-3 py-3 text-center text-sm font-semibold
      ${qualifies ? 'text-green-700 bg-green-50' : 'text-gray-400'}`}>
      {cutoff.toLocaleString()}
    </td>
  )
}

function MatchBadge({ qualified, total }) {
  const all = qualified === total
  const none = qualified === 0
  const cls = all
    ? 'bg-green-100 text-green-800'
    : none
      ? 'bg-red-100 text-red-700'
      : 'bg-yellow-100 text-yellow-800'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {qualified}/{total}
    </span>
  )
}

function formatRoundLabel(label) {
  // Shorten label for column header, e.g. "2025 Round 2 — ROK" → "2025 R2"
  const m = label && label.match(/(\d{4})\s+Round\s+(\d)/i)
  return m ? `${m[1]} R${m[2]}` : (label || '?')
}

export default function ResultsTable({ results, rank, category, roundKeys, roundLabels }) {
  const [branchFilter, setBranchFilter] = useState('')
  const [collegeFilter, setCollegeFilter] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 50

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
      {/* Summary + filters */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          {results.length === 0 ? (
            <p className="text-red-600 font-medium">
              No colleges found for rank {rank} in {category}. Try a higher rank.
            </p>
          ) : (
            <p className="text-gray-800 font-semibold">
              <span className="text-kea-blue text-xl">{results.length}</span>{' '}
              <span className="text-gray-600 text-sm">
                colleges eligible — rank <strong>{rank}</strong> · category <strong>{category}</strong>
              </span>
            </p>
          )}
          {filtered.length !== results.length && (
            <p className="text-xs text-gray-400 mt-0.5">Showing {filtered.length} after filters</p>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Filter by branch…"
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-kea-blue"
            value={branchFilter}
            onChange={onFilter(setBranchFilter)}
          />
          <input
            type="text"
            placeholder="Filter by college…"
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-kea-blue"
            value={collegeFilter}
            onChange={onFilter(setCollegeFilter)}
          />
        </div>
      </div>

      {results.length > 0 && (
        <>
          {/* Legend */}
          <div className="px-6 py-2 border-b border-gray-50 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-green-100 inline-block" /> Green = you qualify
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-gray-100 inline-block" /> Gray = cutoff below your rank
            </span>
            <span>Match = rounds where you qualify / total rounds</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">Code</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">College</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch</th>
                  {roundKeys.map(rk => (
                    <th key={rk} className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center whitespace-nowrap">
                      {formatRoundLabel(roundLabels[rk])}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center w-20">Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((r, i) => (
                  <tr key={i} className="hover:bg-blue-50 transition-colors">
                    <td className="px-3 py-3 text-gray-400 text-xs font-mono">{r.college_code}</td>
                    <td className="px-3 py-3 text-gray-800 text-xs leading-snug max-w-xs">{r.college_name}</td>
                    <td className="px-3 py-3 text-gray-700 text-xs leading-snug max-w-xs">{r.branch}</td>
                    {roundKeys.map(rk => (
                      <RoundCell key={rk} cutoff={r.rounds[rk]} rank={rank} />
                    ))}
                    <td className="px-3 py-3 text-center">
                      <MatchBadge qualified={r.qualifiedCount} total={roundKeys.length} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-gray-500 text-xs">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
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
