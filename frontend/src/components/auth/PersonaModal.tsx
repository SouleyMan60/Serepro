import { useState } from "react";
import { getAuth } from "firebase/auth";
import { useAuth } from "../../context/AuthContext";
import api from "../../config/api";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";

type TenantType = "ENTREPRISE" | "ENTREPRENEUR";

function ErrorBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
      <svg
        className="size-4 text-red-500 mt-0.5 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
      <p className="text-sm text-red-600 dark:text-red-400">{msg}</p>
    </div>
  );
}

export default function PersonaModal() {
  const { refreshUserProfile } = useAuth();

  const [tenantType, setTenantType] = useState<TenantType | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!tenantType || !name.trim()) return;
    setError("");
    setLoading(true);

    try {
      const firebaseUser = getAuth().currentUser;

      if (!firebaseUser) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      const body = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email ?? "",
        displayName: name.trim(),
        tenantName: name.trim(),
        role: "EMPLOYER",
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      };

      console.log("[PersonaModal] POST /auth/register body:", JSON.stringify(body));

      await api.post("/auth/register", body);

      localStorage.removeItem("google_pending_user");
      await refreshUserProfile();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string; error?: string } } })?.response?.status;
      const data = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data;
      console.error("[PersonaModal] HTTP", status, data);
      const msg =
        data?.message ?? data?.error ?? (err instanceof Error ? err.message : "Une erreur est survenue.");
      setError(status ? `Erreur serveur HTTP ${status} — ${msg}` : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-900 p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl shadow-md flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #F97316, #16a34a)" }}
          >
            <span className="text-white font-black text-xl leading-none select-none">
              S
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-white/90 leading-tight">
              SEREPRO
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">
              RH &amp; Finance CI
            </p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
          Bienvenue sur SEREPRO !
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Qui êtes-vous ? Choisissez le profil qui vous correspond.
        </p>

        {/* Persona cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setTenantType("ENTREPRISE")}
            className={`rounded-2xl border-2 p-4 text-left transition-all ${
              tenantType === "ENTREPRISE"
                ? "border-[#F97316] bg-orange-50 dark:bg-orange-500/10"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${
                tenantType === "ENTREPRISE"
                  ? "bg-gradient-to-br from-[#F97316] to-[#fb923c]"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              🏢
            </div>
            <p className="font-semibold text-sm text-gray-800 dark:text-white/90 mb-0.5">
              Entreprise
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              PME, société avec employés
            </p>
            {tenantType === "ENTREPRISE" && (
              <div className="mt-2 flex items-center gap-1 text-[#F97316] text-xs font-semibold">
                <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Sélectionné
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTenantType("ENTREPRENEUR")}
            className={`rounded-2xl border-2 p-4 text-left transition-all ${
              tenantType === "ENTREPRENEUR"
                ? "border-[#16a34a] bg-green-50 dark:bg-green-500/10"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${
                tenantType === "ENTREPRENEUR"
                  ? "bg-gradient-to-br from-[#16a34a] to-[#4ade80]"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              👤
            </div>
            <p className="font-semibold text-sm text-gray-800 dark:text-white/90 mb-0.5">
              Entrepreneur
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Particulier, emploi domestique
            </p>
            {tenantType === "ENTREPRENEUR" && (
              <div className="mt-2 flex items-center gap-1 text-[#16a34a] text-xs font-semibold">
                <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Sélectionné
              </div>
            )}
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4 mb-6">
          {error && <ErrorBanner msg={error} />}

          <div>
            <Label>
              {tenantType === "ENTREPRISE"
                ? "Nom de l'entreprise"
                : "Votre nom complet"}{" "}
              <span className="text-error-500">*</span>
            </Label>
            <Input
              placeholder={
                tenantType === "ENTREPRISE"
                  ? "ACME Côte d'Ivoire"
                  : "Kouassi Jean-Pierre"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label>Téléphone</Label>
            <Input
              type="tel"
              placeholder="+225 07 00 00 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <Button
          className="w-full"
          size="sm"
          disabled={!tenantType || !name.trim() || loading}
          onClick={handleConfirm}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Enregistrement…
            </span>
          ) : (
            "Confirmer mon profil"
          )}
        </Button>
      </div>
    </div>
  );
}
