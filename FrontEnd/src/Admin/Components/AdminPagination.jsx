import { Button } from "../../Components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

/**
 * Generička paginacija za sve admin liste.
 * Vizualni stil je identičan Leaderboard/Lectures paginaciji
 * (bijela kartica s rounded gumbima i indigo highlight-om za aktivnu stranicu).
 *
 * Props:
 *   currentPage   - trenutno odabrana stranica (1-based)
 *   totalPages    - ukupan broj stranica
 *   onPageChange  - callback (page: number) => void
 *   totalItems    - opcionalno, broj svih stavki (za "Showing X of Y" tekst)
 *   pageSize      - opcionalno, broj stavki po stranici (za tekst)
 */
export default function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize
}) {
  // Ako imamo samo jednu stranicu - nema potrebe za paginacijom
  if (totalPages <= 1) return null

  // Pomoćna funkcija koja izračunava raspon prikazanih brojeva.
  // Pokazujemo prvu, zadnju i ±1 oko trenutne, s "..." gdje je rez.
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)

  // Tekst tipa "Showing 9-16 of 47" - prikazan samo ako su prosljeđene veličine
  const showRange = totalItems != null && pageSize != null
  const firstOnPage = (currentPage - 1) * pageSize + 1
  const lastOnPage  = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-3">
      {/* Lijevi info tekst */}
      {showRange && (
        <p className="text-xs text-slate-400 font-medium">
          Showing <span className="font-bold text-slate-600">{firstOnPage}–{lastOnPage}</span> of{" "}
          <span className="font-bold text-slate-600">{totalItems}</span>
        </p>
      )}

      {/* Desno - kontrole paginacije */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
        {/* Skok na prvu */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4 text-slate-600" />
        </Button>

        {/* Prethodna */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 text-slate-600" />
        </Button>

        {/* Brojevi stranica s opcionalnim "..." separatorom */}
        <div className="flex gap-1 px-2">
          {pages.map((page, index, array) => (
            <div key={page} className="flex gap-1">
              {/* Ako između brojeva fali raspon, ubacimo "..." */}
              {index > 0 && array[index - 1] !== page - 1 && (
                <span className="flex items-center px-1 text-slate-300">...</span>
              )}
              <Button
                variant={currentPage === page ? "default" : "ghost"}
                className={`h-9 w-9 rounded-lg font-bold ${
                  currentPage === page
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            </div>
          ))}
        </div>

        {/* Sljedeća */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4 text-slate-600" />
        </Button>

        {/* Skok na zadnju */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4 text-slate-600" />
        </Button>
      </div>
    </div>
  )
}
