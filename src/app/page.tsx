'use client';

import { useState, useCallback, FormEvent, useRef, useEffect } from 'react';
import { generateRecipesFromIngredients } from '@/ai/flows/generate-recipes-from-ingredients';
import {
  generateRecipeDetails,
  type RecipeDetailsOutput,
} from '@/ai/flows/generate-recipe-details';
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
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type RecipeDetailsState = {
  isLoading: boolean;
  data: RecipeDetailsOutput | null;
  error: string | null;
};

export default function RecipeSavvyPage() {
  const [ingredients, setIngredients] = useState<string[]>(['Flour', 'Eggs', 'Sugar']);
  const [newIngredient, setNewIngredient] = useState('');

  const [generatedRecipes, setGeneratedRecipes] = useState<string[]>([]);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);

  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [recipeDetails, setRecipeDetails] = useState<RecipeDetailsState>({
    isLoading: false,
    data: null,
    error: null,
  });

  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

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

  const handleGenerateRecipes = useCallback(async () => {
    if (ingredients.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Ingredients',
        description: 'Please add some ingredients first.',
      });
      return;
    }
    setIsGeneratingRecipes(true);
    setGeneratedRecipes([]);
    setSelectedRecipe(null);
    setRecipeDetails({ isLoading: false, data: null, error: null });

    try {
      const result = await generateRecipesFromIngredients({ ingredients });
      if (result.recipes.length === 0) {
        toast({
          title: 'No Recipes Found',
          description: 'We couldn\'t find any recipes with your ingredients. Try adding more!',
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
  }, [ingredients, toast]);
  
  useEffect(() => {
    if (generatedRecipes.length > 0 && resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [generatedRecipes]);

  useEffect(() => {
    if (selectedRecipe && detailsRef.current) {
        detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedRecipe]);

  const handleSelectRecipe = useCallback(
    async (recipeName: string) => {
      setSelectedRecipe(recipeName);
      setRecipeDetails({ isLoading: true, data: null, error: null });
      try {
        const details = await generateRecipeDetails({ recipeName });
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
    [toast]
  );

  const handleBack = () => {
    setSelectedRecipe(null);
    setRecipeDetails({ isLoading: false, data: null, error: null });
    setTimeout(() => {
         if(resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
         }
    }, 100);
  };
  
  const handleStartOver = () => {
    setIngredients([]);
    setNewIngredient('');
    setGeneratedRecipes([]);
    setSelectedRecipe(null);
    setRecipeDetails({ isLoading: false, data: null, error: null });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 py-8">
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
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {!selectedRecipe ? (
              <motion.div
                key="ingredient-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="shadow-lg overflow-hidden">
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">
                      What's in your pantry?
                    </CardTitle>
                    <CardDescription>
                      Add your ingredients and we'll find recipes for you.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  <CardFooter className="flex-col sm:flex-row gap-2">
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
                    {ingredients.length > 0 && 
                      <Button onClick={handleStartOver} variant="outline" className="w-full sm:w-auto">
                        Start Over
                      </Button>
                    }
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
                            <p className="font-headline text-xl text-primary-foreground">Whipping up some ideas...</p>
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
                          Here's what you can make
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {generatedRecipes.map(recipe => (
                            <motion.div
                              key={recipe}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              whileHover={{ scale: 1.03, y:-5 }}
                            >
                              <Card
                                onClick={() => handleSelectRecipe(recipe)}
                                className="cursor-pointer h-full flex flex-col justify-center items-center text-center p-6 shadow-md hover:shadow-xl transition-shadow duration-300"
                              >
                                <CardTitle className="font-headline text-xl">{recipe}</CardTitle>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="details-view"
                ref={detailsRef}
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '-100%' }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 50, damping: 15 }}
              >
                <Button onClick={handleBack} variant="ghost" className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Recipes
                </Button>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="font-headline text-3xl">{selectedRecipe}</CardTitle>
                     {recipeDetails.data && <CardDescription>{recipeDetails.data.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    {recipeDetails.isLoading && (
                      <div className="flex flex-col items-center justify-center gap-4 py-16">
                        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                        <p className="font-headline text-xl text-primary-foreground">Fetching delicious details...</p>
                      </div>
                    )}
                    {recipeDetails.error && (
                      <div className="text-destructive text-center py-8">
                        <p>{recipeDetails.error}</p>
                        <Button onClick={() => handleSelectRecipe(selectedRecipe)} className="mt-4">
                          Try Again
                        </Button>
                      </div>
                    )}
                    {recipeDetails.data && (
                      <div className="space-y-6">
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <div><strong>Prep:</strong> {recipeDetails.data.prepTime}</div>
                            </div>
                             <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <div><strong>Cook:</strong> {recipeDetails.data.cookTime}</div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-headline text-xl mb-3 flex items-center gap-2"><BookOpen className="h-5 w-5" /> Ingredients</h3>
                            <ul className="list-disc list-inside space-y-1 font-body">
                                {recipeDetails.data.ingredients.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                           <h3 className="font-headline text-xl mb-3 flex items-center gap-2"><ChefHat className="h-5 w-5" /> Instructions</h3>
                           <ol className="list-decimal list-inside space-y-3 font-body">
                                {recipeDetails.data.instructions.map((step, index) => (
                                    <li key={index} className="pl-2">{step}</li>
                                ))}
                           </ol>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="text-center py-4 text-muted-foreground text-sm">
        <p>Built with ❤️ by Vibecoder ❤️💀</p>
      </footer>
    </div>
  );
}
