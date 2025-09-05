'use server';

/**
 * @fileOverview A flow for explaining culinary terms in the context of a recipe.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainCulinaryTermInputSchema = z.object({
  term: z.string().describe('The culinary term the user wants an explanation for.'),
  recipeContext: z.object({
    name: z.string(),
    description: z.string(),
    ingredients: z.array(z.string()),
    instructions: z.array(z.string()),
  }).describe('The recipe the user is currently viewing.'),
   apiKey: z.string().optional().describe('Google AI API key.'),
});

export type ExplainCulinaryTermInput = z.infer<typeof ExplainCulinaryTermInputSchema>;

const ExplainCulinaryTermOutputSchema = z.object({
  explanation: z.string().describe('A clear and concise explanation of the culinary term.'),
});

export type ExplainCulinaryTermOutput = z.infer<typeof ExplainCulinaryTermOutputSchema>;

export async function explainCulinaryTerm(
  input: ExplainCulinaryTermInput
): Promise<ExplainCulinaryTermOutput> {
  return explainCulinaryTermFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainCulinaryTermPrompt',
  input: {schema: ExplainCulinaryTermInputSchema},
  output: {schema: ExplainCulinaryTermOutputSchema},
  prompt: `You are a helpful culinary assistant. A user is asking for the meaning of a specific term while looking at a recipe.

Recipe Name: {{recipeContext.name}}
Recipe Description: {{recipeContext.description}}

The user's question is: "What does '{{term}}' mean?"

Explain the term '{{term}}' in a simple and easy-to-understand way, keeping the context of the recipe in mind if relevant.`,
});

const explainCulinaryTermFlow = ai.defineFlow(
  {
    name: 'explainCulinaryTermFlow',
    inputSchema: ExplainCulinaryTermInputSchema,
    outputSchema: ExplainCulinaryTermOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input, {
      config: input.apiKey ? { apiKey: input.apiKey } : undefined,
    });
    return output!;
  }
);
