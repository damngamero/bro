'use server';

/**
 * @fileOverview Generates a list of possible recipes based on the ingredients provided by the user.
 *
 * - generateRecipesFromIngredients - A function that takes a list of ingredients and returns a list of possible recipes.
 * - GenerateRecipesFromIngredientsInput - The input type for the generateRecipesFromIngredients function.
 * - GenerateRecipesFromIngredientsOutput - The return type for the generateRecipesFromIngredients function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecipesFromIngredientsInputSchema = z.object({
  ingredients: z
    .array(z.string())
    .describe('A list of ingredients that the user has on hand.'),
});
export type GenerateRecipesFromIngredientsInput = z.infer<
  typeof GenerateRecipesFromIngredientsInputSchema
>;

const GenerateRecipesFromIngredientsOutputSchema = z.object({
  recipes: z
    .array(z.string())
    .describe('A list of possible recipes that can be made with the given ingredients.'),
});
export type GenerateRecipesFromIngredientsOutput = z.infer<
  typeof GenerateRecipesFromIngredientsOutputSchema
>;

export async function generateRecipesFromIngredients(
  input: GenerateRecipesFromIngredientsInput
): Promise<GenerateRecipesFromIngredientsOutput> {
  return generateRecipesFromIngredientsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecipesFromIngredientsPrompt',
  input: {schema: GenerateRecipesFromIngredientsInputSchema},
  output: {schema: GenerateRecipesFromIngredientsOutputSchema},
  prompt: `You are a recipe expert. Given the following list of ingredients, suggest some recipes.

Ingredients:
{{#each ingredients}}- {{this}}\n{{/each}}`,
});

const generateRecipesFromIngredientsFlow = ai.defineFlow(
  {
    name: 'generateRecipesFromIngredientsFlow',
    inputSchema: GenerateRecipesFromIngredientsInputSchema,
    outputSchema: GenerateRecipesFromIngredientsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
