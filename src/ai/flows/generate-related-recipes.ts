'use server';

/**
 * @fileOverview Generates a list of recipes related to a given recipe.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {ModelId} from '@genkit-ai/googleai';

const GenerateRelatedRecipesInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe to find related recipes for.'),
  apiKey: z.string().describe('Google AI API key.'),
  model: z.string().describe('The model to use for generation.'),
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
  async ({ recipeName, apiKey, model }) => {
    const prompt = `You are a recipe expert. A user just finished cooking "${recipeName}". Suggest 3-4 other recipes they might enjoy. The suggestions should be related by cuisine, main ingredients, or cooking style.`;

    const { output } = await ai.generate({
      prompt,
      model: model as ModelId,
      output: { schema: GenerateRelatedRecipesOutputSchema },
      config: { apiKey },
    });
    
    return output!;
  }
);
