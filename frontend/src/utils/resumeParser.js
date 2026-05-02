/**
 * Resume Parsing Utility
 * Uses PDF.js (CDN) to extract text from a PDF, then passes it to
 * Groq SDK (groq-sdk package) to parse structured employee data.
 * Follows the same SDK usage pattern as backend/services/groqAgent.service.js
 */

import Groq from 'groq-sdk';

const GROQ_MODEL = 'llama-3.1-8b-instant';
const FALLBACK_MODELS = ['llama-3.1-8b-instant', 'llama3-8b-8192'];

/**
 * Load PDF.js dynamically from CDN and extract all text from a PDF file.
 */
export async function parsePdfText(file) {
    if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item) => item.str).join(' ') + '\n';
    }
    return fullText;
}

/**
 * Send extracted PDF text to Groq via groq-sdk and return structured data.
 * Returns: { name, email, phone, designation, location, skills[], certifications[], about }
 */
export async function parseResumeWithGroq(pdfText) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
        throw new Error('VITE_GROQ_API_KEY is not configured in frontend/.env');
    }

    const client = new Groq({ apiKey, dangerouslyAllowBrowser: true });

    const systemPrompt = `You are an HR data extraction assistant.
Extract structured employee information from the resume text provided.
Return ONLY a strict JSON object matching this exact schema (no markdown, no explanation):
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number",
  "designation": "job title or role",
  "location": "city or location",
  "skills": ["skill1", "skill2"],
  "certifications": ["cert1"],
  "about": "2-3 sentence professional summary"
}
Rules:
- If a field is not found, use empty string for strings or empty array for arrays.
- Extract up to 8 most relevant skills.
- about should be a concise professional summary.`;

    const userContent = `Resume Text:\n${pdfText.substring(0, 6000)}`;

    let completion = null;
    let lastErr = null;

    const modelsToTry = [...new Set([GROQ_MODEL, ...FALLBACK_MODELS])];

    for (const model of modelsToTry) {
        try {
            completion = await client.chat.completions.create({
                model,
                temperature: 0.1,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userContent },
                ],
            });
            break;
        } catch (err) {
            lastErr = err;
            const detail = String(err?.message || '');
            const canRetryModel =
                detail.includes('model_decommissioned') ||
                detail.includes('no longer supported') ||
                detail.includes('not found');
            if (!canRetryModel) break;
        }
    }

    if (!completion) {
        const status = lastErr?.status ?? lastErr?.response?.status;
        const detail = lastErr?.message || 'Unknown Groq SDK error';
        throw new Error(`Groq API failed${status ? ` (${status})` : ''}: ${detail}`);
    }

    const text = completion?.choices?.[0]?.message?.content || '{}';

    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw new Error('Failed to parse Groq response as JSON');
    }
}
