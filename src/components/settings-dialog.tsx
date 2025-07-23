
'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useDashboard } from './bookmark-dashboard-provider';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Download, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { getIcon } from './icons';

// ===== Personalizza Tab =====

const appInfoSchema = z.object({
  title: z.string().min(1, { message: 'Il nome dell\'app è obbligatorio.' }),
  logo: z.any().optional(),
});

const PersonalizeTab = () => {
  const { appInfo, handleAppInfoSave } = useDashboard();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof appInfoSchema>>({
    resolver: zodResolver(appInfoSchema),
    defaultValues: {
      title: appInfo.title,
    },
  });

  const onSubmit = async (values: z.infer<typeof appInfoSchema>) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', values.title);
    if (values.logo && values.logo.length > 0) {
      formData.append('logo', values.logo[0]);
    }
    await handleAppInfoSave(formData);
    setIsSubmitting(false);
  };

  const isLogoUrl = appInfo.logo?.startsWith('http');
  const IconComponent = !isLogoUrl ? getIcon(appInfo.logo) : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-4">
            <div className="shrink-0">
                {isLogoUrl ? (
                    <img src={appInfo.logo} alt="logo attuale" className="h-16 w-16 rounded-md object-cover border p-1" />
                ) : (
                    IconComponent && <IconComponent className="h-16 w-16" />
                )}
            </div>
            <FormField
              control={form.control}
              name="logo"
              render={({ field: { onChange, onBlur, name, ref } }) => (
                <FormItem className="flex-grow">
                  <FormLabel>Carica Nuovo Logo</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => onChange(e.target.files)}
                      onBlur={onBlur}
                      name={name}
                      ref={ref}
                      className="file:text-primary file:font-semibold"
                     />
                  </FormControl>
                  <FormDescription>
                    Lascia vuoto per mantenere il logo attuale.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome App</FormLabel>
              <FormControl>
                <Input placeholder="es. DevZen" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salva Personalizzazione
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

// ===== Esporta Tab =====

const ExportTab = () => {
    const { handleExport } = useDashboard();
    const [isExporting, setIsExporting] = React.useState(false);

    const onExport = async () => {
        setIsExporting(true);
        await handleExport();
        setIsExporting(false);
    }
    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Esporta l'intera configurazione del tuo spazio di lavoro, inclusi tutti gli spazi, le cartelle e i segnalibri, in un unico file JSON. Puoi utilizzare questo file come backup o per importare il tuo spazio di lavoro in un'altra istanza.
            </p>
            <DialogFooter>
                <Button onClick={onExport} disabled={isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Esporta Spazio di Lavoro
                </Button>
            </DialogFooter>
        </div>
    )
}

// ===== Connessioni Tab =====

const models = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-1.0-pro",
];

const connectionsSchema = z.object({
  aiApiKey: z.string().min(1, { message: 'La chiave API è obbligatoria.' }),
  aiModel: z.string().min(1, { message: 'Devi selezionare un modello.' }),
});

const ConnectionsTab = () => {
    const { user, handleAiSettingsSave } = useDashboard();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [showKey, setShowKey] = React.useState(false);

    const form = useForm<z.infer<typeof connectionsSchema>>({
        resolver: zodResolver(connectionsSchema),
        defaultValues: {
            aiApiKey: user?.aiApiKey ?? '',
            aiModel: user?.aiModel ?? models[0],
        },
    });

    const onSubmit = async (values: z.infer<typeof connectionsSchema>) => {
        setIsSubmitting(true);
        await handleAiSettingsSave(values);
        setIsSubmitting(false);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="aiApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chiave API Google AI</FormLabel>
                       <div className="relative">
                            <FormControl>
                                <Input 
                                    type={showKey ? 'text' : 'password'}
                                    placeholder="Inserisci la tua chiave API..."
                                    {...field}
                                    className="pr-10"
                                />
                            </FormControl>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setShowKey(!showKey)}
                            >
                                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">{showKey ? 'Nascondi' : 'Mostra'} chiave</span>
                            </Button>
                       </div>
                      <FormDescription>
                        Puoi ottenere la tua chiave da <a href="https://aistudio.google.com/keys" target="_blank" rel="noopener noreferrer" className="underline text-primary">Google AI Studio</a>.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="aiModel"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Modello AI</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleziona un modello..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {models.map((model) => (
                                        <SelectItem key={model} value={model}>
                                        {model}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <FormDescription>
                                Gemini 1.5 Flash è consigliato per la maggior parte dei casi d'uso.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salva Connessioni
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    )
}

// ===== Main Dialog Component =====

interface SettingsDialogProps {
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ onOpenChange }: SettingsDialogProps) {
  const { user } = useDashboard();
  const defaultTab = user && !user.aiApiKey ? "connections" : "personalize";
  
  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Impostazioni</DialogTitle>
          <DialogDescription>
            Gestisci le impostazioni della tua applicazione e le connessioni AI.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} className="pt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personalize">Personalizza</TabsTrigger>
            <TabsTrigger value="export">Esporta</TabsTrigger>
            <TabsTrigger value="connections">Connessioni</TabsTrigger>
          </TabsList>
          <TabsContent value="personalize" className="pt-6">
            <PersonalizeTab />
          </TabsContent>
          <TabsContent value="export" className="pt-6">
            <ExportTab />
          </TabsContent>
          <TabsContent value="connections" className="pt-6">
            <ConnectionsTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
