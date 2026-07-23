import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendChatMessage, getSuggestedPrompts } from '../services/api';

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I\'m your **ESG Advisor**. Ask me about your carbon footprint, ESG score, or green financing.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggested_actions: [
        'My carbon footprint summary',
        'How to reduce emissions?',
        'Green financing options'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getSuggestedPrompts().then((data) => {
      if (data && data.prompts) setPrompts(data.prompts);
    });
  }, []);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg = {
      id: 'u_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await sendChatMessage(text, history);

      setMessages((prev) => [
        ...prev,
        {
          id: 'a_' + Date.now(),
          role: 'assistant',
          content: res.reply || 'No response.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggested_actions: res.suggested_actions || []
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'e_' + Date.now(),
          role: 'assistant',
          content: 'Connection error. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'w_' + Date.now(),
        role: 'assistant',
        content: 'Chat cleared. How can I help?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Custom renderers for react-markdown to keep things clean inside chat bubbles
  const mdComponents = {
    // Render headings as bold paragraphs (no giant text in a chat bubble)
    h1: ({ children }) => <p className="font-bold text-sm mt-2 mb-1">{children}</p>,
    h2: ({ children }) => <p className="font-bold text-sm mt-2 mb-1">{children}</p>,
    h3: ({ children }) => <p className="font-semibold text-[13px] mt-1.5 mb-0.5">{children}</p>,
    h4: ({ children }) => <p className="font-semibold text-xs mt-1 mb-0.5">{children}</p>,
    p: ({ children }) => <p className="text-[13px] leading-relaxed mb-1.5 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="space-y-0.5 my-1 ml-1">{children}</ul>,
    ol: ({ children }) => <ol className="space-y-0.5 my-1 ml-1 list-decimal list-inside">{children}</ol>,
    li: ({ children }) => (
      <li className="flex items-start gap-1.5 text-[13px] leading-snug">
        <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
        <span>{children}</span>
      </li>
    ),
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-slate-100 dark:bg-slate-700 text-[12px] px-1 py-0.5 rounded">{children}</code>
    ),
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">{children}</a>
    ),
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* FAB */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white pl-3.5 pr-4 py-2.5 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
          </svg>
          <span className="text-sm font-medium">ESG Advisor</span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="w-[370px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden">

          {/* Header — compact */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">ESG Advisor</p>
                <p className="text-[10px] text-slate-400">Gemini · Vertex AI</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={handleClear} title="Clear" className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button onClick={() => setIsOpen(false)} title="Close" className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-sm'
                      : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-[13px] leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="chat-md">
                      <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Suggestion chips — only on the latest assistant message */}
                {msg.role === 'assistant' && msg.suggested_actions && msg.suggested_actions.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1 max-w-[90%]">
                    {msg.suggested_actions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(action)}
                        className="text-[11px] bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full px-2.5 py-0.5 transition-colors active:scale-95"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 bg-white text-slate-500 border border-slate-200 px-3 py-2.5 rounded-xl rounded-bl-sm w-fit shadow-sm">
                <svg className="w-3.5 h-3.5 text-emerald-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.657-5.657l1.414-1.414M4.93 19.07l1.414-1.414m12.728 0l-1.414-1.414M4.93 4.93l1.414 1.414M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
                <span className="text-[12px] font-medium tracking-wide bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent animate-pulse">
                  Analyzing ESG Insights...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Starter prompts — only when chat is fresh */}
          {messages.length <= 1 && prompts.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-100 bg-white shrink-0">
              <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1 tracking-wider">Try asking</p>
              <div className="flex gap-1 overflow-x-auto pb-0.5">
                {prompts.slice(0, 3).map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p)}
                    className="whitespace-nowrap text-[11px] bg-slate-50 hover:bg-emerald-50 text-slate-600 border border-slate-200 rounded-lg px-2 py-1 transition-colors shrink-0"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="px-3 py-2.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about ESG, carbon, or financing..."
              disabled={isLoading}
              className="flex-1 bg-slate-100 text-slate-800 placeholder-slate-400 text-[13px] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 border border-transparent"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
