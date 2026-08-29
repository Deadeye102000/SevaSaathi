'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const MOCK_EMPLOYEES = [
  {
    id: 'UP-EHRMS-88213',
    name: 'Ravi Kumar',
    designation: 'Assistant Teacher',
    department: 'Basic Education',
    district: 'Sitapur',
    category: 'RURAL',
    avatar: 'RK',
    color: 'from-emerald-600 to-teal-600',
    balances: 'CL: 8 · EL: 22 · ML: 12',
    officer: 'Smt. Anita Sharma, BSA',
  },
  {
    id: 'UP-EHRMS-94021',
    name: 'Sunita Verma',
    designation: 'Senior Staff Nurse',
    department: 'Medical & Health Services',
    district: 'Lucknow',
    category: 'URBAN',
    avatar: 'SV',
    color: 'from-blue-600 to-indigo-600',
    balances: 'CL: 11 · EL: 15 · ML: 6',
    officer: 'Dr. R.K. Mishra, CMO',
  },
  {
    id: 'UP-EHRMS-72904',
    name: 'Rajesh Singh',
    designation: 'Revenue Lekhpal',
    department: 'Revenue Department',
    district: 'Barabanki',
    category: 'SEMI-URBAN',
    avatar: 'RS',
    color: 'from-amber-600 to-orange-600',
    balances: 'CL: 5 · EL: 28 · ML: 14',
    officer: 'Shri Alok Srivastava, SDM',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState('UP-EHRMS-88213');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sevasarthi_emp_id', selectedId);
    }
    setTimeout(() => {
      router.push(`/chat?emp=${selectedId}`);
    }, 700);
  };

  const selectedEmployee = MOCK_EMPLOYEES.find((emp) => emp.id === selectedId) || MOCK_EMPLOYEES[0];

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#030712] overflow-hidden p-4">
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
          backgroundImage:
            'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)',
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
          <span className="text-[10px] text-slate-600 font-mono tracking-wider">
            SECURE · OFFICIAL · EHRMS
          </span>
        </div>
      </div>

      {/* ── Main card ── */}
      <div
        className={`relative z-10 w-full max-w-md my-12 transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* Glow ring behind card */}
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent blur-sm" />

        <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Shimmer top edge */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

          <div className="p-6 sm:p-8">
            {/* Logo + title */}
            <div className="text-center mb-6">
              <div className="relative inline-flex mb-3">
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
                <span className="text-[11px] text-emerald-400 font-medium tracking-wide">
                  Manav Sampada eHRMS Login
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Employee Selector Cards */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 tracking-wide uppercase flex items-center justify-between">
                  <span>Select Employee Profile</span>
                  <span className="text-[10px] text-emerald-400 font-mono">3 Accounts Available</span>
                </label>

                <div className="space-y-2">
                  {MOCK_EMPLOYEES.map((emp) => {
                    const isSelected = emp.id === selectedId;
                    return (
                      <div
                        key={emp.id}
                        onClick={() => setSelectedId(emp.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/40'
                            : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${emp.color} flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0`}
                          >
                            {emp.avatar}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">
                                {emp.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {emp.id}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {emp.designation} · {emp.department} ({emp.district})
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {emp.balances}
                            </p>
                          </div>
                        </div>

                        {/* Selected Radio Indicator */}
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'border-emerald-400 bg-emerald-500 text-white'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isSelected && <span className="text-[10px] font-bold">✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-slate-400 tracking-wide uppercase"
                >
                  Password / OTP
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all font-mono"
                />
                <p className="text-[10px] text-slate-500">
                  Default passcode pre-filled for hackathon evaluation.
                </p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.99] text-white font-semibold text-sm shadow-lg shadow-emerald-950/60 border border-emerald-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Signing in as {selectedEmployee.name}...</span>
                  </>
                ) : (
                  <>
                    <span>Enter eHRMS Portal →</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-white/5 bg-white/[0.01] text-center">
            <p className="text-[11px] text-slate-500">
              UP eHRMS Assistant · Privacy Preserving AI Core
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
