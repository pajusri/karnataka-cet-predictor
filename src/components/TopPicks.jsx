function ScoreBar({ score }) {
  const color =
    score >= 80 ? 'bg-green-500' :
    score >= 60 ? 'bg-blue-500'  :
    score >= 40 ? 'bg-yellow-500' : 'bg-gray-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-600 w-8 text-right">{score}</span>
    </div>
  )
}

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
            Scored on round coverage, fit to your rank, and cutoff stability
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {picks.map((p, i) => {
          const gap = p.bestCutoff - rank
          return (
            <div key={i}
              className="border border-gray-100 rounded-lg p-4 hover:border-kea-blue hover:shadow-sm transition-all">

              {/* Rank badge + score */}
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-kea-orange bg-orange-50 px-2 py-0.5 rounded-full">
                  #{i + 1} Pick
                </span>
                <span className="text-xs text-gray-400 font-mono">{p.college_code}</span>
              </div>

              {/* College + branch */}
              <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2 mb-1">
                {p.college_name}
              </p>
              <p className="text-xs text-kea-blue mb-3 leading-snug">{p.branch}</p>

              {/* Fit score bar */}
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1">Fit Score</p>
                <ScoreBar score={p.score} />
              </div>

              {/* Stats */}
              <div className="flex justify-between text-xs text-gray-500">
                <div>
                  <p className="text-gray-400">Best Cutoff</p>
                  <p className="font-semibold text-gray-700">{p.bestCutoff.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Gap</p>
                  <p className="font-semibold text-green-600">+{gap.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400">From</p>
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
