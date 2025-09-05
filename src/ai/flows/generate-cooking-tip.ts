'use server';

/**
 * @fileOverview Generates a random, useful cooking tip.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ModelId } from '@genkit-ai/googleai';

const GenerateCookingTipInputSchema = z.object({
  previousTips: z.array(z.string()).describe('A list of previously shown tips to avoid repetition.'),
  context: z.object({
    view: z.string().describe("The user's current view in the app (e.g., 'search', 'cooking')."),
    recipeName: z.string().optional().describe('The name of the recipe the user is currently viewing or cooking, if any.'),
    step: z.string().optional().describe('The current cooking step, if applicable.'),
  }).optional().describe('The context of where the user is in the app.'),
  apiKey: z.string().optional().describe('Google AI API key.'),
  model: z.string().optional().describe('The model to use for generation.'),
});

export type GenerateCookingTipInput = z.infer<typeof GenerateCookingTipInputSchema>;

const GenerateCookingTipOutputSchema = z.object({
  tip: z.string().describe('A single, useful, and relatively short cooking tip. It should be a general tip, not related to a specific recipe.'),
});

export type GenerateCookingTipOutput = z.infer<typeof GenerateCookingTipOutputSchema>;

export async function generateCookingTip(
  input: GenerateCookingTipInput
): Promise<GenerateCookingTipOutput> {
  return generateCookingTipFlow(input);
}

const generateCookingTipFlow = ai.defineFlow(
  {
    name: 'generateCookingTipFlow',
    inputSchema: GenerateCookingTipInputSchema,
    outputSchema: GenerateCookingTipOutputSchema,
  },
  async ({ previousTips, context, apiKey, model }) => {
    let prompt = `You are a helpful assistant for a cooking app. Your goal is to provide a single, useful cooking tip for the user.`;

    if (context?.view === 'cooking' && context.recipeName && context.step) {
      prompt += `
The user is currently cooking "${context.recipeName}" and is on the following step: "${context.step}".
Provide a tip relevant to this specific step or recipe if possible. Otherwise, a general cooking tip is fine.`;
    } else {
      prompt += `
The tip should be general purpose and not tied to any specific recipe. It should be concise and easy to understand.`;
    }

    prompt += `

To ensure variety, please do not repeat any of the following previously shown tips:
${previousTips.map(tip => `- ${tip}`).join('\n')}

Please provide one new, unique cooking tip.`;

    const { output } = await ai.generate({
      prompt,
      model: model as ModelId,
      output: { schema: GenerateCookingTipOutputSchema },
      config: apiKey ? { apiKey } : undefined,
    });

    return output!;
  }
);
