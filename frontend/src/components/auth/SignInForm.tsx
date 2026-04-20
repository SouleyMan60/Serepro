import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Email ou mot de passe incorrect.",
  "auth/user-not-found": "Aucun compte associé à cet email.",
  "auth/wrong-password": "Mot de passe incorrect.",
  "auth/invalid-email": "Adresse email invalide.",
  "auth/user-disabled": "Ce compte a été désactivé.",
  "auth/too-many-requests": "Trop de tentatives. Veuillez réessayer plus tard.",
  "auth/network-request-failed": "Erreur réseau. Vérifiez votre connexion internet.",
  "auth/popup-closed-by-user": "",
  "auth/cancelled-popup-request": "",
};

function ErrorBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
      <svg className="size-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <p className="text-sm text-red-600 dark:text-red-400">{msg}</p>
    </div>
  );
}

export default function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  // ── Email / password sign-in ───────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err
        ? (err as { code: string }).code : "";
      setError(FIREBASE_ERRORS[code] ?? "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  // ── Google sign-in ─────────────────────────────────────────
  async function handleGoogleSignIn() {
    setError("");
    setLoadingGoogle(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // AuthContext will call /auth/me and set needsPersona if new user
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err
        ? (err as { code: string }).code : "";
      const msg = FIREBASE_ERRORS[code];
      if (msg !== "") {
        setError(msg ?? "Erreur lors de la connexion Google. Réessayez.");
      }
    } finally {
      setLoadingGoogle(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
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

          <div className="mb-6">
            <h1 className="mb-1 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Connexion
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Entrez vos identifiants pour accéder à votre espace.
            </p>
          </div>

          {/* ── Google button ── */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle || loading}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {loadingGoogle ? (
              <span className="size-5 rounded-full border-2 border-gray-300 border-t-[#4285F4] animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M18.751 10.194c0-.72-.059-1.245-.188-1.789H10.18v3.247h4.92c-.099.807-.635 2.022-1.826 2.839l-.016.109 2.65 2.012.184.018C17.779 15.104 18.751 12.858 18.751 10.194z" fill="#4285F4"/>
                <path d="M10.179 18.75c2.41 0 4.434-.778 5.912-2.12l-2.819-2.138c-.754.515-1.766.875-3.093.875-2.362 0-4.366-1.527-5.08-3.636l-.105.009-2.756 2.09-.036.098C3.671 16.786 6.687 18.75 10.179 18.75z" fill="#34A853"/>
                <path d="M5.1 11.73a5.542 5.542 0 01-.302-1.73c0-.602.11-1.186.29-1.731l-.005-.114L2.295 6.03l-.092.043A9.01 9.01 0 001.251 10c0 1.41.348 2.742.952 3.928L5.1 11.73z" fill="#FBBC05"/>
                <path d="M10.179 4.633c1.676 0 2.807.71 3.452 1.303l2.52-2.408C14.603 2.115 12.589 1.25 10.179 1.25c-3.492 0-6.508 1.964-7.976 4.822l2.875 2.197c.724-2.11 2.728-3.636 5.101-3.636z" fill="#EB4335"/>
              </svg>
            )}
            {loadingGoogle ? "Connexion…" : "Continuer avec Google"}
          </button>

          {/* ── Separator ── */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400 dark:bg-gray-900">ou</span>
            </div>
          </div>

          {/* ── Email / password form ── */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {error && <ErrorBanner msg={error} />}

              <div>
                <Label>Email <span className="text-error-500">*</span></Label>
                <Input
                  type="email"
                  placeholder="demo@serepro.net"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label>Mot de passe <span className="text-error-500">*</span></Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword
                      ? <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link to="/reset-password" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button className="w-full" size="sm" disabled={loading || !email || !password}>
                {loading ? "Connexion en cours…" : "Se connecter"}
              </Button>
            </div>
          </form>

          {/* ── Register link ── */}
          <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
            Pas encore de compte ?{" "}
            <Link to="/register" className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
