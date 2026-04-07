import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  MapPin,
  Phone,
  Shield,
} from "lucide-react";
import rudaFirmLogo from "../../assets/Rudafirm.png";

export default function Register() {
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    email: "",
    role: "admin",
    address: "",
    contact: "",
    password: "",
    confirm_password: "",
  });

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirm_password) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        company_name: formData.company_name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role || "admin",
        address: formData.address?.trim() || "",
        contact: formData.contact?.trim() || "",
        password: formData.password,
      };

      const response = await fetch("http://127.0.0.1:8000/api/create-user/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Register response:", data);

      if (!response.ok) {
        const errorMessage = data?.data
          ? Object.entries(data.data)
              .map(([key, value]) => {
                const text = Array.isArray(value) ? value.join(", ") : value;
                return `${key}: ${text}`;
              })
              .join("\n")
          : data?.message || "Registration failed.";

        alert(errorMessage);
        return;
      }

      alert("Account created successfully.");
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      alert("Something went wrong while creating account.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseClass =
    "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-sky-300 focus:ring-4 focus:ring-sky-200/50";

  const passwordInputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-12 pr-11 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-sky-300 focus:ring-4 focus:ring-sky-200/50";

  const iconWrapClass =
    "absolute left-3 top-2 grid h-7 w-7 place-items-center rounded-lg bg-slate-50 text-slate-500";

  return (
    <div className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-green-950 via-emerald-900 to-slate-950">
      {/* background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.16]">
        <svg
          className="h-full w-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="gridFade" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#93c5fd" stopOpacity="0.35" />
              <stop offset="0.5" stopColor="#34d399" stopOpacity="0.25" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.12" />
            </linearGradient>
            <pattern
              id="grid"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="url(#gridFade)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="1200" height="800" fill="url(#grid)" />
          <path
            d="M0,560 C180,520 260,620 440,590 C620,560 740,420 940,460 C1060,485 1120,540 1200,510"
            fill="none"
            stroke="rgba(147,197,253,0.45)"
            strokeWidth="2"
            strokeDasharray="10 10"
          />
          <path
            d="M0,300 C240,260 320,360 520,330 C720,300 820,160 1020,200 C1120,220 1160,255 1200,235"
            fill="none"
            stroke="rgba(52,211,153,0.35)"
            strokeWidth="2"
            strokeDasharray="14 12"
          />
          <animate
            attributeName="opacity"
            values="0.55;0.85;0.55"
            dur="7s"
            repeatCount="indefinite"
          />
        </svg>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-black/20" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-4 sm:px-6">
        <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          {/* LEFT PANEL */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 pt-4 pb-6 shadow-2xl backdrop-blur-sm lg:px-7 lg:pt-6 lg:pb-7">
            {/* decorative blobs */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-300/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-emerald-300/15 blur-2xl" />

            {/* LOGO */}
            <div className="flex justify-center mt-20">
              <div className="rounded-full bg-white p-2 shadow-sm">
                <img
                  src={rudaFirmLogo}
                  alt="RUDA"
                  className="h-16 w-16 object-contain sm:h-20 sm:w-20"
                />
              </div>
            </div>

            {/* TEXT */}
            <div className="mt-5 space-y-3 text-center">
              <h1 className="mx-auto max-w-xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                Create your RCMS
                <span className="block text-sky-200">account access</span>
              </h1>

              <p className="mx-auto max-w-md text-sm leading-6 text-white/80">
                Register your organization and admin details to access cadastral
                parcels, spatial records, and land management tools.
              </p>

              {/* FEATURES */}
              <div className="mt-5 grid gap-3 text-sm text-white/85 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-2.5">
                  Company onboarding
                </div>
                <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-2.5">
                  Secure access
                </div>
                <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-2.5">
                  Spatial records
                </div>
                <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-2.5">
                  Role management
                </div>
              </div>
            </div>
          </div>
          {/* RIGHT PANEL */}
          <div className="flex items-center">
            <div
              className={[
                "w-full transition duration-700 ease-out",
                mounted
                  ? "translate-y-0 opacity-100"
                  : "translate-y-3 opacity-0",
              ].join(" ")}
            >
              <div className="relative rounded-3xl bg-gradient-to-br from-sky-200/60 via-white/40 to-emerald-200/60 p-[1px] shadow-2xl">
                <div className="relative overflow-hidden rounded-3xl bg-white/95 p-5 backdrop-blur-sm lg:p-6">
                  <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl animate-pulse" />
                  <div className="pointer-events-none absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-emerald-200/35 blur-3xl animate-pulse" />

                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-slate-900">
                      Register
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Fill the details below to create your account.
                    </p>

                    <div className="mt-3 flex justify-center">
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Secure registration
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          First name
                        </label>
                        <div className="relative mt-1.5">
                          <div className={iconWrapClass}>
                            <User size={15} />
                          </div>
                          <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            className={inputBaseClass}
                            placeholder="First name"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Last name
                        </label>
                        <div className="relative mt-1.5">
                          <div className={iconWrapClass}>
                            <User size={15} />
                          </div>
                          <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            className={inputBaseClass}
                            placeholder="Last name"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Company name
                        </label>
                        <div className="relative mt-1.5">
                          <div className={iconWrapClass}>
                            <Building2 size={15} />
                          </div>
                          <input
                            type="text"
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleChange}
                            className={inputBaseClass}
                            placeholder="Company name"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Role
                        </label>
                        <div className="relative mt-1.5">
                          <div className={iconWrapClass}>
                            <Shield size={15} />
                          </div>
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className={inputBaseClass}
                            required
                          >
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Email address
                      </label>
                      <div className="relative mt-1.5">
                        <div className={iconWrapClass}>
                          <Mail size={15} />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={inputBaseClass}
                          placeholder="name@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_0.9fr]">
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Address
                        </label>
                        <div className="relative mt-1.5">
                          <div className={iconWrapClass}>
                            <MapPin size={15} />
                          </div>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className={inputBaseClass}
                            placeholder="Address"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Contact
                        </label>
                        <div className="relative mt-1.5">
                          <div className={iconWrapClass}>
                            <Phone size={15} />
                          </div>
                          <input
                            type="text"
                            name="contact"
                            value={formData.contact}
                            onChange={handleChange}
                            className={inputBaseClass}
                            placeholder="Contact number"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Password
                        </label>
                        <div className="relative mt-1.5">
                          <div className={iconWrapClass}>
                            <Lock size={15} />
                          </div>
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={passwordInputClass}
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            {showPassword ? (
                              <EyeOff size={17} />
                            ) : (
                              <Eye size={17} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Confirm password
                        </label>
                        <div className="relative mt-1.5">
                          <div className={iconWrapClass}>
                            <Lock size={15} />
                          </div>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            className={passwordInputClass}
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-2.5 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            {showConfirmPassword ? (
                              <EyeOff size={17} />
                            ) : (
                              <Eye size={17} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-green-900 via-green-800 to-emerald-700 py-2.5 font-semibold text-white shadow-sm transition hover:from-green-800 hover:via-green-700 hover:to-emerald-600 focus:outline-none focus:ring-4 focus:ring-sky-200/60 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                        <span className="absolute -left-20 top-0 h-full w-28 skew-x-[-20deg] bg-white/20 blur-sm animate-pulse" />
                      </span>
                      {isLoading ? "Creating account..." : "Create account"}
                    </button>

                    <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                      <p className="text-xs text-slate-500">
                        Backend will manage active, verified and staff status.
                      </p>

                      <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="shrink-0 font-medium text-green-800 hover:text-green-700 hover:underline"
                      >
                        Sign in
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          {/* END RIGHT */}
        </div>
      </div>
    </div>
  );
}
