import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import PageMeta from "../../components/common/PageMeta";

interface Employe {
  id: number;
  nom: string;
  poste: string;
  dept: string;
  salaire: number;
  score: number;
  statut: "Actif" | "Congé" | "Suspendu";
  initiales: string;
  gradient: string;
}

const employes: Employe[] = [
  { id: 1, nom: "Koné Aboubakar", poste: "Directeur Commercial", dept: "Commercial", salaire: 850000, score: 88, statut: "Actif", initiales: "KA", gradient: "from-[#F97316] to-[#fb923c]" },
  { id: 2, nom: "Traoré Aminata", poste: "Responsable RH", dept: "RH", salaire: 620000, score: 72, statut: "Actif", initiales: "TA", gradient: "from-[#16a34a] to-[#4ade80]" },
  { id: 3, nom: "Diallo Ibrahima", poste: "Comptable Senior", dept: "Finance", salaire: 540000, score: 65, statut: "Congé", initiales: "DI", gradient: "from-[#3b82f6] to-[#60a5fa]" },
  { id: 4, nom: "N'Guessan Fatoumata", poste: "Ingénieure IT", dept: "IT", salaire: 710000, score: 91, statut: "Actif", initiales: "NF", gradient: "from-[#8b5cf6] to-[#a78bfa]" },
  { id: 5, nom: "Coulibaly Moussa", poste: "Commercial Senior", dept: "Commercial", salaire: 480000, score: 55, statut: "Actif", initiales: "CM", gradient: "from-[#ec4899] to-[#f472b6]" },
  { id: 6, nom: "Bamba Seydou", poste: "Chef de Projet", dept: "IT", salaire: 790000, score: 79, statut: "Suspendu", initiales: "BS", gradient: "from-[#F97316] to-[#16a34a]" },
  { id: 7, nom: "Ouattara Mariam", poste: "Assistante Direction", dept: "Direction", salaire: 410000, score: 83, statut: "Actif", initiales: "OM", gradient: "from-[#06b6d4] to-[#67e8f9]" },
  { id: 8, nom: "Soro Emmanuel", poste: "Technicien Réseau", dept: "IT", salaire: 380000, score: 60, statut: "Actif", initiales: "SE", gradient: "from-[#f59e0b] to-[#fcd34d]" },
];

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "#16a34a" : score >= 60 ? "#F97316" : "#ef4444";
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-gray-100 rounded-full dark:bg-gray-800">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold w-6 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function StatutBadge({ statut }: { statut: Employe["statut"] }) {
  if (statut === "Actif") return <Badge color="success" size="sm">{statut}</Badge>;
  if (statut === "Congé") return <Badge color="warning" size="sm">{statut}</Badge>;
  return <Badge color="error" size="sm">{statut}</Badge>;
}

export default function Employes() {
  const actifs = employes.filter((e) => e.statut === "Actif").length;

  return (
    <>
      <PageMeta title="Employés | SEREPRO" description="Liste des employés SEREPRO" />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Employés</h2>
          <p className="text-sm text-gray-500 mt-0.5">{employes.length} employés · {actifs} actifs</p>
        </div>
        <button className="serepro-btn-ci text-sm px-4 py-2.5 rounded-lg font-semibold">
          + Nouvel employé
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="">
            <TableHeader>
              <TableRow className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.02]">
                <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Employé
                </TableCell>
                <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Département
                </TableCell>
                <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Salaire net
                </TableCell>
                <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Score crédit
                </TableCell>
                <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employes.map((e) => (
                <TableRow
                  key={e.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors last:border-0"
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${e.gradient} text-white font-bold text-sm flex-shrink-0 shadow-sm`}
                      >
                        {e.initiales}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          {e.nom}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{e.poste}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{e.dept}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90 serepro-amount">
                      {e.salaire.toLocaleString("fr-FR")} FCFA
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <ScoreBar score={e.score} />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <StatutBadge statut={e.statut} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
