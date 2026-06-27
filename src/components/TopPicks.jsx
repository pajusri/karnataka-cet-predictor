function formatRound(rk, roundLabels) {
  if (!rk) return '—'
  const label = roundLabels[rk] || rk
  const m = label.match(/Round\s+(\d)/i)
  return m ? `Round ${m[1]}` : label
}

export default function TopPicks({ picks, rank, roundLabels }) {
  if (!picks || picks.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🤖</span>
        <div>
          <h2 className="text-gray-800 font-semibold text-base">AI Top Picks for You</h2>
          <p className="text-xs text-gray-400">
            Based on round coverage, closeness to your rank, and cutoff stability
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {picks.map((p, i) => {
          const gap = p.bestCutoff - rank
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(p.college_name + ' Karnataka')}`

          return (
            <div key={i}
              className="border border-gray-100 rounded-lg p-4 hover:border-kea-blue hover:shadow-sm transition-all">

              {/* Pick badge + code */}
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-kea-orange bg-orange-50 px-2 py-0.5 rounded-full">
                  #{i + 1} Pick
                </span>
                <span className="text-xs text-gray-400 font-mono">{p.college_code}</span>
              </div>

              {/* College name — clickable link to Google */}
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs font-semibold text-kea-blue hover:underline leading-snug line-clamp-2 mb-1"
                title="Click to search this college on Google"
              >
                {p.college_name}
              </a>

              {/* Branch */}
              <p className="text-xs text-gray-500 mb-4 leading-snug">{p.branch}</p>

              {/* Stats */}
              <div className="flex justify-between text-xs text-gray-500 border-t border-gray-50 pt-3">
                <div>
                  <p className="text-gray-400 mb-0.5">Best Cutoff</p>
                  <p className="font-semibold text-gray-700">{p.bestCutoff.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 mb-0.5">Gap above rank</p>
                  <p className="font-semibold text-green-600">+{gap.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 mb-0.5">First in</p>
                  <p className="font-semibold text-gray-700">{formatRound(p.firstRound, roundLabels)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-300 mt-4 text-center">
        Predictions based on previous year KEA data · Not a guarantee of admission
      </p>
    </div>
  )
}
