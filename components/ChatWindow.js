'use client';

import { useState, useRef, useEffect } from 'react';
import DataBoundaryPanel from '@/components/DataBoundaryPanel';

const QUICK_PROMPTS = [
  { label: 'All Leaves (सभी अवकाश)', text: 'Show all my leaves and balance' },
  { label: 'Apply Casual Leave', text: 'Mujhe 3 din ki casual leave chahiye' },
  { label: 'Apply Earned Leave', text: 'Mujhe 7 din ki earned leave chahiye' },
  { label: 'Apply Medical Leave', text: 'Mujhe 4 din ki medical leave chahiye' },
  { label: 'Confirm (कन्फर्म)', text: 'haan confirm karo' },
  { label: 'CL Balance', text: 'What is my casual leave balance?' },
  { label: 'EL Balance', text: 'What is my earned leave balance?' },
  { label: 'ML Balance', text: 'What is my medical leave balance?' },
  { label: 'Leave Status', text: 'meri leave approve hui kya?' },
  { label: 'Service book dikhao', text: 'Service book dikhao' },
  { label: 'Career record dikhao', text: 'Career record dikhao' },
  { label: 'Property return status', text: 'Property return status' },
  { label: 'Koi complaint hai kya', text: 'Koi complaint hai kya' },
  { label: 'Aap kya kar sakte ho?', text: 'Aap kya kya kar sakte ho?' },
];

/**
 * ChatWindow Component
 * Main chat interface supporting Hindi and English queries.
 * On each AI response, renders DataBoundaryPanel showing the exact data boundary.
 * Supports local file attachment for medical leave exceeding 3 days.
 *
 * @param {Object} props
 * @param {Function} [props.onDataBoundaryUpdate] - Callback to sync latest boundary to page sidebar
 */
export default function ChatWindow({ onDataBoundaryUpdate }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'Namaste! I am SevaSaathi, your Government Service and Leave Entitlements Assistant (UP Manav Sampada eHRMS). You can ask questions in Hindi or English regarding your leave balance, rules, or submit an application.',
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
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [medicalDocRequired, setMedicalDocRequired] = useState(false);
  const [conversationState, setConversationState] = useState({
    activeLeaveDraft: null,
    lastCreatedApplication: null,
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync initial boundary to parent
  useEffect(() => {
    if (messages[0]?.dataBoundary && onDataBoundaryUpdate) {
      onDataBoundaryUpdate(messages[0].dataBoundary);
    }
  }, [messages, onDataBoundaryUpdate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, medicalDocRequired, attachedFile]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store in component state as a File object (do not upload anywhere yet)
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
    const fallbackText = attachedFile ? 'Medical certificate attached. Please confirm and proceed.' : '';
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

      // Send as FormData with documentAttached flag and conversationState
      const formData = new FormData();
      formData.append('message', text);
      formData.append('documentAttached', attachedFile ? 'true' : 'false');
      formData.append('conversationHistory', JSON.stringify(conversationHistory));
      formData.append('conversationState', JSON.stringify(conversationState));
      if (conversationState.activeLeaveDraft) {
        formData.append('activeLeaveDraft', JSON.stringify(conversationState.activeLeaveDraft));
      }
      if (conversationState.lastCreatedApplication) {
        formData.append('lastCreatedApplication', JSON.stringify(conversationState.lastCreatedApplication));
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const replyText = data.aiMessage || data.reply || 'No response returned from the assistant.';

      // Update client conversation state from response
      if (data.conversationState) {
        setConversationState(data.conversationState);
      } else if (data.activeLeaveDraft !== undefined || data.lastCreatedApplication !== undefined) {
        setConversationState((prev) => ({
          activeLeaveDraft: data.activeLeaveDraft !== undefined ? data.activeLeaveDraft : prev.activeLeaveDraft,
          lastCreatedApplication: data.lastCreatedApplication !== undefined ? data.lastCreatedApplication : prev.lastCreatedApplication,
        }));
      }

      // Check if medical document is needed
      if (data.requiresMedicalDocument) {
        setMedicalDocRequired(true);
      } else {
        // If request was completed/confirmed, reset document requirement
        setMedicalDocRequired(false);
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }

      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        dataBoundary: data.dataBoundary,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);

      if (data.dataBoundary && onDataBoundaryUpdate) {
        onDataBoundaryUpdate(data.dataBoundary);
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetConversation = () => {
    const welcome = {
      id: `welcome-${Date.now()}`,
      sender: 'assistant',
      text: 'Namaste! I am SevaSaathi, your Government Service and Leave Entitlements Assistant (UP Manav Sampada eHRMS). How may I assist you today?',
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
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Chat Window Top Bar */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
            SS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">
                सेवासाथी सहायक
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Verified Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Hindi & English Supported • UP Basic Education
            </p>
          </div>
        </div>

        <button
          onClick={handleResetConversation}
          title="Reset conversation"
          className="text-xs min-h-[36px] px-2.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700 flex items-center gap-1 active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 sm:gap-3 max-w-[96%] sm:max-w-[85%] ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-semibold shadow-sm ${
                  isUser
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {isUser ? 'You' : 'SS'}
              </div>

              {/* Bubble & Data Boundary */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base leading-relaxed whitespace-pre-wrap shadow-sm ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : msg.isError
                      ? 'bg-red-950/50 border border-red-800/50 text-red-200 rounded-tl-none'
                      : 'bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Data Boundary Panel rendered on each AI response */}
                {!isUser && msg.dataBoundary && (
                  <div className="mt-2">
                    <DataBoundaryPanel dataBoundary={msg.dataBoundary} isSidePanel={false} />
                  </div>
                )}

                <div className={`text-[10px] text-slate-500 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-2.5 sm:gap-3 max-w-[90%] sm:max-w-[85%] mr-auto items-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center">
              SS
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700/60 rounded-tl-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs text-slate-400">Processing with rules engine...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Medical Document Upload Bar (Appears only when medical leave > 3 days requires a certificate) */}
      {medicalDocRequired && (
        <div className="px-4 py-2.5 bg-emerald-950/30 border-t border-emerald-600/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-300 font-medium text-xs">
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
                className="px-3 py-1.5 min-h-[36px] rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Upload Certificate</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-lg text-xs font-mono">
                <span>📄</span>
                <span className="truncate max-w-[120px] sm:max-w-[200px]" title={attachedFile.name}>
                  {attachedFile.name}
                </span>
                <span className="text-[10px] text-emerald-400 font-sans hidden xs:inline">(Local)</span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="ml-1 text-slate-400 hover:text-red-300 transition-colors p-1"
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth text-xs">
        <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">Try:</span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt.text)}
            disabled={loading}
            className="px-2.5 py-1 min-h-[30px] rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] whitespace-nowrap transition-all flex-shrink-0 active:scale-95"
          >
            {prompt.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 border-t border-slate-800 bg-slate-900/95 flex items-center gap-3"
      >
        <input
          id="chat-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={attachedFile ? `Attached: ${attachedFile.name}. Press Send...` : "Ask a question or apply (Hindi / English)..."}
          disabled={loading}
          className="flex-1 bg-slate-950 text-slate-100 placeholder-slate-500 text-base sm:text-sm rounded-xl px-4 py-2.5 sm:py-3 border border-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors min-h-[44px]"
        />

        <button
          id="send-button"
          type="submit"
          disabled={loading || (!input.trim() && !attachedFile)}
          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 text-white font-medium text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all flex items-center gap-1.5 flex-shrink-0 min-h-[44px] shadow-md shadow-emerald-950/40 cursor-pointer"
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
