import { CATEGORIES } from '../App'

const DISTRICTS = [
  'Bangalore (Urban)',
  'Bangalore (Rural)',
  'Mysuru',
  'Mangaluru',
  'Hubli / Dharwad',
  'Belagavi',
  'Tumakuru',
  'Davangere',
  'Shivamogga',
  'Kalaburagi',
  'Ballari',
  'Hassan',
  'Mandya',
  'Udupi',
  'Chikmagalur',
  'Raichur',
  'Bidar',
  'Vijayapura',
  'Bagalkot',
  'Chitradurga',
  'Kolar',
  'Ramanagara',
  'Gadag',
  'Haveri',
  'Koppal',
  'Yadgir',
  'Chamarajanagar',
  'Chikkaballapur',
]

export default function SearchForm({
  courses,
  activeCourse,
  onCourseChange,
  rank,
  onRankChange,
  category,
  onCategoryChange,
  onSearch,
  dataLoading,
  dataReady,
  noData,
  roundCount,
  district,
  onDistrictChange,
  preferredBranch,
  onPreferredBranchChange,
  uniqueBranches,
}) {
  function handleKeyDown(e) {
    if (e.key === 'Enter') onSearch()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">

      {/* Course tabs */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Select Course</p>
        <div className="flex flex-wrap gap-2">
          {courses.map(c => (
            <button
              key={c.id}
              onClick={() => onCourseChange(c.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-150
                ${activeCourse === c.id
                  ? 'bg-kea-blue text-white border-kea-blue'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-kea-blue hover:text-kea-blue'
                }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <p className="text-xs mt-2 h-4">
          {dataLoading && <span className="text-gray-400">Loading data…</span>}
          {!dataLoading && noData && (
            <span className="text-amber-600">No data yet for this course.</span>
          )}
          {!dataLoading && dataReady && (
            <span className="text-green-600">
              {roundCount} round{roundCount !== 1 ? 's' : ''} loaded — search will cover all rounds
            </span>
          )}
        </p>
      </div>

      {/* Rank + Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Your CET Rank
          </label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 5000"
            className="h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-kea-blue"
            value={rank}
            onChange={e => onRankChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Your Category
          </label>
          <select
            className="h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-kea-blue"
            value={category}
            onChange={e => onCategoryChange(e.target.value)}
          >
            {CATEGORIES.map(({ group, items }) => (
              <optgroup key={group} label={group}>
                {items.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* AI Picks preferences */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          AI Picks Preferences <span className="normal-case font-normal text-gray-400">(optional — helps suggest better colleges)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500">Preferred District</label>
            <select
              className="h-10 px-3 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-kea-blue"
              value={district}
              onChange={e => onDistrictChange(e.target.value)}
            >
              <option value="">Any district</option>
              {DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500">Preferred Branch</label>
            <select
              className="h-10 px-3 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-kea-blue"
              value={preferredBranch}
              onChange={e => onPreferredBranchChange(e.target.value)}
            >
              <option value="">Any branch</option>
              {uniqueBranches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onSearch}
          disabled={!rank || !dataReady || dataLoading}
          className="bg-kea-blue text-white px-8 py-2.5 rounded-lg font-medium text-sm
                     hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-150"
        >
          Find Colleges
        </button>
        <p className="text-xs text-gray-400">
          Lower rank = better. Results cover all loaded rounds.
        </p>
      </div>
    </div>
  )
}
