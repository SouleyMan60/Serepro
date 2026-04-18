import { useState } from "react";
import Badge from "../../components/ui/badge/Badge";
import PageMeta from "../../components/common/PageMeta";

interface Document {
  id: number;
  nom: string;
  type: "PDF" | "DOCX" | "XLSX" | "IMG";
  taille: string;
  date: string;
  categorie: string;
}

interface DossierEmploye {
  id: number;
  nom: string;
  poste: string;
  initiales: string;
  gradient: string;
  docs: Document[];
}

const dossiers: DossierEmploye[] = [
  {
    id: 1, nom: "Koné Aboubakar", poste: "Directeur Commercial", initiales: "KA", gradient: "from-[#F97316] to-[#fb923c]",
    docs: [
      { id: 1, nom: "Contrat de travail CDI", type: "PDF", taille: "245 Ko", date: "2021-03-15", categorie: "Contrat" },
      { id: 2, nom: "Bulletin de paie Mars 2025", type: "PDF", taille: "128 Ko", date: "2025-03-31", categorie: "Paie" },
      { id: 3, nom: "Attestation de travail", type: "PDF", taille: "98 Ko", date: "2025-01-10", categorie: "Attestation" },
      { id: 4, nom: "Avenant salarial 2024", type: "DOCX", taille: "72 Ko", date: "2024-01-15", categorie: "Contrat" },
    ],
  },
  {
    id: 2, nom: "Traoré Aminata", poste: "Responsable RH", initiales: "TA", gradient: "from-[#16a34a] to-[#4ade80]",
    docs: [
      { id: 1, nom: "Contrat de travail CDI", type: "PDF", taille: "238 Ko", date: "2022-06-01", categorie: "Contrat" },
      { id: 2, nom: "Bulletin de paie Mars 2025", type: "PDF", taille: "131 Ko", date: "2025-03-31", categorie: "Paie" },
      { id: 3, nom: "Diplôme Master RH", type: "IMG", taille: "1.2 Mo", date: "2022-05-20", categorie: "Diplôme" },
    ],
  },
  {
    id: 3, nom: "Diallo Ibrahima", poste: "Comptable Senior", initiales: "DI", gradient: "from-[#3b82f6] to-[#60a5fa]",
    docs: [
      { id: 1, nom: "Contrat de travail CDD", type: "PDF", taille: "210 Ko", date: "2023-09-01", categorie: "Contrat" },
      { id: 2, nom: "Bulletin de paie Février 2025", type: "PDF", taille: "125 Ko", date: "2025-02-28", categorie: "Paie" },
      { id: 3, nom: "Tableau de bord Q1 2025", type: "XLSX", taille: "340 Ko", date: "2025-04-02", categorie: "Rapport" },
    ],
  },
  {
    id: 4, nom: "N'Guessan Fatoumata", poste: "Ingénieure IT", initiales: "NF", gradient: "from-[#8b5cf6] to-[#a78bfa]",
    docs: [
      { id: 1, nom: "Contrat de travail CDI", type: "PDF", taille: "252 Ko", date: "2020-11-01", categorie: "Contrat" },
      { id: 2, nom: "Bulletin de paie Mars 2025", type: "PDF", taille: "130 Ko", date: "2025-03-31", categorie: "Paie" },
    ],
  },
];

const typeIcon: Record<string, string> = {
  PDF: "📄",
  DOCX: "📝",
  XLSX: "📊",
  IMG: "🖼️",
};

const categorieColor: Record<string, "primary" | "success" | "info" | "warning" | "light"> = {
  Contrat: "primary",
  Paie: "success",
  Attestation: "info",
  Diplôme: "warning",
  Rapport: "light",
};

export default function Archivage() {
  const [selectedId, setSelectedId] = useState(1);
  const [searchDoc, setSearchDoc] = useState("");

  const dossier = dossiers.find((d) => d.id === selectedId)!;
  const docsFiltered = dossier.docs.filter((d) =>
    d.nom.toLowerCase().includes(searchDoc.toLowerCase())
  );
  const totalDocs = dossiers.reduce((s, d) => s + d.docs.length, 0);

  return (
    <>
      <PageMeta title="Archivage | SEREPRO" description="Archivage documents RH SEREPRO" />

      <div className="grid grid-cols-12 gap-6">
        {/* ── Sidebar dossiers ───────────────────────────────── */}
        <div className="col-span-12 lg:col-span-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Dossiers employés
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {dossiers.length} dossiers · {totalDocs} documents
            </p>
          </div>

          <ul className="p-2 space-y-1">
            {dossiers.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => setSelectedId(d.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                    selectedId === d.id
                      ? "bg-gradient-to-r from-[#F97316]/10 to-[#16a34a]/10 border border-[#F97316]/20"
                      : "hover:bg-gray-50 dark:hover:bg-white/[0.02] border border-transparent"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${d.gradient} text-white font-bold text-xs flex-shrink-0 shadow-sm`}
                  >
                    {d.initiales}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">
                      {d.nom}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{d.poste}</p>
                  </div>
                  <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5 flex-shrink-0">
                    {d.docs.length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Documents panel ────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-8 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${dossier.gradient} text-white font-bold text-xs shadow-sm`}
              >
                {dossier.initiales}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {dossier.nom}
                </h3>
                <p className="text-xs text-gray-400">{dossier.docs.length} document{dossier.docs.length > 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchDoc}
                onChange={(e) => setSearchDoc(e.target.value)}
                placeholder="Rechercher..."
                className="h-9 rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-800 dark:text-white/90 focus:border-[#F97316] focus:outline-none w-40"
              />
              <button className="serepro-btn-ci text-xs px-3 py-2 rounded-lg font-semibold">
                + Ajouter
              </button>
            </div>
          </div>

          {/* Documents list */}
          {docsFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <span className="text-4xl mb-3">📂</span>
              <p className="text-sm">Aucun document trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {docsFiltered.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
                >
                  <span className="text-3xl flex-shrink-0">{typeIcon[doc.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {doc.nom}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {doc.taille} ·{" "}
                      {new Date(doc.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge
                    color={categorieColor[doc.categorie] ?? "light"}
                    size="sm"
                  >
                    {doc.categorie}
                  </Badge>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#F97316] hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                      title="Télécharger"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                    </button>
                    <button
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      title="Supprimer"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
