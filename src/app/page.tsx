import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookMarked, Zap } from 'lucide-react';
import { getIcon } from '@/components/icons';

export default function LandingPage() {
  const AppIcon = getIcon('Logo');

  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <AppIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline text-foreground">DevZen</h1>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Accedi</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">
              Registrati <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 flex items-center">
        <div className="container mx-auto px-6 text-center">
          <div className="bg-primary/10 text-primary font-semibold py-1 px-3 rounded-full inline-block mb-4 border border-primary/20">
            Il tuo hub di conoscenza potenziato dall'IA
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold font-headline text-foreground mb-4 leading-tight">
            Organizza i tuoi link. <br /> Scatena le tue idee.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            DevZen trasforma il modo in cui salvi e interagisci con i contenuti web. Smetti di perdere link e inizia a costruire una base di conoscenza intelligente e ricercabile.
          </p>
          <div className="flex justify-center gap-4 mb-12">
            <Button size="lg" asChild>
              <Link href="/signup">Inizia Gratuitamente</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Vai alla Dashboard</Link>
            </Button>
          </div>
        </div>
      </main>

       <section className="bg-muted py-20">
        <div className="container mx-auto px-6">
            <h3 className="text-3xl font-bold text-center font-headline mb-12">Perché scegliere DevZen?</h3>
            <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="bg-card p-8 rounded-lg shadow-sm">
                    <BookMarked className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h4 className="text-xl font-semibold mb-2">Organizzazione Intelligente</h4>
                    <p className="text-muted-foreground">Crea "Spazi" di lavoro per ogni progetto o interesse. L'IA ti aiuta a categorizzare e riassumere ogni link che salvi.</p>
                </div>
                <div className="bg-card p-8 rounded-lg shadow-sm">
                    <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h4 className="text-xl font-semibold mb-2">Strumenti AI Integrati</h4>
                    <p className="text-muted-foreground">Non solo un posto per i tuoi link. Chatta con i tuoi contenuti, analizza le tue collezioni e genera nuove idee.</p>
                </div>
                 <div className="bg-card p-8 rounded-lg shadow-sm">
                    <ArrowRight className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h4 className="text-xl font-semibold mb-2">Flusso di lavoro efficiente</h4>
                    <p className="text-muted-foreground">Dalla generazione di spazi di lavoro automatici alla ricerca semantica, tutto è progettato per farti risparmiare tempo.</p>
                </div>
            </div>
        </div>
      </section>

      <footer className="container mx-auto px-6 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} DevZen. Tutti i diritti riservati.</p>
      </footer>
    </div>
  );
}
