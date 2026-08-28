'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('UP-EHRMS-88213');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => router.push('/chat'), 900);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#030712] overflow-hidden">

      {/* ── Ambient gradient orbs ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal-500/8 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-emerald-400/5 blur-[80px]" />
      </div>

      {/* ── Subtle grid overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Government header strip ── */}
      <div className="absolute top-0 inset-x-0 border-b border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="w-4 h-4 rounded-sm bg-orange-500/80 inline-block" />
            <span className="w-4 h-4 rounded-sm bg-white/80 inline-block" />
            <span className="w-4 h-4 rounded-sm bg-green-600/80 inline-block" />
            <span className="ml-1 hidden sm:inline">Government of Uttar Pradesh</span>
          </div>
          <span className="text-[10px] text-slate-600 font-mono tracking-wider">SECURE · OFFICIAL</span>
        </div>
      </div>

      {/* ── Main card ── */}
      <div
        className={`relative z-10 w-full max-w-sm mx-4 transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* Glow ring behind card */}
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent blur-sm" />

        <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-black/60 overflow-hidden">

          {/* Shimmer top edge */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

          <div className="p-8">

            {/* Logo + title */}
            <div className="text-center mb-8">
              <div className="relative inline-flex mb-4">
                <div className="absolute inset-0 rounded-2xl bg-emerald-500/30 blur-lg" />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-900/50">
                  सं
                </div>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white">
                सेवासाथी
                <span className="ml-2 text-emerald-400 font-light text-xl">SevaSaathi</span>
              </h1>

              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-400 font-medium tracking-wide">Manav Sampada eHRMS</span>
              </div>

              <p className="mt-3 text-sm text-slate-400">
                Government Service &amp; Leave Assistant
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">

              <div className="space-y-1.5">
                <label htmlFor="employee-id" className="text-xs font-medium text-slate-400 tracking-wide uppercase">
                  Employee ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                    </svg>
                  </div>
                  <input
                    id="employee-id"
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-slate-400 tracking-wide uppercase">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                  />
                </div>
              </div>

              <button
                id="login-button"
                type="submit"
                disabled={loading}
                className="relative w-full mt-2 py-3.5 rounded-xl font-semibold text-sm text-white overflow-hidden group disabled:opacity-70 transition-all active:scale-[0.99] cursor-pointer"
              >
                {/* Button gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 transition-all duration-300" />
                {/* Button shimmer */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Authenticating…</span>
                    </>
                  ) : (
                    <>
                      <span>Login to eHRMS Portal</span>
                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Demo notice */}
            <div className="mt-5 flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <svg className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <p className="text-[11px] text-amber-400/70 leading-relaxed">
                Demo mode — credentials pre-filled. Any input logs in as <strong className="text-amber-300/80">Ravi Kumar</strong> (UP-EHRMS-88213).
              </p>
            </div>
          </div>

          {/* Bottom shimmer */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>

        {/* Footer */}
        <div className="mt-5 text-center space-y-1">
          <p className="text-[11px] text-slate-600">
            Secured by Manav Sampada eHRMS · Govt. of Uttar Pradesh
          </p>
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-700">
            <span>Privacy Policy</span>
            <span>·</span>
            <span>Terms of Use</span>
            <span>·</span>
            <span>Help</span>
          </div>
        </div>
      </div>
    </div>
  );
}
