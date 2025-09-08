
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
import { Eye, EyeOff, Moon, Sun, Check, ChevronsUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { languages } from "@/lib/i18n"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"

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
  const { t, i18n } = useTranslation();
  const [localApiKey, setLocalApiKey] = useState(apiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const { toast } = useToast();

  const [langPopoverOpen, setLangPopoverOpen] = useState(false);

  useEffect(() => {
    setLocalApiKey(apiKey || "");
    setIsApiKeyMissing(!apiKey);
  }, [apiKey, isOpen]);
  
  const handleSave = () => {
    if (localApiKey) {
        localStorage.setItem("googleApiKey", localApiKey);
        onApiKeyChange(localApiKey);
        toast({
            title: t('settingsSaved'),
            description: t('settingsSavedDescription'),
        });
    } else {
        localStorage.removeItem("googleApiKey");
        onApiKeyChange(null);
         toast({
            title: t('apiKeyRemoved'),
            description: t('apiKeyRemovedDescription'),
        });
    }
    onOpenChange(false);
  }

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setLangPopoverOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('settings')}</DialogTitle>
          <DialogDescription>
            {t('manageSettings')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api-key" className="text-right">
                {t('apiKey')}
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
                  <span className="sr-only">{showApiKey ? t('hideApiKey') : t('showApiKey')}</span>
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground px-1 text-center col-span-4 -mt-2">
              {t('getApiKeyPrompt')}{" "}
              <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline"
              >
                  {t('googleAiStudio')}
              </a>.{" "}
              {t('cacheWarningApiKey')}
            </p>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
             <Label className="text-right">{t('model')}</Label>
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
                {t('theme')}
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
          <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t('language')}</Label>
              <div className="col-span-3">
                 <Popover open={langPopoverOpen} onOpenChange={setLangPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={langPopoverOpen}
                        className="w-full justify-between"
                      >
                        {languages.find((lang) => lang.code === i18n.language)?.name || i18n.language}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder={t('searchLanguage')} />
                        <CommandList>
                          <CommandEmpty>{t('noLanguageFound')}</CommandEmpty>
                          <CommandGroup>
                            {languages.map((lang) => (
                              <CommandItem
                                key={lang.code}
                                value={lang.name}
                                onSelect={() => handleLanguageChange(lang.code)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    i18n.language === lang.code ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {lang.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
              </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>{t('saveChanges')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
