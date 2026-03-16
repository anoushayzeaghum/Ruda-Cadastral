import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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
      {/* overlay */}
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-10 grid grid-cols-2 gap-16 items-center">

        {/* LEFT SIDE (same as login) */}

        <div className="text-white space-y-6">

          <h1 className="text-5xl font-bold leading-tight">
            Register Now
          </h1>

          <p className="text-white/100 max-w-md">
            RUDA Cadastral Management System provides secure access to cadastral
            data, spatial records and land management tools.
          </p>

          <p className="text-white/100 text-sm">
            Create your account to manage cadastral information and spatial data.
          </p>

        </div>


        {/* RIGHT SIDE REGISTER FORM */}

        <div className="w-full max-w-md">

          <h2 className="text-white text-4xl font-semibold mb-6">
            Register
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}

            <div>
              <label className="text-white text-sm block mb-1">
                Full Name
              </label>

              <div className="relative">

                <User
                  size={18}
                  className="absolute left-3 top-3 text-gray-600"
                />

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 py-2.5 rounded bg-white text-gray-800 outline-none"
                  required
                />

              </div>
            </div>


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
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 py-2.5 rounded bg-white text-gray-800 outline-none"
                  required
                />

              </div>
            </div>


            {/* Phone */}

            <div>
              <label className="text-white text-sm block mb-1">
                Phone Number
              </label>

              <div className="relative">

                <Phone
                  size={18}
                  className="absolute left-3 top-3 text-gray-600"
                />

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 py-2.5 rounded bg-white text-gray-800 outline-none"
                  required
                />

              </div>
            </div>


            {/* Password */}

            <div>
              <label className="text-white text-sm block mb-1">
                Password
              </label>

              <div className="relative">

                <Lock
                  size={18}
                  className="absolute left-3 top-3 text-gray-600"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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


            {/* Confirm Password */}

            <div>
              <label className="text-white text-sm block mb-1">
                Confirm Password
              </label>

              <div className="relative">

                <Lock
                  size={18}
                  className="absolute left-3 top-3 text-gray-600"
                />

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 rounded bg-white text-gray-800 outline-none"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-3 text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>
            </div>


            {/* Button */}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-orange-600 text-white py-2.5 rounded font-semibold transition"
            >
              {isLoading ? "Creating Account..." : "Register"}
            </button>


            {/* Login link */}

            <p className="text-white/70 text-sm mt-2">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/login")}
                className="underline cursor-pointer"
              >
                Login
              </span>
            </p>

          </form>

        </div>

      </div>
    </div>
  );
}