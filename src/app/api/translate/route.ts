import { NextRequest, NextResponse } from 'next/server';
import { translateText, TranslateTextInputSchema } from '@/ai/flows/translate-text';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedBody = TranslateTextInputSchema.parse(body);

    const result = await translateText(parsedBody);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in translate API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to translate text.', details: errorMessage },
      { status: 500 }
    );
  }
}
