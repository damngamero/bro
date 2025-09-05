"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Moon, Sun } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"

type ModelId = 'googleai/gemini-2.5-flash' | 'googleai/gemini-2.5-pro';

interface SettingsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    apiKey: string | null;
    onApiKeyChange: (apiKey: string | null) => void;
    model: ModelId;
    onModelChange: (model: ModelId) => void;
}

export function SettingsDialog({ isOpen, onOpenChange, apiKey, onApiKeyChange, model, onModelChange }: SettingsDialogProps) {
  const { setTheme, theme } = useTheme()
  const [localApiKey, setLocalApiKey] = useState(apiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLocalApiKey(apiKey || "");
  }, [apiKey]);
  
  const handleSave = () => {
    if (localApiKey) {
        localStorage.setItem("googleApiKey", localApiKey);
        onApiKeyChange(localApiKey);
        toast({
            title: "Settings Saved",
            description: "Your API key and preferences have been saved.",
        });
    } else {
        localStorage.removeItem("googleApiKey");
        onApiKeyChange(null);
         toast({
            title: "API Key Removed",
            description: "Your API key has been removed.",
        });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your application settings here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api-key" className="text-right">
                API Key
              </Label>
              <div className="col-span-3 relative">
                 <Input 
                    id="api-key" 
                    type={showApiKey ? "text" : "password"}
                    value={localApiKey} 
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    className="pr-10"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute inset-y-0 right-0 h-full px-3"
                  onClick={() => setShowApiKey(s => !s)}
                >
                  {showApiKey ? <EyeOff /> : <Eye />}
                  <span className="sr-only">{showApiKey ? 'Hide API key' : 'Show API key'}</span>
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground px-1 text-center col-span-4 -mt-2">
              Get your Google AI API key from{" "}
              <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline"
              >
                  Google AI Studio
              </a>. 
              Your key is stored only in your browser.
            </p>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
             <Label className="text-right">Model</Label>
             <RadioGroup
                value={model}
                onValueChange={(value: string) => onModelChange(value as ModelId)}
                className="col-span-3 flex gap-4"
              >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="googleai/gemini-2.5-pro" id="gemini-pro" />
                    <Label htmlFor="gemini-pro">Pro</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="googleai/gemini-2.5-flash" id="gemini-flash" />
                    <Label htmlFor="gemini-flash">Flash</Label>
                </div>
              </RadioGroup>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
                Theme
            </Label>
             <div className="col-span-3 flex gap-2">
                <Button variant={theme === 'light' ? 'default' : 'outline'} size="icon" onClick={() => setTheme("light")}>
                    <Sun className="h-[1.2rem] w-[1.2rem]" />
                </Button>
                <Button variant={theme === 'dark' ? 'default' : 'outline'} size="icon" onClick={() => setTheme("dark")}>
                    <Moon className="h-[1.2rem] w-[1.2rem]" />
                </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
