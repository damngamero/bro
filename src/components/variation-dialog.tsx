"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { LoaderCircle } from "lucide-react"
import { type RecipeDetailsOutput } from "@/ai/flows/generate-recipe-details"
import { type RecipeVariationOutput } from "@/ai/flows/generate-recipe-variation"
import { useTranslation } from "react-i18next"

type ModelId = 'googleai/gemini-2.5-flash' | 'googleai/gemini-2.5-pro';

interface VariationDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  recipeName: string
  recipeDetails: RecipeDetailsOutput
  apiKey: string | null
  model: ModelId
  onVariationCreated: (newName: string, newDetails: RecipeDetailsOutput) => void
}

export function VariationDialog({
  isOpen,
  onOpenChange,
  recipeName,
  recipeDetails,
  apiKey,
  model,
  onVariationCreated
}: VariationDialogProps) {
  const { t } = useTranslation();
  const [excludeIngredients, setExcludeIngredients] = useState<string[]>([])
  const [addons, setAddons] = useState<string>("")
  const [unavailableEquipment, setUnavailableEquipment] = useState("");
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleToggleExclude = (ingredient: string) => {
    setExcludeIngredients(
      excludeIngredients.includes(ingredient)
        ? excludeIngredients.filter((i) => i !== ingredient)
        : [...excludeIngredients, ingredient]
    )
  }

  const handleGenerateVariation = async () => {
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: t('apiKeyMissing'),
      })
      return
    }
    if (excludeIngredients.length === 0 && !addons.trim() && !unavailableEquipment.trim()) {
        toast({
            variant: "destructive",
            title: t('noChangesRequested'),
            description: t('noChangesRequestedDescription'),
        });
        return;
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/generate-variation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeName,
          ingredientsToExclude: excludeIngredients,
          addons: addons.split(',').map(a => a.trim()).filter(Boolean),
          unavailableEquipment: unavailableEquipment.split(',').map(e => e.trim()).filter(Boolean),
          apiKey,
          model,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const result: RecipeVariationOutput = await response.json();

      if (result.possible && result.newRecipe) {
        onVariationCreated(result.newRecipe.name, result.newRecipe as RecipeDetailsOutput)
      } else {
        toast({
          variant: "destructive",
          title: t('variationNotPossible'),
          description: result.reason || t('couldNotCreateVariation'),
          duration: 8000
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('failedToGenerateVariation'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('createVariation')}</DialogTitle>
          <DialogDescription>
            {t('createVariationDescription', { recipeName })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <Label className="text-base font-medium">
              {t('removeIngredients')}
            </Label>
            <p className="text-sm text-muted-foreground pb-2">
              {t('removeIngredientsDescription')}
            </p>
            <div className="space-y-2">
              {recipeDetails.ingredients.map((ingredient) => (
                <div key={ingredient} className="flex items-center space-x-2">
                  <Checkbox
                    id={`exclude-${ingredient}`}
                    checked={excludeIngredients.includes(ingredient)}
                    onCheckedChange={() => handleToggleExclude(ingredient)}
                  />
                  <label
                    htmlFor={`exclude-${ingredient}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {ingredient}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <Label htmlFor="addons" className="text-base font-medium">
              {t('tryDifferentAddons')}
            </Label>
             <p className="text-sm text-muted-foreground pb-2">
              {t('addAddonsDescription')}
            </p>
            <Input
              id="addons"
              value={addons}
              onChange={(e) => setAddons(e.target.value)}
              placeholder={t('addonsPlaceholder')}
            />
          </div>
           <Separator />
          <div>
            <Label htmlFor="unavailable-equipment" className="text-base font-medium">
              Unavailable Equipment
            </Label>
             <p className="text-sm text-muted-foreground pb-2">
              Tell us what equipment you don't have, and we'll try to adapt the recipe.
            </p>
            <Input
              id="unavailable-equipment"
              value={unavailableEquipment}
              onChange={(e) => setUnavailableEquipment(e.target.value)}
              placeholder="e.g., Oven, microwave, stand mixer..."
            />
          </div>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="ghost">{t('cancel')}</Button>
            </DialogClose>
            <Button onClick={handleGenerateVariation} disabled={isLoading}>
                {isLoading && <LoaderCircle className="animate-spin mr-2" />}
                {t('generateVariation')}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
