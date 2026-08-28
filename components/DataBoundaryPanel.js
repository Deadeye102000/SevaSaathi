'use client';

/**
 * DataBoundaryPanel Component
 * Displays the strict architectural separation between local government records
 * (PII that stays on-premise/local) and the minimal derived payload sent to the LLM.
 *
 * @param {Object} props
 * @param {Object} [props.dataBoundary] - { staysLocal, sentToAI }
 * @param {boolean} [props.isSidePanel=false] - Whether rendered as main sidebar or inline card
 */
export default function DataBoundaryPanel({ dataBoundary, isSidePanel = false }) {
  // Default values for initial render before first user message
  const staysLocal = dataBoundary?.staysLocal || {
    name: 'Ravi Kumar',
    employee_id: 'UP-EHRMS-88213',
    department: 'Basic Education',
    posting_district: 'Sitapur',
  };

  const sentToAI = dataBoundary?.sentToAI;

  return (
    <aside
      id="data-boundary-panel"
      className={`rounded-2xl border transition-all ${
        isSidePanel
          ? 'bg-slate-900/90 border-slate-800 p-4 sm:p-5 shadow-2xl flex flex-col h-full space-y-4'
          : 'bg-slate-950/90 border-slate-800 p-3 sm:p-4 my-2 text-xs shadow-md'
      }`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Data Privacy Boundary
          </h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono border border-slate-700">
          Zero PII to LLM
        </span>
      </div>

      {/* Two Columns with Clear Separation & Distinct Background Tints */}
      <div className={`grid gap-4 ${isSidePanel ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {/* Column 1: Stays in Government System (Emerald Tint) */}
        <div className="bg-emerald-950/20 rounded-xl p-4 border border-emerald-500/25 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span>🔒</span>
                <span>Stays in Government System</span>
              </h4>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25 font-medium">
                Local Only
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Protected identity and posting records. Never transmitted to AI.
            </p>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-emerald-900/30">
              <span className="text-slate-400 font-sans text-[11px]">Name:</span>
              <span className="text-slate-200 font-medium flex items-center gap-1">
                <span className="text-emerald-400 text-[10px]">🔒</span>
                <span>{staysLocal.name || '—'}</span>
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-emerald-900/30">
              <span className="text-slate-400 font-sans text-[11px]">Employee ID:</span>
              <span className="text-slate-200 font-medium flex items-center gap-1">
                <span className="text-emerald-400 text-[10px]">🔒</span>
                <span>{staysLocal.employee_id || '—'}</span>
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-emerald-900/30">
              <span className="text-slate-400 font-sans text-[11px] flex-shrink-0">Department:</span>
              <span className="text-slate-200 font-medium flex items-center gap-1 truncate max-w-[130px] xs:max-w-[170px]" title={staysLocal.department}>
                <span className="text-emerald-400 text-[10px] flex-shrink-0">🔒</span>
                <span className="truncate">{staysLocal.department || '—'}</span>
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-emerald-900/30">
              <span className="text-slate-400 font-sans text-[11px] flex-shrink-0">Posting District:</span>
              <span className="text-slate-200 font-medium flex items-center gap-1">
                <span className="text-emerald-400 text-[10px] flex-shrink-0">🔒</span>
                <span>{staysLocal.posting_district || '—'}</span>
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-emerald-900/30">
              <span className="text-slate-400 font-sans text-[11px] flex-shrink-0">Attachment:</span>
              <span className="text-slate-200 font-medium flex items-center gap-1 text-[11px]">
                <span className="text-emerald-400 text-[10px] flex-shrink-0">🔒</span>
                <span className="whitespace-nowrap">{staysLocal.uploaded_document || 'Uploaded document (unprocessed)'}</span>
              </span>
            </div>

            {Object.entries(staysLocal)
              .filter(([k]) => !['name', 'employee_id', 'department', 'posting_district', 'uploaded_document'].includes(k))
              .map(([key, val]) => {
                const label = key === 'assets_declared_detail'
                  ? 'Property Assets'
                  : key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                const displayVal = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val);
                return (
                  <div key={key} className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-emerald-900/30">
                    <span className="text-slate-400 font-sans text-[11px] flex-shrink-0">{label}:</span>
                    <span className="text-slate-200 font-medium flex items-center gap-1 text-[11px] truncate max-w-[140px] xs:max-w-[180px]" title={displayVal}>
                      <span className="text-emerald-400 text-[10px] flex-shrink-0">🔒</span>
                      <span className="truncate">{displayVal}</span>
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Column 2: Sent to AI (Neutral Slate Tint) */}
        <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="text-slate-400">→</span>
                <span>Sent to AI</span>
              </h4>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-medium">
                Anonymized
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Only derived entitlement numbers required for natural language reasoning.
            </p>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {!sentToAI || Object.keys(sentToAI).length === 0 ? (
              <div className="py-6 px-3 text-center bg-slate-900/30 rounded-lg border border-dashed border-slate-800 text-slate-500 text-xs">
                <span className="block text-slate-400 text-sm mb-1">🛡️</span>
                <span>No employee records sent</span>
                <p className="text-[10px] text-slate-600 mt-1 font-sans">
                  Zero data sent externally. Read locally from government system only.
                </p>
              </div>
            ) : (
              Object.entries(sentToAI).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60">
                  <span className="text-slate-500 font-sans text-[11px]">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}:
                  </span>
                  <span className={typeof val === 'boolean' ? (val ? 'text-emerald-400' : 'text-slate-400') : 'text-slate-300 capitalize'}>
                    {String(val)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer explanation in sidebar mode */}
      {isSidePanel && (
        <div className="mt-auto pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
          <div className="flex items-center gap-1 text-slate-300 font-medium mb-1">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Architectural Guarantee</span>
          </div>
          Application IDs and routing officer assignments are generated purely on-premise by local deterministic code and appended server-side.
        </div>
      )}
    </aside>
  );
}
