'use server';
/**
 * @fileOverview An AI flow to explain culinary terms within the context of a recipe.
 *
 * - explainCulinaryTerm - A function that provides an explanation for a culinary term.
 * - ExplainCulinaryTermInput - The input type for the explainCulinaryTerm function.
 * - ExplainCulinaryTermOutput - The return type for the explainCulinaryTerm function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainCulinaryTermInputSchema = z.object({
  term: z.string().describe('The culinary term or question the user has.'),
  recipeContext: z
    .string()
    .describe('The full context of the recipe the user is asking about.'),
   apiKey: z.string().optional().describe('Google AI API key.'),
});
export type ExplainCulinaryTermInput = z.infer<
  typeof ExplainCulinaryTermInputSchema
>;

const ExplainCulinaryTermOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A clear, concise explanation of the culinary term.'),
});
export type ExplainCulinaryTermOutput = z.infer<
  typeof ExplainCulinaryTermOutputSchema
>;

export async function explainCulinaryTerm(
  input: ExplainCulinaryTermInput
): Promise<ExplainCulinaryTermOutput> {
  return explainCulinaryTermFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainCulinaryTermPrompt',
  input: {schema: ExplainCulinaryTermInputSchema},
  output: {schema: ExplainCulinaryTermOutputSchema},
  prompt: `You are an expert chef and culinary instructor. A user is asking for help understanding a term or concept while looking at a recipe.

Recipe Context:
---
{{recipeContext}}
---

User's Question: "{{term}}"

Please provide a simple, clear, and concise explanation for the user's question based on the provided recipe context. If the question isn't a question, but a term, explain what it means. Be friendly and encouraging.
`,
});

const explainCulinaryTermFlow = ai.defineFlow(
  {
    name: 'explainCulinaryTermFlow',
    inputSchema: ExplainCulinaryTermInputSchema,
    outputSchema: ExplainCulinaryTermOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, {
        config: input.apiKey ? { apiKey: input.apiKey } : undefined,
    });
    return output!;
  }
);
