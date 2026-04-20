import { useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../config/firebase";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "../AuthPages/AuthPageLayout";

type TenantType = "ENTREPRISE" | "ENTREPRENEUR";
type Step = 1 | 2 | 3;

const API_URL =
  import.meta.env.VITE_API_URL ?? "https://api.serepro.net/api/v1";

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/email-already-in-use": "Cet email est déjà associé à un compte.",
  "auth/invalid-email": "Adresse email invalide.",
  "auth/weak-password": "Le mot de passe doit contenir au moins 6 caractères.",
  "auth/network-request-failed":
    "Erreur réseau. Vérifiez votre connexion internet.",
};

function StepDots({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {([1, 2, 3] as Step[]).map((s) => (
        <span
          key={s}
          className={`h-2 rounded-full transition-all duration-300 ${
            s === current
              ? "w-8 bg-gradient-to-r from-[#F97316] to-[#16a34a]"
              : s < current
              ? "w-2 bg-[#16a34a]"
              : "w-2 bg-gray-200 dark:bg-gray-700"
          }`}
        />
      ))}
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
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

export default function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [tenantType, setTenantType] = useState<TenantType | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function step2Valid(): boolean {
    return (
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= 6 &&
      password === confirmPassword
    );
  }

  async function handleSubmit() {
    if (!tenantType) return;
    setError("");
    setLoading(true);
    setStep(3);

    try {
      if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        setStep(2);
        setLoading(false);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = cred.user;
      await updateProfile(firebaseUser, { displayName: name });

      const token = await firebaseUser.getIdToken();
      const resolvedName = name.trim();

      const body = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email ?? email,
        displayName: resolvedName,
        tenantName: resolvedName,
        tenantType,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      };

      console.log("[Register] POST /auth/register body:", body);

      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let data: { message?: string; error?: string } = {};
        try { data = await res.json(); } catch { /* ignore */ }
        console.error("[Register] API error", res.status, data);
        throw new Error(
          data.message ?? data.error ?? `Erreur serveur ${res.status}`
        );
      }

      setSuccess(true);
      setTimeout(() => navigate("/", { replace: true }), 2000);
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code: string }).code
          : "";
      const msg =
        err instanceof Error ? err.message : "Une erreur inattendue est survenue.";
      console.error("[Register] error:", err);
      setError(FIREBASE_ERRORS[code] ?? msg);
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageMeta
        title="Créer un compte | SEREPRO"
        description="Créez votre espace SEREPRO"
      />
      <AuthLayout>
        <div className="flex flex-col flex-1">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4 py-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="flex items-center justify-center w-11 h-11 rounded-xl shadow-md flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #F97316, #16a34a)" }}
              >
                <span className="text-white font-black text-2xl leading-none select-none">
                  S
                </span>
              </div>
              <div>
                <p className="text-base font-bold text-gray-800 dark:text-white/90 leading-tight">
                  SEREPRO
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                  RH &amp; Finance CI
                </p>
              </div>
            </div>

            <StepDots current={step} />

            {/* ── STEP 1 : Persona ─────────────────────────── */}
            {step === 1 && (
              <div>
                <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90 mb-1">
                  Qui êtes-vous ?
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Choisissez le profil qui vous correspond.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setTenantType("ENTREPRISE")}
                    className={`rounded-2xl border-2 p-5 text-left transition-all ${
                      tenantType === "ENTREPRISE"
                        ? "border-[#F97316] bg-orange-50 dark:bg-orange-500/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${
                        tenantType === "ENTREPRISE"
                          ? "bg-gradient-to-br from-[#F97316] to-[#fb923c]"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      🏢
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-white/90 mb-1">
                      Entreprise
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      PME, société avec employés à gérer
                    </p>
                    {tenantType === "ENTREPRISE" && (
                      <div className="mt-3 flex items-center gap-1 text-[#F97316] text-xs font-semibold">
                        <svg className="size-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Sélectionné
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTenantType("ENTREPRENEUR")}
                    className={`rounded-2xl border-2 p-5 text-left transition-all ${
                      tenantType === "ENTREPRENEUR"
                        ? "border-[#16a34a] bg-green-50 dark:bg-green-500/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${
                        tenantType === "ENTREPRENEUR"
                          ? "bg-gradient-to-br from-[#16a34a] to-[#4ade80]"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      👤
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-white/90 mb-1">
                      Entrepreneur
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Particulier, emploi domestique
                    </p>
                    {tenantType === "ENTREPRENEUR" && (
                      <div className="mt-3 flex items-center gap-1 text-[#16a34a] text-xs font-semibold">
                        <svg className="size-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Sélectionné
                      </div>
                    )}
                  </button>
                </div>

                <Button
                  className="w-full"
                  size="sm"
                  disabled={!tenantType}
                  onClick={() => setStep(2)}
                >
                  Continuer
                </Button>

                <p className="mt-5 text-sm text-center text-gray-500 dark:text-gray-400">
                  Déjà un compte ?{" "}
                  <Link
                    to="/signin"
                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium"
                  >
                    Se connecter
                  </Link>
                </p>
              </div>
            )}

            {/* ── STEP 2 : Informations ─────────────────────── */}
            {step === 2 && (
              <div>
                <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90 mb-1">
                  {tenantType === "ENTREPRISE" ? "Votre entreprise" : "Vos informations"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {tenantType === "ENTREPRISE"
                    ? "Renseignez les informations de votre société."
                    : "Renseignez vos informations personnelles."}
                </p>

                <div className="space-y-4">
                  {error && <ErrorBanner msg={error} />}

                  <div>
                    <Label>
                      {tenantType === "ENTREPRISE" ? "Nom de l'entreprise" : "Votre nom complet"}{" "}
                      <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      placeholder={tenantType === "ENTREPRISE" ? "ACME Côte d'Ivoire" : "Kouassi Jean-Pierre"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>
                      Email <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      placeholder="contact@exemple.ci"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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

                  <div>
                    <Label>
                      Mot de passe <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPass ? "text" : "password"}
                        placeholder="Minimum 6 caractères"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPass ? (
                          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label>
                      Confirmer le mot de passe <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Répétez votre mot de passe"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        error={confirmPassword.length > 0 && password !== confirmPassword}
                        hint={
                          confirmPassword.length > 0 && password !== confirmPassword
                            ? "Les mots de passe ne correspondent pas"
                            : undefined
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 text-gray-400"
                        style={{ top: confirmPassword && password !== confirmPassword ? "36%" : "50%", transform: "translateY(-50%)" }}
                      >
                        {showConfirm ? (
                          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setError(""); setStep(1); }}
                  >
                    Retour
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={!step2Valid()}
                    onClick={handleSubmit}
                  >
                    Créer mon compte
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 3 : Processing / Success ────────────── */}
            {step === 3 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                {loading && !success && (
                  <>
                    <div
                      className="flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg mb-6 serepro-glow animate-pulse"
                      style={{ background: "linear-gradient(135deg, #F97316, #16a34a)" }}
                    >
                      <span className="text-white font-black text-4xl leading-none select-none">S</span>
                    </div>
                    <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Création du compte…
                    </p>
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </>
                )}

                {success && (
                  <>
                    <div
                      className="flex items-center justify-center w-20 h-20 rounded-full mb-6 shadow-lg"
                      style={{ background: "linear-gradient(135deg, #F97316, #16a34a)" }}
                    >
                      <svg className="size-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2">
                      Compte créé avec succès !
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Bienvenue sur SEREPRO,{" "}
                      <strong className="text-gray-700 dark:text-gray-300">{name || email}</strong>
                    </p>
                    <p className="text-xs text-gray-400">Redirection vers votre tableau de bord…</p>
                  </>
                )}

                {!loading && !success && error && (
                  <div className="w-full">
                    <ErrorBanner msg={error} />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => { setStep(2); setError(""); }}
                    >
                      Réessayer
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
