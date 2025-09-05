'use server';

/**
 * @fileOverview Generates an image for a specific cooking step.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateStepImageInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe.'),
  instruction: z.string().describe('The cooking instruction for the current step.'),
  apiKey: z.string().optional().describe('Google AI API key.'),
});

export type GenerateStepImageInput = z.infer<typeof GenerateStepImageInputSchema>;

const GenerateStepImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});

export type GenerateStepImageOutput = z.infer<typeof GenerateStepImageOutputSchema>;

export async function generateStepImage(
  input: GenerateStepImageInput
): Promise<GenerateStepImageOutput> {
  return generateStepImageFlow(input);
}

const generateStepImageFlow = ai.defineFlow(
  {
    name: 'generateStepImageFlow',
    inputSchema: GenerateStepImageInputSchema,
    outputSchema: GenerateStepImageOutputSchema,
  },
  async ({ recipeName, instruction, apiKey }) => {
    const prompt = `You are a food photographer. Generate a realistic, mouth-watering image of a cooking step.
    
    Recipe: ${recipeName}
    Current Step: "${instruction}"
    
    The image should be well-lit, appetizing, and clearly show the action or result of this specific step. Focus on the food.`;

    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt,
      config: apiKey ? { apiKey } : undefined,
    });
    
    if (!media.url) {
      throw new Error('Image generation failed.');
    }

    return { imageUrl: media.url };
  }
);
