import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export default function LoginPage({
  buildingName = 'AL MUSTAFA HEIGHTS 5-E-18/19',
  storedAuth = { username: 'admin', password: '123' },
  onLoginSuccess
}) {
  const [username, setUsername] = useState(storedAuth.username || 'admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const trimmedUser = (username || '').trim().toLowerCase();
      const trimmedPass = (password || '').trim();

      const expectedUser = (storedAuth.username || 'admin').trim().toLowerCase();
      const expectedPass = (storedAuth.password || '123').trim();

      if (trimmedUser === expectedUser && trimmedPass === expectedPass) {
        onLoginSuccess({ rememberMe, user: username });
      } else {
        setIsLoading(false);
        setErrorMsg('Invalid credentials. (درج کردہ یوزر نیم یا پاس ورڈ غلط ہے۔)');
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#070a11] flex items-center justify-center p-4 sm:p-6 relative select-none">
      {/* Subtle Ambient Backing */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Brand Header */}
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
              <Building2 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                {buildingName}
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Financial Management & Maintenance ERP
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Username (یوزر نیم)
              </label>
              <div className="relative">
                <div className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full ps-9.5 pe-3 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>Password (پاس ورڈ)</span>
                <span className="text-[10px] text-slate-500 font-mono">Default: 123</span>
              </label>
              <div className="relative">
                <div className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full ps-9.5 pe-10 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember session on this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In (لاگ ان کریں)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Note */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted Session • Disk Auto-Save Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
