
'use server';

import { usersCollectionName } from '@/lib/pocketbase';
import { createServerClient } from '@/lib/pocketbase_server';
import type { User } from '@/lib/types';
import type { RecordModel } from 'pocketbase';

function recordToUser(record: RecordModel): User {
    return {
        id: record.id,
        username: record.username,
        email: record.email,
        name: record.name,
        avatar: record.avatar,
        aiApiKey: record.aiApiKey,
        aiModel: record.aiModel,
    };
}

export async function getUserAction(): Promise<User | null> {
    const pb = await createServerClient();
    if (!pb.authStore.isValid || !pb.authStore.model) {
        return null;
    }
    try {
        const record = await pb.collection(usersCollectionName).getOne(pb.authStore.model.id);
        return recordToUser(record);
    } catch (e) {
        console.error("Impossibile recuperare l'utente", e);
        return null;
    }
}

export async function updateAiSettingsAction(data: { aiApiKey: string, aiModel: string }): Promise<User> {
    const pb = await createServerClient();
    if (!pb.authStore.isValid || !pb.authStore.model) {
        throw new Error("Utente non autenticato.");
    }
    try {
        const record = await pb.collection(usersCollectionName).update(pb.authStore.model.id, data);
        return recordToUser(record);
    } catch (e) {
        console.error("Impossibile aggiornare le impostazioni AI", e);
        throw new Error("Impossibile salvare le impostazioni AI.");
    }
}
