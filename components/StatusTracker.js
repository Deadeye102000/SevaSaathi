'use client';

/**
 * StatusTracker Component
 * Visual horizontal 4-stage lifecycle tracker for Manav Sampada eHRMS leave applications.
 *
 * Stages:
 * 1. Submitted
 * 2. Under Review
 * 3. Officer Decision
 * 4. Approved (or Sent Back / Rejected)
 *
 * @param {Object} props
 * @param {string} [props.currentStatus='Submitted'] - eHRMS status string
 * @param {string} [props.officer] - Reporting officer name/title
 */
export default function StatusTracker({ currentStatus = 'Submitted', officer }) {
  const norm = (currentStatus || 'Submitted').toLowerCase().trim();

  const isApproved = norm.includes('approved');
  const isRejected = norm.includes('reject');
  const isSentBack = norm.includes('sent back');
  const isSubmitted = norm.includes('submit');

  // Stage 4 Label
  const finalStageLabel = isRejected ? 'Rejected' : isSentBack ? 'Sent Back' : 'Approved';

  // Determine stage index (0 to 3)
  // 0 = Submitted, 1 = Under Review, 2 = Officer Decision, 3 = Approved / Final
  let activeIndex = 0;
  if (isApproved) {
    activeIndex = 3;
  } else if (isRejected || isSentBack) {
    activeIndex = 3;
  } else if (isSubmitted) {
    // When submitted, it is active at Stage 0 (Submitted) transitioning into Stage 1 (Under Review)
    activeIndex = 0;
  } else {
    activeIndex = 1;
  }

  const stages = [
    { id: 'submitted', label: 'Submitted', desc: 'ID Generated' },
    { id: 'review', label: 'Under Review', desc: officer || 'Reporting Officer' },
    { id: 'decision', label: 'Officer Decision', desc: 'Reviewing' },
    { id: 'final', label: finalStageLabel, desc: isApproved ? 'Final Approval' : isRejected ? 'Declined' : isSentBack ? 'Needs Action' : 'Pending' },
  ];

  return (
    <div className="my-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 shadow-md font-sans text-xs space-y-2">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 border-b border-slate-800/60 pb-1.5">
        <span className="flex items-center gap-1.5 text-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Application Status Tracker</span>
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
            isApproved
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : isRejected
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : isSentBack
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}
        >
          {currentStatus}
        </span>
      </div>

      {/* 4-Stage Horizontal Track Bar */}
      <div className="relative pt-2 pb-1">
        {/* Background Connecting Line */}
        <div className="absolute top-4 left-3 right-3 h-0.5 bg-slate-800 -z-0" />

        {/* Completed Progress Line */}
        <div
          className={`absolute top-4 left-3 h-0.5 transition-all duration-700 -z-0 ${
            isApproved
              ? 'bg-emerald-500 w-[calc(100%-1.5rem)]'
              : isRejected
              ? 'bg-red-500 w-[calc(100%-1.5rem)]'
              : isSentBack
              ? 'bg-amber-500 w-[calc(100%-1.5rem)]'
              : 'bg-emerald-500 w-[20%]'
          }`}
        />

        {/* 4 Stage Nodes */}
        <div className="relative z-10 grid grid-cols-4 gap-1 text-center">
          {stages.map((stage, idx) => {
            const isPassed = idx < activeIndex || isApproved;
            const isCurrent = idx === activeIndex && !isApproved;

            // Styles based on state
            let dotClass = 'bg-slate-900 border-2 border-slate-700 text-slate-500';
            let labelClass = 'text-slate-500';
            let icon = String(idx + 1);

            if (isPassed) {
              dotClass = 'bg-emerald-600 border-emerald-400 text-white shadow-sm shadow-emerald-950/50';
              labelClass = 'text-emerald-400 font-semibold';
              icon = '✓';
            } else if (isCurrent) {
              if (isRejected) {
                dotClass = 'bg-red-600 border-red-400 text-white animate-pulse';
                labelClass = 'text-red-400 font-bold';
                icon = '✕';
              } else if (isSentBack) {
                dotClass = 'bg-amber-600 border-amber-400 text-white animate-pulse';
                labelClass = 'text-amber-400 font-bold';
                icon = '!';
              } else {
                dotClass = 'bg-emerald-600 border-emerald-400 text-white animate-pulse shadow-md shadow-emerald-500/30';
                labelClass = 'text-emerald-400 font-bold';
                icon = '⏳';
              }
            }

            return (
              <div key={stage.id} className="flex flex-col items-center space-y-1">
                {/* Circle Dot */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${dotClass}`}
                >
                  {icon}
                </div>

                {/* Stage Label */}
                <span className={`text-[10px] leading-tight font-medium ${labelClass}`}>
                  {stage.label}
                </span>
                <span className="text-[8px] text-slate-500 font-mono truncate max-w-full">
                  {stage.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
