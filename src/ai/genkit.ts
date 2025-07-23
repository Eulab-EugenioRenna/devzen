import { genkit, configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { getUserAction } from '@/app/actions/user';
import { User } from '@/lib/types';

let userCache: User | null = null;
let userCacheTimestamp = 0;

async function getCachedUser(): Promise<User | null> {
    const now = Date.now();
    if (userCache && (now - userCacheTimestamp < 1000)) { // Cache per 1 secondo
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

    const apiKey = user?.aiApiKey || process.env.GEMINI_API_KEY;
    const modelName = user?.aiModel || 'googleai/gemini-1.5-flash-latest';

    if (apiKey) {
        return genkit({
            plugins: [googleAI({ apiKey })],
            model: modelName,
        });
    }

    // Fallback se nessuna chiave è disponibile
    return genkit({
        plugins: [googleAI()],
        model: modelName,
    });
}
