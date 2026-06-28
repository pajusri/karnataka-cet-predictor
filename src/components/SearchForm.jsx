import { useState, useRef, useEffect } from 'react'
import { CATEGORIES } from '../App'
import { DISTRICTS } from '../utils/districts.js'

function BranchCombobox({ value, onChange, options }) {
  const [query, setQuery]       = useState(value || '')
  const [open, setOpen]         = useState(false)
  const [highlighted, setHigh]  = useState(0)
  const containerRef            = useRef(null)

  // Keep displayed text in sync when parent clears the value
  useEffect(() => { if (!value) setQuery('') }, [value])

  const matches = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options

  function select(branch) {
    setQuery(branch)
    onChange(branch)
    setOpen(false)
  }

  function clear() {
    setQuery('')
    onChange('')
    setOpen(false)
  }

  function handleKey(e) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true)
      return
    }
    if (e.key === 'ArrowDown')  { e.preventDefault(); setHigh(h => Math.min(h + 1, matches.length - 1)) }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setHigh(h => Math.max(h - 1, 0)) }
    if (e.key === 'Enter')      { if (matches[highlighted]) select(matches[highlighted]) }
    if (e.key === 'Escape')     { setOpen(false) }
  }

  // Close on outside click
  useEffect(() => {
    function onClick(e) { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="Type to search branch…"
          className="h-10 w-full px-3 pr-8 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-kea-blue"
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(''); setOpen(true); setHigh(0) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
        />
        {query ? (
          <button
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            tabIndex={-1}
          >×</button>
        ) : (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">▾</span>
        )}
      </div>

      {open && (
        <ul className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-gray-400 italic text-xs">No branches match</li>
          ) : (
            matches.map((b, i) => (
              <li
                key={b}
                className={`px-3 py-2 cursor-pointer text-xs leading-snug
                  ${i === highlighted ? 'bg-blue-50 text-kea-blue' : 'text-gray-700 hover:bg-gray-50'}`}
                onMouseDown={() => select(b)}
                onMouseEnter={() => setHigh(i)}
              >
                {b}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export default function SearchForm({
  courses,
  activeCourse,
  onCourseChange,
  rank,
  onRankChange,
  rankError,
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
            className={`h-10 px-3 border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-kea-blue
              ${rankError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            value={rank}
            onChange={e => onRankChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {rankError && <p className="text-xs text-red-500 mt-1">{rankError}</p>}
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
            <BranchCombobox
              value={preferredBranch}
              onChange={onPreferredBranchChange}
              options={uniqueBranches}
            />
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
