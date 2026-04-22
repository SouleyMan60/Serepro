import PageMeta from "../../components/common/PageMeta";
import PlanGate from "../../components/ui/PlanGate";
import Badge from "../../components/ui/badge/Badge";

const mockSavings = [
  { id: 1, name: "Koné Aboubakar", amount: 45000, rate: 5, status: "ACTIVE" as const },
  { id: 2, name: "Traoré Aminata", amount: 30000, rate: 5, status: "ACTIVE" as const },
  { id: 3, name: "Diallo Ibrahima", amount: 20000, rate: 5, status: "PAUSED" as const },
];

function EpargneContent() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Épargne totale", value: "95 000 FCFA", icon: "💰" },
          { label: "Épargnants actifs", value: "2 / 3", icon: "👥" },
          { label: "Taux moyen", value: "5%", icon: "📈" },
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
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Plans d'épargne actifs</h3>
          <button className="serepro-btn-ci text-xs px-3 py-2 rounded-lg font-semibold">+ Nouveau plan</button>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {mockSavings.map((s) => (
            <div key={s.id} className="flex items-center gap-4 px-6 py-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#16a34a] to-[#4ade80] text-white font-bold text-xs">
                {s.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{s.name}</p>
                <p className="text-xs text-gray-400">Taux : {s.rate}% / an</p>
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {s.amount.toLocaleString("fr-FR")} FCFA
              </p>
              <Badge color={s.status === "ACTIVE" ? "success" : "warning"} size="sm">
                {s.status === "ACTIVE" ? "Actif" : "Pausé"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Epargne() {
  return (
    <>
      <PageMeta title="Épargne Auto | SEREPRO" description="Épargne automatique employés SEREPRO" />
      <PlanGate requiredPlan="PRO">
        <EpargneContent />
      </PlanGate>
    </>
  );
}
