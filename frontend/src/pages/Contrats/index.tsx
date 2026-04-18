import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import PageMeta from "../../components/common/PageMeta";

interface Bulletin {
  id: number;
  employe: string;
  initiales: string;
  gradient: string;
  mois: string;
  brut: number;
  net: number;
  statut: "Généré" | "En cours" | "En attente";
  progress: number;
}

const bulletins: Bulletin[] = [
  { id: 1, employe: "Koné Aboubakar", initiales: "KA", gradient: "from-[#F97316] to-[#fb923c]", mois: "Mars 2025", brut: 1050000, net: 850000, statut: "Généré", progress: 100 },
  { id: 2, employe: "Traoré Aminata", initiales: "TA", gradient: "from-[#16a34a] to-[#4ade80]", mois: "Mars 2025", brut: 780000, net: 620000, statut: "Généré", progress: 100 },
  { id: 3, employe: "N'Guessan Fatoumata", initiales: "NF", gradient: "from-[#8b5cf6] to-[#a78bfa]", mois: "Mars 2025", brut: 890000, net: 710000, statut: "En cours", progress: 65 },
  { id: 4, employe: "Bamba Seydou", initiales: "BS", gradient: "from-[#F97316] to-[#16a34a]", mois: "Mars 2025", brut: 980000, net: 790000, statut: "En cours", progress: 30 },
  { id: 5, employe: "Diallo Ibrahima", initiales: "DI", gradient: "from-[#3b82f6] to-[#60a5fa]", mois: "Mars 2025", brut: 680000, net: 540000, statut: "En attente", progress: 0 },
  { id: 6, employe: "Coulibaly Moussa", initiales: "CM", gradient: "from-[#ec4899] to-[#f472b6]", mois: "Mars 2025", brut: 610000, net: 480000, statut: "En attente", progress: 0 },
  { id: 7, employe: "Ouattara Mariam", initiales: "OM", gradient: "from-[#06b6d4] to-[#67e8f9]", mois: "Mars 2025", brut: 520000, net: 410000, statut: "En attente", progress: 0 },
];

function ProgressBar({ value, statut }: { value: number; statut: Bulletin["statut"] }) {
  const color =
    statut === "Généré" ? "#16a34a" : statut === "En cours" ? "#F97316" : "#d1d5db";
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full dark:bg-gray-800">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] text-gray-400 w-7 text-right">{value}%</span>
    </div>
  );
}

function StatutBadge({ statut }: { statut: Bulletin["statut"] }) {
  if (statut === "Généré") return <Badge color="success" size="sm">{statut}</Badge>;
  if (statut === "En cours") return <Badge color="warning" size="sm">{statut}</Badge>;
  return <Badge color="light" size="sm">{statut}</Badge>;
}

const totalNet = bulletins.reduce((s, b) => s + b.net, 0);
const generes = bulletins.filter((b) => b.statut === "Généré").length;

export default function Contrats() {
  return (
    <>
      <PageMeta title="Contrats & Paie | SEREPRO" description="Gestion bulletins de paie SEREPRO" />

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 mb-1">Bulletins générés</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90">{generes} / {bulletins.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 mb-1">Masse salariale nette</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90 serepro-amount">
            {(totalNet / 1000000).toFixed(1)}M FCFA
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 mb-1">Période</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90">Mars 2025</p>
        </div>
      </div>

      {/* Bulletins list */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Bulletins de paie — Mars 2025
          </h2>
          <Button size="sm">Générer tous</Button>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {bulletins.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${b.gradient} text-white font-bold text-xs flex-shrink-0 shadow-sm`}
              >
                {b.initiales}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{b.employe}</p>
                <p className="text-xs text-gray-400 mt-0.5">{b.mois}</p>
                <ProgressBar value={b.progress} statut={b.statut} />
              </div>

              <div className="text-right flex-shrink-0 mr-2">
                <p className="text-sm font-bold text-gray-800 dark:text-white/90 serepro-amount">
                  {b.net.toLocaleString("fr-FR")} FCFA
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Brut: {b.brut.toLocaleString("fr-FR")}
                </p>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                <StatutBadge statut={b.statut} />
                {b.statut === "Généré" && (
                  <button className="text-gray-400 hover:text-[#F97316] transition-colors" title="Télécharger">
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
