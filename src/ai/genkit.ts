import { genkit, configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { getUserAction } from '@/app/actions/user';
import type { User } from '@/lib/types';

let userCache: User | null = null;
let userCacheTimestamp = 0;

async function getCachedUser(): Promise<User | null> {
    const now = Date.now();
    // Cache for 1 second to avoid refetching on multiple concurrent AI calls
    if (userCache && (now - userCacheTimestamp < 1000)) { 
        return userCache;
    }
    try {
        userCache = await getUserAction();
        userCacheTimestamp = now;
        return userCache;
    } catch (e) {
        console.error("Failed to fetch user in getCachedUser", e);
        return null;
    }
}

export async function getInitializedAI() {
    const user = await getCachedUser();

    const apiKey = user?.aiApiKey;
    const modelName = user?.aiModel || 'googleai/gemini-1.5-flash-latest';

    if (!apiKey || !modelName) {
        throw new Error("Per favore, configura la tua chiave API AI e il modello nelle impostazioni per utilizzare questa funzionalità.");
    }
    
    return genkit({
        plugins: [googleAI({ apiKey })],
        model: modelName,
    });
}
