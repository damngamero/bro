'use server';

/**
 * @fileOverview Generates one or more random, easy-to-make recipe names.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ModelId } from '@genkit-ai/googleai';

const GenerateRandomRecipesInputSchema = z.object({
  count: z.number().default(1).describe('The number of random recipes to generate.'),
  apiKey: z.string().optional().describe('Google AI API key.'),
  model: z.string().optional().describe('The model to use for generation.'),
});

export type GenerateRandomRecipesInput = z.infer<typeof GenerateRandomRecipesInputSchema>;

const GenerateRandomRecipesOutputSchema = z.object({
  recipes: z.array(z.string()).describe('A list of recipe names.'),
});

export type GenerateRandomRecipesOutput = z.infer<typeof GenerateRandomRecipesOutputSchema>;

export async function generateRandomRecipes(
  input: GenerateRandomRecipesInput
): Promise<GenerateRandomRecipesOutput> {
  return generateRandomRecipesFlow(input);
}

const generateRandomRecipesFlow = ai.defineFlow(
  {
    name: 'generateRandomRecipesFlow',
    inputSchema: GenerateRandomRecipesInputSchema,
    outputSchema: GenerateRandomRecipesOutputSchema,
  },
  async ({ count, apiKey, model }) => {
    const prompt = `You are a helpful assistant. Your goal is to provide ${count} random, popular, and relatively easy-to-make recipe names. Just provide the names, no extra text.`;

    const { output } = await ai.generate({
      prompt,
      model: model as ModelId,
      output: { schema: GenerateRandomRecipesOutputSchema },
      config: apiKey ? { apiKey } : undefined,
    });

    return output!;
  }
);
