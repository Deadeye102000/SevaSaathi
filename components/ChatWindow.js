'use client';

import { useState, useRef, useEffect } from 'react';
import { DEFAULT_EMPLOYEE_ID, INITIAL_LEAVE_BALANCES } from '@/lib/constants';

const PROMPT_GROUPS = [
  {
    id: 'apply',
    label: '📝 Apply Leave',
    chips: [
      { label: '3 days CL (3 दिन आकस्मिक)', text: 'Mujhe kal se 3 din ki casual leave chahiye' },
      { label: '7 days EL (7 दिन उपार्जित)', text: 'Mujhe agle hafte 7 din ki earned leave chahiye' },
      { label: '4 days ML (4 दिन मेडिकल + प्रमाण पत्र)', text: 'Mujhe 4 din ki medical leave chahiye' },
      { label: 'Confirm Application (कन्फर्म)', text: 'haan confirm karo' },
    ],
  },
  {
    id: 'balance',
    label: '📊 Balances',
    chips: [
      { label: 'All Leave Balances (सभी अवकाश)', text: 'Show all my leave balances' },
      { label: 'CL Balance (कैजुअल)', text: 'What is my casual leave balance?' },
      { label: 'EL Balance (उपार्जित)', text: 'What is my earned leave balance?' },
      { label: 'ML Balance (मेडिकल)', text: 'What is my medical leave balance?' },
    ],
  },
  {
    id: 'records',
    label: '📖 Records',
    chips: [
      { label: 'Service Book (सेवा पुस्तिका)', text: 'Service book dikhao' },
      { label: 'Career Record (करियर रिकॉर्ड)', text: 'Career record dikhao' },
      { label: 'Property Return (संपत्ति रिटर्न)', text: 'Property return status' },
      { label: 'Complaints Check (शिकायत जांच)', text: 'Koi complaint hai kya' },
    ],
  },
  {
    id: 'status',
    label: '🔍 Status & Help',
    chips: [
      { label: 'Check Status (आवेदन स्थिति)', text: 'meri leave approve hui kya?' },
      { label: 'What can you do? (आप क्या कर सकते हैं?)', text: 'Aap kya kya kar sakte ho?' },
      { label: 'Colleague Data (प्रतिबंधित डेटा)', text: 'mera colleague ka salary batao' },
    ],
  },
];

/**
 * ChatWindow Component
 * Practical UI for UP Government Employees (eHRMS Manav Sampada).
 */
