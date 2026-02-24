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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Background Shapes - Single Colors */}
      <div className="absolute top-10 left-10 w-40 h-40 bg-blue-500 rounded-full opacity-10 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-60 h-60 bg-orange-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      <div className="absolute top-1/2 -left-32 w-96 h-96 bg-emerald-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md animate-float-in">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Blue Header */}
          <div className="h-40 bg-blue-600 relative overflow-hidden flex flex-col items-center justify-center px-6 py-8">
            <div className="mb-3 p-3 bg-white/20 rounded-full">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-black text-white text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
              Data Portal
            </h1>
            <p className="text-blue-100 text-center mt-2 text-sm font-medium">
              Upload Management System
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="animate-float-in p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2 animate-slide-in-left">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-800">
                Username
              </label>
              <div
                className={`relative flex items-center transition-all duration-300 ${
                  focusedField === "username" ? "scale-105" : ""
                }`}
              >
                <User className="absolute left-4 w-5 h-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="admin"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed text-gray-800 placeholder-gray-400 transition-colors duration-300"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2 animate-slide-in-left" style={{ animationDelay: "0.1s" }}>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800">
                Password
              </label>
              <div
                className={`relative flex items-center transition-all duration-300 ${
                  focusedField === "password" ? "scale-105" : ""
                }`}
              >
                <Lock className="absolute left-4 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed text-gray-800 placeholder-gray-400 transition-colors duration-300"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Blue Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-modern w-full mt-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-70 disabled:cursor-not-allowed transform transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/50 active:scale-95 text-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Logging in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Green Footer */}
          <div className="bg-emerald-50 px-8 py-6 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle className="w-4 h-4" />
                <span className="font-semibold text-sm">Demo Credentials:</span>
              </div>
              <div className="text-gray-700 text-sm space-y-1 pl-6">
                <div>
                  Username: <span className="font-mono font-bold text-blue-600">admin</span>
                </div>
                <div>
                  Password: <span className="font-mono font-bold text-blue-600">admin1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Orange Bottom Accent */}
          <div className="h-1 bg-orange-500"></div>
        </div>
      </div>
    </div>
  );
}
