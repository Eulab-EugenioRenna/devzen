import Link from 'next/link';
import { SignupForm } from './signup-form';
import { getIcon } from '@/components/icons';

export default function SignupPage() {
    const AppIcon = getIcon('Logo');
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-muted">
             <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <AppIcon className="h-12 w-12 text-primary" />
                    </Link>
                    <h1 className="text-3xl font-bold font-headline mt-4">Crea il Tuo Account</h1>
                    <p className="text-muted-foreground">Inizia il tuo viaggio verso un'organizzazione potenziata dall'IA.</p>
                </div>
                <SignupForm />
                 <p className="mt-6 text-center text-sm text-muted-foreground">
                    Hai già un account?{' '}
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                        Accedi
                    </Link>
                </p>
            </div>
        </div>
    );
}
