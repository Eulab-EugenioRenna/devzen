'use server';

import { pb, menuCollectionName } from '@/lib/pocketbase';
import { revalidateAndGetClient } from './utils';
import type { AppInfo } from '@/lib/types';
import type { RecordModel } from 'pocketbase';

function recordToAppInfo(record: RecordModel): AppInfo {
    const logoUrl = record.logo ? pb.files.getUrl(record, record.logo) : '';
    return {
        id: record.id,
        title: record.title,
        logo: record.logo ? logoUrl : 'Logo',
    };
}

export async function updateAppInfoAction(id: string, formData: FormData): Promise<AppInfo> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

    const data = formData;
    data.append('user', pb.authStore.model!.id);

    try {
      if (id) {
        const record = await pb.collection(menuCollectionName).update(id, data);
        return recordToAppInfo(record);
      } else {
        const record = await pb.collection(menuCollectionName).create(data);
        return recordToAppInfo(record);
      }
    } catch (e) {
        console.error("Impossibile salvare le info dell'app", e);
        throw new Error("Impossibile salvare le impostazioni dell'app.");
    }
}
