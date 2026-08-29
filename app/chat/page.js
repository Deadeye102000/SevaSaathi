'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ChatWindow from '@/components/ChatWindow';
import DataBoundaryPanel from '@/components/DataBoundaryPanel';
import ApplicationsPanel from '@/components/ApplicationsPanel';

export default function ChatPage() {
  const [activeDataBoundary, setActiveDataBoundary] = useState(null);
  const [mobileTab, setMobileTab] = useState('chat'); // 'chat' | 'applications' | 'boundary'
  const [sideTab, setSideTab] = useState('applications'); // 'applications' | 'boundary'
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [applications, setApplications] = useState([]);

  const [employeeInfo, setEmployeeInfo] = useState({
    name: 'Ravi Kumar',
    avatar: 'RK',
    id: 'UP-EHRMS-88213',
  });

  const fetchEmployeeData = useCallback((empId) => {
    fetch(`/api/chat?emp=${empId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.employee_name) {
          const initials = data.employee_name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
          setEmployeeInfo({
            name: data.employee_name,
            avatar: initials,
            id: data.employee_id || empId,
          });
        }
        if (Array.isArray(data.leave_history)) {
          setApplications(data.leave_history);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let currentEmp = 'UP-EHRMS-88213';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      currentEmp = params.get('emp') || localStorage.getItem('sevasarthi_emp_id') || 'UP-EHRMS-88213';
    }
    fetchEmployeeData(currentEmp);
  }, [fetchEmployeeData]);

  const handleApplicationsUpdate = (newApp) => {
    if (newApp && newApp.id) {
      setApplications((prev) => {
        const exists = prev.some((a) => a.id === newApp.id);
        if (exists) {
          return prev.map((a) => (a.id === newApp.id ? { ...a, ...newApp } : a));
        }
        return [newApp, ...prev];
      });
    } else {
      fetchEmployeeData(employeeInfo.id);
    }
  };

  const handleOpenApplicationsTab = () => {
    setSideTab('applications');
    setMobileTab('applications');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-slate-100 selection:bg-emerald-500/30">

      {/* ── Ambient background glows ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 -left-40 w-[700px] h-[700px] rounded-full bg-emerald-500/[0.06] blur-[140px]" />
        <div className="absolute top-1/2 -right-60 w-[500px] h-[500px] rounded-full bg-teal-500/[0.05] blur-[120px]" />
      </div>

      {/* ── Header ── */}
      <header className="relative z-50 border-b border-white/[0.06] bg-[#030712]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Left: Branding */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-xl bg-emerald-500/30 blur-md" />
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-lg">
                सं
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white truncate">
                  सेवासाथी
                  <span className="ml-1.5 text-emerald-400 font-medium">SevaSaathi</span>
                </h1>
                <span className="hidden sm:inline-block text-[9px] tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10 font-medium whitespace-nowrap uppercase">
                  eHRMS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate hidden sm:block">
                UP Manav Sampada eHRMS Assistant
              </p>
            </div>
          </div>

          {/* Right: User chip, Officer View & Audit links */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/officer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[11px] font-medium transition-all"
              title="Reporting Officer Dashboard (Smt. Anita Sharma, BSA)"
            >
              <span>👔</span>
              <span className="hidden sm:inline">Officer View (Demo)</span>
            </Link>

            <Link
              href="/audit"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium transition-all"
              title="View Real-Time Compliance Audit Log"
            >
              <span>🔍</span>
              <span className="hidden sm:inline">Live Audit Log</span>
            </Link>

            <Link
              href="/login"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-slate-300 hover:text-white transition-all"
              title={`Logged in as ${employeeInfo.name} (${employeeInfo.id}). Click to switch account.`}
            >
              <div className="w-5 h-5 rounded-full bg-emerald-600/60 flex items-center justify-center text-[9px] font-bold text-white">
                {employeeInfo.avatar}
              </div>
              <span className="hidden sm:inline">{employeeInfo.name}</span>
            </Link>
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="lg:hidden px-4 pb-2 flex items-center gap-2">
          {[
            { id: 'chat', label: '💬 Chat' },
            { id: 'applications', label: `📑 Applications (${applications.length})` },
            { id: 'boundary', label: '🔒 Data Boundary' },
          ].map((tab) => (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              onClick={() => setMobileTab(tab.id)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
                mobileTab === tab.id
                  ? 'bg-white/[0.08] text-emerald-400 border border-white/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── Main layout ── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-5 flex flex-col min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">

          {/* Chat panel */}
          <section
            className={`lg:col-span-7 flex flex-col h-[calc(100dvh-11rem)] lg:h-[calc(100vh-11rem)] ${
              mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <ChatWindow
              onDataBoundaryUpdate={setActiveDataBoundary}
              onApplicationsUpdate={handleApplicationsUpdate}
              onOpenApplicationsTab={handleOpenApplicationsTab}
            />
          </section>

          {/* Dedicated Side Panel with Tabs: Leave Applications | Data Boundary */}
          <section
            className={`lg:col-span-5 flex flex-col h-[calc(100dvh-11rem)] lg:h-[calc(100vh-11rem)] overflow-hidden ${
              mobileTab !== 'chat' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Desktop Side Panel Tabs Navigation */}
            <div className="flex items-center gap-2 pb-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSideTab('applications');
                  setMobileTab('applications');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  (mobileTab === 'applications' || (mobileTab === 'chat' && sideTab === 'applications'))
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-500/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>📑</span>
                <span>Leave Applications ({applications.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSideTab('boundary');
                  setMobileTab('boundary');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  (mobileTab === 'boundary' || (mobileTab === 'chat' && sideTab === 'boundary'))
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-500/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>🔒</span>
                <span>Data Boundary</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {(mobileTab === 'applications' || (mobileTab === 'chat' && sideTab === 'applications')) ? (
                <ApplicationsPanel
                  applications={applications}
                  employeeName={employeeInfo.name}
                  employeeId={employeeInfo.id}
                />
              ) : (
                <DataBoundaryPanel dataBoundary={activeDataBoundary} isSidePanel={true} />
              )}
            </div>
          </section>
        </div>

        {/* ── Roadmap collapsible ── */}
        <section className="mt-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <button
              id="production-roadmap-toggle"
              type="button"
              onClick={() => setIsRoadmapOpen(!isRoadmapOpen)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors"
              aria-expanded={isRoadmapOpen}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs">🚀</span>
                <span className="text-xs text-slate-400 font-medium">Built for the Hackathon — Designed to Scale</span>
                <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500 border border-white/10 font-mono tracking-wider">ROADMAP</span>
              </div>
              <svg
                className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isRoadmapOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isRoadmapOpen && (
              <div id="production-roadmap-content" className="px-4 pb-4 pt-3 border-t border-white/[0.04] space-y-3">
                <div className="p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-[11px] text-slate-300 leading-relaxed">
                  <span className="text-emerald-400 font-semibold">✅ Live in this demo: </span>
                  Leave applications (CL/EL/ML), Service Book, Career Record, Property Return, Complaint status — all with zero PII sent to AI.
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {[
                    ['Real eHRMS API integration', 'currently: mock employee data'],
                    ['Persistent database for applications', 'currently: in-memory session'],
                    ['Self-hosted/approved government LLM', 'currently: OpenAI — architecture is model-agnostic'],
                    ['Additional modules: tour, transfer, GPF/pension', ''],
                    ['Medical certificate verification pipeline', 'currently: attachment-only'],
                    ['Voice input for employees less comfortable typing', ''],
                  ].map(([title, sub]) => (
                    <li key={title} className="flex items-start gap-2 text-slate-400">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span>
                        <strong className="text-slate-300">{title}</strong>
                        {sub && <span className="text-slate-600"> ({sub})</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
