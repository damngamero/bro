'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecipeDetailsInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe to get details for.'),
});
export type RecipeDetailsInput = z.infer<typeof RecipeDetailsInputSchema>;

const RecipeDetailsOutputSchema = z.object({
  description: z.string().describe('A brief, mouth-watering description of the recipe.'),
  ingredients: z.array(z.string()).describe('List of all necessary ingredients for the recipe.'),
  instructions: z.array(z.string()).describe('Step-by-step cooking instructions.'),
  prepTime: z.string().describe('Preparation time, e.g., "15 minutes".'),
  cookTime: z.string().describe('Cooking time, e.g., "30 minutes".'),
});
export type RecipeDetailsOutput = z.infer<typeof RecipeDetailsOutputSchema>;

export async function generateRecipeDetails(
  input: RecipeDetailsInput
): Promise<RecipeDetailsOutput> {
  return generateRecipeDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecipeDetailsPrompt',
  input: {schema: RecipeDetailsInputSchema},
  output: {schema: RecipeDetailsOutputSchema},
  prompt: `You are a world-class chef. A user wants to cook "{{recipeName}}". 
  
  Provide a detailed recipe including:
  1. A short, mouth-watering description of the dish.
  2. A list of all necessary ingredients.
  3. Step-by-step cooking instructions.
  4. The preparation time.
  5. The cooking time.
  
  Please format the output as a JSON object that matches the provided schema.`,
});

const generateRecipeDetailsFlow = ai.defineFlow(
  {
    name: 'generateRecipeDetailsFlow',
    inputSchema: RecipeDetailsInputSchema,
    outputSchema: RecipeDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
