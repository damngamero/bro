
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { languages } from '@/lib/languages';

// The default strings, used as keys and as fallback content
const ENGLISH_STRINGS: Record<string, string> = {
    findYourNextMeal: "Find Your Next Meal",
    byIngredients: "By Ingredients",
    byRecipeName: "By Recipe Name",
    whatsInPantry: "What's in your pantry?",
    addIngredientsPrompt: "Add the ingredients you have on hand to find recipes.",
    addIngredients: "Add Ingredients",
    remove: "Remove",
    whatToCook: "What to cook?",
    enterRecipeToFind: "Enter a recipe name to find it directly.",
    recipePlaceholder: "e.g., Spaghetti Carbonara",
    halalMode: "Halal Mode",
    allergens: "Allergens",
    maxCookTime: "Max Cook Time (min)",
    e_g_30: "e.g., 30",
    findRecipes: "Find Recipes",
    surpriseMe: "Surprise Me",
    clear: "Clear",
    whippingUpIdeas: "Whipping up some ideas...",
    tryTheseRecipes: "Or, Try One of These Recipes!",
    heresWhatYouCanMake: "Here's What You Can Make",
    showMore: "Show More",
    backToSearch: "Back to Search",
    myCookbook: "My Cookbook",
    cookbookEmpty: "Your Cookbook is Empty",
    saveRecipesPrompt: "Save your favorite recipes here for easy access.",
    cacheWarningCookbook: "Note: Your cookbook is saved in your browser's cache.",
    apiKeyRequired: "API Key Required",
    apiKeyRequiredDescription: "Please add your Google AI API key in the settings to use the app.",
    openSettings: "Open Settings.",
    noIngredients: "No Ingredients",
    addIngredientsFirst: "Please add some ingredients first.",
    noRecipesFound: "No Recipes Found",
    noRecipesFoundDescription: "We couldn't find any recipes with the ingredients and filters provided. Try removing some ingredients or filters.",
    error: "Error",
    failedToGenerateRecipes: "Failed to generate recipes. Please try again.",
    ohNo: "Oh no!",
    couldNotFindSurprise: "Couldn't find a surprise recipe. Please try again.",
    failedToFindSurprise: "Failed to find a surprise recipe. Please try again.",
    noRecipeName: "No Recipe Name",
    enterRecipeName: "Please enter a recipe name to search.",
    returnedHome: "Returned Home",
    canGoBack: "You can go back to where you were.",
    undo: "Undo",
    apiKeyMissing: "API Key Missing",
    addApiKeyInSettings: "Please add your API key in the settings.",
    failedToLoadRecipe: "Failed to load the recipe details.",
    addToCookbook: "Add to Cookbook",
    fetchingDeliciousDetails: "Fetching delicious details...",
    tryAgain: "Try Again",
    prep: "Prep",
    cook: "Cook",
    total: "Total",
    hour: "hour",
    hours: "hours",
    minute: "minute",
    minutes: "minutes",
    makeVariation: "Make a Variation",
    ingredients: "Ingredients",
    instructions: "Instructions",
    startCooking: "Start Cooking!",
    removedFromCookbook: "Removed from Cookbook",
    addedToCookbook: "Added to Cookbook",
    areYouSure: "Are you sure?",
    confirmRemoveCookbook: "This will permanently remove {{recipeName}} from your cookbook.",
    dontAskAgain: "Don't ask me again for 5 days.",
    continue: "Continue",
    step: "Step {{currentStep}} of {{totalSteps}}",
    whatShouldItLookLike: "What should it look like?",
    somethingsWrong: "Something's wrong...",
    startTimer: "Start {{duration}} min Timer",
    stopTimer: "Stop Timer",
    previousStep: "Previous Step",
    nextStep: "Next Step",
    imDone: "I'm Done!",
    descriptionFailed: "Description Failed",
    couldNotGenerateDescription: "Could not generate a description for this step.",
    failedToGetDescription: "Failed to get description.",
    failedToGetAdvice: "Failed to get advice.",
    failedToGetAdviceTitle: "Couldn't Get Advice",
    failedToGetAdviceDescription: "We were unable to get troubleshooting advice at this time.",
    enjoyYourMeal: "Enjoy Your Meal!",
    successfullyCooked: "You've successfully cooked {{recipeName}}!",
    whatsNext: "What's Next?",
    findingMoreRecipes: "Finding more recipes you might like...",
    failedToGetRelatedRecipes: "Failed to get related recipes.",
    or: "OR",
    remakeRecipe: "Remake {{recipeName}}",
    backToHome: "Back to Home",
    appSubtitle: "Your AI-powered recipe assistant",
    footer: "Made By : TheVibeCod3r",
    settings: "Settings",
    proTip: "Pro Tip!",
    addIngredientsTitle: "Add Ingredients",
    addIngredientsDesc: "Select from the list or add your own ingredients.",
    searchOrAdd: "Search or add a new one...",
    addCustom: "Add \"{{searchTerm}}\"",
    selectedIngredients: "Selected Ingredients",
    cancel: "Cancel",
    manageAllergens: "Manage Allergens",
    manageAllergensDescription: "Select common allergens or add your own to filter out recipes.",
    commonAllergens: "Common Allergens",
    peanuts: "Peanuts",
    treenuts: "Tree nuts",
    milk: "Milk",
    egg: "Egg",
    soy: "Soy",
    wheat: "Wheat",
    fish: "Fish",
    shellfish: "Shellfish",
    gluten: "Gluten",
    customAllergen: "Custom Allergen",
    customAllergenPlaceholder: "e.g., Sesame",
    add: "Add",
    yourActiveAllergens: "Your Active Allergens",
    done: "Done",
    manageSettings: "Manage your app settings and API key.",
    apiKey: "API Key",
    showApiKey: "Show API Key",
    hideApiKey: "Hide API Key",
    getApiKeyPrompt: "Get your key from",
    googleAiStudio: "Google AI Studio",
    cacheWarningApiKey: "Your key is saved in your browser's cache.",
    model: "Model",
    theme: "Theme",
    language: "Language",
    searchLanguage: "Search language...",
    noLanguageFound: "No language found.",
    saveChanges: "Save Changes",
    settingsSaved: "Settings Saved",
    settingsSavedDescription: "Your preferences have been updated.",
    apiKeyRemoved: "API Key Removed",
    apiKeyRemovedDescription: "Your API Key has been removed. The app will not function until a new one is added.",
    createVariation: "Create a Variation",
    createVariationDescription: "Modify '{{recipeName}}' by adding or removing ingredients, or noting unavailable equipment.",
    removeIngredients: "Remove Ingredients",
    removeIngredientsDescription: "Select ingredients from the original recipe to exclude.",
    tryDifferentAddons: "Try Different Add-ons",
    addAddonsDescription: "List new ingredients to add, separated by commas.",
    addonsPlaceholder: "e.g., Cayenne Pepper, Lime Juice",
    unavailableEquipment: "Unavailable Equipment",
    unavailableEquipmentDescription: "List any equipment you don't have, separated by commas.",
    unavailableEquipmentPlaceholder: "e.g., Oven, Food Processor",
    generateVariation: "Generate Variation",
    variationNotPossible: "Variation Not Possible",
    couldNotCreateVariation: "The AI chef couldn't create a variation with the requested changes.",
    noChangesRequested: "No Changes Requested",
    noChangesRequestedDescription: "Please select an ingredient to remove or add a new one.",
    failedToGenerateVariation: "Failed to generate variation. Please try again.",
    describeTheProblem: "Describe the problem you're facing. The more detail, the better the advice.",
    currentStep: "Current Step",
    troubleshootPlaceholder: "e.g., 'The sauce is too thin', 'My onions are burning'",
    gettingAdvice: "Getting advice from the chef...",
    chefsAdvice: "Chef's Advice",
    getHelp: "Get Help",
};

