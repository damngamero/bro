'use server';

/**
 * @fileOverview Generates a description for a specific cooking step.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {ModelId} from '@genkit-ai/googleai';

const GenerateStepDescriptionInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe.'),
  instruction: z.string().describe('The cooking instruction for the current step.'),
  apiKey: z.string().optional().describe('Google AI API key.'),
  model: z.string().optional().describe('The model to use for generation.'),
});

export type GenerateStepDescriptionInput = z.infer<typeof GenerateStepDescriptionInputSchema>;

const GenerateStepDescriptionOutputSchema = z.object({
  description: z.string().describe('A two-sentence description of what the result of the cooking step should look like.'),
});

export type GenerateStepDescriptionOutput = z.infer<typeof GenerateStepDescriptionOutputSchema>;

export async function generateStepDescription(
  input: GenerateStepDescriptionInput
): Promise<GenerateStepDescriptionOutput> {
  return generateStepDescriptionFlow(input);
}

const generateStepDescriptionFlow = ai.defineFlow(
  {
    name: 'generateStepDescriptionFlow',
    inputSchema: GenerateStepDescriptionInputSchema,
    outputSchema: GenerateStepDescriptionOutputSchema,
  },
  async ({ recipeName, instruction, apiKey, model }) => {
    const prompt = `You are a food stylist. A user is cooking a recipe and wants to know what the current step should look like.

Recipe: ${recipeName}
Current Step: "${instruction}"

Provide a concise, two-sentence description of what the food should look like at this stage. Focus on the expected color, texture, and consistency. Be vivid and encouraging.`;

    const { output } = await ai.generate({
      prompt,
      model: model as ModelId,
      output: { schema: GenerateStepDescriptionOutputSchema },
      config: apiKey ? { apiKey } : undefined,
    });

    return output!;
  }
);
