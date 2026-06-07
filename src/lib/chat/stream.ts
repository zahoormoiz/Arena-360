import type { ChatMessageRecord } from './types';

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

interface StreamGeminiOptions {
    apiKey: string;
    systemPrompt: string;
    messages: ChatMessageRecord[];
}

interface GeminiStreamChunk {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string;
            }>;
        };
    }>;
}

function extractTextFromChunk(payload: GeminiStreamChunk) {
    const parts = payload?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) {
        return '';
    }

    return parts
        .map((part) => (typeof part?.text === 'string' ? part.text : ''))
        .join('');
}

async function* parseGeminiSseStream(response: Response) {
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('Missing Gemini response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const rawEvent of events) {
            const lines = rawEvent.split('\n');
            const data = lines
                .filter((line) => line.startsWith('data:'))
                .map((line) => line.slice(5).trim())
                .join('');

            if (!data || data === '[DONE]') {
                continue;
            }

            try {
                const payload = JSON.parse(data);
                const text = extractTextFromChunk(payload);
                if (text) {
                    yield text;
                }
            } catch {
                continue;
            }
        }
    }
}

export async function* streamGeminiCompletion({
    apiKey,
    systemPrompt,
    messages,
}: StreamGeminiOptions) {
    const contents = messages.map((message) => ({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.content }],
    }));

    const body = JSON.stringify({
        system_instruction: {
            parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig: {
            temperature: 0.55,
            topP: 0.9,
            maxOutputTokens: 500,
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
    });

    let lastError: Error | null = null;

    for (const model of GEMINI_MODELS) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 16000);

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body,
                    signal: controller.signal,
                }
            );

            if (response.status === 429) {
                lastError = new Error(`${model} rate limited`);
                continue;
            }

            if (!response.ok) {
                const text = await response.text();
                lastError = new Error(`${model} failed: ${response.status} ${text}`);
                continue;
            }

            for await (const chunk of parseGeminiSseStream(response)) {
                yield chunk;
            }

            return;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown Gemini error');
        } finally {
            clearTimeout(timeout);
        }
    }

    throw lastError || new Error('Unable to stream a Gemini response');
}

export async function* streamStaticText(text: string) {
    const words = text.split(/(\s+)/).filter(Boolean);

    for (const word of words) {
        yield word;
        await new Promise((resolve) => setTimeout(resolve, 18));
    }
}

export function toSseEvent(event: string, data: unknown) {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
