import { useState, useEffect } from 'react'
import Header from './components/Header'
import SearchForm from './components/SearchForm'
import ResultsTable from './components/ResultsTable'
import TopPicks from './components/TopPicks'
import { getTopPicks } from './utils/scoreColleges'

export const CATEGORIES = [
  { group: 'General Merit', items: ['GM', 'GMK', 'GMP', 'GMR'] },
  { group: 'Category 1',    items: ['1G', '1K', '1R'] },
  { group: 'Category 2A',   items: ['2AG', '2AK', '2AR'] },
  { group: 'Category 2B',   items: ['2BG', '2BK', '2BR'] },
  { group: 'Category 3A',   items: ['3AG', '3AK', '3AR'] },
  { group: 'Category 3B',   items: ['3BG', '3BK', '3BR'] },
  { group: 'SC',            items: ['SCG', 'SCK', 'SCR'] },
  { group: 'ST',            items: ['STG', 'STK', 'STR'] },
  { group: 'Others',        items: ['NRI', 'OPN', 'OTH'] },
]

export default function App() {
  const [courses, setCourses]           = useState([])
  const [activeCourse, setActiveCourse] = useState(null)
  const [allData, setAllData]           = useState([])
  const [roundKeys, setRoundKeys]       = useState([])
  const [roundLabels, setRoundLabels]   = useState({})
  const [dataLoading, setDataLoading]   = useState(false)
  const [noData, setNoData]             = useState(false)

  const [rank, setRank]                         = useState('')
  const [category, setCategory]                 = useState('GM')
  const [district, setDistrict]                 = useState('')
  const [preferredBranch, setPreferredBranch]   = useState('')
  const [results, setResults]                   = useState([])
  const [topPicks, setTopPicks]                 = useState([])
  const [hasSearched, setHasSearched]           = useState(false)

  useEffect(() => {
    fetch('/data/courses.json')
      .then(r => r.json())
      .then(data => {
        setCourses(data)
        if (data.length > 0) setActiveCourse(data[0].id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!activeCourse || courses.length === 0) return
    const course = courses.find(c => c.id === activeCourse)
    if (!course) return

    setDataLoading(true)
    setAllData([])
    setHasSearched(false)
    setNoData(false)

    fetch(`/data/${course.folder}/manifest.json`)
      .then(r => { if (!r.ok) throw new Error('no manifest'); return r.json() })
      .then(async manifest => {
        if (!manifest || manifest.length === 0) { setNoData(true); setDataLoading(false); return }

        const loaded = await Promise.all(
          manifest.map(entry =>
            fetch(`/data/${course.folder}/${entry.file}`)
              .then(r => r.json())
              .then(records => ({ entry, records }))
          )
        )

        const merged = loaded.flatMap(({ records }) => records)
        const rks = [...new Set(merged.map(r => `${r.year}_${r.round}`))].sort()
        const rls = {}
        for (const { entry } of loaded) rls[`${entry.year}_${entry.round}`] = entry.label

        setAllData(merged)
        setRoundKeys(rks)
        setRoundLabels(rls)
        setDataLoading(false)
        setPreferredBranch('')
      })
      .catch(() => { setNoData(true); setDataLoading(false) })
  }, [activeCourse, courses])

  function handleSearch() {
    const rankNum = parseInt(rank)
    if (!rank || isNaN(rankNum) || rankNum < 1 || allData.length === 0) return

    const lowerBound = Math.floor(rankNum * 0.95)  // 5% below rank  — close miss
    const upperBound = Math.ceil(rankNum * 1.10)   // 10% above rank — comfortable qualify

    // ── Build code↔name maps from known records ──
    const codeToName = {}
    for (const r of allData) {
      if (!r.college_code.startsWith('UNK') && r.college_name !== 'Unknown') {
        codeToName[r.college_code] = r.college_name
      }
    }

    // Normalise a college name to a stable key (removes punctuation/spacing differences)
    function normName(name) {
      return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
    }

    // ── Group by normalised name + branch so UNK records merge with known records ──
    const groups = {}
    for (const record of allData) {
      const code = record.college_code
      const name = record.college_name === 'Unknown'
        ? (codeToName[code] || 'Unknown')
        : record.college_name

      // Skip fully unresolvable records
      if (name === 'Unknown') continue

      // Key: normalised name + branch — works even when codes differ across rounds
      const key = `${normName(name)}||${record.branch}`

      if (!groups[key]) {
        groups[key] = {
          college_code: code.startsWith('UNK') ? '?' : code,
          college_name: name,
          branch: record.branch,
          rounds: {},
        }
      } else {
        // Upgrade to a proper code whenever we find one
        if (groups[key].college_code === '?' && !code.startsWith('UNK')) {
          groups[key].college_code = code
        }
      }

      const rk = `${record.year}_${record.round}`
      groups[key].rounds[rk] = record[category]
    }

    function enrichGroup(g) {
      const qualifiedRks = roundKeys.filter(rk => g.rounds[rk] != null && g.rounds[rk] >= rankNum)
      const qualifiedCutoffs = qualifiedRks.map(rk => g.rounds[rk])
      return {
        ...g,
        qualifiedCount: qualifiedRks.length,
        bestCutoff: qualifiedCutoffs.length > 0 ? Math.min(...qualifiedCutoffs) : null,
      }
    }

    const allGroups = Object.values(groups)

    // All qualifying groups (any round cutoff >= rank) — used for AI picks
    const allQualifying = allGroups
      .filter(g => roundKeys.some(rk => g.rounds[rk] != null && g.rounds[rk] >= rankNum))
      .map(enrichGroup)

    // Range-filtered groups for the table (show ±5%/10% window only)
    const filtered = allGroups
      .filter(g =>
        roundKeys.some(rk => {
          const c = g.rounds[rk]
          return c != null && c >= lowerBound && c <= upperBound
        })
      )
      .map(enrichGroup)
      .sort((a, b) => {
        if (b.qualifiedCount !== a.qualifiedCount) return b.qualifiedCount - a.qualifiedCount
        const aBest = a.bestCutoff ?? Infinity
        const bBest = b.bestCutoff ?? Infinity
        return aBest - bBest
      })

    setResults(filtered)
    // AI picks always use all qualifying colleges — not limited by range filter
    setTopPicks(getTopPicks(allQualifying, rankNum, roundKeys, 5, { branch: preferredBranch, district }))
    setHasSearched(true)
  }

  function handleCourseChange(id) {
    setActiveCourse(id)
    setResults([])
    setHasSearched(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <SearchForm
          courses={courses}
          activeCourse={activeCourse}
          onCourseChange={handleCourseChange}
          rank={rank}
          onRankChange={setRank}
          category={category}
          onCategoryChange={setCategory}
          onSearch={handleSearch}
          dataLoading={dataLoading}
          dataReady={allData.length > 0}
          noData={noData}
          roundCount={roundKeys.length}
          district={district}
          onDistrictChange={setDistrict}
          preferredBranch={preferredBranch}
          onPreferredBranchChange={setPreferredBranch}
          uniqueBranches={[...new Set(allData.map(r => r.branch))].sort()}
        />

        {hasSearched && (
          <>
            <TopPicks
              picks={topPicks}
              rank={parseInt(rank)}
              roundLabels={roundLabels}
            />
            <ResultsTable
              results={results}
              rank={parseInt(rank)}
              category={category}
              roundKeys={roundKeys}
              roundLabels={roundLabels}
            />
          </>
        )}
      </main>

      <footer className="text-center text-xs text-gray-400 py-6 mt-8 border-t border-gray-200 space-y-1">
        <p>Based on Karnataka Examinations Authority (KEA) cutoff data. For reference only.</p>
        <p className="text-gray-300">Version 1 · Built by Futurisync Systems</p>
      </footer>
    </div>
  )
}
