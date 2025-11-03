import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Send, X, Sparkles } from 'lucide-react';
import kb from '../agent/knowledge-vi.json';

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return normalize(text).split(' ').filter(Boolean);
}

function scoreDocuments(query, documents) {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];
  const df = new Map();
  const docTokens = documents.map(d => ({ ...d, tokens: tokenize(d.title + ' ' + d.content) }));
  docTokens.forEach(d => {
    const unique = new Set(d.tokens);
    qTokens.forEach(t => {
      if (unique.has(t)) df.set(t, (df.get(t) || 0) + 1);
    });
  });
  const N = docTokens.length;
  const idf = new Map(qTokens.map(t => [t, Math.log((N + 1) / ((df.get(t) || 0) + 1)) + 1]));

  const scores = docTokens.map(d => {
    const tf = new Map();
    d.tokens.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
    let score = 0;
    qTokens.forEach(t => {
      const w = idf.get(t) || 0;
      score += (tf.get(t) || 0) * w;
    });
    // phrase boost
    const normDoc = normalize(d.title + ' ' + d.content);
    const normQ = normalize(query);
    if (normDoc.includes(normQ) && normQ.length > 4) score *= 1.4;
    return { doc: d, score };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores.filter(s => s.score > 0);
}

const INITIAL_MESSAGE = {
  role: 'agent',
  content:
    'Xin chào! Tôi là trợ lý về Cách mạng Tháng Tám 1945. Hãy đặt câu hỏi bằng tiếng Việt (ví dụ: \"Diễn biến chính của Tổng khởi nghĩa?\").',
};

export default function ChatAgent() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const viewportRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [cfgKey, setCfgKey] = useState('');
  const [cfgModel, setCfgModel] = useState('');
  const [cfgVersion, setCfgVersion] = useState('');
  const cacheRef = useRef(new Map());

  const knowledge = useMemo(() => kb, []);

  function getApiKey() {
    // Vite (import.meta.env)
    try {
      // eslint-disable-next-line no-undef
      const k = import.meta && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY;
      if (k) return k;
    } catch {}
    // CRA/Node bundlers
    try {
      // eslint-disable-next-line no-undef
      if (typeof process !== 'undefined' && process.env && process.env.VITE_GEMINI_API_KEY) {
        // eslint-disable-next-line no-undef
        return process.env.VITE_GEMINI_API_KEY;
      }
    } catch {}
    // localStorage (user-provided)
    try {
      const ls = typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null;
      if (ls) return ls;
    } catch {}
    // <meta name="gemini-api-key" content="...">
    try {
      const meta = typeof document !== 'undefined' ? document.querySelector('meta[name="gemini-api-key"]') : null;
      const content = meta && meta.getAttribute('content');
      if (content) return content;
    } catch {}
    // window fallback
    try {
      // eslint-disable-next-line no-undef
      if (typeof window !== 'undefined' && window.GEMINI_API_KEY) return window.GEMINI_API_KEY;
    } catch {}
    return undefined;
  }

  function getModel() {
    // Prefer explicit configuration
    try {
      // eslint-disable-next-line no-undef
      const m = (import.meta && import.meta.env && import.meta.env.VITE_GEMINI_MODEL) || undefined;
      if (m) return m;
    } catch {}
    try {
      // eslint-disable-next-line no-undef
      if (typeof process !== 'undefined' && process.env && process.env.VITE_GEMINI_MODEL) {
        // eslint-disable-next-line no-undef
        return process.env.VITE_GEMINI_MODEL;
      }
    } catch {}
    try {
      const ls = typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_MODEL') : null;
      if (ls) return ls;
    } catch {}
    try {
      const meta = typeof document !== 'undefined' ? document.querySelector('meta[name="gemini-model"]') : null;
      const content = meta && meta.getAttribute('content');
      if (content) return content;
    } catch {}
    try {
      // eslint-disable-next-line no-undef
      if (typeof window !== 'undefined' && window.GEMINI_MODEL) return window.GEMINI_MODEL;
    } catch {}
    // Default (only model requested)
    return 'gemini-2.5-flash';
  }

  function getApiVersion() {
    try {
      // eslint-disable-next-line no-undef
      const v = (import.meta && import.meta.env && import.meta.env.VITE_GEMINI_API_VERSION) || undefined;
      if (v) return v;
    } catch {}
    try {
      // eslint-disable-next-line no-undef
      if (typeof process !== 'undefined' && process.env && process.env.VITE_GEMINI_API_VERSION) {
        // eslint-disable-next-line no-undef
        return process.env.VITE_GEMINI_API_VERSION;
      }
    } catch {}
    try {
      const ls = typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_VERSION') : null;
      if (ls) return ls;
    } catch {}
    try {
      const meta = typeof document !== 'undefined' ? document.querySelector('meta[name="gemini-api-version"]') : null;
      const content = meta && meta.getAttribute('content');
      if (content) return content;
    } catch {}
    try {
      // eslint-disable-next-line no-undef
      if (typeof window !== 'undefined' && window.GEMINI_API_VERSION) return window.GEMINI_API_VERSION;
    } catch {}
    return 'v1beta';
  }

  // Model discovery removed per request (force 1.5 flash). Keeping helpers deleted.

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    // Load existing config into settings inputs
    try {
      const k = typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : '';
      const m = typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_MODEL') : '';
      const v = typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_VERSION') : '';
      if (k) setCfgKey(k);
      if (m) setCfgModel(m);
      if (v) setCfgVersion(v);
    } catch {}
  }, []);

  async function generateWithGemini(query, contextDocs, apiKey, model, apiVersion) {
    const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const contextText = contextDocs.slice(0, 2)
      .map(({ doc }, idx) => `(${idx + 1}) ${doc.title}: ${doc.content}`)
      .join('\n');
    const system =
      'Bạn là trợ lý lịch sử Việt Nam. Trả lời NGẮN GỌN, tiếng Việt, lịch sự, chính xác. Nếu không chắc, hãy nói bạn chưa có dữ liệu. Tránh suy đoán. Dùng dữ liệu bối cảnh khi phù hợp.';
    const prompt = [
      { role: 'user', parts: [{ text: `${system}\n\nDỮ LIỆU BỐI CẢNH:\n${contextText || '(Không có)'}\n\nCÂU HỎI: ${query}\n\nYÊU CẦU: Trả lời ngắn gọn (3–6 câu), ưu tiên mốc thời gian, địa danh, nhân vật. Nếu dùng dữ liệu, có thể trích nguồn bằng tiêu đề trong ngoặc.` }] }
    ];
    const body = { contents: prompt };
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = (data && (data.error?.message || data.message)) || res.statusText || 'Gemini API error';
      const err = new Error(`Gemini API error: ${res.status} ${errMsg}`);
      // Attach details for troubleshooting
      err.details = { status: res.status, statusText: res.statusText, data };
      throw err;
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text.trim();
  }

  async function generateViaProxy(query, contextDocs) {
    const payload = {
      query,
      context: contextDocs.slice(0, 2).map(({ doc }) => ({ title: doc.title, content: doc.content })),
      model: getModel(),
      apiVersion: getApiVersion(),
    };
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || res.statusText || 'Proxy error';
      const err = new Error(`Proxy error: ${res.status} ${msg}`);
      err.details = { status: res.status, data };
      throw err;
    }
    return (data && data.text) || '';
  }

  const ask = async () => {
    const q = input.trim();
    if (!q) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    try {
      // Cache check
      const cacheKey = `${getModel()}|${getApiVersion()}|${q}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setMessages(prev => [...prev, { role: 'agent', content: cached }]);
        return;
      }
      const ranked = scoreDocuments(q, knowledge);
      const top = ranked.slice(0, 2);
      const apiKey = getApiKey();

      if (apiKey) {
        try {
          let apiVersion = getApiVersion() || 'v1';
          let model = getModel();

          let answer;
          try {
            answer = await generateWithGemini(q, top, apiKey, model, apiVersion);
          } catch (e1) {
            const status = e1 && e1.details && e1.details.status;
            // Retry once on 429 with small backoff
            if (status === 429) {
              await new Promise(r => setTimeout(r, 15000));
              answer = await generateWithGemini(q, top, apiKey, model, apiVersion);
            } else {
              throw e1;
            }
          }
          if (answer) {
            setMessages(prev => [...prev, { role: 'agent', content: answer }]);
            // Persist working config
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem('GEMINI_MODEL', model);
                localStorage.setItem('GEMINI_API_VERSION', apiVersion);
              }
            } catch {}
            cacheRef.current.set(cacheKey, answer);
          } else {
            throw new Error('Empty response');
          }
        } catch (e) {
          // Fallback to retrieval bullets
          console.error('[Gemini Error]', e);
          const errorText = (e && e.message) ? e.message : 'Lỗi không xác định khi gọi Gemini';
          if (top.length === 0) {
            setMessages(prev => [
              ...prev,
              {
                role: 'agent',
                content:
                  `Không thể lấy câu trả lời từ Gemini. ${errorText}.\n\nBạn hãy kiểm tra: khóa API đúng, đã bật Generative Language API, và hạn chế khóa (HTTP referrer) cho domain hiện tại. Hoặc hỏi cụ thể hơn (thời gian, địa điểm, nhân vật...).`,
              },
            ]);
          } else {
            const bullets = top
              .map(({ doc }) => `• ${doc.content} (Nguồn: ${doc.title})`)
              .join('\n');
            const answer = `Dựa trên dữ liệu hiện có, đây là thông tin liên quan:\n${bullets}\n\n(Lưu ý: Gemini lỗi: ${errorText})`;
            setMessages(prev => [...prev, { role: 'agent', content: answer }]);
            cacheRef.current.set(cacheKey, answer);
          }
        }
      } else {
        // Try server proxy (for Vercel deployment) before pure retrieval fallback
        try {
          let answer;
          try {
            answer = await generateViaProxy(q, top);
          } catch (e1) {
            const status = e1 && e1.details && e1.details.status;
            if (status === 429) {
              await new Promise(r => setTimeout(r, 15000));
              answer = await generateViaProxy(q, top);
            } else {
              throw e1;
            }
          }
          if (answer) {
            setMessages(prev => [...prev, { role: 'agent', content: answer }]);
            cacheRef.current.set(cacheKey, answer);
          } else {
            throw new Error('Empty proxy response');
          }
        } catch (proxyErr) {
          console.error('[Proxy Error]', proxyErr);
        if (top.length === 0) {
          setMessages(prev => [
            ...prev,
            {
              role: 'agent',
              content:
                'Tôi chưa tìm thấy thông tin phù hợp trong dữ liệu hiện có và không thể gọi Gemini. Bạn có thể hỏi cụ thể hơn (thời gian, địa điểm, nhân vật, sự kiện...).',
            },
          ]);
        } else {
          const bullets = top
            .map(({ doc }) => `• ${doc.content} (Nguồn: ${doc.title})`)
            .join('\n');
          const answer = `Dựa trên dữ liệu hiện có, đây là thông tin liên quan:\n${bullets}\n\n(Lưu ý: không thể truy cập Gemini qua proxy.)`;
          setMessages(prev => [...prev, { role: 'agent', content: answer }]);
        }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-[90vw] max-w-md bg-stone-900/90 backdrop-blur text-white rounded-2xl shadow-2xl border border-stone-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-600 to-amber-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Sparkles size={18} /></div>
              <div className="font-semibold">Trợ lý CMT8 (Việt ngữ)</div>
            </div>
            <div className="flex items-center gap-1">
              <button aria-label="Cấu hình" onClick={() => setShowSettings(s => !s)} className="px-2 py-1 rounded hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white text-sm">Cấu hình</button>
              <button aria-label="Đóng" onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <X size={18} />
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="px-4 py-3 border-b border-stone-700 bg-stone-900">
              <div className="grid gap-2">
                <label className="text-xs text-stone-300">Khóa Gemini (lưu cục bộ)</label>
                <input
                  value={cfgKey}
                  onChange={(e) => setCfgKey(e.target.value)}
                  placeholder="dán khóa tại đây"
                  className="w-full rounded bg-stone-800 text-white p-2 outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-stone-300">Model</label>
                    <input
                      value={cfgModel}
                      onChange={(e) => setCfgModel(e.target.value)}
                      placeholder="vd: gemini-1.5-flash-latest"
                      className="w-full rounded bg-stone-800 text-white p-2 outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-300">API version</label>
                    <input
                      value={cfgVersion}
                      onChange={(e) => setCfgVersion(e.target.value)}
                      placeholder="vd: v1 hoặc v1beta"
                      className="w-full rounded bg-stone-800 text-white p-2 outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      try {
                        if (typeof localStorage !== 'undefined') {
                          if (cfgKey) localStorage.setItem('GEMINI_API_KEY', cfgKey); else localStorage.removeItem('GEMINI_API_KEY');
                          if (cfgModel) localStorage.setItem('GEMINI_MODEL', cfgModel); else localStorage.removeItem('GEMINI_MODEL');
                          if (cfgVersion) localStorage.setItem('GEMINI_API_VERSION', cfgVersion); else localStorage.removeItem('GEMINI_API_VERSION');
                        }
                      } catch {}
                      setShowSettings(false);
                    }}
                    className="px-3 py-2 rounded bg-amber-400 text-stone-900 font-semibold hover:opacity-90"
                  >Lưu</button>
                  <button
                    onClick={() => {
                      setCfgKey(''); setCfgModel(''); setCfgVersion('');
                      try {
                        if (typeof localStorage !== 'undefined') {
                          localStorage.removeItem('GEMINI_API_KEY');
                          localStorage.removeItem('GEMINI_MODEL');
                          localStorage.removeItem('GEMINI_API_VERSION');
                        }
                      } catch {}
                    }}
                    className="px-3 py-2 rounded bg-stone-700 text-white hover:bg-stone-600"
                  >Xóa</button>
                </div>
              </div>
            </div>
          )}

          <div ref={viewportRef} className="max-h-[60vh] overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={
                  'inline-block px-3 py-2 rounded-xl whitespace-pre-wrap ' +
                  (m.role === 'user'
                    ? 'bg-amber-300 text-stone-900'
                    : 'bg-stone-800 text-stone-100 border border-stone-700')
                }>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-left">
                <div className="inline-block px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 animate-pulse">Đang tìm thông tin…</div>
              </div>
            )}
          </div>

          <div className="border-t border-stone-700 p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Nhập câu hỏi của bạn về Cách mạng Tháng Tám…"
                className="flex-1 resize-none rounded-xl bg-stone-800 text-white placeholder-stone-400 p-3 outline-none focus-visible:ring-2 focus-visible:ring-amber-400 min-h-[44px] max-h-28"
              />
              <button
                onClick={ask}
                disabled={loading || !input.trim()}
                className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="mt-2 text-xs text-stone-400">{getApiKey() ? 'Sử dụng Gemini (đã cấu hình khóa). Câu trả lời được căn cứ dữ liệu tích hợp.' : 'Không dùng API bên ngoài; trả lời dựa trên tri thức tích hợp. Có thể cấu hình Gemini để nâng cao.'}</p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          aria-label="Mở trợ lý Cách mạng Tháng Tám"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}


