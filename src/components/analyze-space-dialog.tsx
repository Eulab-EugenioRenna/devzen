'use client';

import * as React from 'react';
import type { Space, AnalyzeSpaceOutput, ChatMessage, Bookmark } from '@/lib/types';
import { chatInSpaceAction, saveChatAsNoteAction } from '@/app/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Loader2, Lightbulb, Tags, FileText, Send, User, Bot, Sparkles, Copy, Check, FileSignature } from 'lucide-react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';


interface AnalyzeSpaceDialogProps {
  space: Space;
  spaceBookmarks: Bookmark[];
  analysisResult: AnalyzeSpaceOutput | null;
  onOpenChange: (open: boolean) => void;
  isLoadingAnalysis: boolean;
  onNoteSaved: () => void;
}

const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
    const htmlContent = content
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc pl-5 mb-4">$1</ul>');
  
    return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

const ChatMessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const [isCopied, setIsCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const isUser = message.role === 'user';
    const Icon = isUser ? User : Bot;

    return (
        <div className={`group flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
            {!isUser && <Icon className="h-6 w-6 text-primary flex-shrink-0" />}
            <div className={`relative max-w-md rounded-lg px-4 py-2 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <MarkdownContent content={message.content} />
                 <Button
                    size="icon"
                    variant="ghost"
                    className={`absolute -top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 ${isUser ? '-left-8' : '-right-8'}`}
                    onClick={handleCopy}
                >
                    {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
            {isUser && <Icon className="h-6 w-6 text-muted-foreground flex-shrink-0" />}
        </div>
    );
};


const ChatInterface: React.FC<{ space: Space; spaceBookmarks: Bookmark[]; initialAnalysis: AnalyzeSpaceOutput; onNoteSaved: () => void; }> = ({ space, spaceBookmarks, initialAnalysis, onNoteSaved }) => {
    const [messages, setMessages] = React.useState<ChatMessage[]>([
        { role: 'model', content: "Ecco un'analisi del tuo spazio. Chiedimi qualsiasi cosa sul suo contenuto!" }
    ]);
    const [input, setInput] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const scrollViewportRef = React.useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        if (scrollViewportRef.current) {
            scrollViewportRef.current.scrollTo({ top: scrollViewportRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const newMessages: ChatMessage[] = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const result = await chatInSpaceAction({
                history: newMessages,
                context: {
                    spaceName: space.name,
                    bookmarks: spaceBookmarks.map(b => ({ title: b.title, summary: b.summary }))
                },
                question: input,
            });
            setMessages(prev => [...prev, { role: 'model', content: result.answer }]);
        } catch (error) {
            console.error("Errore nella chat:", error);
            setMessages(prev => [...prev, { role: 'model', content: "Spiacente, si è verificato un errore. Riprova." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveNote = async () => {
        setIsLoading(true);
        try {
            await saveChatAsNoteAction({ spaceId: space.id, messages });
            onNoteSaved();
            toast({
                title: 'Chat Salvata!',
                description: 'La conversazione è stata salvata come una nuova nota in questo spazio.',
            });
        } catch(error) {
            console.error("Errore nel salvataggio della nota:", error);
            toast({
                variant: 'destructive',
                title: 'Errore',
                description: 'Impossibile salvare la nota della chat.',
            })
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-full mt-4">
             <div className='flex justify-between items-center mb-2'>
                <DialogTitle className="font-headline text-2xl flex items-center gap-2">
                    <Sparkles className="text-primary"/>
                    Analisi dello Spazio: {space.name}
                </DialogTitle>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={handleSaveNote} disabled={isLoading}>
                                <FileSignature className="h-4 w-4" />
                                <span className="sr-only">Salva Chat come Nota</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Salva Chat come Nota</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
             <DialogDescription>
                L'AI ha analizzato il contenuto di questo spazio. Ora puoi conversare con essa per approfondire.
            </DialogDescription>
            
             <ScrollArea className="flex-grow pr-4 -mr-4 my-4">
                <div className="space-y-6 pb-4">
                    <div>
                        <h3 className="font-semibold text-lg flex items-center mb-2">
                            <FileText className="mr-2 h-5 w-5" />
                            Riepilogo Generale
                        </h3>
                        <div className="text-sm text-muted-foreground space-y-2">
                            <MarkdownContent content={initialAnalysis.analysis} />
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg flex items-center mb-2">
                            <Tags className="mr-2 h-5 w-5" />
                            Temi Chiave
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {initialAnalysis.keyThemes.map((theme, index) => (
                                <Badge key={index} variant="secondary">{theme}</Badge>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg flex items-center mb-2">
                            <Lightbulb className="mr-2 h-5 w-5" />
                            Suggerimenti
                        </h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                            {initialAnalysis.suggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                    {messages.map((message, index) => (
                        <ChatMessageBubble key={index} message={message} />
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                            <div className="max-w-md rounded-lg px-4 py-2 bg-muted flex items-center">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <form onSubmit={handleSubmit} className="mt-auto flex gap-2 shrink-0">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Chiedi qualcosa su questo spazio..."
                    disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="sr-only">Invia</span>
                </Button>
            </form>
        </div>
    );
};


export function AnalyzeSpaceDialog({ space, spaceBookmarks, analysisResult, onOpenChange, isLoadingAnalysis, onNoteSaved }: AnalyzeSpaceDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-6">
        <div className="flex-grow min-h-0">
          {isLoadingAnalysis ? (
            <>
            <DialogHeader>
                <DialogTitle className="font-headline text-2xl flex items-center gap-2">
                    <Sparkles className="text-primary"/>
                    Analisi dello Spazio: {space.name}
                </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p className="text-lg font-medium">Analisi in corso...</p>
              <p>L'AI sta esaminando i tuoi segnalibri.</p>
            </div>
            </>
          ) : analysisResult ? (
            <ChatInterface space={space} spaceBookmarks={spaceBookmarks} initialAnalysis={analysisResult} onNoteSaved={onNoteSaved} />
          ) : (
             <>
            <DialogHeader>
                 <DialogTitle className="font-headline text-2xl flex items-center gap-2">
                    <Sparkles className="text-primary"/>
                    Analisi dello Spazio: {space.name}
                </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full">
                <p>Impossibile caricare l'analisi.</p>
            </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
