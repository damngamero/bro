import { config } from 'dotenv';
config();

import '@/ai/flows/generate-recipes-from-ingredients.ts';
import '@/ai/flows/generate-recipe-details.ts';
import '@/ai/flows/generate-step-image.ts';
import '@/ai/flows/troubleshoot-step.ts';
