import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../config/firebase";

const API_URL = "https://api.serepro.net/api/v1";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  needsPersona: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  needsPersona: false,
  refreshUserProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPersona, setNeedsPersona] = useState(false);

  const checkProfile = useCallback(async (firebaseUser: User) => {
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNeedsPersona(res.status === 404);
    } catch (err) {
      // CORS or network error — don't block the user
      console.warn("[AuthContext] /auth/me unreachable, skipping persona check:", err);
      setNeedsPersona(false);
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    const u = auth.currentUser;
    if (u) await checkProfile(u);
  }, [checkProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await checkProfile(firebaseUser);
      } else {
        setNeedsPersona(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [checkProfile]);

  return (
    <AuthContext.Provider value={{ user, loading, needsPersona, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-5">
        <div
          className="flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg serepro-glow"
          style={{ background: "linear-gradient(135deg, #F97316, #16a34a)" }}
        >
          <span className="text-white font-black text-4xl leading-none select-none">
            S
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            SEREPRO
          </p>
          <div className="flex gap-1.5 mt-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