interface TranslationContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
  isRtl: boolean;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

type TranslationsCache = Record<string, Record<string, string>>;

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState('en');
  const [isRtl, setIsRtl] = useState(false);
  const [translationsCache, setTranslationsCache] = useState<TranslationsCache>({});
  const pendingTranslations = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang);
  }, []);

  const setLanguage = useCallback((langCode: string) => {
    setLanguageState(langCode);
    localStorage.setItem('language', langCode);
    const langDetails = languages.find(l => l.code === langCode);
    setIsRtl(langDetails?.dir === 'rtl');
  }, []);

  const translateAndCache = useCallback(async (key: string, text: string, lang: string) => {
    // Don't request if already pending
    if (pendingTranslations.current[`${lang}:${key}`]) return;

    try {
      pendingTranslations.current[`${lang}:${key}`] = true;
      const apiKey = localStorage.getItem('googleApiKey');
      const model = localStorage.getItem('geminiModel') || 'googleai/gemini-2.5-pro';

      if (!apiKey) {
        // No API key, can't translate.
        return;
      }
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLanguage: lang,
          apiKey,
          model
        }),
      });

      if (!response.ok) {
        throw new Error('Translation API failed');
      }

      const result = await response.json();
      if (result.translatedText) {
        setTranslationsCache(prev => ({
          ...prev,
          [lang]: {
            ...prev[lang],
            [key]: result.translatedText,
          },
        }));
      }
    } catch (error) {
      console.error(`Failed to translate key "${key}":`, error);
    } finally {
        delete pendingTranslations.current[`${lang}:${key}`];
    }
  }, []);

  const t = useCallback((key: string, options?: Record<string, string | number>): string => {
    const englishText = ENGLISH_STRINGS[key] || key;
    
    // English is the default, no translation needed
    if (language === 'en') {
      let templatedText = englishText;
      if (options) {
        templatedText = templatedText.replace(/\{\{\s*(\w+)\s*\}\}/g, (placeholder, placeholderKey) => {
          return String(options[placeholderKey] || placeholder);
        });
      }
      return templatedText;
    }
    
    const cachedTranslation = translationsCache[language]?.[key];
    
    // If not in cache, trigger translation but return English text for now
    if (!cachedTranslation) {
      translateAndCache(key, englishText, language);
    }

    let textToDisplay = cachedTranslation || englishText;

    // Handle templating for variables like {{name}}
    if (options) {
      textToDisplay = textToDisplay.replace(/\{\{\s*(\w+)\s*\}\}/g, (placeholder, placeholderKey) => {
        return String(options[placeholderKey] || placeholder);
      });
    }
    
    return textToDisplay;

  }, [language, translationsCache, translateAndCache]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    isRtl
  }), [language, setLanguage, t, isRtl]);

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
}

    