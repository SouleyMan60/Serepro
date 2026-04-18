import Badge from "../../components/ui/badge/Badge";
import PageMeta from "../../components/common/PageMeta";

interface Obligation {
  id: number;
  type: "CNPS" | "ITS" | "CMU";
  libelle: string;
  montant: number;
  echeance: string;
  statut: "Urgent" | "Proche" | "Normal";
  jours: number;
  paye: boolean;
}

const obligations: Obligation[] = [
  { id: 1, type: "CNPS", libelle: "Cotisations sociales Q1 2025", montant: 3420000, echeance: "2025-04-15", statut: "Urgent", jours: 3, paye: false },
  { id: 2, type: "ITS", libelle: "Impôt sur Traitement & Salaires — Mars", montant: 1850000, echeance: "2025-04-20", statut: "Proche", jours: 8, paye: false },
  { id: 3, type: "CMU", libelle: "Cotisation Maladie Universelle — T1", montant: 620000, echeance: "2025-04-30", statut: "Normal", jours: 18, paye: false },
  { id: 4, type: "ITS", libelle: "Impôt sur Traitement & Salaires — Avril", montant: 1850000, echeance: "2025-05-20", statut: "Normal", jours: 38, paye: false },
  { id: 5, type: "CNPS", libelle: "Cotisations sociales Q2 2025", montant: 3420000, echeance: "2025-07-15", statut: "Normal", jours: 94, paye: false },
  { id: 6, type: "CNPS", libelle: "Cotisations sociales Q4 2024", montant: 3200000, echeance: "2025-01-15", statut: "Normal", jours: -75, paye: true },
];

const typeStyle: Record<string, { gradient: string; label: string }> = {
  CNPS: { gradient: "from-[#3b82f6] to-[#60a5fa]", label: "CNPS" },
  ITS: { gradient: "from-[#F97316] to-[#fb923c]", label: "ITS" },
  CMU: { gradient: "from-[#16a34a] to-[#4ade80]", label: "CMU" },
};

function UrgenceBadge({ statut, paye }: { statut: Obligation["statut"]; paye: boolean }) {
  if (paye) return <Badge color="success" size="sm">Payé</Badge>;
  if (statut === "Urgent") return <Badge color="error" variant="solid" size="sm">🔴 Urgent</Badge>;
  if (statut === "Proche") return <Badge color="warning" size="sm">⚠️ Proche</Badge>;
  return <Badge color="info" size="sm">Normal</Badge>;
}

const total = obligations.filter((o) => !o.paye).reduce((s, o) => s + o.montant, 0);
const urgents = obligations.filter((o) => o.statut === "Urgent" && !o.paye).length;

export default function Echeancier() {
  return (
    <>
      <PageMeta title="Échéancier | SEREPRO" description="Obligations fiscales et sociales SEREPRO" />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 mb-1">Obligations à payer</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {obligations.filter((o) => !o.paye).length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 mb-1">Montant total dû</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90 serepro-amount">
            {(total / 1000000).toFixed(2)}M FCFA
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 mb-1">Échéances urgentes</p>
          <p className={`text-2xl font-bold ${urgents > 0 ? "text-red-500" : "text-gray-800 dark:text-white/90"}`}>
            {urgents}
          </p>
        </div>
      </div>

      {/* Timeline list */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
          Calendrier des obligations
        </h2>

        {obligations.map((o) => (
          <div
            key={o.id}
            className={`flex items-center gap-4 rounded-2xl border p-5 transition-all ${
              o.paye
                ? "border-gray-100 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-white/[0.01]"
                : o.statut === "Urgent"
                ? "border-red-200 bg-red-50/30 dark:border-red-500/20 dark:bg-red-500/5"
                : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
            }`}
          >
            {/* Type icon */}
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${typeStyle[o.type].gradient} text-white font-bold text-xs flex-shrink-0 shadow-sm`}
            >
              {typeStyle[o.type].label}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{o.libelle}</p>
              <p className="text-xs text-gray-500 mt-1">
                Échéance :{" "}
                <span className="font-medium">
                  {new Date(o.echeance).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {!o.paye && (
                  <span className={`ml-2 ${o.jours <= 7 ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                    · dans {o.jours}j
                  </span>
                )}
              </p>
            </div>

            {/* Montant */}
            <div className="text-right flex-shrink-0 mr-2">
              <p className="text-base font-bold text-gray-800 dark:text-white/90 serepro-amount">
                {o.montant.toLocaleString("fr-FR")} FCFA
              </p>
            </div>

            {/* Badge */}
            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              <UrgenceBadge statut={o.statut} paye={o.paye} />
              {!o.paye && (
                <button className="serepro-btn-ci text-[11px] px-3 py-1 rounded-lg">
                  Payer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