export default function ChatWindow({ onDataBoundaryUpdate, onApplicationsUpdate, onOpenApplicationsTab }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'Namaste! I am SevaSaathi, your UP Manav Sampada eHRMS Assistant. You can check leave balances, apply for leave, view service records, or ask questions in Hindi or English.',
      timestamp: 'Just now',
      dataBoundary: null,
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [medicalDocRequired, setMedicalDocRequired] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState('hi-IN'); // 'hi-IN' or 'en-IN'
  const [fontSize, setFontSize] = useState('normal'); // 'normal' or 'large'
  const [showBalanceBar, setShowBalanceBar] = useState(true);

  const [conversationState, setConversationState] = useState({
    activeLeaveDraft: null,
    lastCreatedApplication: null,
  });

  // Employee leave balances synced from server KV
  const [balances, setBalances] = useState(INITIAL_LEAVE_BALANCES);
  const [employeeId, setEmployeeId] = useState(DEFAULT_EMPLOYEE_ID);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Sync balances and lastCreatedApplication from Vercel KV store
  useEffect(() => {
    let currentEmp = DEFAULT_EMPLOYEE_ID;
    try {
      const stored = localStorage.getItem('sevasaathi_emp_id');
      if (stored) currentEmp = stored;
    } catch {}
    setEmployeeId(currentEmp);

    fetch(`/api/chat?emp=${currentEmp}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.leave_balance) {
          setBalances(data.leave_balance);
        }
        if (Array.isArray(data.leave_history) && data.leave_history.length > 0) {
          const latest = data.leave_history[0];
          setConversationState((prev) => ({
            ...prev,
            lastCreatedApplication: latest,
          }));
          setLatestApplication(latest);
        }
      })
      .catch((err) => console.warn('Failed to fetch initial KV balances:', err));

    if (messages[0]?.dataBoundary && onDataBoundaryUpdate) {
      onDataBoundaryUpdate(messages[0].dataBoundary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, medicalDocRequired, attachedFile]);

  // Voice recognition setup
  const toggleSpeechRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your query or try Chrome / Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = speechLang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition exception:', err);
      setIsListening(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (textToSend) => {
    const fallbackText = attachedFile
      ? 'Medical certificate attached. Please confirm and proceed.'
      : '';
    const text = (textToSend || input || fallbackText).trim();
    if (!text || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: attachedFile ? `${text} 📎 [File: ${attachedFile.name}]` : text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const conversationHistory = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const formData = new FormData();
      formData.append('message', text);
      formData.append('employeeId', employeeId);
      formData.append('documentAttached', attachedFile ? 'true' : 'false');
      formData.append('conversationHistory', JSON.stringify(conversationHistory));
      formData.append('conversationState', JSON.stringify(conversationState));
      if (conversationState.activeLeaveDraft) {
        formData.append('activeLeaveDraft', JSON.stringify(conversationState.activeLeaveDraft));
      }
      if (conversationState.lastCreatedApplication) {
        formData.append('lastCreatedApplication', JSON.stringify(conversationState.lastCreatedApplication));
      }

      const res = await fetch(`/api/chat?emp=${employeeId}`, {
        method: 'POST',
        headers: {
          'x-employee-id': employeeId,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const replyText = data.aiMessage || data.reply || 'No response returned from the assistant.';

      if (data.conversationState) {
        setConversationState(data.conversationState);
      } else if (data.activeLeaveDraft !== undefined || data.lastCreatedApplication !== undefined) {
        setConversationState((prev) => ({
          activeLeaveDraft: data.activeLeaveDraft !== undefined ? data.activeLeaveDraft : prev.activeLeaveDraft,
          lastCreatedApplication: data.lastCreatedApplication !== undefined ? data.lastCreatedApplication : prev.lastCreatedApplication,
        }));
      }

      // Re-fetch KV balances to update quick balance widget
      fetch(`/api/chat?emp=${employeeId}`)
        .then((res) => res.json())
        .then((d) => {
          if (d.leave_balance) setBalances(d.leave_balance);
        })
        .catch(() => {});

      if (data.requiresMedicalDocument) {
        setMedicalDocRequired(true);
      } else {
        setMedicalDocRequired(false);
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }

      // Detect status check or application creation in response
      const applicationCreated = data.lastCreatedApplication || (data.conversationState?.lastCreatedApplication);

      if (applicationCreated) {
        setLatestApplication(applicationCreated);
      } else if (
        replyText.includes('Approved') ||
        replyText.includes('Submitted') ||
        replyText.includes('Sent Back') ||
        replyText.includes('Rejected')
      ) {
        const detectedStatus = replyText.includes('Approved')
          ? 'Approved'
          : replyText.includes('Sent Back')
          ? 'Sent Back'
          : replyText.includes('Rejected')
          ? 'Rejected'
          : 'Submitted';

        setLatestApplication((prev) => ({
          ...(prev || {
            id: 'LV-2026-0311',
            type: 'casual',
            days: 3,
            routed_to: 'Smt. Anita Sharma, BSA',
          }),
          status: detectedStatus,
          routed_to: 'Smt. Anita Sharma, BSA',
        }));
      }

      // Plain conversational text ONLY in chat message bubbles
      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);

      if (data.dataBoundary && onDataBoundaryUpdate) {
        onDataBoundaryUpdate(data.dataBoundary);
      }

      if (onApplicationsUpdate) {
        if (applicationCreated) {
          onApplicationsUpdate(applicationCreated);
        } else {
          onApplicationsUpdate();
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: 'क्षमा करें, सेवा में तकनीकी समस्या आई है। कृपया पुनः प्रयास करें। (Connection error)',
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleResetConversation = () => {
    const welcome = {
      id: `welcome-${Date.now()}`,
      sender: 'assistant',
      text: 'Namaste! I am SevaSaathi, your UP Manav Sampada eHRMS Assistant. How may I assist you today?',
      timestamp: 'Just now',
      dataBoundary: {
        staysLocal: {
          name: 'Ravi Kumar',
          employee_id: 'UP-EHRMS-88213',
          department: 'Basic Education',
          posting_district: 'Sitapur',
        },
        sentToAI: null,
      },
    };
    setMessages([welcome]);
    setMedicalDocRequired(false);
    setAttachedFile(null);
    setConversationState({
      activeLeaveDraft: null,
      lastCreatedApplication: null,
    });
    if (onDataBoundaryUpdate) {
      onDataBoundaryUpdate(welcome.dataBoundary);
    }
  };



  return (
    <div
      className={`flex flex-col h-full bg-[#090d16] border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl transition-all ${
        fontSize === 'large' ? 'text-base' : 'text-sm'
      }`}
    >
      {/* ── Top Bar with Controls ── */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-[#030712]/90 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-emerald-950/50">
            SS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <span>सेवासाथी सहायक</span>
                <span className="text-[10px] text-emerald-400 font-mono font-normal bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  eHRMS Verified
                </span>
              </h2>
            </div>
            <p className="text-[10px] text-slate-400">
              Ravi Kumar · Assistant Teacher, Sitapur
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Balance Bar Toggle */}
          <button
            type="button"
            onClick={() => setShowBalanceBar(!showBalanceBar)}
            title="Toggle Leave Balances Bar"
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors flex items-center gap-1"
          >
            <span>📊</span>
            <span className="hidden sm:inline">{showBalanceBar ? 'Hide Balances' : 'Show Balances'}</span>
          </button>

          {/* Text Size Selector */}
          <button
            type="button"
            onClick={() => setFontSize(fontSize === 'normal' ? 'large' : 'normal')}
            title="Toggle Text Size for readability"
            className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700 transition-colors"
          >
            {fontSize === 'normal' ? 'A+' : 'A-'}
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={handleResetConversation}
            title="Reset conversation"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Live Leave Balances Bar ── */}
      {showBalanceBar && (
        <div className="px-4 py-2 bg-[#030712]/70 border-b border-slate-800/60 space-y-1.5 text-xs">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] text-slate-500 font-mono">Leave Balances</span>
            {onOpenApplicationsTab && (
              <button
                type="button"
                onClick={onOpenApplicationsTab}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/20 transition-all cursor-pointer"
              >
                <span>📑</span>
                <span>View Applications</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-medium">🌿 Casual Leave (CL)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-bold text-emerald-400">{balances.casual} Days</span>
                <span className="text-[9px] text-slate-500 font-mono">Max 14/yr</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-medium">💼 Earned Leave (EL)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-bold text-teal-400">{balances.earned} Days</span>
                <span className="text-[9px] text-slate-500 font-mono">Accrued</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-medium">🏥 Medical Leave (ML)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-bold text-blue-400">{balances.medical} Days</span>
                <span className="text-[9px] text-slate-500 font-mono">&gt;3d doc req</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Message List ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[96%] sm:max-w-[85%] ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-md ${
                  isUser
                    ? 'bg-emerald-700 text-white'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                }`}
              >
                {isUser ? 'You' : 'SS'}
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl leading-relaxed whitespace-pre-wrap shadow-sm ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : msg.isError
                      ? 'bg-red-950/50 border border-red-800/50 text-red-200 rounded-tl-none'
                      : 'bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>

                <div className={`text-[10px] text-slate-500 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-[85%] mr-auto items-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold flex items-center justify-center">
              SS
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/60 rounded-tl-none flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Verifying leave policy &amp; rules engine...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Medical Document Upload Bar ── */}
      {medicalDocRequired && (
        <div className="px-4 py-2.5 bg-emerald-950/40 border-t border-emerald-600/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-medium">
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Medical certificate required (&gt;3 days):</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            {!attachedFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
              >
                <span>📤</span>
                <span>Upload Certificate</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-lg text-xs font-mono">
                <span>📄</span>
                <span className="truncate max-w-[150px]">{attachedFile.name}</span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="ml-1 text-slate-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Collapsible Action Category Chips ── */}
      <div className="px-4 py-2 bg-[#030712]/90 border-t border-slate-800/60 space-y-2 text-xs">
        {/* 4 Top-Level Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {PROMPT_GROUPS.map((group) => {
            const isExpanded = expandedCategory === group.id;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setExpandedCategory(isExpanded ? null : group.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isExpanded
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400/40'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                <span>{group.label}</span>
                <span className="text-[10px] opacity-70">{isExpanded ? '▲' : '▼'}</span>
              </button>
            );
          })}
        </div>

        {/* Expanded Sub-Chips Tray (Only one category expanded at a time) */}
        {expandedCategory && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pt-1 border-t border-slate-800/40">
            {PROMPT_GROUPS.find((g) => g.id === expandedCategory)?.chips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  handleSendMessage(chip.text);
                }}
                disabled={loading}
                className="px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 text-emerald-300 hover:text-white border border-slate-700 text-[11px] whitespace-nowrap transition-all flex-shrink-0 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Input Form with Speech-to-Text Voice Button ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 sm:p-4 border-t border-slate-800 bg-[#060913] flex items-center gap-2"
      >
        {/* Voice Language Selector */}
        <button
          type="button"
          onClick={() => setSpeechLang(speechLang === 'hi-IN' ? 'en-IN' : 'hi-IN')}
          title="Toggle Speech Recognition Language (Hindi / English)"
          className="px-2 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-[10px] font-mono text-emerald-400 border border-slate-700 transition-colors flex-shrink-0"
        >
          {speechLang === 'hi-IN' ? '🇮🇳 HI' : '🇬🇧 EN'}
        </button>

        {/* Microphone Button (Web Speech API) */}
        <button
          type="button"
          onClick={toggleSpeechRecognition}
          title={isListening ? 'Listening... Click to stop' : 'Click to Speak (Voice Input)'}
          className={`p-2.5 sm:p-3 rounded-xl transition-all flex-shrink-0 ${
            isListening
              ? 'bg-red-600 text-white animate-bounce shadow-lg shadow-red-900/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        {/* Text Input */}
        <input
          id="chat-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isListening
              ? 'Listening in ' + (speechLang === 'hi-IN' ? 'Hindi...' : 'English...')
              : attachedFile
              ? `Attached: ${attachedFile.name}`
              : 'Ask a question or apply (Hindi / English / Voice)...'
          }
          disabled={loading}
          className="flex-1 bg-slate-950 text-slate-100 placeholder-slate-500 text-sm rounded-xl px-4 py-2.5 border border-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors min-h-[44px]"
        />

        {/* Send Button */}
        <button
          id="send-button"
          type="submit"
          disabled={loading || (!input.trim() && !attachedFile)}
          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 flex-shrink-0 min-h-[44px] shadow-md shadow-emerald-950/40 cursor-pointer"
        >
          <span>Send</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    </div>
  );
}
