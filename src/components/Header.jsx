export default function Header() {
  return (
    <header className="bg-kea-blue text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-bold leading-tight">
            Karnataka CET College Predictor
          </h1>
          <p className="text-blue-200 text-xs mt-0.5">
            Based on KEA UGCET previous year allotment cutoffs
          </p>
        </div>
        <span className="hidden sm:block bg-kea-orange text-white text-xs font-semibold px-3 py-1 rounded-full">
          UGCET
        </span>
      </div>
    </header>
  )
}
