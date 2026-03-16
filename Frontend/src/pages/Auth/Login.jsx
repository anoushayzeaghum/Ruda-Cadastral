import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 1200);
  };

  return (
    <div
      className="h-screen w-screen bg-cover bg-center flex items-center"
      style={{ backgroundImage: "url('/ruda_bg.png')" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-10 grid grid-cols-2 gap-16 items-center">
        {/* LEFT SIDE */}
        <div className="text-white space-y-6">
          <h1 className="text-6xl font-bold leading-tight">
            Welcome <br /> Back
          </h1>

          <p className="text-white/100 max-w-md">
            RUDA Cadastral Management System provides secure access to cadastral
            data, spatial records and land management tools.
          </p>

          <p className="text-white/100 text-sm">
            Access the system to manage cadastral information and spatial data.
          </p>
        </div>

        {/* RIGHT SIDE LOGIN */}
        <div className="w-full max-w-md">
          <h2 className="text-white text-4xl font-semibold mb-6">Login</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-white text-sm block mb-1">
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-3 text-gray-600"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 py-2.5 rounded bg-white text-gray-800 outline-none"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-white text-sm block mb-1">Password</label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-3 text-gray-600"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded bg-white text-gray-800 outline-none"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember */}
            <div className="flex items-center justify-between text-sm text-white">
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                Remember Me
              </label>

              <button className="hover:underline">Lost your password?</button>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-orange-600 text-white py-2.5 rounded font-semibold transition"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>

            <p className="text-white/70 text-xs mt-4">
              By clicking on "Login in now" you agree to our Terms of Service
              and Privacy Policy
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
