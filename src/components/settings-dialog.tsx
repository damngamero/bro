
"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import Link from "next/link"

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
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

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
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLocalApiKey(apiKey || "");
    setIsApiKeyMissing(!apiKey);
  }, [apiKey, isOpen]);
  
  const handleSave = () => {
    if (localApiKey) {
        localStorage.setItem("googleApiKey", localApiKey);
        onApiKeyChange(localApiKey);
        toast({
            title: 'Settings Saved',
            description: 'Your preferences have been updated.',
        });
    } else {
        localStorage.removeItem("googleApiKey");
        onApiKeyChange(null);
         toast({
            title: 'API Key Removed',
            description: 'Your API Key has been removed. The app will not function until a new one is added.',
        });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your app preferences.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
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
                        className={cn(
                          "pr-10",
                          isApiKeyMissing && "ring-2 ring-offset-2 ring-destructive focus-visible:ring-destructive"
                        )}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute inset-y-0 right-0 h-full px-3"
                      onClick={() => setShowApiKey(s => !s)}
                    >
                      {showApiKey ? <EyeOff /> : <Eye />}
                      <span className="sr-only">{showApiKey ? 'Hide API Key' : 'Show API Key'}</span>
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground px-1 text-center col-span-4 -mt-2">
                  Get your key from{" "}
                  <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="underline"
                  >
                      Google AI Studio
                  </a>.{" "}
                  Your key is saved in your browser's cache.
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
              <Button onClick={handleSave}>Save Changes</Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="about">
            <div className="py-4 space-y-4">
              <p className="text-sm text-foreground">
                This application is made by{' '}
                <Link href="/creations" className="font-bold underline hover:text-primary transition-colors" onClick={() => onOpenChange(false)}>
                    TheVibeCod3r
                </Link>
                {' '}to showcase the power of AI in everyday applications.
              </p>
              <p className="text-sm text-muted-foreground">
                Built with Next.js, Genkit, and ShadCN UI.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
