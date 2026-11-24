import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { chatWithAI, getRiskAssessment } from '../api/ai';

const severityColors = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high:     'bg-orange-100 text-orange-800 border-orange-300',
  medium:   'bg-yellow-100 text-yellow-800 border-yellow-300',
  low:      'bg-blue-100 text-blue-800 border-blue-300',
};

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m the Government AI Assistant powered by Gemini. I can help you analyze complaints, suggest actions, understand trends, and answer governance-related questions. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [risks, setRisks] = useState([]);
  const [riskLoading, setRiskLoading] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    setRiskLoading(true);
    try {
      const res = await getRiskAssessment();
      setRisks(res.data?.risks || res.data || []);
    } catch {
      setRisks([]);
    } finally {
      setRiskLoading(false);
    }
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || sending) return;
    setInput('');
    setSending(true);

    const userMsg = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);

    try {
      const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const res = await chatWithAI(q, history);
      const aiReply = res.data?.response || res.data?.message || 'I apologize, I could not process that request right now.';
      setMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Failed to get AI response. Please check your connection and try again.' }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    'What are the top complaint categories this week?',
    'Which zone has the most critical issues?',
    'Recommend actions for water supply complaints.',
    'Summarize today\'s IoT alerts.',
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-hidden flex gap-5" style={{ height: 'calc(100vh - 56px)' }}>
          {/* Chat Panel */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-w-0">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-xl">🤖</div>
              <div>
                <div className="font-bold text-gray-900">AI Assistant</div>
                <div className="text-xs text-gray-400">Powered by Google Gemini</div>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs text-green-600">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="text-xs text-gray-400 mb-1 font-medium">🤖 Gemini AI</div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-5 pb-2">
                <div className="text-xs text-gray-400 mb-2">Suggested questions:</div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(s)}
                      className="text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-5 py-4 border-t border-gray-200">
              <div className="flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about city governance, complaints, or IoT data..."
                  rows={2}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 h-fit"
                >
                  {sending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : '➤'}
                </button>
              </div>
              <div className="text-xs text-gray-400 mt-1.5">Press Enter to send · Shift+Enter for new line</div>
            </div>
          </div>

          {/* Risk Assessment Panel */}
          <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <div className="font-bold text-gray-900 text-sm">Risk Assessment</div>
                  <div className="text-xs text-gray-400">AI-powered analysis</div>
                </div>
              </div>
              <button
                onClick={fetchRisks}
                disabled={riskLoading}
                className="text-teal-600 hover:text-teal-800 text-xs font-medium border border-teal-200 hover:bg-teal-50 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                {riskLoading ? '...' : '↻ Refresh'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {riskLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
                </div>
              ) : risks.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-sm text-gray-500">No significant risks detected</p>
                </div>
              ) : (
                <>
                  <div className="text-xs text-gray-500 font-medium">Top {risks.length} risks identified:</div>
                  {risks.map((risk, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                          <span>⚠</span> {risk.title || risk.area || `Risk ${i+1}`}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${
                          severityColors[risk.severity] || severityColors.medium
                        }`}>
                          {risk.severity || 'medium'}
                        </span>
                      </div>
                      {risk.description && (
                        <p className="text-xs text-gray-600 mb-2 leading-relaxed">{risk.description}</p>
                      )}
                      {risk.recommendedAction && (
                        <div className="bg-teal-50 border border-teal-100 rounded-lg p-2">
                          <div className="text-xs font-medium text-teal-700 mb-0.5">Recommended Action:</div>
                          <div className="text-xs text-teal-800">{risk.recommendedAction}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="text-xs text-gray-400 text-center">Assessment updates based on live data</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
