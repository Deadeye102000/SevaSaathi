'use client';

import { useState } from 'react';
import Link from 'next/link';
import ChatWindow from '@/components/ChatWindow';
import DataBoundaryPanel from '@/components/DataBoundaryPanel';

export default function HomePage() {
  const [activeDataBoundary, setActiveDataBoundary] = useState(null);
  const [mobileTab, setMobileTab] = useState('chat'); // 'chat' | 'boundary'
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 selection:bg-emerald-500/30">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-950/50 flex-shrink-0">
              सं
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
                  <span>सेवासाथी</span>
                  <span className="text-emerald-400 font-semibold font-sans">SevaSaathi</span>
                </h1>
                <span className="hidden xs:inline-block text-[10px] tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium whitespace-nowrap">
                  Manav Sampada
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                UP Government Service & Leave Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/login"
              title="Switch Account / View Login Screen"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 hover:border-emerald-500/40 text-[11px] text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <span>👤</span>
              <span className="hidden sm:inline">Ravi Kumar</span>
              <span className="sm:hidden">Ravi K.</span>
            </Link>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden xs:inline">PII Guard Active</span>
              <span className="xs:hidden">Guarded</span>
            </div>
          </div>
        </div>

        {/* Mobile Tab Bar (Visible on phones/tablets < lg) */}
        <div className="lg:hidden px-4 py-1.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-center gap-2">
          <button
            id="mobile-tab-chat"
            onClick={() => setMobileTab('chat')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'chat'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>💬</span>
            <span>Chat Assistant</span>
          </button>
          <button
            id="mobile-tab-boundary"
            onClick={() => setMobileTab('boundary')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'boundary'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🔒</span>
            <span>Data Boundary</span>
          </button>
        </div>
      </header>

      {/* Prominent One-Line Context Banner (First thing seen, under 15 words) */}
      <div className="w-full text-center py-2.5 sm:py-3 px-4 border-b border-slate-800/60 bg-slate-950/60">
        <p className="text-xs sm:text-sm font-medium text-slate-300 tracking-normal">
          AI-powered, policy-grounded leave assistant for UP Government employees with zero PII exposure.
        </p>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 flex-1 min-h-0">
          {/* Main Chat Interface */}
          <section
            className={`lg:col-span-8 flex flex-col h-[calc(100dvh-10rem)] sm:h-[640px] lg:h-[calc(100vh-10.5rem)] ${
              mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <ChatWindow onDataBoundaryUpdate={setActiveDataBoundary} />
          </section>

          {/* Right Sidebar: Data Privacy & Rules Boundary */}
          <section
            className={`lg:col-span-4 flex flex-col h-[calc(100dvh-10rem)] sm:h-[640px] lg:h-[calc(100vh-10.5rem)] overflow-y-auto ${
              mobileTab === 'boundary' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <DataBoundaryPanel dataBoundary={activeDataBoundary} isSidePanel={true} />
          </section>
        </div>

        {/* Coming to Production: Visually De-emphasized, Muted Collapsible */}
        <section className="mt-4 w-full">
          <div className="rounded-xl border border-slate-800/40 bg-slate-950/40 overflow-hidden transition-all">
            <button
              id="production-roadmap-toggle"
              type="button"
              onClick={() => setIsRoadmapOpen(!isRoadmapOpen)}
              className="w-full px-4 py-2 flex items-center justify-between text-left text-xs text-slate-500 hover:text-slate-400 hover:bg-slate-900/30 transition-colors"
              aria-expanded={isRoadmapOpen}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs opacity-70">🚩</span>
                <span className="text-slate-400 text-xs truncate">
                  Built for the Hackathon — Designed to Scale
                </span>
                <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800 font-mono">
                  Roadmap
                </span>
              </div>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 flex-shrink-0 ml-2">
                <span>{isRoadmapOpen ? 'Hide' : 'Show details'}</span>
                <svg
                  className={`w-3 h-3 transform transition-transform duration-200 ${
                    isRoadmapOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            {isRoadmapOpen && (
              <div
                id="production-roadmap-content"
                className="px-4 py-3 border-t border-slate-800/40 bg-slate-950/80 text-[11px] text-slate-400 space-y-2.5"
              >
                <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-slate-300 text-[11px] leading-relaxed">
                  <span className="text-emerald-400 font-semibold mr-1">Now live in this demo:</span>
                  Leave applications, Service Book, Career Record, Property Return status, Complaint status — all with zero PII exposure to AI.
                </div>

                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500/70 mt-0.5">•</span>
                    <span>
                      <strong className="text-slate-300">Real eHRMS API integration</strong>{' '}
                      <span className="text-slate-500">(currently: mock employee data)</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500/70 mt-0.5">•</span>
                    <span>
                      <strong className="text-slate-300">Persistent database for applications and history</strong>{' '}
                      <span className="text-slate-500">(currently: in-memory session)</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500/70 mt-0.5">•</span>
                    <span>
                      <strong className="text-slate-300">Self-hosted/approved government model for production</strong>{' '}
                      <span className="text-slate-500">(currently: OpenAI API for rapid prototyping — architecture is model-agnostic)</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500/70 mt-0.5">•</span>
                    <span>
                      <strong className="text-slate-300">Additional service modules:</strong>{' '}
                      <span>tour applications, transfer eligibility, GPF/pension queries</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500/70 mt-0.5">•</span>
                    <span>
                      <strong className="text-slate-300">Real document verification pipeline for medical certificates</strong>{' '}
                      <span className="text-slate-500">(currently: attachment-only)</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500/70 mt-0.5">•</span>
                    <span>
                      <strong className="text-slate-300">Multi-department rule sets</strong>{' '}
                      <span className="text-slate-500">beyond Basic Education</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2 md:col-span-2">
                    <span className="text-emerald-500/70 mt-0.5">•</span>
                    <span>
                      <strong className="text-slate-300">Voice input</strong>{' '}
                      <span className="text-slate-500">for employees less comfortable typing</span>
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
