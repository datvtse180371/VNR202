import React, { useEffect, useState } from 'react';

function getSessionNumber(key, def = 0) {
  try {
    const v = sessionStorage.getItem(key);
    return v ? parseInt(v, 10) : def;
  } catch {
    return def;
  }
}

function setSessionNumber(key, val) {
  try {
    sessionStorage.setItem(key, String(val));
  } catch {}
}

export default function FooterStats() {
  const [sessionViews, setSessionViews] = useState(0);
  const [aiCalls, setAiCalls] = useState(0);
  const [aiStatus, setAiStatus] = useState('Retrieval');

  useEffect(() => {
    // Increment session page views on mount
    const v = getSessionNumber('session_views', 0) + 1;
    setSessionNumber('session_views', v);
    setSessionViews(v);

    // Initialize AI calls from session
    const a = getSessionNumber('session_ai_calls', 0);
    setAiCalls(a);

    const onAiAnswer = (e) => {
      const via = (e && e.detail && e.detail.via) || 'Retrieval';
      const next = getSessionNumber('session_ai_calls', 0) + 1;
      setSessionNumber('session_ai_calls', next);
      setAiCalls(next);
      setAiStatus(via === 'gemini' || via === 'proxy' ? 'Gemini' : 'Retrieval');
    };
    window.addEventListener('ai:answer', onAiAnswer);
    return () => window.removeEventListener('ai:answer', onAiAnswer);
  }, []);

  return (
    <div className="mt-3 text-xs text-gray-400 flex items-center justify-center gap-3">
      <span>Lượt xem (phiên): <strong className="text-gray-200">{sessionViews}</strong></span>
      <span>AI (phiên): <strong className="text-gray-200">{aiCalls}</strong></span>
      <span>Trạng thái AI: <strong className="text-gray-200">{aiStatus}</strong></span>
    </div>
  );
}


