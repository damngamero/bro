'use server';

/**
 * @fileOverview Generates a list of recipes related to a given recipe.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateRelatedRecipesInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe to find related recipes for.'),
  apiKey: z.string().optional().describe('Google AI API key.'),
});

export type GenerateRelatedRecipesInput = z.infer<typeof GenerateRelatedRecipesInputSchema>;

const GenerateRelatedRecipesOutputSchema = z.object({
  recipes: z.array(z.string()).describe('A list of 3-4 recipe names related to the input recipe.'),
});

export type GenerateRelatedRecipesOutput = z.infer<typeof GenerateRelatedRecipesOutputSchema>;

export async function generateRelatedRecipes(
  input: GenerateRelatedRecipesInput
): Promise<GenerateRelatedRecipesOutput> {
  return generateRelatedRecipesFlow(input);
}

const generateRelatedRecipesFlow = ai.defineFlow(
  {
    name: 'generateRelatedRecipesFlow',
    inputSchema: GenerateRelatedRecipesInputSchema,
    outputSchema: GenerateRelatedRecipesOutputSchema,
  },
  async ({ recipeName, apiKey }) => {
    const prompt = `You are a recipe expert. A user just finished cooking "${recipeName}". Suggest 3-4 other recipes they might enjoy. The suggestions should be related by cuisine, main ingredients, or cooking style.`;

    const { output } = await ai.generate({
      prompt,
      output: { schema: GenerateRelatedRecipesOutputSchema },
      config: apiKey ? { apiKey } : undefined,
    });
    
    return output!;
  }
);
