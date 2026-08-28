'use client';

import { useState } from 'react';
import Link from 'next/link';
import ChatWindow from '@/components/ChatWindow';
import DataBoundaryPanel from '@/components/DataBoundaryPanel';

export default function ChatPage() {
  const [activeDataBoundary, setActiveDataBoundary] = useState(null);
  const [mobileTab, setMobileTab] = useState('chat');
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);

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
                UP Government Service &amp; Leave Assistant
              </p>
            </div>
          </div>

          {/* Right: User chip */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-slate-300 hover:text-white transition-all"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-600/60 flex items-center justify-center text-[9px] font-bold text-white">
                RK
              </div>
              <span className="hidden sm:inline">Ravi Kumar</span>
            </Link>
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="lg:hidden px-4 pb-2 flex items-center gap-2">
          {['chat', 'boundary'].map((tab) => (
            <button
              key={tab}
              id={`mobile-tab-${tab}`}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === tab
                  ? 'bg-white/[0.08] text-emerald-400 border border-white/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>{tab === 'chat' ? '💬' : '🔒'}</span>
              <span>{tab === 'chat' ? 'Chat' : 'Data Boundary'}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── Main layout ── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-5 flex flex-col min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">

          {/* Chat panel */}
          <section
            className={`lg:col-span-8 flex flex-col h-[calc(100dvh-11rem)] lg:h-[calc(100vh-11rem)] ${
              mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <ChatWindow onDataBoundaryUpdate={setActiveDataBoundary} />
          </section>

          {/* Sidebar */}
          <section
            className={`lg:col-span-4 flex flex-col h-[calc(100dvh-11rem)] lg:h-[calc(100vh-11rem)] overflow-y-auto ${
              mobileTab === 'boundary' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <DataBoundaryPanel dataBoundary={activeDataBoundary} isSidePanel={true} />
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
