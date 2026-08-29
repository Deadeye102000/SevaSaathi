'use client';

import { useState } from 'react';
import StatusTracker from './StatusTracker';
import { DEFAULT_EMPLOYEE_NAME, DEFAULT_EMPLOYEE_ID, DEFAULT_REPORTING_OFFICER } from '@/lib/constants';

export default function ApplicationsPanel({ applications = [], employeeName = DEFAULT_EMPLOYEE_NAME, employeeId = DEFAULT_EMPLOYEE_ID }) {
  const [filter, setFilter] = useState('ALL');

  const filteredApps = applications.filter((app) => {
    if (filter === 'ALL') return true;
    return (app.status || 'Submitted').toUpperCase() === filter;
  });

  const handleCopySlip = (app) => {
    const text = `Manav Sampada eHRMS Leave Application Slip
Application ID: ${app.id}
Employee: ${employeeName} (${employeeId})
Leave Type: ${(app.type || 'casual').toUpperCase()} Leave
Duration: ${app.days} Day(s)
Status: ${app.status}
Routed To: ${app.routed_to || DEFAULT_REPORTING_OFFICER}`;
    navigator.clipboard.writeText(text);
    alert('Application Slip copied to clipboard!');
  };

  const handlePrintSlip = (app) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>eHRMS Leave Slip - ${app.id}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #111; }
            .card { border: 2px solid #047857; padding: 24px; border-radius: 12px; max-width: 500px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 12px; margin-bottom: 16px; }
            .header h2 { margin: 0; color: #047857; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px stroke #eee; }
            .label { font-weight: bold; color: #555; }
            .badge { background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 99px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h2>Manav Sampada eHRMS (UP)</h2>
              <p>Official Leave Application Slip</p>
            </div>
            <div class="row"><span class="label">Application ID:</span> <span>${app.id}</span></div>
            <div class="row"><span class="label">Employee Name:</span> <span>${employeeName}</span></div>
            <div class="row"><span class="label">Employee ID:</span> <span>${employeeId}</span></div>
            <div class="row"><span class="label">Leave Type:</span> <span>${(app.type || 'casual').toUpperCase()}</span></div>
            <div class="row"><span class="label">Days Requested:</span> <span>${app.days} Day(s)</span></div>
            <div class="row"><span class="label">Current Status:</span> <span class="badge">${app.status || 'Submitted'}</span></div>
            <div class="row"><span class="label">Routed Authority:</span> <span>${app.routed_to || 'Smt. Anita Sharma, BSA'}</span></div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📑</span>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Leave Applications</h3>
            <p className="text-[11px] text-slate-400">All submitted leave records & real-time statuses</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/20">
          {applications.length} Records
        </span>
      </div>

      {/* Status Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {['ALL', 'SUBMITTED', 'APPROVED', 'SENT BACK', 'REJECTED'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
              filter === f
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            {f === 'ALL' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
        {filteredApps.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-2">
            <span className="text-3xl block opacity-40">📭</span>
            <p>No leave applications found matching &quot;{filter}&quot;.</p>
          </div>
        ) : (
          filteredApps.map((app) => (
            <div
              key={app.id}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 transition-all space-y-3 shadow-md"
            >
              {/* Card Title & Status Badge */}
              <div className="flex items-center justify-between border-b border-slate-800/70 pb-2.5">
                <div>
                  <span className="font-mono text-purple-300 font-bold text-xs">{app.id}</span>
                  <span className="text-[11px] text-slate-400 block font-medium capitalize mt-0.5">
                    🌿 {app.type} Leave ({app.days} Day{app.days > 1 ? 's' : ''})
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    app.status === 'Approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : app.status === 'Rejected'
                      ? 'bg-red-500/20 text-red-300 border-red-500/30'
                      : app.status === 'Sent Back'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}
                >
                  {app.status || 'Submitted'}
                </span>
              </div>

              {/* Application Details */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Applied Date:</span>
                  <span className="text-slate-200 font-medium">{app.applied_date || 'Recent'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Sanctioning Officer:</span>
                  <span className="text-slate-200 font-medium truncate block">{app.routed_to || 'Smt. Anita Sharma, BSA'}</span>
                </div>
                {app.officer_remark && (
                  <div className="col-span-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                    <span className="text-amber-400 font-semibold block">Officer Remark:</span>
                    <span className="text-slate-300 italic">&quot;{app.officer_remark}&quot;</span>
                  </div>
                )}
              </div>

              {/* 4-Stage Horizontal Status Tracker */}
              <div className="pt-2 border-t border-slate-800/60">
                <StatusTracker
                  currentStatus={app.status || 'Submitted'}
                  officer={app.routed_to || 'Smt. Anita Sharma, BSA'}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handlePrintSlip(app)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>Print Application Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopySlip(app)}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] border border-slate-700 transition-colors flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                >
                  <span>📋</span>
                  <span>Copy</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
