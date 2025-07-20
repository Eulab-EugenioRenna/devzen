
'use client';

import * as React from 'react';
import type { Space, SpaceItem } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Check, Send, Mail } from 'lucide-react';

// A simple SVG icon for WhatsApp
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.316 1.906 6.03l-.419 1.563 1.597-.42z" />
    </svg>
);

// A simple SVG icon for Facebook
const FacebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v2.385z" />
    </svg>
);

interface ShareDialogProps {
  item: SpaceItem | Space;
  onOpenChange: (open: boolean) => void;
  onWebhookSent: (url: string, data: any) => Promise<{ success: boolean }>;
}

export function ShareDialog({ item, onOpenChange, onWebhookSent }: ShareDialogProps) {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

  const itemName = 'name' in item ? item.name : item.title;
  const itemType = 'type' in item ? item.type : 'space';
  const itemJson = JSON.stringify(item, null, 2);

  const shareText = `Dai un'occhiata a questo ${itemType}: ${itemName}`;
  const shareUrl = 'url' in item ? item.url : window.location.href; // Fallback to current page for folders/spaces

  const handleCopyJson = () => {
    navigator.clipboard.writeText(itemJson);
    setIsCopied(true);
    toast({ title: 'JSON Copiato!', description: `I dati per "${itemName}" sono stati copiati negli appunti.` });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendWebhook = async () => {
    if (!webhookUrl) {
      toast({ variant: 'destructive', title: 'URL Webhook Mancante', description: 'Inserisci un URL valido per il webhook.' });
      return;
    }
    setIsSending(true);
    try {
      await onWebhookSent(webhookUrl, item);
      toast({ title: 'Webhook Inviato!', description: `I dati per "${itemName}" sono stati inviati con successo.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Si è verificato un errore sconosciuto.';
      toast({ variant: 'destructive', title: 'Errore Invio Webhook', description: message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Condividi "{itemName}"</DialogTitle>
          <DialogDescription>
            Condividi questo elemento tramite webhook o social media.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Webhook Section */}
          <div className="space-y-2">
            <Label htmlFor="webhook-url" className="font-semibold">Invia a Webhook</Label>
            <div className="flex items-center gap-2">
              <Input
                id="webhook-url"
                placeholder="https://your-webhook-url.com/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                disabled={isSending}
              />
              <Button onClick={handleSendWebhook} disabled={isSending}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Invia</span>
              </Button>
            </div>
          </div>

          {/* Social & Email Sharing */}
          <div className="space-y-2">
            <Label className="font-semibold">Condividi tramite link</Label>
            <div className="flex justify-start gap-2">
                <Button variant="outline" asChild>
                    <a href={`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`} className="flex items-center gap-2">
                        <Mail /> Email
                    </a>
                </Button>
                <Button variant="outline" asChild>
                    <a href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <WhatsAppIcon /> WhatsApp
                    </a>
                </Button>
                 <Button variant="outline" asChild>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <FacebookIcon /> Facebook
                    </a>
                </Button>
            </div>
          </div>

          {/* JSON Data Section */}
          <div className="space-y-2">
            <Label htmlFor="json-data" className="font-semibold">Copia Dati (JSON)</Label>
            <div className="relative">
              <Textarea
                id="json-data"
                readOnly
                value={itemJson}
                className="h-32 font-mono text-xs bg-muted"
              />
              <Button
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={handleCopyJson}
              >
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copia JSON</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
