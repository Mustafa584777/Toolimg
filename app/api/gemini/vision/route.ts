import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

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

interface VisionRequestBody {
  tool: VisionToolType;
  imageBase64: string;
  mimeType: string;
  options?: {
    codeStack?: 'html-tailwind' | 'react-tailwind' | 'html-css';
    promptStyle?: 'midjourney' | 'stable-diffusion' | 'video' | 'json';
    includeEnglishTranslation?: boolean;
  };
}

function buildInstruction(
  tool: VisionToolType,
  options?: VisionRequestBody['options']
): { systemInstruction: string; userPrompt: string } {
  switch (tool) {
    case 'handwriting-to-text':
      return {
        systemInstruction:
          'You are a high-precision OCR transcription engine. Extract all handwritten or printed text accurately while preserving paragraph structure, line breaks, lists, and punctuation. Do not add commentary or markdown code fences unless the text itself is code. If any word is illegible, mark it as [unclear].',
        userPrompt:
          'Transcribe all handwritten text in this image cleanly and accurately. Output only the extracted text.',
      };

    case 'hindi-handwriting-to-text':
      return {
        systemInstruction:
          'You are an expert Devanagari (Hindi) OCR transcription engine. Accurately transcribe handwritten Hindi text in clean Unicode Devanagari script, preserving matras, anusvara, chandrabindu, conjuncts, and purna viram (।). Keep line breaks and structure intact.',
        userPrompt: options?.includeEnglishTranslation
          ? 'Transcribe all Hindi handwritten text from this image in clean Unicode Devanagari. Then add a "---" divider and provide an accurate English translation below it.'
          : 'Transcribe all Hindi handwritten text from this image in clean Unicode Devanagari script. Output only the extracted Hindi text without extra commentary.',
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
      };
    }

    case 'gemini-image-to-prompt': {
      const style = options?.promptStyle ?? 'midjourney';
      if (style === 'json') {
        return {
          systemInstruction:
            'You are a visual prompt engineer. Analyze the image and output a clean, valid JSON object describing subject, setting, composition, lighting, camera_lens, color_palette, style, and mood.',
          userPrompt:
            'Analyze this image and return a structured JSON visual prompt specification.',
        };
      }
      if (style === 'stable-diffusion') {
        return {
          systemInstruction:
            'You are an expert Stable Diffusion prompt engineer. Output a comma-separated positive prompt of crisp descriptive tokens covering subject, environment, lighting, lens, medium, and quality tags, followed by a concise Negative Prompt line.',
          userPrompt:
            'Reverse-engineer this image into an optimized Stable Diffusion prompt and negative prompt.',
        };
      }
      if (style === 'video') {
        return {
          systemInstruction:
            'You are a cinematic AI video prompt director. Describe the scene, subject action, subtle camera movement, lighting, lens focal length, and atmosphere in one cohesive paragraph suitable for AI video generation.',
          userPrompt:
            'Convert this still image into a rich cinematic AI video generation prompt.',
        };
      }
      return {
        systemInstruction:
          'You are an expert AI image prompt engineer. Write a vivid, detailed, copy-ready prompt describing the exact subject, pose, composition, lighting, textures, color grading, camera perspective, and artistic medium so an image model can recreate a similar aesthetic.',
        userPrompt:
          'Generate a detailed, high-craft AI image prompt describing this image.',
      };
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error:
            'GEMINI_API_KEY is not configured. Please add it in Settings > Secrets.',
        },
        { status: 500 }
      );
    }

    const body = (await req.json()) as VisionRequestBody;
    if (!body?.tool || !body?.imageBase64 || !body?.mimeType) {
      return NextResponse.json(
        { error: 'Missing required fields: tool, imageBase64, and mimeType.' },
        { status: 400 }
      );
    }

    // Strip data URL prefix if present
    const cleanBase64 = body.imageBase64.replace(/^data:[^;]+;base64,/, '');
    const { systemInstruction, userPrompt } = buildInstruction(
      body.tool,
      body.options
    );

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: body.mimeType,
              data: cleanBase64,
            },
          },
          { text: userPrompt },
        ],
      },
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    return NextResponse.json({
      result: response.text ?? '',
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Vision processing failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
