

'use client';

import { useState, useCallback, FormEvent, useRef, useEffect } from 'react';
import { generateRecipesFromIngredients } from '@/ai/flows/generate-recipes-from-ingredients';
import {
  generateRecipeDetails,
  type RecipeDetailsOutput,
} from '@/ai/flows/generate-recipe-details';
import { generateStepDescription } from '@/ai/flows/generate-step-description';
import { troubleshootStep } from '@/ai/flows/troubleshoot-step';
import { generateRelatedRecipes } from '@/ai/flows/generate-related-recipes';
import { identifyTimedSteps, type IdentifyTimedStepsOutput } from '@/ai/flows/identify-timed-steps';
import { generateCookingTip } from '@/ai/flows/generate-cooking-tip';
import { generateRandomRecipes } from '@/ai/flows/generate-random-recipes';
import { suggestRecipes } from '@/ai/flows/suggest-recipes';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ChefHat,
  Sparkles,
  LoaderCircle,
  Plus,
  X,
  ArrowLeft,
  Clock,
  BookOpen,
  Heart,
  Settings,
  BookHeart,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  PartyPopper,
  Repeat,
  Home,
  Timer,
  BellOff,
  Lightbulb,
  Wand2,
  Dices,
  Trash2,
  Salad
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { SettingsDialog } from '@/components/settings-dialog';
import { AllergensDialog } from '@/components/allergens-dialog';
import { IngredientsDialog } from '@/components/ingredients-dialog';
import { VariationDialog } from '@/components/variation-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { SuggestionsList } from '@/components/suggestions-list';
import { Checkbox } from '@/components/ui/checkbox';

type ModelId = 'googleai/gemini-2.5-flash' | 'googleai/gemini-2.5-pro';

type StepDescription = {
  isLoading: boolean;
  data: string | null;
  error: string | null;
}

type RecipeDetailsState = {
  isLoading: boolean;
  data: RecipeDetailsOutput | null;
  error: string | null;
  timedSteps: IdentifyTimedStepsOutput['timedSteps'];
};

type CookbookRecipe = {
  name: string;
  details: RecipeDetailsOutput;
};

type View = 'search' | 'details' | 'cooking' | 'enjoy';

const MAX_TIPS = 25;
const MAX_TIPS_IN_30_MIN = 8;
const TIP_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const CONFIRM_DELETE_COOL_DOWN_MS = 5 * 24 * 60 * 60 * 1000; // 5 days


