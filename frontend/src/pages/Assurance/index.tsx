import PageMeta from "../../components/common/PageMeta";
import PlanGate from "../../components/ui/PlanGate";
import Badge from "../../components/ui/badge/Badge";

const mockInsured = [
  { id: 1, name: "Koné Aboubakar", coverage: "Santé + Vie", premium: 12000, status: "ACTIVE" as const },
  { id: 2, name: "Traoré Aminata", coverage: "Santé", premium: 8000, status: "ACTIVE" as const },
  { id: 3, name: "Diallo Ibrahima", coverage: "Santé + Vie", premium: 12000, status: "PENDING" as const },
];

function AssuranceContent() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Cotisation mensuelle totale", value: "32 000 FCFA", icon: "🛡️" },
          { label: "Assurés actifs", value: "2 / 3", icon: "👥" },
          { label: "Couverture groupe", value: "Santé + Vie", icon: "❤️" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
            <span className="text-2xl">{s.icon}</span>
            <p className="text-xl font-bold text-gray-800 dark:text-white/90 mt-2">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Assurance groupe</h3>
          <button className="serepro-btn-ci text-xs px-3 py-2 rounded-lg font-semibold">+ Ajouter</button>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {mockInsured.map((e) => (
            <div key={e.id} className="flex items-center gap-4 px-6 py-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-white font-bold text-xs">
                {e.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{e.name}</p>
                <p className="text-xs text-gray-400">{e.coverage}</p>
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {e.premium.toLocaleString("fr-FR")} FCFA/mois
              </p>
              <Badge color={e.status === "ACTIVE" ? "success" : "warning"} size="sm">
                {e.status === "ACTIVE" ? "Actif" : "En attente"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Assurance() {
  return (
    <>
      <PageMeta title="Assurance Groupe | SEREPRO" description="Assurance groupe employés SEREPRO" />
      <PlanGate requiredPlan="BUSINESS">
        <AssuranceContent />
      </PlanGate>
    </>
  );
}
