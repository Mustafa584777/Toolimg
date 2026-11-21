import {
  GoogleGenAI,
  ThinkingLevel,
  type GenerateContentConfig,
} from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 15;

const HIGH_DEMAND_ERROR = 'This tool is in high demand. Please try later.';
const SERVER_DEADLINE_MS = 13_000;
const HEDGE_DELAYS_MS = [2800, 2400, 2200, 2000];

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export type VisionToolType =
  | 'handwriting-to-text'
  | 'hindi-handwriting-to-text'
  | 'image-to-code'
  | 'gemini-image-to-prompt';

interface VisionOptions {
  codeStack?: 'html-tailwind' | 'react-tailwind' | 'html-css';
  promptStyle?: 'midjourney' | 'stable-diffusion' | 'video' | 'json';
  includeEnglishTranslation?: boolean;
}

interface VisionRequestBody {
  tool: VisionToolType;
  imageBase64: string;
  mimeType: string;
  options?: VisionOptions;
}

interface ModelCandidate {
  model: string;
  thinkingConfig?: GenerateContentConfig['thinkingConfig'];
}

const VISION_MODEL_FALLBACKS: ModelCandidate[] = [
  {
    model: 'gemini-4-hydrogen',
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
  },
  {
    model: 'gemini-3.1-flash-lite',
    thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
  },
  {
    model: 'gemini-2.5-flash',
    thinkingConfig: { thinkingBudget: 0 },
  },
  {
    model: 'gemini-2.5-flash-lite',
    thinkingConfig: { thinkingBudget: 0 },
  },
  {
    model: 'gemini-3-flash-preview',
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
  },
];

const VALID_TOOLS = new Set<VisionToolType>([
  'handwriting-to-text',
  'hindi-handwriting-to-text',
  'image-to-code',
  'gemini-image-to-prompt',
]);

function buildInstruction(
  tool: VisionToolType,
  options?: VisionOptions
): { systemInstruction: string; userPrompt: string; expectJson: boolean } {
  switch (tool) {
    case 'handwriting-to-text':
      return {
        systemInstruction:
          'You are a high-precision OCR transcription engine. Extract all handwritten or printed text accurately while preserving paragraph structure, line breaks, lists, and punctuation. Do not add commentary or markdown code fences unless the text itself is code. If any word is illegible, mark it as [unclear].',
        userPrompt:
          'Transcribe all handwritten text in this image cleanly and accurately. Output only the extracted text.',
        expectJson: false,
      };

    case 'hindi-handwriting-to-text':
      return {
        systemInstruction:
          'You are an expert Devanagari (Hindi) OCR transcription engine. Accurately transcribe handwritten Hindi text in clean Unicode Devanagari script, preserving matras, anusvara, chandrabindu, conjuncts, and purna viram (।). Keep line breaks and structure intact.',
        userPrompt: options?.includeEnglishTranslation
          ? 'Transcribe all Hindi handwritten text from this image in clean Unicode Devanagari. Then add a "---" divider and provide an accurate English translation below it.'
          : 'Transcribe all Hindi handwritten text from this image in clean Unicode Devanagari script. Output only the extracted Hindi text without extra commentary.',
        expectJson: false,
      };

    case 'image-to-code': {
      const stack = options?.codeStack ?? 'html-tailwind';
      const stackLabel =
        stack === 'react-tailwind'
          ? 'a self-contained React TypeScript functional component using Tailwind CSS utility classes'
          : stack === 'html-css'
          ? 'semantic HTML5 with embedded clean CSS inside a <style> tag'
          : 'clean semantic HTML5 using Tailwind CSS utility classes';
      return {
        systemInstruction:
          'You are a senior frontend engineer. Convert UI screenshots, wireframes, or design mockups into clean, responsive, accessible code. Output ONLY the raw code without markdown backticks or explanation.',
        userPrompt: `Recreate the visual layout, typography, colors, spacing, and components shown in this image as ${stackLabel}. Output only valid code.`,
        expectJson: false,
      };
    }

    case 'gemini-image-to-prompt': {
      const style = options?.promptStyle ?? 'midjourney';
      if (style === 'json') {
        return {
          systemInstruction:
            'You are a visual prompt engineer. Analyze the image and output ONLY a valid JSON object (no markdown fences) with keys: subject, setting, composition, lighting, camera_lens, color_palette, style, mood.',
          userPrompt:
            'Analyze this image and return a structured JSON visual prompt specification.',
          expectJson: true,
        };
      }
      if (style === 'stable-diffusion') {
        return {
          systemInstruction:
            'You are an expert Stable Diffusion prompt engineer. Output a comma-separated positive prompt of crisp descriptive tokens covering subject, environment, lighting, lens, medium, and quality tags, followed by a concise Negative Prompt line.',
          userPrompt:
            'Reverse-engineer this image into an optimized Stable Diffusion prompt and negative prompt.',
          expectJson: false,
        };
      }
      if (style === 'video') {
        return {
          systemInstruction:
            'You are a cinematic AI video prompt director. Describe the scene, subject action, subtle camera movement, lighting, lens focal length, and atmosphere in one cohesive paragraph suitable for AI video generation.',
          userPrompt:
            'Convert this still image into a rich cinematic AI video generation prompt.',
          expectJson: false,
        };
      }
      return {
        systemInstruction:
          'You are an expert AI image prompt engineer. Write a vivid, detailed, copy-ready prompt describing the exact subject, pose, composition, lighting, textures, color grading, camera perspective, and artistic medium so an image model can recreate a similar aesthetic.',
        userPrompt:
          'Generate a detailed, high-craft AI image prompt describing this image.',
        expectJson: false,
      };
    }
  }
}