export default function RecipeSavvyPage() {
  const [viewHistory, setViewHistory] = useState<View[]>(['search']);
  const currentView = viewHistory[viewHistory.length - 1];

  const changeView = (newView: View) => {
    setViewHistory(prev => [...prev, newView]);
  };

  const handleGoBack = () => {
    if (viewHistory.length > 1) {
      if (currentView === 'cooking') {
        // Just go back to the details view, don't reset anything else
        setViewHistory(prev => prev.slice(0, -1));
        return;
      }

      if (currentView === 'details') {
          // This is like handleBackToSearch but using history
          const previousView = viewHistory[viewHistory.length - 2];
          if(previousView === 'search') {
            handleBackToSearch(true);
          } else {
            setViewHistory(prev => prev.slice(0, -1));
          }
          return;
      }
      
      setViewHistory(prev => prev.slice(0, -1));
    }
  };
  
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isIngredientsDialogOpen, setIsIngredientsDialogOpen] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [isHalal, setIsHalal] = useState(false);
  const [useAllergens, setUseAllergens] = useState(false);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [maxCookTime, setMaxCookTime] = useState<string>('');

  const [generatedRecipes, setGeneratedRecipes] = useState<string[]>([]);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [showAllRecipes, setShowAllRecipes] = useState(false);
  
  const [suggestedRecipes, setSuggestedRecipes] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(true);

  const [recipeNameSuggestions, setRecipeNameSuggestions] = useState<string[]>([]);
  const [isSuggestingRecipeNames, setIsSuggestingRecipeNames] = useState(false);
  const debouncedRecipeName = useDebounce(recipeName, 300);


  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [recipeDetails, setRecipeDetails] = useState<RecipeDetailsState>({
    isLoading: false,
    data: null,
    error: null,
    timedSteps: [],
  });

  const [cookbook, setCookbook] = useState<CookbookRecipe[]>([]);
  const [showCookbook, setShowCookbook] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAllergensOpen, setIsAllergensOpen] = useState(false);
  const [isVariationOpen, setIsVariationOpen] = useState(false);

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const [model, setModel] = useState<ModelId>('googleai/gemini-2.5-pro');

  const [currentStep, setCurrentStep] = useState(0);
  const [stepDescriptionsCache, setStepDescriptionsCache] = useState<Record<number, StepDescription>>({});
  const currentStepDescription = stepDescriptionsCache[currentStep];

  const [isTroubleshootDialogOpen, setIsTroubleshootDialogOpen] = useState(false);
  const [troubleshootQuery, setTroubleshootQuery] = useState('');
  const [troubleshootingAdvice, setTroubleshootingAdvice] = useState<{
    isLoading: boolean;
    data: string | null;
    error: string | null;
  }>({ isLoading: false, data: null, error: null });

  const [relatedRecipes, setRelatedRecipes] = useState<{
    isLoading: boolean;
    data: string[] | null;
    error: string | null;
  }>({ isLoading: false, data: null, error: null });

  const [timer, setTimer] = useState<{
    isActive: boolean;
    remaining: number;
    duration: number;
  }>({ isActive: false, remaining: 0, duration: 0 });
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const alarmRef = useRef<HTMLAudioElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [shownTips, setShownTips] = useState<string[]>([]);
  const [tipCountLast30Min, setTipCountLast30Min] = useState(0);
  const tipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [dontAskAgain, setDontAskAgain] = useState(false);


  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const scheduleNextTip = useCallback(() => {
    if (tipTimeoutRef.current) {
        clearTimeout(tipTimeoutRef.current);
    }
    if (!apiKey || shownTips.length >= MAX_TIPS || tipCountLast30Min >= MAX_TIPS_IN_30_MIN) {
        return;
    }
    
    tipTimeoutRef.current = setTimeout(async () => {
        try {
            const context: any = { view: currentView };
            if (currentView === 'cooking' && selectedRecipe && recipeDetails.data) {
                context.recipeName = selectedRecipe;
                context.step = recipeDetails.data.instructions[currentStep];
            } else if (currentView === 'details' && selectedRecipe) {
                context.recipeName = selectedRecipe;
            }

            const { tip } = await generateCookingTip({ 
                previousTips: shownTips, 
                context,
                apiKey: apiKey!, 
                model 
            });
            setShownTips(prev => [...prev, tip]);
            setTipCountLast30Min(prev => prev + 1);

            toast({
                title: (
                    <div className="flex items-center gap-2">
                        <Lightbulb className="text-yellow-400" />
                        Pro Tip
                    </div>
                ),
                description: tip,
                duration: 10000,
            });
        } catch (error) {
            console.error("Failed to fetch cooking tip:", error);
        } finally {
            scheduleNextTip();
        }
    }, TIP_INTERVAL_MS);

  }, [apiKey, model, shownTips, tipCountLast30Min, toast, currentView, selectedRecipe, recipeDetails.data, currentStep]);

  useEffect(() => {
    // Reset the 30-minute tip counter every 30 minutes
    const interval = setInterval(() => {
        setTipCountLast30Min(0);
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('googleApiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsApiKeyMissing(false);
    } else {
      setIsApiKeyMissing(true);
    }

    const storedModel = localStorage.getItem('geminiModel') as ModelId;
    if (storedModel) {
      setModel(storedModel);
    }

    const storedCookbook = localStorage.getItem('cookbookRecipes');
    if (storedCookbook) {
      setCookbook(JSON.parse(storedCookbook));
    }
    
    const storedTips = localStorage.getItem('shownTips');
    if (storedTips) {
        setShownTips(JSON.parse(storedTips));
    }

    const storedAllergens = localStorage.getItem('userAllergens');
    if (storedAllergens) {
      setAllergens(JSON.parse(storedAllergens));
    }
    const storedUseAllergens = localStorage.getItem('useAllergens');
    if(storedUseAllergens) {
      setUseAllergens(JSON.parse(storedUseAllergens));
    }
  }, []);
  
  useEffect(() => {
    if (apiKey) {
      fetchSuggestions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);
  
  useEffect(() => {
    localStorage.setItem('shownTips', JSON.stringify(shownTips));
  }, [shownTips]);
  
  useEffect(() => {
    localStorage.setItem('userAllergens', JSON.stringify(allergens));
  }, [allergens]);
  
  useEffect(() => {
    localStorage.setItem('useAllergens', JSON.stringify(useAllergens));
  }, [useAllergens]);

  useEffect(() => {
    scheduleNextTip();
    return () => {
        if (tipTimeoutRef.current) {
            clearTimeout(tipTimeoutRef.current);
        }
    }
  }, [scheduleNextTip]);

  const fetchSuggestions = async () => {
    if (!apiKey) return;
    setIsGeneratingSuggestions(true);
    try {
      const { recipes } = await generateRandomRecipes({
        count: 2,
        apiKey: apiKey,
        model,
      });
      setSuggestedRecipes(recipes);
    } catch (error) {
      console.error("Failed to fetch suggested recipes:", error);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

   useEffect(() => {
    if (debouncedRecipeName.length > 2 && ensureApiKey(false)) {
      setIsSuggestingRecipeNames(true);
      suggestRecipes({
        query: debouncedRecipeName,
        apiKey: apiKey!,
        model,
      }).then(result => {
        setRecipeNameSuggestions(result.suggestions);
        setIsSuggestingRecipeNames(false);
      }).catch(err => {
        console.error("Failed to fetch recipe name suggestions:", err);
        setIsSuggestingRecipeNames(false);
      });
    } else {
      setRecipeNameSuggestions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedRecipeName, apiKey, model]);
  
  const handleApiKeyChange = (newApiKey: string | null) => {
    setApiKey(newApiKey);
    if (newApiKey) {
        setIsApiKeyMissing(false);
        if (suggestedRecipes.length === 0) {
          fetchSuggestions();
        }
    } else {
        setIsApiKeyMissing(true);
    }
  };

  const handleAddModel = (newModel: ModelId) => {
    setModel(newModel);
    localStorage.setItem('geminiModel', newModel);
  }

  const handleAddIngredient = (ingredient: string) => {
    if (ingredient.trim() && !ingredients.includes(ingredient.trim())) {
      setIngredients([...ingredients, ingredient.trim()]);
    }
  };

  const handleRemoveIngredient = (ingredientToRemove: string) => {
    setIngredients(ingredients.filter(i => i !== ingredientToRemove));
  };

  const ensureApiKey = useCallback((showAlert = true) => {
    if (!apiKey) {
      if (showAlert) {
        toast({
          variant: 'destructive',
          title: 'API Key Missing',
          description: 'Please add your Google AI API key in the settings.',
        });
      }
      setIsSettingsOpen(true);
      return false;
    }
    return true;
  }, [apiKey, toast]);


  const handleSelectRecipe = useCallback(
    async (recipeName: string, options?: { newDetails?: RecipeDetailsOutput }) => {
      setSelectedRecipe(recipeName);
      setCurrentStep(0);
      setStepDescriptionsCache({});
      changeView('details');
      setShowCookbook(false); 
      setRecipeName(''); // Clear recipe name search and suggestions
      setRecipeNameSuggestions([]);

      if (options?.newDetails) {
        const timedStepsResult = await identifyTimedSteps({
          instructions: options.newDetails.instructions,
          apiKey: apiKey!,
          model,
        });
        setRecipeDetails({ isLoading: false, data: options.newDetails, error: null, timedSteps: timedStepsResult.timedSteps });
        return;
      }
      
      const cookbookRecipe = cookbook.find(f => f.name === recipeName);
      if (cookbookRecipe) {
        const timedStepsResult = await identifyTimedSteps({
            instructions: cookbookRecipe.details.instructions,
            apiKey: apiKey!,
            model,
        });
        setRecipeDetails({ isLoading: false, data: cookbookRecipe.details, error: null, timedSteps: timedStepsResult.timedSteps });
        return;
      }
      
      if (!ensureApiKey()) {
        setRecipeDetails({ isLoading: false, data: null, error: 'API Key is missing.', timedSteps: [] });
        return;
      }

      try {
        setRecipeDetails({ isLoading: true, data: null, error: null, timedSteps: [] });
        const details = await generateRecipeDetails({
          recipeName,
          halalMode: isHalal,
          allergens: useAllergens ? allergens : undefined,
          apiKey: apiKey!,
          model,
        });

        const timedStepsResult = await identifyTimedSteps({
            instructions: details.instructions,
            apiKey: apiKey!,
            model,
        });
        
        setRecipeDetails({ isLoading: false, data: details, error: null, timedSteps: timedStepsResult.timedSteps });
      } catch (error) {
        console.error(error);
        setRecipeDetails({
          isLoading: false,
          data: null,
          error: 'Failed to load recipe details.',
          timedSteps: [],
        });
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load recipe details. Please try again.',
        });
      }
    },
    [apiKey, isHalal, useAllergens, allergens, toast, cookbook, ensureApiKey, model]
  );
  
  const handleGetRecipeFromName = useCallback(async () => {
    if (!ensureApiKey()) return;
    if (!recipeName.trim()) {
      toast({
        variant: 'destructive',
        title: 'No Recipe Name',
        description: 'Please enter the name of a recipe.',
      });
      return;
    }
    handleSelectRecipe(recipeName);
  }, [recipeName, ensureApiKey, toast, handleSelectRecipe]);


  const handleGenerateRecipes = useCallback(async () => {
    if (!ensureApiKey()) return;
    if (ingredients.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Ingredients',
        description: 'Please add some ingredients first.',
      });
      return;
    }
    setIsGeneratingRecipes(true);
    setShowCookbook(false);
    setGeneratedRecipes([]);
    setSelectedRecipe(null);
    setShowAllRecipes(false);
    setRecipeDetails({ isLoading: false, data: null, error: null, timedSteps: [] });

    try {
      const time = parseInt(maxCookTime, 10);
      const result = await generateRecipesFromIngredients({
        ingredients,
        halalMode: isHalal,
        allergens: useAllergens ? allergens : undefined,
        maxCookTime: isNaN(time) ? undefined : time,
        apiKey: apiKey!,
        model,
      });
      if (result.recipes.length === 0) {
        toast({
          title: 'No Recipes Found',
          description:
            "We couldn't find any recipes with your ingredients. Try adding more!",
        });
      }
      setGeneratedRecipes(result.recipes);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate recipes. Please try again.',
      });
    } finally {
      setIsGeneratingRecipes(false);
    }
  }, [ingredients, isHalal, useAllergens, allergens, maxCookTime, apiKey, toast, ensureApiKey, model]);

  const handleSurpriseMe = useCallback(async () => {
    if (!ensureApiKey()) return;
    
    setIsGeneratingRecipes(true); // Use the same loading state for a consistent feel
    try {
      const { recipes } = await generateRandomRecipes({ count: 1, apiKey: apiKey!, model });
      if (recipes && recipes.length > 0) {
        await handleSelectRecipe(recipes[0]);
      } else {
        toast({
          variant: 'destructive',
          title: 'Oh no!',
          description: "Couldn't come up with a surprise. Please try again.",
        });
      }
    } catch (error) {
      console.error("Surprise me failed:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to find a surprise recipe. Please try again.',
      });
    } finally {
      setIsGeneratingRecipes(false);
    }
  }, [apiKey, ensureApiKey, handleSelectRecipe, model, toast]);

  useEffect(() => {
    if (generatedRecipes.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [generatedRecipes]);

  useEffect(() => {
    if (currentView !== 'search' && topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentView]);
  
  const handleBackToSearch = (fromGoBack = false) => {
    if (!fromGoBack) {
      setViewHistory(['search']);
    } else {
      setViewHistory(prev => prev.slice(0, -1));
    }
    setSelectedRecipe(null);
    setRecipeDetails({ isLoading: false, data: null, error: null, timedSteps: [] });
    setShowCookbook(false);
    if (generatedRecipes.length > 0) {
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStartOver = () => {
    setViewHistory(['search']);
    setIngredients([]);
    setRecipeName('');
    setRecipeNameSuggestions([]);
    setGeneratedRecipes([]);
    setSelectedRecipe(null);
    setShowCookbook(false);
    setRecipeDetails({ isLoading: false, data: null, error: null, timedSteps: [] });
    setCurrentStep(0);
    setStepDescriptionsCache({});
    setRelatedRecipes({ isLoading: false, data: null, error: null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleCookbookRecipe = (recipeName: string, recipeDetails?: RecipeDetailsOutput) => {
    const isInCookbook = cookbook.some(f => f.name === recipeName);
    
    if (isInCookbook) {
      const updatedCookbook = cookbook.filter(f => f.name !== recipeName)
      setCookbook(updatedCookbook);
      localStorage.setItem('cookbookRecipes', JSON.stringify(updatedCookbook));
      toast({
        title: 'Removed from My Cookbook',
        description: recipeName,
      });
    } else if (recipeDetails) {
      const updatedCookbook = [...cookbook, { name: recipeName, details: recipeDetails }];
      setCookbook(updatedCookbook);
      localStorage.setItem('cookbookRecipes', JSON.stringify(updatedCookbook));
       toast({
        title: 'Added to My Cookbook',
        description: recipeName,
      });
    }
  };

  const handleAttemptRemoveFromCookbook = (recipeName: string) => {
    const confirmSettings = JSON.parse(localStorage.getItem('confirmDeleteCookbook') || '{}');
    if (confirmSettings.dontAskAgain && (Date.now() - confirmSettings.timestamp < CONFIRM_DELETE_COOL_DOWN_MS)) {
        toggleCookbookRecipe(recipeName);
    } else {
        setRecipeToDelete(recipeName);
        setIsConfirmDeleteDialogOpen(true);
    }
  };

  const handleConfirmRemove = () => {
    if (recipeToDelete) {
        if (dontAskAgain) {
            localStorage.setItem('confirmDeleteCookbook', JSON.stringify({ dontAskAgain: true, timestamp: Date.now() }));
        }
        toggleCookbookRecipe(recipeToDelete);
    }
    setIsConfirmDeleteDialogOpen(false);
    setRecipeToDelete(null);
    setDontAskAgain(false);
  };


  const isInCookbook = (recipeName: string) => cookbook.some(f => f.name === recipeName);

  const handleGenerateStepDescription = async () => {
    if (!ensureApiKey() || !recipeDetails.data) return;

    if (stepDescriptionsCache[currentStep]) return;

    setStepDescriptionsCache(prev => ({
      ...prev,
      [currentStep]: { isLoading: true, data: null, error: null }
    }));

    try {
      const result = await generateStepDescription({
        recipeName: selectedRecipe!,
        instruction: recipeDetails.data.instructions[currentStep],
        apiKey: apiKey!,
        model,
      });
      setStepDescriptionsCache(prev => ({
        ...prev,
        [currentStep]: { isLoading: false, data: result.description, error: null }
      }));
    } catch (error) {
      console.error(error);
      setStepDescriptionsCache(prev => ({
        ...prev,
        [currentStep]: { isLoading: false, data: null, error: 'Failed to get description.' }
      }));
      toast({
        variant: 'destructive',
        title: 'Description Failed',
        description: 'Could not generate the description. Please try again.',
      });
    }
  };

  const handleTroubleshoot = async () => {
    if (!ensureApiKey() || !recipeDetails.data || !troubleshootQuery) return;
    setTroubleshootingAdvice({ isLoading: true, data: null, error: null });
    try {
      const result = await troubleshootStep({
        recipeName: selectedRecipe!,
        instruction: recipeDetails.data.instructions[currentStep],
        problem: troubleshootQuery,
        apiKey: apiKey!,
        model,
      });
      setTroubleshootingAdvice({ isLoading: false, data: result.advice, error: null });
    } catch (error) {
      console.error(error);
      setTroubleshootingAdvice({ isLoading: false, data: null, error: 'Failed to get advice.' });
      toast({
        variant: 'destructive',
        title: 'Failed to get advice',
        description: 'Could not get troubleshooting advice. Please try again.',
      });
    }
  };
  
  const handleDoneCooking = async () => {
    changeView('enjoy');
    if (!ensureApiKey() || !selectedRecipe) return;
    setRelatedRecipes({ isLoading: true, data: null, error: null });
    try {
      const result = await generateRelatedRecipes({ recipeName: selectedRecipe, apiKey: apiKey!, model });
      setRelatedRecipes({ isLoading: false, data: result.recipes, error: null });
    } catch(error) {
      console.error(error);
      setRelatedRecipes({ isLoading: false, data: null, error: 'Failed to get related recipes.' });
    }
  };

  const handleRemake = () => {
    changeView('details');
    setCurrentStep(0);
    setStepDescriptionsCache({});
  }

  useEffect(() => {
    if (timer.isActive && timer.remaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimer(t => ({ ...t, remaining: t.remaining - 1 }));
      }, 1000);
    } else if (timer.isActive && timer.remaining === 0) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsAlarmPlaying(true);
      alarmRef.current?.play();
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timer.isActive, timer.remaining]);

  const startTimer = (durationInMinutes: number) => {
    setTimer({
      isActive: true,
      duration: durationInMinutes * 60,
      remaining: durationInMinutes * 60,
    });
  };

  const stopAlarm = () => {
    setIsAlarmPlaying(false);
    alarmRef.current?.pause();
    if(alarmRef.current) alarmRef.current.currentTime = 0;
    setTimer({ isActive: false, remaining: 0, duration: 0 });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const parseTime = (timeString: string): number => {
      let totalMinutes = 0;
      const hoursMatch = timeString.match(/(\d+)\s*hour/);
      const minutesMatch = timeString.match(/(\d+)\s*minute/);

      if (hoursMatch) totalMinutes += parseInt(hoursMatch[1], 10) * 60;
      if (minutesMatch) totalMinutes += parseInt(minutesMatch[1], 10);
      
      return totalMinutes;
  };

  const formatTotalTime = (totalMinutes: number): string => {
      if (totalMinutes === 0) return "";
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      let result = "";
      if (hours > 0) result += `${hours} hour${hours > 1 ? 's' : ''} `;
      if (minutes > 0) result += `${minutes} minute${minutes > 1 ? 's' : ''}`;
      return result.trim();
  };

  const totalCookTime = recipeDetails.data
    ? parseTime(recipeDetails.data.prepTime) + parseTime(recipeDetails.data.cookTime)
    : 0;

  const currentStepTimedInfo = recipeDetails.timedSteps.find(ts => ts.step === currentStep + 1);

  const renderContent = () => {
    if (showCookbook) {
      return (
        <motion.div
          key="cookbook-view"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Button onClick={() => setShowCookbook(false)} variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Search
          </Button>
          <h2 className="text-3xl font-headline text-center mb-6">
              My Cookbook
          </h2>

          {cookbook.length === 0 ? (
            <Card className="text-center p-8 border-dashed">
                <CardHeader>
                    <div className="flex justify-center mb-4 text-muted-foreground">
                        <BookHeart size={48} />
                    </div>
                    <CardTitle>Your Cookbook is Empty</CardTitle>
                    <CardDescription>
                        Save recipes you love to find them here later.
                        <br/>
                        <span className="text-xs italic">If you clear your browser cache, you lose your cookbook , so right em down</span>
                    </CardDescription>
                </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cookbook.map(recipe => (
                <motion.div
                  key={recipe.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5 }}
                  className="h-full"
                >
                  <Card
                    className="cursor-pointer h-full flex flex-col group shadow-md hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="flex-grow p-6 text-center flex items-center justify-center" onClick={() => handleSelectRecipe(recipe.name)}>
                        <CardTitle className="font-headline text-xl">
                            {recipe.name}
                        </CardTitle>
                    </div>
                    <CardFooter className="p-2 border-t justify-end">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAttemptRemoveFromCookbook(recipe.name);
                            }}
                        >
                            <Trash2 size={18} />
                            <span className="sr-only">Remove {recipe.name}</span>
                        </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      );
    }
    
    switch (currentView) {
      case 'search':
        const recipesToShow = showAllRecipes
          ? generatedRecipes
          : generatedRecipes.slice(0, 4);
        return (
          <motion.div
            key="search-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isApiKeyMissing && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>API Key Required</AlertTitle>
                    <AlertDescription>
                        Please set your Google AI API key in the settings to use the app.
                        <Button
                            variant="link"
                            className="p-0 h-auto ml-2 text-black dark:text-white font-bold"
                            onClick={() => setIsSettingsOpen(true)}
                        >
                            Open Settings
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
            <Card className="shadow-lg overflow-hidden">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">
                  Find your next meal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  defaultValue="ingredients"
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ingredients">By Ingredients</TabsTrigger>
                    <TabsTrigger value="recipe">By Recipe Name</TabsTrigger>
                  </TabsList>
                  <TabsContent value="ingredients">
                    <Card className="border-0 shadow-none">
                      <CardHeader className="px-1 pt-4">
                        <CardTitle className="text-xl">What's in your pantry?</CardTitle>
                        <CardDescription>
                          Add your ingredients and we'll find recipes for you.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-1">
                        <Button
                            variant="outline"
                            onClick={() => isApiKeyMissing ? ensureApiKey(false) : setIsIngredientsDialogOpen(true)}
                            className="w-full justify-start h-auto py-3 text-muted-foreground font-normal mb-4"
                        >
                            <Plus className="mr-2" />
                            <span>Add ingredients...</span>
                        </Button>
                        <div className="flex flex-wrap gap-2">
                          {ingredients.map(ingredient => (
                            <Badge
                              key={ingredient}
                              variant="secondary"
                              className="py-1 px-3 text-sm"
                            >
                              {ingredient}
                              <button
                                onClick={() => handleRemoveIngredient(ingredient)}
                                className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5"
                                aria-label={`Remove ${ingredient}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="recipe">
                    <Card className="border-0 shadow-none">
                      <CardHeader className="px-1 pt-4">
                        <CardTitle className="text-xl">
                          What do you want to cook?
                        </CardTitle>
                        <CardDescription>
                          Enter the name of the recipe you'd like to find.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-1 relative">
                        <form
                          onSubmit={e => {
                            e.preventDefault();
                            handleGetRecipeFromName();
                          }}
                          className="flex gap-2"
                        >
                          <Input
                            type="text"
                            value={recipeName}
                            onChange={e => setRecipeName(e.target.value)}
                            onClick={() => isApiKeyMissing && ensureApiKey(false)}
                            placeholder="e.g., Chicken Alfredo"
                            className="flex-grow"
                            disabled={isApiKeyMissing}
                            autoComplete="off"
                          />
                        </form>
                         <AnimatePresence>
                         {recipeName.length > 2 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 z-10 mt-2"
                            >
                                <SuggestionsList
                                    suggestions={recipeNameSuggestions}
                                    isLoading={isSuggestingRecipeNames}
                                    onSelect={(suggestion) => {
                                        handleSelectRecipe(suggestion);
                                    }}
                                />
                            </motion.div>
                         )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
                <div className="flex flex-wrap items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="halal-mode" checked={isHalal} onCheckedChange={setIsHalal} disabled={isApiKeyMissing}/>
                    <Label htmlFor="halal-mode">Halal Mode</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="allergens-mode" checked={useAllergens} onCheckedChange={setUseAllergens} disabled={isApiKeyMissing}/>
                    <Button variant="link" className="p-0 h-auto" onClick={() => setIsAllergensOpen(true)}>
                      Allergens
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="max-cook-time">Max Cook Time (min)</Label>
                    <Input
                      id="max-cook-time"
                      type="number"
                      min="0"
                      value={maxCookTime}
                      onChange={e => {
                          const value = e.target.value;
                          if (parseInt(value, 10) < 0) return;
                          setMaxCookTime(value)
                      }}
                      className="w-24"
                      placeholder="e.g., 30"
                      disabled={isApiKeyMissing}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col sm:flex-row gap-2">
                 <Button
                    onClick={handleGenerateRecipes}
                    disabled={isGeneratingRecipes || ingredients.length === 0 || isApiKeyMissing}
                    className="w-full sm:w-auto flex-grow bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {isGeneratingRecipes ? (
                      <LoaderCircle className="animate-spin mr-2" />
                    ) : (
                      <Sparkles className="mr-2" />
                    )}
                    Find Recipes
                  </Button>

                  <Button
                    onClick={handleSurpriseMe}
                    variant="outline"
                    disabled={isGeneratingRecipes || isApiKeyMissing}
                    className="w-full sm:w-auto"
                  >
                     <Dices className="mr-2" />
                    Surprise Me
                  </Button>
                
                {(ingredients.length > 0 || recipeName) && (
                  <Button
                    onClick={() => {
                        setIngredients([]);
                        setRecipeName('');
                    }}
                    variant="ghost"
                    className="w-full sm:w-auto"
                  >
                    Clear
                  </Button>
                )}
              </CardFooter>
            </Card>

            <div ref={resultsRef} className="mt-8">
              <AnimatePresence>
                {isGeneratingRecipes && (
                  <motion.div
                    key="loading-recipes"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col items-center text-center gap-4 py-16"
                  >
                    <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                    <p className="font-headline text-xl text-primary-foreground">
                      Whipping up some ideas...
                    </p>
                  </motion.div>
                )}
                
                {!isGeneratingRecipes && generatedRecipes.length === 0 && (
                  <motion.div>
                     <h2 className="text-3xl font-headline text-center mb-6">
                      Try these recipes
                    </h2>
                    {isGeneratingSuggestions && (
                      <div className="flex justify-center">
                        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {suggestedRecipes.map(
                        (recipe, index) => (
                          <motion.div
                            key={`${recipe}-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            whileHover={{ scale: 1.03, y: -5 }}
                            onClick={() => handleSelectRecipe(recipe)}
                          >
                            <Card
                              className="cursor-pointer h-full flex flex-col justify-center items-center text-center p-6 shadow-md hover:shadow-xl transition-shadow duration-300"
                            >
                              <CardTitle className="font-headline text-xl">
                                {recipe}
                              </CardTitle>
                            </Card>
                          </motion.div>
                        )
                      )}
                    </div>
                  </motion.div>
                )}

                {generatedRecipes.length > 0 && !isGeneratingRecipes && (
                  <motion.div
                    key="recipe-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-3xl font-headline text-center mb-6">
                      {"Here's what you can make"}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recipesToShow.map(
                        (recipe, index) => (
                          <motion.div
                            key={recipe}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            whileHover={{ scale: 1.03, y: -5 }}
                            onClick={() => handleSelectRecipe(recipe)}
                          >
                            <Card
                              className="cursor-pointer h-full flex flex-col justify-center items-center text-center p-6 shadow-md hover:shadow-xl transition-shadow duration-300"
                            >
                              <CardTitle className="font-headline text-xl">
                                {recipe}
                              </CardTitle>
                            </Card>
                          </motion.div>
                        )
                      )}
                    </div>
                     {generatedRecipes.length > 4 && !showAllRecipes && (
                        <div className="mt-6 text-center">
                            <Button onClick={() => setShowAllRecipes(true)}>Show More</Button>
                        </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );

      case 'details':
        return (
          <motion.div
            key="details-view"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Button onClick={handleGoBack} variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <CardTitle className="font-headline text-3xl">
                      {selectedRecipe}
                    </CardTitle>
                    {recipeDetails.data && (
                      <CardDescription>
                        {recipeDetails.data.description}
                      </CardDescription>
                    )}
                  </div>
                  {recipeDetails.data && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        toggleCookbookRecipe(selectedRecipe!, recipeDetails.data!)
                      }
                    >
                      <Heart
                        className={
                          isInCookbook(selectedRecipe!)
                            ? 'fill-red-500 text-red-500'
                            : ''
                        }
                      />
                       <span className="sr-only">Add to cookbook</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {recipeDetails.isLoading && (
                  <div className="flex flex-col items-center justify-center gap-4 py-16">
                    <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                    <p className="font-headline text-xl text-primary-foreground">
                      Fetching delicious details...
                    </p>
                  </div>
                )}
                {recipeDetails.error && (
                  <div className="text-destructive text-center py-8">
                    <p>{recipeDetails.error}</p>
                    <Button
                      onClick={() => handleSelectRecipe(selectedRecipe!)}
                      className="mt-4"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
                {recipeDetails.data && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Salad className="h-4 w-4" />
                            <div>
                              <strong>Prep:</strong> {recipeDetails.data.prepTime}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <div>
                              <strong>Cook:</strong> {recipeDetails.data.cookTime}
                            </div>
                          </div>
                          {totalCookTime > 0 && (
                            <div className="flex items-center gap-2 font-bold text-foreground">
                              <Timer className="h-4 w-4" />
                              <div>
                                <strong>Total:</strong> {formatTotalTime(totalCookTime)}
                              </div>
                            </div>
                          )}
                        </div>
                         <Button
                          variant="outline"
                          onClick={() => setIsVariationOpen(true)}
                        >
                            <Wand2 className="mr-2 h-4 w-4" />
                            Make a variation
                        </Button>
                    </div>

                    <div>
                      <h3 className="font-headline text-xl mb-3 flex items-center gap-2">
                        <BookOpen className="h-5 w-5" /> Ingredients
                      </h3>
                      <ul className="list-disc list-inside space-y-1 font-body columns-2">
                        {recipeDetails.data.ingredients.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-headline text-xl mb-3 flex items-center gap-2">
                        <ChefHat className="h-5 w-5" /> Instructions
                      </h3>
                      <ol className="list-decimal list-inside space-y-3 font-body">
                        {recipeDetails.data.instructions.map((step, index) => (
                          <li key={index} className="pl-2">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </CardContent>
              {recipeDetails.data && (
                <CardFooter>
                  <Button
                    onClick={() => changeView('cooking')}
                    size="lg"
                    className="w-full"
                  >
                    <ChefHat className="mr-2" /> Start Cooking
                  </Button>
                </CardFooter>
              )}
            </Card>
          </motion.div>
        );

      case 'cooking':
        return (
          <motion.div
            key="cooking-mode"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
             <Button onClick={handleGoBack} variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
            </Button>
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline text-3xl">
                        {selectedRecipe}
                        </CardTitle>
                        <CardDescription>
                        Step {currentStep + 1} of{' '}
                        {recipeDetails.data!.instructions.length}
                        </CardDescription>
                    </div>
                    {timer.isActive && (
                        <div className="text-2xl font-mono bg-muted px-4 py-2 rounded-lg">
                            {formatTime(timer.remaining)}
                        </div>
                    )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg font-body leading-relaxed">
                  {recipeDetails.data!.instructions[currentStep]}
                </p>

                {currentStepDescription?.isLoading && (
                  <div className="flex items-center justify-center h-24 bg-muted rounded-lg">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {currentStepDescription?.error && (
                    <div className="text-destructive text-center py-4">{currentStepDescription.error}</div>
                )}

                {currentStepDescription?.data && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-primary/10 rounded-lg border border-primary/20"
                  >
                    <p className="font-body text-primary-foreground/90">{currentStepDescription.data}</p>
                  </motion.div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleGenerateStepDescription} disabled={!!currentStepDescription?.isLoading || !!currentStepDescription?.data}>
                    <Eye className="mr-2" />
                    What should it look like?
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsTroubleshootDialogOpen(true);
                      setTroubleshootQuery('');
                      setTroubleshootingAdvice({ isLoading: false, data: null, error: null });
                    }}
                  >
                    <AlertTriangle className="mr-2" />
                    Something's wrong?
                  </Button>
                   {currentStepTimedInfo && !timer.isActive && (
                    <Button onClick={() => startTimer(currentStepTimedInfo.durationInMinutes)}>
                        <Timer className="mr-2" />
                        Start Timer ({currentStepTimedInfo.durationInMinutes} min)
                    </Button>
                    )}
                    {isAlarmPlaying && (
                        <Button onClick={stopAlarm} variant="destructive">
                            <BellOff className="mr-2" />
                            Stop Alarm
                        </Button>
                    )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  onClick={() => setCurrentStep((s) => s - 1)}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="mr-2" /> Previous Step
                </Button>
                {currentStep < recipeDetails.data!.instructions.length - 1 ? (
                  <Button onClick={() => setCurrentStep(s => s + 1)}>
                    Next Step <ChevronRight className="ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleDoneCooking} className="bg-green-600 hover:bg-green-700">
                    I'm done!
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        );
        case 'enjoy':
            return (
              <motion.div
                key="enjoy-view"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, type: 'spring' }}
                className="text-center"
              >
                <Card className="shadow-lg p-8">
                  <CardHeader className="p-0">
                    <div className="flex justify-center mb-4">
                      <PartyPopper className="h-16 w-16 text-accent" />
                    </div>
                    <CardTitle className="font-headline text-4xl">Enjoy your meal!</CardTitle>
                    <CardDescription className="pt-2">You successfully cooked {selectedRecipe}.</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-6">
                    <h3 className="font-headline text-2xl mb-4">What's next?</h3>
                    {relatedRecipes.isLoading && (
                       <div className="flex items-center justify-center gap-2 text-muted-foreground">
                           <LoaderCircle className="animate-spin h-5 w-5" />
                           <span>Finding more recipes...</span>
                       </div>
                    )}
                    {relatedRecipes.error && <p className="text-destructive">{relatedRecipes.error}</p>}
                    {relatedRecipes.data && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {relatedRecipes.data.map(recipe => (
                          <Button key={recipe} variant="outline" onClick={() => handleSelectRecipe(recipe)}>
                            {recipe}
                          </Button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-4 my-6">
                        <Separator className="flex-1" />
                        <span className="text-muted-foreground text-sm">OR</span>
                        <Separator className="flex-1" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button onClick={handleRemake} size="lg">
                            <Repeat className="mr-2"/>
                            Remake {selectedRecipe}
                        </Button>
                         <Button onClick={handleStartOver} size="lg" variant="secondary">
                            <Home className="mr-2"/>
                            Back to Home
                        </Button>
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            );
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background">
        <header ref={topRef} className="container mx-auto px-4 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <button onClick={handleStartOver} className="flex items-center justify-center gap-4 text-center">
              <ChefHat className="h-12 w-12 text-primary" />
              <div>
                <h1 className="text-5xl font-headline text-primary-foreground tracking-wider">
                  RecipeSavvy
                </h1>
                <p className="text-muted-foreground font-body">
                  Turn your ingredients into delicious meals.
                </p>
              </div>
            </button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowCookbook(true);
                  setViewHistory(['search']);
                }}
              >
                <BookHeart />
                <span className="sr-only">My Cookbook</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                <Settings />
                <span className="sr-only">Settings</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </div>
        </main>

        <footer className="text-center py-4 text-muted-foreground text-sm">
          <p>Built by TheVibecoder</p>
        </footer>
      </div>

      <audio ref={alarmRef} src="/alarm.mp3" loop />

      <SettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
        model={model}
        onModelChange={handleAddModel}
      />
      
      <AllergensDialog
        isOpen={isAllergensOpen}
        onOpenChange={setIsAllergensOpen}
        allergens={allergens}
        onAllergensChange={setAllergens}
      />

       <IngredientsDialog
        isOpen={isIngredientsDialogOpen}
        onOpenChange={setIsIngredientsDialogOpen}
        selectedIngredients={ingredients}
        onIngredientsChange={setIngredients}
      />
      
      {selectedRecipe && recipeDetails.data && (
        <VariationDialog
          isOpen={isVariationOpen}
          onOpenChange={setIsVariationOpen}
          recipeName={selectedRecipe!}
          recipeDetails={recipeDetails.data}
          apiKey={apiKey}
          model={model}
          onVariationCreated={(newName, newDetails) => {
            handleSelectRecipe(newName, { newDetails: newDetails as RecipeDetailsOutput });
            setIsVariationOpen(false);
          }}
        />
      )}
      
      <Dialog open={isTroubleshootDialogOpen} onOpenChange={setIsTroubleshootDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Something wrong?</DialogTitle>
                <DialogDescription>
                    Describe what's happening, and our AI chef will try to help you.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                 <div className="p-4 bg-muted rounded-md">
                   <p className="font-semibold text-sm">Current Step:</p>
                   <p className="text-sm text-muted-foreground">{recipeDetails.data?.instructions[currentStep]}</p>
                 </div>
                 <Textarea 
                    placeholder="e.g., 'My sauce is too thin' or 'I burned the onions!'"
                    value={troubleshootQuery}
                    onChange={(e) => setTroubleshootQuery(e.target.value)} 
                    rows={4}
                 />
                 {troubleshootingAdvice.isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <LoaderCircle className="animate-spin h-4 w-4" />
                        Getting advice...
                    </div>
                 )}
                 {troubleshootingAdvice.error && (
                    <p className="text-sm text-destructive">{troubleshootingAdvice.error}</p>
                 )}
                 {troubleshootingAdvice.data && (
                    <div className="p-4 bg-primary/10 rounded-md border border-primary/20 space-y-2">
                        <h4 className="font-semibold">Chef's Advice:</h4>
                        <p className="text-sm">{troubleshootingAdvice.data}</p>
                    </div>
                 )}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button onClick={handleTroubleshoot} disabled={!troubleshootQuery || troubleshootingAdvice.isLoading}>
                    Get Help
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will permanently remove "{recipeToDelete}" from your cookbook.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="dont-ask-again" 
                    checked={dontAskAgain} 
                    onCheckedChange={(checked) => setDontAskAgain(checked as boolean)}
                  />
                  <Label htmlFor="dont-ask-again">Don't ask me again for 5 days</Label>
              </div>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setRecipeToDelete(null)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmRemove}>Continue</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
