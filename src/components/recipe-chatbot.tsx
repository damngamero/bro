"use client"

import { useState, FormEvent, useRef, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageSquare,
  Send,
  LoaderCircle,
  Sparkles,
  User,
  Bot,
} from "lucide-react"
import { explainCulinaryTerm } from "@/ai/flows/explain-culinary-term"
import { type RecipeDetailsOutput } from "@/ai/flows/generate-recipe-details"

type ChatMessage = {
  role: "user" | "bot"
  content: string
}

interface RecipeChatbotProps {
  recipe: RecipeDetailsOutput & { name: string };
  apiKey: string;
}

export function RecipeChatbot({ recipe, apiKey }: RecipeChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!currentMessage.trim()) return

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: currentMessage },
    ]
    setMessages(newMessages)
    setCurrentMessage("")
    setIsLoading(true)

    try {
      const result = await explainCulinaryTerm({
        term: currentMessage,
        recipeContext: {
          name: recipe.name,
          description: recipe.description,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
        },
        apiKey,
      })
      setMessages([
        ...newMessages,
        { role: "bot", content: result.explanation },
      ])
    } catch (error) {
      console.error("Error explaining term:", error)
      setMessages([
        ...newMessages,
        {
          role: "bot",
          content: "Sorry, I had trouble understanding that. Could you try rephrasing?",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg"
          size="icon"
        >
          <MessageSquare className="h-8 w-8" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot /> Culinary Assistant
          </SheetTitle>
          <SheetDescription>
            Ask me anything about the terms in this recipe!
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow pr-4 -mr-6" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  message.role === "user" ? "justify-end" : ""
                }`}
              >
                {message.role === "bot" && (
                  <div className="bg-primary rounded-full p-2">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <div className="bg-secondary rounded-full p-2">
                    <User className="h-5 w-5 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                 <div className="bg-primary rounded-full p-2">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-4">
          <Input
            value={currentMessage}
            onChange={e => setCurrentMessage(e.target.value)}
            placeholder="What does 'fragrant' mean?"
            className="flex-grow"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