function normalizeJsonOutput(rawText: string): string {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/, '')
    .trim();

  try {
    const parsed: unknown = JSON.parse(cleaned);
    return JSON.stringify(parsed, null, 2);
  } catch {
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx > startIdx) {
      const slice = cleaned.slice(startIdx, endIdx + 1);
      const parsed: unknown = JSON.parse(slice);
      return JSON.stringify(parsed, null, 2);
    }
    throw new Error('Invalid JSON generated by model');
  }
}

async function callVisionCandidate(
  candidate: ModelCandidate,
  mimeType: string,
  cleanBase64: string,
  systemInstruction: string,
  userPrompt: string,
  expectJson: boolean,
  signal: AbortSignal
): Promise<string> {
  const config: GenerateContentConfig = {
    systemInstruction,
    abortSignal: signal,
  };
  if (candidate.thinkingConfig) {
    config.thinkingConfig = candidate.thinkingConfig;
  }
  if (expectJson) {
    config.responseMimeType = 'application/json';
  }

  const response = await ai.models.generateContent({
    model: candidate.model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        { text: userPrompt },
      ],
    },
    config,
  });

  const text = (response.text ?? '').trim();
  if (!text) {
    throw new Error(`Empty response from ${candidate.model}`);
  }
  return expectJson ? normalizeJsonOutput(text) : text;
}

