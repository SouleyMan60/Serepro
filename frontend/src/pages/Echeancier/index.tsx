import { useState, useEffect } from "react";
import Badge from "../../components/ui/badge/Badge";
import PageMeta from "../../components/common/PageMeta";
import PlanGate from "../../components/ui/PlanGate";
import {
  useDeadlines, useCreateDeadline, useCompleteDeadline,
  type Deadline, type CreateDeadlineInput,
} from "../../hooks/useDeadlines";
import { useNotifications, type NotificationPrefs } from "../../hooks/useNotifications";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<string, { gradient: string; label: string }> = {
  CNPS:             { gradient: "from-[#3b82f6] to-[#60a5fa]", label: "CNPS" },
  ITS:              { gradient: "from-[#F97316] to-[#fb923c]", label: "ITS"  },
  CMU:              { gradient: "from-[#16a34a] to-[#4ade80]", label: "CMU"  },
  CONTRACT_RENEWAL: { gradient: "from-[#8b5cf6] to-[#a78bfa]", label: "CTR"  },
  OTHER:            { gradient: "from-[#6b7280] to-[#9ca3af]", label: "AUT"  },
};

const TYPE_LABELS: Record<string, string> = {
  CNPS:             "CNPS — Cotisations sociales",
  ITS:              "ITS — Impôt sur Traitement & Salaires",
  CMU:              "CMU — Cotisation Maladie Universelle",
  CONTRACT_RENEWAL: "Renouvellement de contrat",
  OTHER:            "Autre",
};

const TYPE_DEFAULT_TITLE: Record<string, string> = {
  CNPS:             "Cotisations CNPS",
  ITS:              "Impôt sur Traitement & Salaires",
  CMU:              "Cotisation Maladie Universelle",
  CONTRACT_RENEWAL: "Renouvellement de contrat",
  OTHER:            "",
};

