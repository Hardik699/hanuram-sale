import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User, CheckCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Simple authentication check
    if (username === "admin" && password === "admin1") {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("username", username);
      navigate("/dashboard");
    } else {
      setError("Invalid credentials. Try admin / admin1");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600 rounded-full opacity-15 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-32 right-20 w-80 h-80 bg-emerald-500 rounded-full opacity-15 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }}></div>
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-orange-500 rounded-full opacity-15 blur-3xl animate-pulse" style={{ animationDelay: "3s" }}></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md animate-float-in">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Colorful Top Stripe */}
          <div className="h-2 flex">
            <div className="flex-1 bg-blue-600"></div>
            <div className="flex-1 bg-emerald-500"></div>
            <div className="flex-1 bg-orange-500"></div>
          </div>

          {/* Blue Header Section */}
          <div className="bg-blue-600 px-8 py-12 text-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/30 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="mb-4 inline-flex p-4 bg-blue-500/30 rounded-2xl">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                Data Portal
              </h1>
              <p className="text-blue-100 font-medium text-base">
                Upload Management System
              </p>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleLogin} className="p-8 space-y-5">
            {/* Error Message */}
            {error && (
              <div className="animate-float-in p-4 bg-red-50 border-2 border-red-300 rounded-2xl">
                <p className="text-red-700 font-semibold text-sm">{error}</p>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-3 animate-slide-in-left">
              <label htmlFor="username" className="block text-sm font-bold text-gray-900 uppercase tracking-wide">
                Username
              </label>
              <div
                className={`relative flex items-center transition-all duration-300 ${
                  focusedField === "username" ? "scale-105" : ""
                }`}
              >
                <User className="absolute left-4 w-5 h-5 text-blue-600" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="admin"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-50 hover:bg-white focus:bg-white focus:border-blue-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500 font-medium transition-all duration-300"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-3 animate-slide-in-left" style={{ animationDelay: "0.1s" }}>
              <label htmlFor="password" className="block text-sm font-bold text-gray-900 uppercase tracking-wide">
                Password
              </label>
              <div
                className={`relative flex items-center transition-all duration-300 ${
                  focusedField === "password" ? "scale-105" : ""
                }`}
              >
                <Lock className="absolute left-4 w-5 h-5 text-emerald-600" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-xl bg-gray-50 hover:bg-white focus:bg-white focus:border-emerald-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500 font-medium transition-all duration-300"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-gray-500 hover:text-gray-900 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-modern w-full mt-8 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl disabled:opacity-70 disabled:cursor-not-allowed transform transition-all duration-300 hover:shadow-2xl hover:shadow-blue-600/40 active:scale-95 text-lg uppercase tracking-wide"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  Logging in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Demo Credentials - Emerald Section */}
          <div className="bg-emerald-50 px-8 py-8 border-t-2 border-emerald-200">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="font-black text-emerald-900 text-lg">DEMO CREDENTIALS</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border-2 border-emerald-300 shadow-md">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">Username:</span>
                    <span className="font-mono font-black text-blue-600 text-lg bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">admin</span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-emerald-200 to-transparent"></div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">Password:</span>
                    <span className="font-mono font-black text-orange-600 text-lg bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">admin1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Accent Stripe */}
          <div className="h-1 bg-gradient-to-r from-blue-600 via-emerald-500 to-orange-500"></div>
        </div>
      </div>
    </div>
  );
}
