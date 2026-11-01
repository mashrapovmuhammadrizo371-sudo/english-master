const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const assessmentPrompts = {
  chat: "You are a friendly English conversation tutor. Continue the conversation naturally based on the learner message and task instructions. Reply primarily in simple English appropriate to the learner level, then briefly explain important corrections in Uzbek. Ask one natural follow-up question. Do not just assess the text; have a real conversation.",
  writing: "Assess this English writing using CEFR-informed criteria: task achievement, coherence, vocabulary, grammar. Give a cautious estimated level, scores out of 5 for each criterion, corrections with explanations in Uzbek, and an improved example. Do not claim official certification.",
  speaking: "Assess this English speaking sample using CEFR-informed criteria: task response, fluency (only if audio supports it), vocabulary, grammar, and pronunciation (only if audio supports it). Give a cautious estimated level, criterion scores out of 5, useful feedback in Uzbek, and 3 next steps. Do not claim official certification.",
  test: "Check the learner's test answers against the supplied questions and answer key. Return score, correct/incorrect items, explanations in Uzbek, and suggestions. If no answer key is supplied, say that and assess only what can be reliably checked.",
  task: "Assess whether the learner's response fulfils the supplied task instructions. Check completeness, relevance, clarity, language quality, and missing requirements. Give an estimated CEFR level only if there is enough English evidence, explain feedback in Uzbek, and suggest improvements. Do not claim official certification.",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== "POST") return json({ error: "Faqat POST so‘rovi qabul qilinadi." }, 405);
    if (!env.GROQ_API_KEY) return json({ error: "Groq API kaliti serverda sozlanmagan. GROQ_API_KEY secretini tekshiring." }, 500);

    try {
      const body = await request.json();
      const { type, content, instructions = "", answerKey = "", audioBase64 = "", audioMimeType = "" } = body || {};
      if (!Object.hasOwn(assessmentPrompts, type)) return json({ error: "Tekshiruv turi noto‘g‘ri." }, 400);
      if ((!content || !String(content).trim()) && !audioBase64) return json({ error: "Tekshirish uchun javob yoki audio yuboring." }, 400);
      if (String(content || "").length > 20000) return json({ error: "Matn juda uzun. 20 000 belgidan qisqa matn yuboring." }, 413);
      if (audioBase64 && (!audioMimeType || !["audio/webm", "audio/wav", "audio/mp3", "audio/mpeg", "audio/mp4", "audio/m4a", "audio/ogg", "audio/aac", "audio/flac"].includes(audioMimeType))) {
        return json({ error: "Audio formati qo‘llab-quvvatlanmaydi." }, 400);
      }
      if (audioBase64 && audioBase64.length > 12_000_000) return json({ error: "Audio fayl juda katta. Kichikroq audio yuboring." }, 413);

      let learnerContent = String(content || "");
      if (audioBase64) {
        const bytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
        const audioBlob = new Blob([bytes], { type: audioMimeType });
        const form = new FormData();
        form.append("file", audioBlob, "speaking-audio");
        form.append("model", "whisper-large-v3-turbo");
        form.append("response_format", "json");
        const transcriptionResponse = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: "Bearer " + env.GROQ_API_KEY },
          body: form,
        });
        const transcription = await transcriptionResponse.json().catch(() => ({}));
        if (!transcriptionResponse.ok) {
          return json({ error: transcriptionResponse.status === 429 ? "Groq audio limiti tugagan yoki vaqtincha ko‘p so‘rov yuborilgan." : "Groq audio transkripsiyasi xato berdi. Audio formatini va API kalitini tekshiring." }, transcriptionResponse.status === 429 ? 429 : 502);
        }
        learnerContent = [learnerContent, "Audio transkripsiyasi:", transcription.text || ""].filter(Boolean).join("\\n\\n");
        if (!learnerContent.trim()) return json({ error: "Audiodan matn ajratib bo‘lmadi. Qayta urinib ko‘ring." }, 502);
      }

      const prompt = [
        assessmentPrompts[type],
        "Return the feedback in clear Uzbek, using valid JSON with keys: estimatedLevel, summary, criteria (array of {name, scoreOutOf5, feedback}), corrections (array of {original, corrected, explanation}), strengths (array), nextSteps (array), score (number or null). Use only relevant keys. Keep feedback supportive and honest. Do not claim official certification.",
        instructions ? "TASK INSTRUCTIONS:\\n" + String(instructions).slice(0, 5000) : "",
        answerKey ? "ANSWER KEY:\\n" + String(answerKey).slice(0, 5000) : "",
        learnerContent ? "LEARNER RESPONSE:\\n" + learnerContent : "",
      ].filter(Boolean).join("\\n\\n");

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + env.GROQ_API_KEY,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: "You are a careful English-learning assessor. Respond in Uzbek and output valid JSON only." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const providerMessage = result?.error?.message || "";
        const safeError = response.status === 401 || response.status === 403
          ? "Groq API kaliti noto‘g‘ri yoki ruxsati yo‘q. GROQ_API_KEY secretini tekshiring."
          : response.status === 429
            ? "Groq API limiti tugagan yoki vaqtincha ko‘p so‘rov yuborilgan."
            : response.status === 400
              ? "Groq so‘rovini qabul qilmadi. Model yoki yuborilgan ma’lumotni tekshirish kerak."
              : "Groq API hozir javob bermadi. Keyinroq qayta urinib ko‘ring.";
        return json({ error: safeError, providerStatus: response.status, ...(providerMessage ? { detail: providerMessage.slice(0, 240) } : {}) }, response.status === 429 ? 429 : 502);
      }
      const output = result?.choices?.[0]?.message?.content?.trim();
      if (!output) return json({ error: "AI javob qaytarmadi. Qayta urinib ko‘ring." }, 502);
      let assessment;
      try { assessment = JSON.parse(output); }
      catch { return json({ error: "AI natijasini o‘qib bo‘lmadi. Qayta urinib ko‘ring." }, 502); }
      return json({ assessment });
    } catch {
      return json({ error: "So‘rovni tekshirib, qayta urinib ko‘ring." }, 400);
    }
  },
};
