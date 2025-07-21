'use server';

import { spacesCollectionName, bookmarksCollectionName } from '@/lib/pocketbase';
import type { Space, SpaceLink } from '@/lib/types';
import { revalidateAndGetClient } from './utils';
import { recordToSpace, recordToSpaceItem } from './utils';

export async function createSpaceAction(data: { name: string, icon: string, category?: string }): Promise<Space> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

    const spaceData = { ...data, user: pb.authStore.model!.id };
    const record = await pb.collection(spacesCollectionName).create(spaceData);
    return recordToSpace(record);
}

export async function updateSpaceAction({ id, data }: { id: string, data: { name: string, icon: string, category?: string, isLink?: boolean } }): Promise<Space> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

    const record = await pb.collection(spacesCollectionName).update(id, { ...data, user: pb.authStore.model!.id });
    return recordToSpace(record);
}

export async function deleteSpaceAction({ id }: { id: string }): Promise<{ success: boolean }> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

    const incomingLinks = await pb.collection(bookmarksCollectionName).getFullList({
        filter: `user = "${pb.authStore.model!.id}" && tool.type = "space-link" && tool.linkedSpaceId = "${id}"`,
    });
    for (const item of incomingLinks) {
      await pb.collection(bookmarksCollectionName).delete(item.id);
    }

    const itemsInSpace = await pb.collection(bookmarksCollectionName).getFullList({
        filter: `user = "${pb.authStore.model!.id}" && tool.spaceId = "${id}"`,
    });
    
    for (const item of itemsInSpace) {
      if (item.tool.type === 'space-link' && item.tool.linkedSpaceId) {
        await pb.collection(spacesCollectionName).update(item.tool.linkedSpaceId, { isLink: false, user: pb.authStore.model!.id });
      }
    }

    for (const item of itemsInSpace) {
      await pb.collection(bookmarksCollectionName).delete(item.id);
    }

    await pb.collection(spacesCollectionName).delete(id);

    return { success: true };
}

export async function createSpaceLinkAction(space: Space, targetSpaceId: string): Promise<SpaceLink> {
  const pb = await revalidateAndGetClient();
  if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");
  
  const linkData = {
    tool: {
      type: 'space-link',
      name: space.name,
      icon: space.icon,
      linkedSpaceId: space.id,
      spaceId: targetSpaceId,
    },
    user: pb.authStore.model!.id,
  };
  
  const record = await pb.collection(bookmarksCollectionName).create(linkData);
  await pb.collection(spacesCollectionName).update(space.id, { isLink: true, user: pb.authStore.model!.id });

  const newLink = recordToSpaceItem(record);
  if (!newLink || newLink.type !== 'space-link') {
    throw new Error('Failed to create space link.');
  }
  return newLink as SpaceLink;
}

export async function unlinkSpaceAction({ id, linkedSpaceId }: { id: string, linkedSpaceId: string }): Promise<{ success: boolean }> {
    const pb = await revalidateAndGetClient();
    if (!pb.authStore.isValid) throw new Error("Utente non autenticato.");

    await pb.collection(bookmarksCollectionName).delete(id);
    await pb.collection(spacesCollectionName).update(linkedSpaceId, { isLink: false, user: pb.authStore.model!.id });
    return { success: true };
}
