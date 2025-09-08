
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowUpRight, Home } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const creations = [
    {
        title: 'VerdantWise',
        description: 'An AI-powered assistant to help you level up your garden game. Identify plants, diagnose problems, and get expert advice.',
        link: 'https://verdantwise.vercel.app/',
        image: '/verdantwise-screenshot.jpg',
        internal: false,
    },
    {
        title: 'RecipeSavvy',
        description: 'Your AI-powered recipe assistant. Find recipes with what you have, get cooking help, and create variations.',
        link: 'https://recipesavvy.vercel.app/',
        image: '/recipesavvy-screenshot.jpg',
        internal: false,
    },
]

export default function CreationsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to RecipeSavvy
                    </Link>
                </div>
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-headline text-primary-foreground tracking-wider">Creations by TheVibeCod3r</h1>
                    <p className="text-muted-foreground font-body mt-2">A collection of apps and experiments.</p>
                </div>
                
                <div className="grid gap-8">
                    {creations.map((creation) => (
                        <Card key={creation.title} className="overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                             <div className="aspect-video bg-muted flex items-center justify-center">
                                <Image 
                                    src="https://picsum.photos/1280/720" 
                                    alt={`${creation.title} screenshot`}
                                    width={1280}
                                    height={720}
                                    className="object-cover w-full h-full"
                                    data-ai-hint="website ui screenshot"
                                />
                            </div>
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">{creation.title}</CardTitle>
                                <CardDescription>{creation.description}</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                {creation.internal ? (
                                    <Link href={creation.link} className="w-full">
                                        <Button className="w-full">
                                            <Home className="mr-2 h-4 w-4" />
                                            Go to App
                                        </Button>
                                    </Link>
                                ) : (
                                     <a href={creation.link} target="_blank" rel="noopener noreferrer" className="w-full">
                                        <Button className="w-full">
                                            Go to App
                                            <ArrowUpRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </a>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
