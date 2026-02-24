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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600 rounded-full opacity-10 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-32 right-20 w-80 h-80 bg-emerald-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }}></div>
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-orange-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: "3s" }}></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md animate-float-in">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Blue Header Section */}
          <div className="bg-blue-600 px-8 py-14 text-center">
            <div className="mb-4 inline-flex p-3 bg-white/20 rounded-full">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-black text-white mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
              Data Portal
            </h1>
            <p className="text-blue-100 font-medium">Upload Management System</p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleLogin} className="p-8 space-y-5">
            {/* Error Message */}
            {error && (
              <div className="animate-float-in p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <p className="text-red-700 font-semibold text-sm">{error}</p>
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
                <User className="absolute left-4 w-5 h-5 text-blue-600" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="admin"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 hover:bg-white focus:bg-white focus:border-blue-600 focus:outline-none disabled:opacity-60 text-gray-800 placeholder-gray-400 transition-all"
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
                <Lock className="absolute left-4 w-5 h-5 text-emerald-600" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 hover:bg-white focus:bg-white focus:border-emerald-600 focus:outline-none disabled:opacity-60 text-gray-800 placeholder-gray-400 transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-modern w-full mt-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-70 transform transition-all hover:shadow-lg active:scale-95"
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

          {/* Demo Credentials */}
          <div className="bg-gray-100 px-8 py-6 border-t border-gray-200">
            <p className="text-gray-700 text-center text-sm font-semibold mb-2">Demo Credentials:</p>
            <div className="space-y-2 text-center">
              <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-blue-200">
                <span className="text-gray-700 font-medium">Username:</span>
                <span className="font-mono font-bold text-blue-600">admin</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-orange-200">
                <span className="text-gray-700 font-medium">Password:</span>
                <span className="font-mono font-bold text-orange-600">admin1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
