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
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { SettingsDialog } from '@/components/settings-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

type RecipeDetailsState = {
  isLoading: boolean;
  data: RecipeDetailsOutput | null;
  error: string | null;
};

type FavoriteRecipe = {
  name: string;
  details: RecipeDetailsOutput;
};

type Mode = 'ingredients' | 'recipe';
type View = 'search' | 'details' | 'cooking' | 'enjoy';

export default function RecipeSavvyPage() {
  const [mode, setMode] = useState<Mode>('ingredients');
  const [currentView, setCurrentView] = useState<View>('search');
  
  const [ingredients, setIngredients] = useState<string[]>(['Flour', 'Eggs', 'Sugar']);
  const [newIngredient, setNewIngredient] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [isHalal, setIsHalal] = useState(false);

  const [generatedRecipes, setGeneratedRecipes] = useState<string[]>([]);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);

  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [recipeDetails, setRecipeDetails] = useState<RecipeDetailsState>({
    isLoading: false,
    data: null,
    error: null,
  });

  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [stepDescription, setStepDescription] = useState<{
    isLoading: boolean;
    data: string | null;
    error: string | null;
  }>({ isLoading: false, data: null, error: null });

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


  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('googleApiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }

    const storedFavorites = localStorage.getItem('favoriteRecipes');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  const handleAddIngredient = (e: FormEvent) => {
    e.preventDefault();
    if (newIngredient.trim() && !ingredients.includes(newIngredient.trim())) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const handleRemoveIngredient = (ingredientToRemove: string) => {
    setIngredients(ingredients.filter(i => i !== ingredientToRemove));
  };

  const ensureApiKey = useCallback(() => {
    if (!apiKey) {
      toast({
        variant: 'destructive',
        title: 'API Key Missing',
        description: 'Please add your Google AI API key in the settings.',
      });
      setIsSettingsOpen(true);
      return false;
    }
    return true;
  }, [apiKey, toast]);

  const handleSelectRecipe = useCallback(
    async (recipeName: string) => {
      setSelectedRecipe(recipeName);
      setRecipeDetails({ isLoading: true, data: null, error: null });
      setCurrentStep(0);
      setStepDescription({ isLoading: false, data: null, error: null });
      setCurrentView('details');

      const favorite = favorites.find(f => f.name === recipeName);
      if (favorite) {
        setRecipeDetails({ isLoading: false, data: favorite.details, error: null });
        return;
      }

      if (!ensureApiKey()) {
        setRecipeDetails({ isLoading: false, data: null, error: 'API Key is missing.' });
        return;
      }

      try {
        const details = await generateRecipeDetails({
          recipeName,
          halalMode: isHalal,
          apiKey: apiKey!,
        });
        setRecipeDetails({ isLoading: false, data: details, error: null });
      } catch (error) {
        console.error(error);
        setRecipeDetails({
          isLoading: false,
          data: null,
          error: 'Failed to load recipe details.',
        });
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load recipe details. Please try again.',
        });
      }
    },
    [apiKey, isHalal, toast, favorites, ensureApiKey]
  );
  
  const handleGetRecipe = useCallback(async () => {
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
    setShowFavorites(false);
    setGeneratedRecipes([]);
    setSelectedRecipe(null);
    setRecipeDetails({ isLoading: false, data: null, error: null });

    try {
      const result = await generateRecipesFromIngredients({
        ingredients,
        halalMode: isHalal,
        apiKey: apiKey!,
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
  }, [ingredients, isHalal, apiKey, toast, ensureApiKey]);

  useEffect(() => {
    if ((generatedRecipes.length > 0 || showFavorites) && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [generatedRecipes, showFavorites]);

  useEffect(() => {
    if (currentView !== 'search' && topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentView]);

  const handleBackToSearch = () => {
    setCurrentView('search');
    setSelectedRecipe(null);
    setRecipeDetails({ isLoading: false, data: null, error: null });
    // In recipe mode, going back should not scroll to results, but to the top.
    if (mode === 'ingredients' && (generatedRecipes.length > 0 || showFavorites)) {
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
    setCurrentView('search');
    setIngredients(['Flour', 'Eggs', 'Sugar']);
    setNewIngredient('');
    setRecipeName('');
    setGeneratedRecipes([]);
    setSelectedRecipe(null);
    setShowFavorites(false);
    setRecipeDetails({ isLoading: false, data: null, error: null });
    setCurrentStep(0);
    setStepDescription({ isLoading: false, data: null, error: null });
    setRelatedRecipes({ isLoading: false, data: null, error: null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = (recipeName: string, recipeDetails: RecipeDetailsOutput) => {
    const updatedFavorites = favorites.some(f => f.name === recipeName)
      ? favorites.filter(f => f.name !== recipeName)
      : [...favorites, { name: recipeName, details: recipeDetails }];

    setFavorites(updatedFavorites);
    localStorage.setItem('favoriteRecipes', JSON.stringify(updatedFavorites));

    toast({
      title: favorites.some(f => f.name === recipeName)
        ? 'Removed from Favorites'
        : 'Added to Favorites',
      description: recipeName,
    });
  };

  const isFavorited = (recipeName: string) => favorites.some(f => f.name === recipeName);

  const handleGenerateStepDescription = async () => {
    if (!ensureApiKey() || !recipeDetails.data) return;
    setStepDescription({ isLoading: true, data: null, error: null });
    try {
      const result = await generateStepDescription({
        recipeName: selectedRecipe!,
        instruction: recipeDetails.data.instructions[currentStep],
        apiKey: apiKey!,
      });
      setStepDescription({ isLoading: false, data: result.description, error: null });
    } catch (error) {
      console.error(error);
      setStepDescription({ isLoading: false, data: null, error: 'Failed to get description.' });
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
    setCurrentView('enjoy');
    if (!ensureApiKey() || !selectedRecipe) return;
    setRelatedRecipes({ isLoading: true, data: null, error: null });
    try {
      const result = await generateRelatedRecipes({ recipeName: selectedRecipe, apiKey: apiKey! });
      setRelatedRecipes({ isLoading: false, data: result.recipes, error: null });
    } catch(error) {
      console.error(error);
      setRelatedRecipes({ isLoading: false, data: null, error: 'Failed to get related recipes.' });
    }
  };

  const handleRemake = () => {
    setCurrentView('details');
    setCurrentStep(0);
    setStepDescription({isLoading: false, data: null, error: null});
  }

  const renderContent = () => {
    switch (currentView) {
      case 'search':
        return (
          <motion.div
            key="search-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-lg overflow-hidden">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">
                  Find your next meal
                </CardTitle>
                <CardDescription>
                  Switch between finding recipes by ingredients or by name.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={mode}
                  onValueChange={v => setMode(v as Mode)}
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
                        <form onSubmit={handleAddIngredient} className="flex gap-2 mb-4">
                          <Input
                            type="text"
                            value={newIngredient}
                            onChange={e => setNewIngredient(e.target.value)}
                            placeholder="e.g., Chicken breast"
                            className="flex-grow"
                          />
                          <Button type="submit" size="icon" aria-label="Add ingredient">
                            <Plus />
                          </Button>
                        </form>
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
                      <CardContent className="px-1">
                        <form
                          onSubmit={e => {
                            e.preventDefault();
                            handleGetRecipe();
                          }}
                          className="flex gap-2"
                        >
                          <Input
                            type="text"
                            value={recipeName}
                            onChange={e => setRecipeName(e.target.value)}
                            placeholder="e.g., Chicken Alfredo"
                            className="flex-grow"
                          />
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
                <div className="flex items-center space-x-2 mt-4">
                  <Switch id="halal-mode" checked={isHalal} onCheckedChange={setIsHalal} />
                  <Label htmlFor="halal-mode">Halal Mode</Label>
                </div>
              </CardContent>
              <CardFooter className="flex-col sm:flex-row gap-2">
                {mode === 'ingredients' ? (
                  <Button
                    onClick={handleGenerateRecipes}
                    disabled={isGeneratingRecipes || ingredients.length === 0}
                    className="w-full sm:w-auto flex-grow bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {isGeneratingRecipes ? (
                      <LoaderCircle className="animate-spin mr-2" />
                    ) : (
                      <Sparkles className="mr-2" />
                    )}
                    Find Recipes
                  </Button>
                ) : (
                  <Button
                    onClick={handleGetRecipe}
                    disabled={recipeDetails.isLoading || !recipeName}
                    className="w-full sm:w-auto flex-grow bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {recipeDetails.isLoading ? (
                      <LoaderCircle className="animate-spin mr-2" />
                    ) : (
                      <Sparkles className="mr-2" />
                    )}
                    Get Recipe
                  </Button>
                )}
                {(ingredients.length > 3 || generatedRecipes.length > 0 || recipeName) && (
                  <Button
                    onClick={handleStartOver}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Start Over
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
                {(generatedRecipes.length > 0 || showFavorites) && !isGeneratingRecipes && (
                  <motion.div
                    key="recipe-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-3xl font-headline text-center mb-6">
                      {showFavorites ? 'Your Favorite Recipes' : "Here's what you can make"}
                    </h2>

                    {showFavorites && favorites.length === 0 && (
                      <p className="text-center text-muted-foreground">
                        You haven't saved any favorites yet.
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(showFavorites ? favorites.map(f => f.name) : generatedRecipes).map(
                        recipe => (
                          <motion.div
                            key={recipe}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ scale: 1.03, y: -5 }}
                            className="relative"
                          >
                            <Card
                              onClick={() => handleSelectRecipe(recipe)}
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
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 50, damping: 15 }}
          >
            <Button onClick={handleBackToSearch} variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to{' '}
              {mode === 'ingredients' && generatedRecipes.length > 0 ? 'Results' : 'Search'}
            </Button>
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
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
                        toggleFavorite(selectedRecipe!, recipeDetails.data!)
                      }
                    >
                      <Heart
                        className={
                          isFavorited(selectedRecipe!)
                            ? 'fill-red-500 text-red-500'
                            : ''
                        }
                      />
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
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
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
                    </div>

                    <div>
                      <h3 className="font-headline text-xl mb-3 flex items-center gap-2">
                        <BookOpen className="h-5 w-5" /> Ingredients
                      </h3>
                      <ul className="list-disc list-inside space-y-1 font-body">
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
                    onClick={() => setCurrentView('cooking')}
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
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-3xl">
                  {selectedRecipe}
                </CardTitle>
                <CardDescription>
                  Step {currentStep + 1} of{' '}
                  {recipeDetails.data!.instructions.length}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg font-body leading-relaxed">
                  {recipeDetails.data!.instructions[currentStep]}
                </p>

                {stepDescription.isLoading && (
                  <div className="flex items-center justify-center h-24 bg-muted rounded-lg">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {stepDescription.error && (
                    <div className="text-destructive text-center py-4">{stepDescription.error}</div>
                )}

                {stepDescription.data && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-primary/10 rounded-lg border border-primary/20"
                  >
                    <p className="font-body text-primary-foreground/90">{stepDescription.data}</p>
                  </motion.div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleGenerateStepDescription} disabled={stepDescription.isLoading}>
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
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  onClick={() => setCurrentStep(s => s - 1)}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="mr-2" /> Previous Step
                </Button>
                {currentStep < recipeDetails.data!.instructions.length - 1 ? (
                  <Button onClick={() => {
                      setCurrentStep(s => s + 1);
                      setStepDescription({isLoading: false, data: null, error: null});
                    }}>
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
                transition={{ duration: 0.5, type: 'spring' }}
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
            <div className="flex items-center justify-center gap-4 text-center">
              <ChefHat className="h-12 w-12 text-primary" />
              <div>
                <h1 className="text-5xl font-headline text-primary-foreground tracking-wider">
                  RecipeSavvy
                </h1>
                <p className="text-muted-foreground font-body">
                  Turn your ingredients into delicious meals.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowFavorites(true);
                  setGeneratedRecipes([]);
                  setSelectedRecipe(null);
                  setCurrentView('search');
                }}
              >
                <BookHeart />
                <span className="sr-only">Favorites</span>
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

      <SettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
      />
      
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
    </>
  );
}
