'use server';

/**
 * @fileOverview Provides troubleshooting advice for a specific cooking step.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TroubleshootStepInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe.'),
  instruction: z.string().describe('The cooking instruction where the user is having trouble.'),
  problem: z.string().describe("The user's description of what's going wrong."),
  apiKey: z.string().optional().describe('Google AI API key.'),
});

export type TroubleshootStepInput = z.infer<typeof TroubleshootStepInputSchema>;

const TroubleshootStepOutputSchema = z.object({
  advice: z.string().describe('Helpful advice to fix the user\'s problem.'),
});

export type TroubleshootStepOutput = z.infer<typeof TroubleshootStepOutputSchema>;

export async function troubleshootStep(
  input: TroubleshootStepInput
): Promise<TroubleshootStepOutput> {
  return troubleshootStepFlow(input);
}

const troubleshootStepFlow = ai.defineFlow(
  {
    name: 'troubleshootStepFlow',
    inputSchema: TroubleshootStepInputSchema,
    outputSchema: TroubleshootStepOutputSchema,
  },
  async ({ recipeName, instruction, problem, apiKey }) => {
    const prompt = `You are an expert chef and cooking instructor. A user is having trouble making a recipe and needs help.

Recipe: ${recipeName}
The step they are on: "${instruction}"
Their problem: "${problem}"

Provide clear, concise, and encouraging advice to help them fix the problem and continue cooking. Be specific and give actionable steps. If the problem is unrecoverable, gently explain why and suggest what to do differently next time.`;

    const {output} = await ai.generate({
      prompt,
      output: { schema: TroubleshootStepOutputSchema },
      config: apiKey ? { apiKey } : undefined,
    });
    
    return output!;
  }
);