const REMINDER_OPTIONS = [
  { value: 7,  label: "7 jours avant" },
  { value: 3,  label: "3 jours avant" },
  { value: 0,  label: "Jour J" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dueDate: string) {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

function fmtM(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin h-8 w-8 text-[#F97316]" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}

function UrgenceBadge({ urgency, completed }: { urgency: Deadline["urgency"]; completed: boolean }) {
  if (completed)           return <Badge color="success" size="sm">Payé</Badge>;
  if (urgency === "URGENT") return <Badge color="error" variant="solid" size="sm">Urgent</Badge>;
  if (urgency === "BIENTOT") return <Badge color="warning" size="sm">Proche</Badge>;
  return <Badge color="info" size="sm">Normal</Badge>;
}

// ─── Modal Création ───────────────────────────────────────────────────────────

function CreateModal({
  onClose, onSubmit, isLoading, error,
}: {
  onClose: () => void;
  onSubmit: (v: CreateDeadlineInput) => void;
  isLoading: boolean;
  error: string;
}) {
  const [type, setType] = useState<Deadline["type"]>("CNPS");
  const [title, setTitle] = useState(TYPE_DEFAULT_TITLE["CNPS"]);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleTypeChange(t: Deadline["type"]) {
    setType(t);
    if (TYPE_DEFAULT_TITLE[t]) setTitle(TYPE_DEFAULT_TITLE[t]);
  }

  function handleSubmit() {
    if (!title.trim() || !dueDate) return;
    onSubmit({
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate,
      amount: amount ? parseInt(amount.replace(/\s/g, ""), 10) : undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60">
      <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <p className="text-base font-semibold text-gray-800 dark:text-white/90">Nouvelle échéance</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Type</label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as Deadline["type"])}
              className="serepro-input text-sm w-full"
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="serepro-input text-sm w-full"
              placeholder="Libellé de l'échéance"
            />
          </div>

          {/* Montant + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Montant (FCFA)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="serepro-input text-sm w-full"
                placeholder="Ex : 1500000"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Date d'échéance</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="serepro-input text-sm w-full"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Description <span className="text-gray-400">(optionnel)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="serepro-input text-sm w-full resize-none"
              placeholder="Précisions sur cette échéance…"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
          <button onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim() || !dueDate}
            className="serepro-btn-ci flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-60"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {isLoading ? "Création…" : "Créer l'échéance"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Notifications ──────────────────────────────────────────────────────

function NotifModal({
  initial, onClose, onSave, saving, saved,
}: {
  initial: NotificationPrefs;
  onClose: () => void;
  onSave: (p: NotificationPrefs) => void;
  saving: boolean;
  saved: boolean;
}) {
  const [prefs, setPrefs] = useState<NotificationPrefs>({ ...initial });
  const set = <K extends keyof NotificationPrefs>(k: K, v: NotificationPrefs[K]) =>
    setPrefs((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function toggleReminder(days: number) {
    setPrefs((p) => ({
      ...p,
      reminderDays: p.reminderDays.includes(days)
        ? p.reminderDays.filter((d) => d !== days)
        : [...p.reminderDays, days],
    }));
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60">
      <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-base font-semibold text-gray-800 dark:text-white/90">Paramètres de rappel</p>
            <p className="text-xs text-gray-400 mt-0.5">Canaux et délais de notification</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Email */}
          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</span>
              <button
                onClick={() => set("emailEnabled", !prefs.emailEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${prefs.emailEnabled ? "bg-[#F97316]" : "bg-gray-200 dark:bg-gray-700"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${prefs.emailEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </label>
            {prefs.emailEnabled && (
              <input
                type="email"
                value={prefs.emailAddress}
                onChange={(e) => set("emailAddress", e.target.value)}
                className="serepro-input text-sm w-full"
                placeholder="votre@email.com"
              />
            )}
          </div>

          {/* SMS + WhatsApp — plan PRO requis */}
          <PlanGate requiredPlan="PRO">
            <>
          {/* SMS */}
          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">SMS</span>
              <button
                onClick={() => set("smsEnabled", !prefs.smsEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${prefs.smsEnabled ? "bg-[#F97316]" : "bg-gray-200 dark:bg-gray-700"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${prefs.smsEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </label>
            {prefs.smsEnabled && (
              <input
                type="tel"
                value={prefs.smsPhone}
                onChange={(e) => set("smsPhone", e.target.value)}
                className="serepro-input text-sm w-full"
                placeholder="+225 07 00 00 00 00"
              />
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">WhatsApp</span>
              <button
                onClick={() => set("whatsappEnabled", !prefs.whatsappEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${prefs.whatsappEnabled ? "bg-[#F97316]" : "bg-gray-200 dark:bg-gray-700"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${prefs.whatsappEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </label>
            {prefs.whatsappEnabled && (
              <input
                type="tel"
                value={prefs.whatsappPhone}
                onChange={(e) => set("whatsappPhone", e.target.value)}
                className="serepro-input text-sm w-full"
                placeholder="+225 07 00 00 00 00"
              />
            )}
          </div>
            </>
          </PlanGate>

          {/* Délai de rappel */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Délai de rappel</p>
            <div className="flex gap-2 flex-wrap">
              {REMINDER_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => toggleReminder(value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    prefs.reminderDays.includes(value)
                      ? "border-[#F97316] bg-orange-50 dark:bg-orange-900/20 text-[#F97316]"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
            Annuler
          </button>
          <button
            onClick={() => onSave(prefs)}
            disabled={saving}
            className="serepro-btn-ci flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-60"
          >
            {saving && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {saved ? "Enregistré ✓" : saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Echeancier() {
  const { data: deadlines = [], isLoading, isError } = useDeadlines();
  const createMutation   = useCreateDeadline();
  const completeMutation = useCompleteDeadline();
  const { prefs: notifPrefs, save: saveNotif, saving: notifSaving, saved: notifSaved } = useNotifications();

  const [showCreate, setShowCreate]   = useState(false);
  const [showNotif, setShowNotif]     = useState(false);
  const [createError, setCreateError] = useState("");
  const [confirmId, setConfirmId]     = useState<string | null>(null);

  // Bloquer le header quand un modal est ouvert
  useEffect(() => {
    const header = document.querySelector("header");
    if (header) header.style.zIndex = (showCreate || showNotif) ? "0" : "";
  }, [showCreate, showNotif]);

  // KPIs
  const pending  = deadlines.filter((d) => !d.completed);
  const total    = pending.reduce((s, d) => s + (d.amount ?? 0), 0);
  const urgents  = pending.filter((d) => d.urgency === "URGENT").length;
  const prochain = pending.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  async function handleCreate(input: CreateDeadlineInput) {
    setCreateError("");
    try {
      await createMutation.mutateAsync(input);
      setShowCreate(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setCreateError(e?.response?.data?.message ?? e?.message ?? "Erreur création");
    }
  }

  async function handleComplete(id: string) {
    try {
      await completeMutation.mutateAsync(id);
    } finally {
      setConfirmId(null);
    }
  }

  const sorted = [...deadlines].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <>
      <PageMeta title="Échéancier | SEREPRO" description="Obligations fiscales et sociales SEREPRO" />

      {showCreate && (
        <CreateModal
          onClose={() => { setShowCreate(false); setCreateError(""); }}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
          error={createError}
        />
      )}

      {showNotif && (
        <NotifModal
          initial={notifPrefs}
          onClose={() => setShowNotif(false)}
          onSave={async (p) => { await saveNotif(p); if (!notifSaving) setShowNotif(false); }}
          saving={notifSaving}
          saved={notifSaved}
        />
      )}

      {/* Page header */}
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Échéancier fiscal & social</h2>
          <p className="text-sm text-gray-500 mt-0.5">Obligations CNPS, ITS, CMU et autres</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotif(true)}
            title="Paramètres de rappel"
            className="flex items-center justify-center h-9 w-9 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-[#F97316] hover:text-[#F97316] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={() => { setShowCreate(true); setCreateError(""); }}
            className="serepro-btn-ci flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle échéance
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Obligations à payer</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90">{pending.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Montant total dû</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90 serepro-amount">
            {total > 0 ? `${fmtM(total)} FCFA` : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Échéances urgentes</p>
          <p className={`text-2xl font-bold ${urgents > 0 ? "text-red-500" : "text-gray-800 dark:text-white/90"}`}>
            {urgents}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Prochaine échéance</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">
            {prochain
              ? new Date(prochain.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
              : "—"
            }
          </p>
          {prochain && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{prochain.title}</p>
          )}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Calendrier des obligations</h3>
          {!isLoading && (
            <span className="text-xs text-gray-400">{deadlines.length} échéance{deadlines.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {isLoading && <Spinner />}

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 px-6 py-4 text-sm text-red-600 dark:text-red-400">
            Impossible de charger les échéances.
          </div>
        )}

        {!isLoading && !isError && deadlines.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="w-14 h-14 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-medium text-gray-600 dark:text-gray-400">Aucune échéance</p>
            <p className="text-sm text-gray-400">Cliquez sur "+ Nouvelle échéance" pour en ajouter une</p>
          </div>
        )}

        {!isLoading && !isError && sorted.map((d) => {
          const days = daysUntil(d.dueDate);
          const style = TYPE_STYLE[d.type] ?? TYPE_STYLE.OTHER;
          const isConfirming = confirmId === d.id;
          const isPaying = completeMutation.isPending && confirmId === d.id;

          return (
            <div
              key={d.id}
              className={`flex items-center gap-4 rounded-2xl border p-5 transition-all ${
                d.completed
                  ? "border-gray-100 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-white/[0.01]"
                  : d.urgency === "URGENT"
                  ? "border-red-200 bg-red-50/30 dark:border-red-500/20 dark:bg-red-500/5"
                  : d.urgency === "BIENTOT"
                  ? "border-amber-200 bg-amber-50/30 dark:border-amber-500/20 dark:bg-amber-500/5"
                  : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
              }`}
            >
              {/* Type badge */}
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${style.gradient} text-white font-bold text-xs flex-shrink-0 shadow-sm`}>
                {style.label}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{d.title}</p>
                {d.description && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{d.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Échéance :{" "}
                  <span className="font-medium">
                    {new Date(d.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  {!d.completed && (
                    <span className={`ml-2 ${days <= 7 ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                      {days >= 0 ? `· dans ${days}j` : `· ${Math.abs(days)}j de retard`}
                    </span>
                  )}
                </p>
              </div>

              {/* Montant */}
              {d.amount != null && (
                <div className="text-right flex-shrink-0 mr-2 hidden sm:block">
                  <p className="text-base font-bold text-gray-800 dark:text-white/90 serepro-amount">
                    {fmt(d.amount)} FCFA
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex-shrink-0 flex flex-col items-end gap-2">
                <UrgenceBadge urgency={d.urgency} completed={d.completed} />
                {!d.completed && (
                  isConfirming ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Confirmer ?</span>
                      <button
                        onClick={() => handleComplete(d.id)}
                        disabled={isPaying}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-60"
                      >
                        {isPaying ? "…" : "Oui"}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 transition-colors"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(d.id)}
                      className="serepro-btn-ci text-[11px] px-3 py-1 rounded-lg"
                    >
                      Payer
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
