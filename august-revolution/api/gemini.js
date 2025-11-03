export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  try {
    const { query, context, model, apiVersion } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: { message: 'Server is missing GEMINI_API_KEY' } });
    }
    const useModel = model || 'gemini-1.5-flash-latest';
    const useVersion = apiVersion || 'v1';

    const endpoint = `https://generativelanguage.googleapis.com/${useVersion}/models/${encodeURIComponent(useModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const system = 'Bạn là trợ lý lịch sử Việt Nam. Trả lời NGẮN GỌN, tiếng Việt, chính xác, có thể trích nguồn từ dữ liệu bối cảnh trong ngoặc.';
    const contextText = Array.isArray(context)
      ? context.map((d, idx) => `(${idx + 1}) ${d.title}: ${d.content}`).join('\n')
      : (context || '');
    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${system}\n\nDỮ LIỆU BỐI CẢNH:\n${contextText || '(Không có)'}\n\nCÂU HỎI: ${query}\n\nYÊU CẦU: Trả lời ngắn gọn (3–6 câu), ưu tiên mốc thời gian, địa danh, nhân vật.`,
            },
          ],
        },
      ],
    };

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(r.status).json({ error: { message: data?.error?.message || r.statusText } });
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: { message: err?.message || 'Unknown server error' } });
  }
}


