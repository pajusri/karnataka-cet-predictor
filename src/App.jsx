import { useState, useEffect } from 'react'
import Header from './components/Header'
import SearchForm from './components/SearchForm'
import ResultsTable from './components/ResultsTable'

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
  const [courses, setCourses]         = useState([])
  const [activeCourse, setActiveCourse] = useState(null)
  const [allData, setAllData]         = useState([])   // merged rows from all JSONs
  const [roundKeys, setRoundKeys]     = useState([])   // ['2025_1', '2025_2', ...]
  const [roundLabels, setRoundLabels] = useState({})   // {'2025_1': '2025 Round 1 — ROK', ...}
  const [dataLoading, setDataLoading] = useState(false)
  const [noData, setNoData]           = useState(false)

  const [rank, setRank]         = useState('')
  const [category, setCategory] = useState('GM')
  const [results, setResults]   = useState([])
  const [hasSearched, setHasSearched] = useState(false)

  // Load course list
  useEffect(() => {
    fetch('/data/courses.json')
      .then(r => r.json())
      .then(data => {
        setCourses(data)
        if (data.length > 0) setActiveCourse(data[0].id)
      })
      .catch(() => {})
  }, [])

  // When course changes, load ALL its PDFs in parallel
  useEffect(() => {
    if (!activeCourse || courses.length === 0) return
    const course = courses.find(c => c.id === activeCourse)
    if (!course) return

    setDataLoading(true)
    setAllData([])
    setHasSearched(false)
    setNoData(false)

    fetch(`/data/${course.folder}/manifest.json`)
      .then(r => {
        if (!r.ok) throw new Error('no manifest')
        return r.json()
      })
      .then(async manifest => {
        if (!manifest || manifest.length === 0) {
          setNoData(true)
          setDataLoading(false)
          return
        }

        // Load all JSON files in parallel
        const loaded = await Promise.all(
          manifest.map(entry =>
            fetch(`/data/${course.folder}/${entry.file}`)
              .then(r => r.json())
              .then(records => ({ entry, records }))
          )
        )

        const merged = loaded.flatMap(({ records }) => records)

        // Build ordered round keys + labels
        const rks = [...new Set(merged.map(r => `${r.year}_${r.round}`))].sort()
        const rls = {}
        for (const { entry } of loaded) {
          rls[`${entry.year}_${entry.round}`] = entry.label
        }

        setAllData(merged)
        setRoundKeys(rks)
        setRoundLabels(rls)
        setDataLoading(false)
      })
      .catch(() => {
        setNoData(true)
        setDataLoading(false)
      })
  }, [activeCourse, courses])

  function handleSearch() {
    const rankNum = parseInt(rank)
    if (!rank || isNaN(rankNum) || rankNum < 1 || allData.length === 0) return

    // Group rows by college + branch
    const groups = {}
    for (const record of allData) {
      const key = `${record.college_code}||${record.branch}`
      if (!groups[key]) {
        groups[key] = {
          college_code: record.college_code,
          college_name: record.college_name,
          branch: record.branch,
          rounds: {},
        }
      }
      const rk = `${record.year}_${record.round}`
      groups[key].rounds[rk] = record[category]
    }

    const filtered = Object.values(groups)
      .filter(g =>
        roundKeys.some(rk => g.rounds[rk] != null && g.rounds[rk] >= rankNum)
      )
      .map(g => {
        const qualifiedRks = roundKeys.filter(rk => g.rounds[rk] != null && g.rounds[rk] >= rankNum)
        const qualifiedCutoffs = qualifiedRks.map(rk => g.rounds[rk])
        return {
          ...g,
          qualifiedCount: qualifiedRks.length,
          bestCutoff: Math.min(...qualifiedCutoffs),
        }
      })
      // Sort: more qualifying rounds first, then by closest (lowest) cutoff
      .sort((a, b) => {
        if (b.qualifiedCount !== a.qualifiedCount) return b.qualifiedCount - a.qualifiedCount
        return a.bestCutoff - b.bestCutoff
      })

    setResults(filtered)
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
        />

        {hasSearched && (
          <ResultsTable
            results={results}
            rank={parseInt(rank)}
            category={category}
            roundKeys={roundKeys}
            roundLabels={roundLabels}
          />
        )}
      </main>

      <footer className="text-center text-xs text-gray-400 py-6 mt-8 border-t border-gray-200">
        Based on Karnataka Examinations Authority (KEA) cutoff data. For reference only.
      </footer>
    </div>
  )
}
