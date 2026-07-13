import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  FileText,
  LockKeyhole,
  Mail,
  MapPinned,
  Search,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import RudaLogo from "../../assets/RUDA L&M.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FEATURE_ITEMS = [
  { label: "Parcel Search", icon: Search },
  { label: "Map Insights", icon: TrendingUp },
  { label: "Land Use", icon: Building2 },
  { label: "Reports", icon: FileText },
];

export default function Login() {
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 70);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/login-user/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data?.message || "Email or password is incorrect.");
        return;
      }

      const auth = data?.data || {};
      const storage = rememberMe ? localStorage : sessionStorage;

      storage.setItem("accessToken", auth.access || auth.token || "");
      storage.setItem("refreshToken", auth.refresh || "");
      storage.setItem(
        "user",
        JSON.stringify({
          id: auth.id,
          email: auth.email,
          first_name: auth.first_name,
          last_name: auth.last_name,
          role: auth.role,
          is_active: auth.is_active,
        }),
      );

      if (!rememberMe) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }

      navigate("/landing");
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Unable to sign in right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07120e]">
      <style>{`
        @keyframes authPanelIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes authGlow {
          0%, 100% { opacity: .18; }
          50% { opacity: .38; }
        }

        @keyframes authImageFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(4,24,17,.95), rgba(4,42,29,.88), rgba(3,18,13,.96)), url('/ruda_bg.png')",
        }}
      />

      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div
        className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-emerald-400/12 blur-3xl"
        style={{ animation: "authGlow 7s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-6 h-80 w-80 rounded-full bg-cyan-400/8 blur-3xl"
        style={{ animation: "authGlow 9s ease-in-out 1.5s infinite" }}
      />

      <main className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-center px-4 py-6 sm:px-6">
        <div
          className={`grid w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a1c15]/92 shadow-[0_32px_90px_-38px_rgba(0,0,0,.96)] backdrop-blur-xl transition-all duration-700 lg:grid-cols-2 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          style={{
            animation: mounted
              ? "authPanelIn 700ms cubic-bezier(.22,1,.36,1) both"
              : "none",
          }}
        >
          {/* LEFT BRAND PANEL */}
          <section className="relative hidden min-h-[560px] overflow-hidden border-r border-white/15 bg-[#081a13]/96 p-9 lg:flex lg:flex-col lg:justify-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(57,210,154,.12),transparent_40%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.09] [background-image:linear-gradient(rgba(77,225,172,.11)_1px,transparent_1px),linear-gradient(90deg,rgba(77,225,172,.11)_1px,transparent_1px)] [background-size:44px_44px]" />

            <div className="relative mx-auto w-full max-w-[420px] text-center">
              <div
                className="mx-auto overflow-hidden rounded-xl border border-emerald-300/20 bg-black/25 p-1 shadow-[0_18px_50px_-25px_rgba(0,0,0,.9)]"
                style={{ animation: "authImageFloat 7s ease-in-out infinite" }}
              >
                <img
                  src="/s1.png"
                  alt="RUDA GIS Metaverse preview"
                  className="h-28 w-full rounded-lg object-cover opacity-85"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <div className="mt-7 flex items-center justify-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white p-1.5 shadow-lg">
                  <img
                    src={RudaLogo}
                    alt="RUDA"
                    className="h-12 w-12 object-contain"
                  />
                </div>

                <div className="text-left">
                  <h1 className="text-2xl font-black tracking-tight text-white">
                    RUDA GIS METAVERSE
                  </h1>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#6fcbae]">
                    Cadastral Management System
                  </p>
                </div>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-3">
                {FEATURE_ITEMS.map(({ label, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.035] px-4 py-3 text-left transition duration-300 hover:border-emerald-300/20 hover:bg-white/[0.06]"
                  >
                    <Icon size={17} className="shrink-0 text-[#75d8b9]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-300">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* RIGHT LOGIN PANEL */}
          <section className="relative flex min-h-[560px] items-center bg-[#102720]/98 p-6 sm:p-9 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(90,218,170,.08),transparent_36%)]" />

            <div className="relative mx-auto w-full max-w-[430px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-200/70">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Secure access
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-100">
                Sign in
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Use your RUDA RCMS credentials to continue.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200"
                  >
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400"
                  >
                    Email address
                  </label>

                  <div className="relative mt-2">
                    <Mail
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.055] py-3.5 pl-12 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 hover:border-white/18 focus:border-emerald-300/40 focus:ring-4 focus:ring-emerald-300/5"
                      placeholder="superadmin@ruda.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400"
                  >
                    Password
                  </label>

                  <div className="relative mt-2">
                    <LockKeyhole
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.055] py-3.5 pl-12 pr-12 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 hover:border-white/18 focus:border-emerald-300/40 focus:ring-4 focus:ring-emerald-300/5"
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-200"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) =>
                        setRememberMe(event.target.checked)
                      }
                      className="h-4 w-4 rounded border-white/20 bg-transparent text-emerald-500 focus:ring-emerald-400/20"
                    />
                    Remember me
                  </label>

                  <button
                    type="button"
                    className="text-sm font-bold text-slate-400 transition hover:text-slate-200"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-[#0b5e48] via-[#087e5d] to-[#00947c] px-5 py-3.5 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_36px_-22px_rgba(0,150,112,.7)] transition duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/12 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative">
                    {isLoading ? "Signing in..." : "Sign in to terminal"}
                  </span>
                  {!isLoading && (
                    <ArrowRight
                      size={15}
                      className="relative transition-transform group-hover:translate-x-1"
                    />
                  )}
                </button>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-xs leading-5 text-slate-400">
                  No registration required. If you don&apos;t have access,
                  contact the system administrator.
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}