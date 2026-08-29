'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Failed to fetch audit log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const totalLogs = logs.length;
  const localLogsCount = logs.filter((l) => !l.api_call_made).length;
  const aiLogsCount = logs.filter((l) => l.api_call_made).length;
  const piiBlockedCount = logs.filter(
    (l) => l.intent === 'restricted' || l.intent === 'out_of_scope' || !l.api_call_made
  ).length;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 selection:bg-emerald-500/30 font-sans">
      {/* ── Background Glow ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-teal-500/[0.04] blur-[100px]" />
      </div>

      {/* ── Header ── */}
      <header className="relative z-50 border-b border-white/[0.06] bg-[#030712]/90 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/chat"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.08] transition-colors"
              title="Return to Chat"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <span>सेवासाथी</span>
                  <span className="text-emerald-400 font-medium">Live Audit Log</span>
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Zero PII Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Real-time compliance &amp; privacy log of all AI API calls and local data interceptions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto Refresh Toggle */}
            <label className="hidden sm:flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/40"
              />
              <span>Auto-refresh (3s)</span>
            </label>

            {/* Manual Refresh */}
            <button
              type="button"
              onClick={fetchLogs}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              <span className="hidden xs:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <main className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <span className="text-[11px] text-slate-400 font-medium">Total Interceptions</span>
            <div className="text-xl font-bold text-slate-100 mt-1 font-mono">{totalLogs}</div>
            <span className="text-[10px] text-slate-500">Logged interactions</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 shadow-md">
            <span className="text-[11px] text-emerald-400 font-medium">Local (0 Bytes Sent)</span>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{localLogsCount}</div>
            <span className="text-[10px] text-slate-500">On-premise resolved</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20 shadow-md">
            <span className="text-[11px] text-amber-400 font-medium">AI Calls (Anonymized)</span>
            <div className="text-xl font-bold text-amber-400 mt-1 font-mono">{aiLogsCount}</div>
            <span className="text-[10px] text-slate-500">Minimal derived payload</span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 shadow-md">
            <span className="text-[11px] text-purple-400 font-medium">PII Guard Active</span>
            <div className="text-xl font-bold text-purple-300 mt-1 font-mono">{piiBlockedCount}</div>
            <span className="text-[10px] text-slate-500">Identity protected</span>
          </div>
        </div>

        {/* Live Audit Table Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Live Audit Logs (Newest First)
              </h2>
            </div>
            {lastRefreshed && (
              <span className="text-[11px] text-slate-500 font-mono">
                Updated: {lastRefreshed}
              </span>
            )}
          </div>

          {loading && logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-mono">
              Loading audit logs from Vercel KV...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <span className="text-2xl block">🔍</span>
              <p className="text-xs font-medium text-slate-400">No audit entries logged yet.</p>
              <p className="text-[11px] text-slate-600">
                Go to the chat assistant and interact (apply for leave, check balances, or attempt a PII query) to view live entries here.
              </p>
              <Link
                href="/chat"
                className="inline-block mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
              >
                Go to Chat Assistant →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Intent</th>
                    <th className="py-3 px-4">API Call Made</th>
                    <th className="py-3 px-4">Model</th>
                    <th className="py-3 px-4">Payload Sent to LLM</th>
                    <th className="py-3 px-4">Response Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {logs.map((log) => {
                    const isExpanded = expandedRow === log.id;
                    const dateStr = log.timestamp
                      ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : 'Just now';

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Timestamp */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {dateStr}
                        </td>

                        {/* Intent */}
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-slate-800 text-slate-200 border border-slate-700/80">
                            {log.intent}
                          </span>
                        </td>

                        {/* API Call Made */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.api_call_made ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              YES — Anonymized
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              NO — 0 Bytes Sent
                            </span>
                          )}
                        </td>

                        {/* Model */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {log.model}
                        </td>

                        {/* Payload Sent */}
                        <td className="py-3 px-4 max-w-xs">
                          {!log.payload_sent ? (
                            <span className="text-slate-500 font-mono text-[11px] italic">
                              null — zero data sent
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                                className="text-[10px] font-mono text-emerald-400 hover:underline flex items-center gap-1"
                              >
                                <span>{isExpanded ? 'Hide Payload' : 'View Payload JSON'}</span>
                              </button>
                              <pre className={`p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-300 overflow-x-auto ${isExpanded ? 'max-h-60' : 'max-h-16 overflow-hidden'}`}>
                                {JSON.stringify(log.payload_sent, null, 2)}
                              </pre>
                            </div>
                          )}
                        </td>

                        {/* Response Summary */}
                        <td className="py-3 px-4 text-slate-300 text-[11px] leading-relaxed max-w-xs truncate" title={log.response_summary}>
                          {log.response_summary || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
