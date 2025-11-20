/**
 * Custom Fields Service
 *
 * Manages Sources, Campaigns, and other custom fields
 */

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type {
  Source,
  CreateSourceInput,
  Campaign,
  CreateCampaignInput,
} from '../types/customFields.types';

const SOURCES_COLLECTION = 'sources';
const CAMPAIGNS_COLLECTION = 'campaigns';

// ============ SOURCES ============

export async function getSources(): Promise<Source[]> {
  try {
    const q = query(
      collection(db, SOURCES_COLLECTION),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const sources: Source[] = [];

    querySnapshot.forEach((doc) => {
      sources.push({ id: doc.id, ...doc.data() } as Source);
    });

    return sources;
  } catch (error) {
    console.error('Error getting sources:', error);
    throw new Error('Erro ao buscar fontes');
  }
}

export async function getSource(sourceId: string): Promise<Source | null> {
  try {
    const docRef = doc(db, SOURCES_COLLECTION, sourceId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as Source;
  } catch (error) {
    console.error('Error getting source:', error);
    throw new Error('Erro ao buscar fonte');
  }
}

export async function createSource(data: CreateSourceInput): Promise<string> {
  try {
    const sourceData = {
      ...data,
      isActive: data.isActive ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, SOURCES_COLLECTION), sourceData);
    console.log('✅ Source created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating source:', error);
    throw new Error('Erro ao criar fonte');
  }
}

export async function updateSource(
  sourceId: string,
  data: Partial<CreateSourceInput>
): Promise<void> {
  try {
    const docRef = doc(db, SOURCES_COLLECTION, sourceId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Source updated:', sourceId);
  } catch (error) {
    console.error('Error updating source:', error);
    throw new Error('Erro ao atualizar fonte');
  }
}

export async function deleteSource(sourceId: string): Promise<void> {
  try {
    // Soft delete - just mark as inactive
    await updateSource(sourceId, { isActive: false });
    console.log('✅ Source deactivated:', sourceId);
  } catch (error) {
    console.error('Error deleting source:', error);
    throw new Error('Erro ao deletar fonte');
  }
}

// ============ CAMPAIGNS ============

export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const q = query(
      collection(db, CAMPAIGNS_COLLECTION),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const campaigns: Campaign[] = [];

    querySnapshot.forEach((doc) => {
      campaigns.push({ id: doc.id, ...doc.data() } as Campaign);
    });

    return campaigns;
  } catch (error) {
    console.error('Error getting campaigns:', error);
    throw new Error('Erro ao buscar campanhas');
  }
}

export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  try {
    const docRef = doc(db, CAMPAIGNS_COLLECTION, campaignId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as Campaign;
  } catch (error) {
    console.error('Error getting campaign:', error);
    throw new Error('Erro ao buscar campanha');
  }
}

export async function createCampaign(data: CreateCampaignInput): Promise<string> {
  try {
    const campaignData = {
      ...data,
      isActive: data.isActive ?? true,
      startDate: data.startDate ? data.startDate : null,
      endDate: data.endDate ? data.endDate : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, CAMPAIGNS_COLLECTION), campaignData);
    console.log('✅ Campaign created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw new Error('Erro ao criar campanha');
  }
}

export async function updateCampaign(
  campaignId: string,
  data: Partial<CreateCampaignInput>
): Promise<void> {
  try {
    const docRef = doc(db, CAMPAIGNS_COLLECTION, campaignId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Campaign updated:', campaignId);
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw new Error('Erro ao atualizar campanha');
  }
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  try {
    // Soft delete - just mark as inactive
    await updateCampaign(campaignId, { isActive: false });
    console.log('✅ Campaign deactivated:', campaignId);
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw new Error('Erro ao deletar campanha');
  }
}