function generateWithFastFallbacks(params: {
  mimeType: string;
  cleanBase64: string;
  systemInstruction: string;
  userPrompt: string;
  expectJson: boolean;
}): Promise<string> {
  const { mimeType, cleanBase64, systemInstruction, userPrompt, expectJson } =
    params;

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    let nextIndex = 0;
    let activeCount = 0;
    let hedgeTimer: ReturnType<typeof setTimeout> | null = null;
    const controllers: AbortController[] = [];

    const cleanup = () => {
      if (hedgeTimer) {
        clearTimeout(hedgeTimer);
        hedgeTimer = null;
      }
      clearTimeout(deadlineTimer);
      for (const controller of controllers) {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      }
    };

    const deadlineTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Vision pipeline exceeded 13s deadline'));
    }, SERVER_DEADLINE_MS);

    const launchNext = () => {
      if (settled || nextIndex >= VISION_MODEL_FALLBACKS.length) return;

      const idx = nextIndex++;
      const candidate = VISION_MODEL_FALLBACKS[idx];
      const controller = new AbortController();
      controllers.push(controller);
      activeCount++;

      if (hedgeTimer) {
        clearTimeout(hedgeTimer);
        hedgeTimer = null;
      }

      if (nextIndex < VISION_MODEL_FALLBACKS.length) {
        const delay = HEDGE_DELAYS_MS[idx] ?? 2000;
        hedgeTimer = setTimeout(() => {
          launchNext();
        }, delay);
      }

      callVisionCandidate(
        candidate,
        mimeType,
        cleanBase64,
        systemInstruction,
        userPrompt,
        expectJson,
        controller.signal
      )
        .then((text) => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve(text);
        })
        .catch((err: unknown) => {
          activeCount--;
          if (settled) return;
          if (nextIndex < VISION_MODEL_FALLBACKS.length) {
            launchNext();
          } else if (activeCount <= 0) {
            settled = true;
            cleanup();
            reject(err instanceof Error ? err : new Error('All models failed'));
          }
        });
    };

    launchNext();
  });
}

async function parseVisionRequest(req: NextRequest): Promise<{
  tool: VisionToolType;
  cleanBase64: string;
  mimeType: string;
  options?: VisionOptions;
} | null> {
  const contentType = (req.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const rawTool = String(form.get('tool') ?? '') as VisionToolType;
    const imageEntry = form.get('image');
    const rawOptions = form.get('options');

    if (!VALID_TOOLS.has(rawTool) || !(imageEntry instanceof Blob)) {
      return null;
    }

    const buffer = Buffer.from(await imageEntry.arrayBuffer());
    if (!buffer.byteLength) return null;

    let options: VisionOptions | undefined;
    if (typeof rawOptions === 'string' && rawOptions.trim()) {
      try {
        options = JSON.parse(rawOptions) as VisionOptions;
      } catch {
        options = undefined;
      }
    }

    return {
      tool: rawTool,
      cleanBase64: buffer.toString('base64'),
      mimeType: imageEntry.type || 'image/jpeg',
      options,
    };
  }

  const rawBody = await req.text();
  if (!rawBody.trim()) return null;

  let body: VisionRequestBody;
  try {
    body = JSON.parse(rawBody) as VisionRequestBody;
  } catch {
    return null;
  }

  if (
    !body?.tool ||
    !VALID_TOOLS.has(body.tool) ||
    !body?.imageBase64 ||
    !body?.mimeType
  ) {
    return null;
  }

  const cleanBase64 = body.imageBase64.replace(/^data:[^;]+;base64,/, '');
  if (!cleanBase64) return null;

  return {
    tool: body.tool,
    cleanBase64,
    mimeType: body.mimeType,
    options: body.options,
  };
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      return NextResponse.json({ error: HIGH_DEMAND_ERROR }, { status: 503 });
    }

    const parsed = await parseVisionRequest(req);
    if (!parsed) {
      return NextResponse.json({ error: HIGH_DEMAND_ERROR }, { status: 400 });
    }

    const { systemInstruction, userPrompt, expectJson } = buildInstruction(
      parsed.tool,
      parsed.options
    );

    const resultText = await generateWithFastFallbacks({
      mimeType: parsed.mimeType,
      cleanBase64: parsed.cleanBase64,
      systemInstruction,
      userPrompt,
      expectJson,
    });

    if (!resultText.trim()) {
      return NextResponse.json({ error: HIGH_DEMAND_ERROR }, { status: 503 });
    }

    return NextResponse.json({
      result: resultText,
    });
  } catch (err: unknown) {
    console.error('Vision route failure:', err);
    return NextResponse.json({ error: HIGH_DEMAND_ERROR }, { status: 503 });
  }
}
