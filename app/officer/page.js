'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OfficerDashboardPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'submitted' | 'approved' | 'action_needed'

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/officer-action', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data.applications) ? data.applications : []);
      }
    } catch (err) {
      console.warn('Failed to fetch officer applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAction = async (applicationId, action) => {
    setProcessingId(applicationId);
    const remarkText = remarks[applicationId] || '';

    try {
      const res = await fetch('/api/officer-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          action,
          remark: remarkText,
        }),
      });

      if (res.ok) {
        // Refresh applications list
        await fetchApplications();
      }
    } catch (err) {
      console.error('Failed to submit officer decision:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const [activeOfficer, setActiveOfficer] = useState('all'); // 'all' | 'Anita' | 'Mishra' | 'Srivastava'

  const filteredApplications = applications.filter((app) => {
    const statusNorm = (app.status || 'Submitted').toLowerCase();
    const officerStr = (app.reporting_officer || '').toLowerCase();

    if (activeOfficer === 'Anita' && !officerStr.includes('anita') && !officerStr.includes('bsa')) return false;
    if (activeOfficer === 'Mishra' && !officerStr.includes('mishra') && !officerStr.includes('cmo')) return false;
    if (activeOfficer === 'Srivastava' && !officerStr.includes('srivastava') && !officerStr.includes('sdm')) return false;

    if (filter === 'submitted') return statusNorm === 'submitted';
    if (filter === 'approved') return statusNorm === 'approved';
    if (filter === 'action_needed') return statusNorm === 'submitted' || statusNorm === 'sent back';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 selection:bg-emerald-500/30 font-sans">
      {/* ── Background Glow ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-purple-500/[0.04] blur-[100px]" />
      </div>

      {/* ── Header ── */}
      <header className="relative z-50 border-b border-white/[0.06] bg-[#030712]/90 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-purple-950/50 flex-shrink-0">
              👔
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
                  Officer Dashboard
                  <span className="ml-2 text-purple-400 font-normal text-xs sm:text-sm">Smt. Anita Sharma, BSA</span>
                </h1>
                <span className="hidden md:inline-block text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase">
                  eHRMS Sanctioning Authority
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                District Basic Education Officer · Sitapur District Office
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/audit"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium transition-all"
            >
              <span>🔍</span>
              <span className="hidden sm:inline">Live Audit Log</span>
            </Link>

            <Link
              href="/chat"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-slate-300 hover:text-white transition-all"
            >
              <span>💬</span>
              <span className="hidden sm:inline">Employee Chat</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <span className="text-[11px] text-slate-400 font-medium">Total Applications</span>
            <div className="text-xl font-bold text-slate-100 mt-1 font-mono">{applications.length}</div>
            <span className="text-[10px] text-slate-500">In officer jurisdiction</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20 shadow-md">
            <span className="text-[11px] text-amber-400 font-medium">Pending Review</span>
            <div className="text-xl font-bold text-amber-400 mt-1 font-mono">
              {applications.filter((a) => (a.status || '').toLowerCase() === 'submitted').length}
            </div>
            <span className="text-[10px] text-slate-500">Requires BSA action</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 shadow-md">
            <span className="text-[11px] text-emerald-400 font-medium">Approved</span>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
              {applications.filter((a) => (a.status || '').toLowerCase() === 'approved').length}
            </div>
            <span className="text-[10px] text-slate-500">Sanction granted</span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 shadow-md">
            <span className="text-[11px] text-purple-400 font-medium">Sanctioning Officer</span>
            <div className="text-sm font-bold text-purple-300 mt-1 truncate">Smt. Anita Sharma</div>
            <span className="text-[10px] text-slate-500">BSA Sitapur</span>
          </div>
        </div>

        {/* Officer Persona Selector */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Select Sanctioning Officer Persona:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            {[
              { id: 'all', name: 'All Officers', dept: 'All UP Departments' },
              { id: 'Anita', name: 'Smt. Anita Sharma, BSA', dept: 'Basic Education · Sitapur' },
              { id: 'Mishra', name: 'Dr. R.K. Mishra, CMO', dept: 'Medical & Health · Lucknow' },
              { id: 'Srivastava', name: 'Shri Alok Srivastava, SDM', dept: 'Revenue Dept · Barabanki' },
            ].map((off) => (
              <button
                key={off.id}
                type="button"
                onClick={() => setActiveOfficer(off.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  activeOfficer === off.id
                    ? 'bg-purple-950/60 border-purple-500 text-white ring-1 ring-purple-500/40 shadow-sm'
                    : 'bg-slate-950/40 hover:bg-slate-800/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold truncate text-[11px]">{off.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{off.dept}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls & Refresh */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'all', label: 'All Applications' },
              { id: 'submitted', label: '⏳ Submitted (Pending)' },
              { id: 'approved', label: '✅ Approved' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === tab.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchApplications}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span>Refresh Applications</span>
          </button>
        </div>

        {/* Applications List */}
        {loading && applications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono">
            Loading applications for BSA Smt. Anita Sharma from Vercel KV...
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-2xl block">📂</span>
            <p className="text-xs font-medium text-slate-400">No applications match this filter.</p>
            <p className="text-[11px] text-slate-600">
              Submit a leave application in the Chat Assistant view to see it arrive here live.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredApplications.map((app) => {
              const statusNorm = (app.status || 'Submitted').toLowerCase();
              const isSubmitted = statusNorm === 'submitted';
              const isApproved = statusNorm === 'approved';
              const isRejected = statusNorm === 'rejected';
              const isSentBack = statusNorm === 'sent back';
              const isProcessing = processingId === app.id;

              return (
                <div
                  key={app.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isSubmitted
                      ? 'bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 border-purple-500/30 shadow-lg shadow-purple-950/20'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    {/* Employee & Application Header */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0 mt-0.5">
                        RK
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">
                            {app.employee_name || 'Ravi Kumar'}
                          </h3>
                          <span className="text-xs font-mono text-slate-400">
                            ({app.employee_id || 'UP-EHRMS-88213'})
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                            {app.department || 'Basic Education'} · {app.posting_district || 'Sitapur'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Application ID: <span className="font-mono text-emerald-400 font-bold">{app.id}</span> · Type: <span className="capitalize font-semibold text-slate-200">{app.type || 'casual'} Leave</span> ({app.days} Days)
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                          isApproved
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isRejected
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : isSentBack
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/30 animate-pulse'
                        }`}
                      >
                        {app.status || 'Submitted'}
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Leave Duration:</span>
                      <span className="font-medium text-slate-200">{app.days} Day(s)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Requested Dates:</span>
                      <span className="font-mono font-semibold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 inline-block mt-0.5">
                        📅 {app.dates || (app.startDate ? `${app.startDate} to ${app.endDate}` : `${app.days} Day(s)`)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Medical Document:</span>
                      <span className="font-medium text-slate-300">
                        {app.documentAttached ? '📎 Attached' : 'None Required'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Officer Remark:</span>
                      <span className="font-medium text-emerald-400 italic">
                        {app.remark ? `"${app.remark}"` : 'None yet'}
                      </span>
                    </div>
                  </div>

                  {/* Officer Actions for Submitted / Active applications */}
                  {isSubmitted && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-3 bg-slate-950/60 p-3 rounded-xl">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-400">
                          Officer Remark (optional, visible to employee upon approval/status check):
                        </label>
                        <input
                          type="text"
                          value={remarks[app.id] || ''}
                          onChange={(e) =>
                            setRemarks((prev) => ({ ...prev, [app.id]: e.target.value }))
                          }
                          placeholder="e.g. 'Approved - enjoy your leave' or 'Sanctioned by BSA Sitapur'"
                          disabled={isProcessing}
                          className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        {/* Approve */}
                        <button
                          type="button"
                          onClick={() => handleAction(app.id, 'Approve')}
                          disabled={isProcessing}
                          className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <span>✅</span>
                          <span>Approve Application</span>
                        </button>

                        {/* Send Back */}
                        <button
                          type="button"
                          onClick={() => handleAction(app.id, 'Send Back')}
                          disabled={isProcessing}
                          className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <span>↩️</span>
                          <span>Send Back</span>
                        </button>

                        {/* Reject */}
                        <button
                          type="button"
                          onClick={() => handleAction(app.id, 'Reject')}
                          disabled={isProcessing}
                          className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <span>❌</span>
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
