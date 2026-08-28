'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('UP-EHRMS-88213');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    // Decorative only: immediate redirect to the main chat page
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 selection:bg-emerald-500/30">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Top Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-xl shadow-lg shadow-emerald-950/50 mb-3">
            सं
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>सेवासाथी</span>
            <span className="text-emerald-400 font-sans">SevaSaathi</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manav Sampada eHRMS Assistant
          </p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-semibold text-slate-100">
              eHRMS Employee Login
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your credentials to access your leave portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="employee-id"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Employee ID
              </label>
              <input
                id="employee-id"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. UP-EHRMS-88213"
                required
                className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 text-sm rounded-xl px-4 py-2.5 sm:py-3 border border-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 text-sm rounded-xl px-4 py-2.5 sm:py-3 border border-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            <button
              id="login-button"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Logging in...' : 'Login'}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>

          {/* Decorative Demo Notice */}
          <div className="pt-2 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Demo mode — any credentials will log you in as the sample employee (Ravi Kumar, UP-EHRMS-88213)
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6">
          <p className="text-[11px] text-slate-500">
            Government of Uttar Pradesh • Manav Sampada Portal (eHRMS)
          </p>
        </div>
      </div>
    </div>
  );
}
