'use server';

/**
 * @fileOverview Translates text to a specified language using AI.
 */

import { getAi } from '@/ai/genkit';
import { z } from 'zod';
import { ModelId } from '@genkit-ai/googleai';

export const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  targetLanguage: z.string().describe('The IETF language tag, e.g., "de", "ar".'),
  apiKey: z.string().optional().describe('Google AI API key.'),
  model: z.string().describe('The model to use for generation.'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

export const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextOutput> {
    const ai = await getAi(input.apiKey);

    const prompt = `You are Google Translate.
Translate the following English text to the language with the IETF language tag: "${input.targetLanguage}".
Only return the translated text. Do not return any other explanatory text.

Text to translate: "${input.text}"
`;

    const { output } = await ai.generate({
        prompt,
        model: 'googleai/gemini-2.5-flash',
        output: { schema: TranslateTextOutputSchema },
    });

    return output!;
}
