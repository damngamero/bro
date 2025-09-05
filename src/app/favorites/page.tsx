'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import {
  generateRecipeDetails,
  RecipeDetailsOutput,
} from '@/ai/flows/generate-recipe-details';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowLeft,
  ChefHat,
  Clock,
  BookOpen,
  LoaderCircle,
  Heart,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type FavoriteRecipe = {
  id: string;
  name: string;
  details?: RecipeDetailsOutput;
};

type RecipeDetailsState = {
  isLoading: boolean;
  data: RecipeDetailsOutput | null;
  error: string | null;
};

export default function FavoritesPage() {
  const { user, loading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<FavoriteRecipe | null>(
    null
  );
  const [recipeDetails, setRecipeDetails] = useState<RecipeDetailsState>({
    isLoading: false,
    data: null,
    error: null,
  });
  const { toast } = useToast();
  
  useEffect(() => {
    if (loading) return;
    if (!user) {
      setIsLoadingFavorites(false);
      return;
    }

    const favoritesCol = collection(db, 'users', user.uid, 'favorites');
    const unsubscribe = onSnapshot(favoritesCol, (snapshot) => {
      const favs = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        details: doc.data().details,
      }));
      setFavorites(favs);
      setIsLoadingFavorites(false);
    });

    return () => unsubscribe();
  }, [user, loading]);

  const handleSelectRecipe = useCallback(
    async (recipe: FavoriteRecipe) => {
      setSelectedRecipe(recipe);
      if (recipe.details) {
        setRecipeDetails({
          isLoading: false,
          data: recipe.details,
          error: null,
        });
      } else {
        setRecipeDetails({ isLoading: true, data: null, error: null });
        try {
          const details = await generateRecipeDetails({ recipeName: recipe.name });
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
      }
    },
    [toast]
  );
  
  const toggleFavorite = async (recipeName: string) => {
    if (!user) return;
    
    const favRef = doc(db, 'users', user.uid, 'favorites', recipeName);
    try {
        await deleteDoc(favRef);
        if (selectedRecipe?.name === recipeName) {
            handleBack();
        }
        toast({ title: 'Removed from favorites!' });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update favorites.' });
    }
  };

  const handleBack = () => {
    setSelectedRecipe(null);
    setRecipeDetails({ isLoading: false, data: null, error: null });
  };

  if (isLoadingFavorites || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-headline">Please sign in</h1>
        <p>You need to be signed in to view your favorite recipes.</p>
        <Button asChild>
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-4 text-center">
          <Link href="/" className="absolute left-4 top-4">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <BookHeart className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-5xl font-headline text-primary-foreground tracking-wider">
              My Favorites
            </h1>
            <p className="text-muted-foreground font-body">
              Your collection of saved recipes.
            </p>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {!selectedRecipe ? (
              <motion.div
                key="favorites-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {favorites.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-lg text-muted-foreground">
                      You haven't saved any recipes yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favorites.map(recipe => (
                       <motion.div
                        key={recipe.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ scale: 1.03, y:-5 }}
                        className="relative"
                      >
                        <Card
                          onClick={() => handleSelectRecipe(recipe)}
                          className="cursor-pointer h-full flex flex-col justify-center items-center text-center p-6 shadow-md hover:shadow-xl transition-shadow duration-300"
                        >
                          <CardTitle className="font-headline text-xl">{recipe.name}</CardTitle>
                        </Card>
                         <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(recipe.name)
                            }}
                          >
                            <Heart className="h-5 w-5 text-red-500 fill-current" />
                          </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="details-view"
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '-100%' }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 50, damping: 15 }}
              >
                <Button onClick={handleBack} variant="ghost" className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Favorites
                </Button>
                <Card className="shadow-lg">
                  <CardHeader>
                     <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="font-headline text-3xl">{selectedRecipe.name}</CardTitle>
                        {recipeDetails.data && <CardDescription>{recipeDetails.data.description}</CardDescription>}
                      </div>
                      <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavorite(selectedRecipe.name)}
                        >
                          <Heart className="h-6 w-6 text-red-500 fill-current" />
                        </Button>
                    </div>
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
    </div>
  );
}
