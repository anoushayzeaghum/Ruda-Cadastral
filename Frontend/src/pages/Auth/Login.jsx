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
    <div className="relative min-h-screen overflow-hidden bg-[#030a07] font-sans selection:bg-emerald-500/30">
      <style>{`
        @keyframes authPanelIn {
          from { opacity: 0; transform: translateY(30px) scale(0.97); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes authGlow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px #0a1c15 inset !important;
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* ── Cinematic Background with 4K Earth Video ── */}
      <div className="absolute inset-0 z-0 bg-[#020e0a]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-screen"
        >
          {/* High quality revolving earth video from Pexels */}
          <source src="https://videos.pexels.com/video-files/1851190/1851190-uhd_3840_2160_25fps.mp4" type="video/mp4" />
          <source src="https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4" type="video/mp4" />
        </video>
        
        {/* Deep gradient overlay to blend video with the green theme */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030a07] via-[#030a07]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030a07] via-[#030a07]/40 to-[#030a07]" />
        
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(11,122,59,0.25),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(56,212,212,0.15),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay [background-image:repeating-conic-gradient(rgba(255,255,255,0.06)_0%,transparent_1%,transparent_2%,rgba(255,255,255,0.04)_3%)] [background-size:96px_96px]" />
        
        {/* Animated Orbs */}
        <div 
          className="pointer-events-none absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(73,184,74,0.15),transparent_60%)] blur-3xl"
          style={{ animation: 'authGlow 10s ease-in-out infinite' }}
        />
        <div 
          className="pointer-events-none absolute bottom-1/4 right-1/4 h-[600px] w-[600px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,rgba(0,148,124,0.12),transparent_60%)] blur-3xl"
          style={{ animation: 'authGlow 14s ease-in-out 2s infinite' }}
        />
      </div>

      <main className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-8">
        <div
          className={`w-full max-w-[460px] overflow-hidden rounded-[2.5rem] border border-white/[0.08] bg-[#0a1c15]/70 p-7 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all duration-1000 sm:p-10 ${mounted ? "opacity-100" : "opacity-0"
            }`}
          style={{
            animation: mounted ? "authPanelIn 1000ms cubic-bezier(0.16, 1, 0.3, 1) both" : "none",
          }}
        >
          {/* ── Logo & Header ── */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#0b5e48]/30 to-transparent" />
              <img src={RudaLogo} alt="RUDA" className="relative z-10 h-10 w-10 object-contain drop-shadow-xl" />
            </div>

            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#49B84A]/20 bg-[#49B84A]/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[#49B84A]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#49B84A] opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#6fdb5a]"></span>
              </span>
              Secure Portal
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-[34px]">
              Welcome Back
            </h1>
            <p className="mt-2.5 text-[13px] text-slate-400">
              Sign in to RUDA Cadastral Management System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {errorMessage && (
              <div
                role="alert"
                className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-200"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">!</div>
                {errorMessage}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-4 text-[13px] text-white outline-none transition-all placeholder:text-slate-500 hover:border-white/20 focus:border-[#49B84A]/50 focus:bg-black/40 focus:ring-4 focus:ring-[#49B84A]/10"
                  placeholder="superadmin@ruda.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-[11px] font-bold text-[#49B84A] transition hover:text-[#6fdb5a]"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <LockKeyhole
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-11 text-[13px] text-white outline-none transition-all placeholder:text-slate-500 hover:border-white/20 focus:border-[#49B84A]/50 focus:bg-black/40 focus:ring-4 focus:ring-[#49B84A]/10"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="peer relative h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[4px] border border-white/20 bg-black/20 outline-none transition-all checked:border-[#49B84A] checked:bg-[#49B84A] hover:border-white/30"
              />
              <svg
                className="pointer-events-none absolute left-0 h-4 w-4 scale-50 text-white opacity-0 transition-all peer-checked:scale-100 peer-checked:opacity-100"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <label htmlFor="rememberMe" className="cursor-pointer text-[13px] text-slate-400 transition-colors hover:text-slate-300">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative mt-2 flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-[#0B7A3B] via-[#0d8f47] to-[#0B7A3B] px-5 py-3.5 text-[11px] font-black uppercase tracking-[0.15em] text-white shadow-[0_12px_30px_-10px_rgba(73,184,74,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-10px_rgba(73,184,74,0.7)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ backgroundSize: "200% 100%", animation: "shimmer 2s ease-in-out infinite" }} />
              <span className="relative">
                {isLoading ? "Authenticating..." : "Sign in to Dashboard"}
              </span>
              {!isLoading && (
                <ArrowRight
                  size={15}
                  className="relative transition-transform duration-300 group-hover:translate-x-1"
                />
              )}
            </button>

            <div className="mt-6 border-t border-white/10 pt-5 text-center">
              <p className="text-[11px] leading-relaxed text-slate-500">
                Protected system. Unauthorized access is strictly prohibited.<br />
                Contact <a href="mailto:support@ruda.com" className="font-semibold text-slate-400 hover:text-white">support@ruda.com</a> for access issues.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}