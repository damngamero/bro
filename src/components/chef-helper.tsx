"use client";

import { explainCulinaryTerm } from "@/ai/flows/explain-culinary-term";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Bot, LoaderCircle, Send, Sparkles, User } from "lucide-react";
import { FormEvent, useState, useRef, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { v4 as uuidv4 } from 'uuid';

interface ChefHelperProps {
  recipeContext: string;
  apiKey: string;
}

type Message = {
  id: string;
  role: "user" | "bot";
  text: string;
};

export function ChefHelper({ recipeContext, apiKey }: ChefHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: uuidv4(), role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await explainCulinaryTerm({
        term: input,
        recipeContext,
        apiKey,
      });
      const botMessage: Message = { id: uuidv4(), role: "bot", text: result.explanation };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Failed to get explanation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Sorry, I couldn't fetch an explanation. Please try again.",
      });
      setMessages(messages => messages.slice(0, -1)); // Remove the user message on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-lg z-50 bg-primary hover:bg-primary/90"
        >
          <Bot className="h-6 w-6" />
          <span className="sr-only">Open Chef's Helper</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-headline text-2xl">
            <Sparkles className="text-accent"/>
            Chef's Helper
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 flex flex-col-reverse overflow-hidden">
            <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                <div className="space-y-6 py-4">
                    {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex items-start gap-3 ${
                        message.role === "user" ? "justify-end" : ""
                        }`}
                    >
                        {message.role === "bot" && (
                        <div className="bg-primary rounded-full p-2">
                            <Bot className="h-6 w-6 text-primary-foreground" />
                        </div>
                        )}
                        <div
                        className={`rounded-lg p-3 max-w-sm lg:max-w-md ${
                            message.role === "user"
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-muted"
                        }`}
                        >
                        <p className="text-sm">{message.text}</p>
                        </div>
                        {message.role === "user" && (
                        <div className="bg-blue-500 text-white rounded-full p-2">
                             <User className="h-6 w-6" />
                        </div>
                        )}
                    </div>
                    ))}
                    {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
                         <div className="flex items-start gap-3">
                            <div className="bg-primary rounded-full p-2">
                                <Bot className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div className="bg-muted rounded-lg p-3 flex items-center space-x-2">
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                <span className="text-sm text-muted-foreground">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
        <form
          onSubmit={handleSubmit}
          className="relative mt-4 border-t pt-4"
        >
          <TextareaAutosize
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="e.g., What does 'sauté' mean?"
            className="w-full resize-none rounded-md border border-input p-2 pr-20 text-sm focus:ring-ring focus:ring-1"
            maxRows={5}
            minRows={1}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 transform mt-2"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
