import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../config/firebase";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "../AuthPages/AuthPageLayout";

type Step = 1 | 2;

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/email-already-in-use": "Cet email est déjà associé à un compte.",
  "auth/invalid-email": "Adresse email invalide.",
  "auth/weak-password": "Le mot de passe doit contenir au moins 6 caractères.",
  "auth/network-request-failed": "Erreur réseau. Vérifiez votre connexion internet.",
};

function StepDots({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {([1, 2] as Step[]).map((s) => (
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
      <svg className="size-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <p className="text-sm text-red-600 dark:text-red-400">{msg}</p>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function formValid(): boolean {
    return (
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= 6 &&
      password === confirmPassword
    );
  }

  async function handleSubmit() {
    if (!formValid()) return;
    setError("");
    setLoading(true);
    setStep(2);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name.trim() });
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code: string }).code
          : "";
      const msg =
        err instanceof Error ? err.message : "Une erreur inattendue est survenue.";
      setError(FIREBASE_ERRORS[code] ?? msg);
      setStep(1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageMeta title="Créer un compte | SEREPRO" description="Créez votre espace SEREPRO" />
      <AuthLayout>
        <div className="flex flex-col flex-1">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4 py-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="flex items-center justify-center w-11 h-11 rounded-xl shadow-md flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #F97316, #16a34a)" }}
              >
                <span className="text-white font-black text-2xl leading-none select-none">S</span>
              </div>
              <div>
                <p className="text-base font-bold text-gray-800 dark:text-white/90 leading-tight">SEREPRO</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">RH &amp; Finance CI</p>
              </div>
            </div>

            <StepDots current={step} />

            {/* ── STEP 1 : Informations de compte ─────────────────── */}
            {step === 1 && (
              <div>
                <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90 mb-1">
                  Créer un compte
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Renseignez vos informations pour commencer.
                </p>

                <div className="space-y-4">
                  {error && <ErrorBanner msg={error} />}

                  <div>
                    <Label>
                      Nom complet <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      placeholder="Kouassi Jean-Pierre"
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
                        style={{
                          top: confirmPassword && password !== confirmPassword ? "36%" : "50%",
                          transform: "translateY(-50%)",
                        }}
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

                <Button
                  className="w-full mt-6"
                  size="sm"
                  disabled={!formValid() || loading}
                  onClick={handleSubmit}
                >
                  Créer mon compte
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

            {/* ── STEP 2 : Traitement ───────────────────────────────── */}
            {step === 2 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
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
              </div>
            )}
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
