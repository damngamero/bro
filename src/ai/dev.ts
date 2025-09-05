import { config } from 'dotenv';
config();

import '@/ai/flows/generate-recipes-from-ingredients.ts';
import '@/ai/flows/generate-recipe-details.ts';
import '@/ai/flows/generate-step-description.ts';
import '@/ai/flows/troubleshoot-step.ts';
import '@/ai/flows/generate-related-recipes.ts';
import '@/ai/flows/identify-timed-steps.ts';
