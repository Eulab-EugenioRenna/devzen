'use client';

import * as React from 'react';
import type { ChatMessage, DevelopIdeaOutput, IdeaPayload, Space } from '@/lib/types';
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
import { Loader2, Send, User, Bot, Sparkles, Copy, Check, Wand, ClipboardCheck, Link, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

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
            <div className={`relative max-w-2xl rounded-lg px-4 py-2 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
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

const FinalPlanView: React.FC<{ payload: IdeaPayload; conversation: ChatMessage[]; onCreate: (payload: IdeaPayload, conversation: ChatMessage[]) => void; isLoading: boolean; }> = ({ payload, conversation, onCreate, isLoading }) => {
  return (
    <div className="flex flex-col h-full">
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <Wand className="text-primary"/>
            Ecco il piano per la tua idea!
        </DialogTitle>
        <DialogDescription>
            Questo è il riepilogo dello spazio di lavoro che verrà creato.
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="flex-grow my-4 pr-4 -mr-4">
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold text-lg flex items-center mb-2">
                    <ClipboardCheck className="mr-2 h-5 w-5" />
                    Task Principali
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {payload.tasks.map((task, index) => (
                        <li key={index}>{task}</li>
                    ))}
                </ul>
            </div>
            <div>
                <h3 className="font-semibold text-lg flex items-center mb-2">
                    <Link className="mr-2 h-5 w-5" />
                    Strumenti Suggeriti
                </h3>
                <div className="flex flex-wrap gap-2">
                    {payload.suggestedTools.map((tool, index) => (
                        <Badge key={index} variant="secondary">{tool.title}</Badge>
                    ))}
                </div>
            </div>
        </div>
      </ScrollArea>
      <div className="mt-auto flex justify-end shrink-0">
          <Button onClick={() => onCreate(payload, conversation)} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crea Spazio di Lavoro
              <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
      </div>
    </div>
  );
};


interface DevelopIdeaDialogProps {
  onOpenChange: (open: boolean) => void;
  onWorkspaceCreated: (newSpace: Space) => void;
  developIdeaAction: (input: { history: ChatMessage[]; prompt: string; }) => Promise<DevelopIdeaOutput>;
  createWorkspaceAction: (payload: IdeaPayload, conversation: ChatMessage[]) => Promise<Space>;
}

export function DevelopIdeaDialog({ onOpenChange, onWorkspaceCreated, developIdeaAction, createWorkspaceAction }: DevelopIdeaDialogProps) {
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [input, setInput] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [isFinished, setIsFinished] = React.useState(false);
    const [finalPayload, setFinalPayload] = React.useState<IdeaPayload | null>(null);
    const scrollViewportRef = React.useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    
    // Initial fetch for welcome message
    React.useEffect(() => {
        const fetchWelcomeMessage = async () => {
            setIsLoading(true);
            try {
                const result = await developIdeaAction({ history: [], prompt: '' });
                setMessages([ { role: 'model', content: result.response } ]);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile avviare la chat AI.' });
                onOpenChange(false);
            } finally {
                setIsLoading(false);
            }
        };
        fetchWelcomeMessage();
    }, [developIdeaAction, onOpenChange, toast]);

    React.useEffect(() => {
        if (scrollViewportRef.current) {
            scrollViewportRef.current.scrollTo({ top: scrollViewportRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const result = await developIdeaAction({
                history: newMessages,
                prompt: input,
            });
            setMessages(prev => [...prev, { role: 'model', content: result.response }]);
            if (result.isFinished && result.finalPayload) {
                setIsFinished(true);
                setFinalPayload(result.finalPayload);
            }
        } catch (error) {
            console.error("Errore nello sviluppo dell'idea:", error);
            setMessages(prev => [...prev, { role: 'model', content: "Spiacente, si è verificato un errore. Riprova." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCreateWorkspace = async (payload: IdeaPayload, conversation: ChatMessage[]) => {
        setIsLoading(true);
        try {
            const newSpace = await createWorkspaceAction(payload, conversation);
            toast({
                title: 'Spazio Creato!',
                description: `Il nuovo spazio "${payload.spaceName}" è pronto.`,
            });
            onWorkspaceCreated(newSpace);
        } catch (error) {
            console.error("Errore nella creazione dello spazio dall'idea:", error);
            toast({
                variant: 'destructive',
                title: 'Errore',
                description: 'Impossibile creare lo spazio di lavoro.',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={true} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-6">
                 {isFinished && finalPayload ? (
                    <FinalPlanView 
                        payload={finalPayload} 
                        conversation={messages}
                        onCreate={handleCreateWorkspace} 
                        isLoading={isLoading}
                    />
                 ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="font-headline text-2xl flex items-center gap-2">
                                <Sparkles className="text-primary"/>
                                Sviluppa la Tua Idea
                            </DialogTitle>
                            <DialogDescription>
                                Conversa con l'AI per trasformare il tuo concetto in un piano d'azione.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-grow min-h-0 flex flex-col">
                            <ScrollArea className="flex-grow pr-4 -mr-4 my-4">
                                <div ref={scrollViewportRef} className="space-y-4">
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
                                    placeholder="Scrivi la tua idea o rispondi all'AI..."
                                    disabled={isLoading}
                                />
                                <Button type="submit" disabled={isLoading || !input.trim()}>
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    <span className="sr-only">Invia</span>
                                </Button>
                            </form>
                        </div>
                    </>
                 )}
            </DialogContent>
        </Dialog>
    );
}
