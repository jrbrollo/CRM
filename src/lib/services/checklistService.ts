/**
 * Checklist Service
 *
 * Manages conditional checklists with required actions, questions, and data.
 * Critical for workflow progression control and compliance tracking.
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Checklist,
  ChecklistItem,
  CreateChecklistInput,
  UpdateChecklistInput,
  UpdateChecklistItemInput,
  ChecklistTemplate,
  CreateChecklistTemplateInput,
} from '../types/checklist.types';

const CHECKLISTS_COLLECTION = 'checklists';
const TEMPLATES_COLLECTION = 'checklist_templates';

/**
 * Calculate checklist progress
 */
function calculateProgress(items: ChecklistItem[]): {
  totalItems: number;
  completedItems: number;
  requiredItems: number;
  completedRequiredItems: number;
  progressPercentage: number;
  canProgress: boolean;
} {
  const totalItems = items.length;
  const completedItems = items.filter(
    (item) => item.status === 'completed'
  ).length;

  const requiredItems = items.filter((item) => item.required).length;
  const completedRequiredItems = items.filter(
    (item) => item.required && item.status === 'completed'
  ).length;

  const progressPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const canProgress = completedRequiredItems === requiredItems;

  return {
    totalItems,
    completedItems,
    requiredItems,
    completedRequiredItems,
    progressPercentage,
    canProgress,
  };
}

/**
 * Get all checklists for an entity
 */
export async function getChecklistsForEntity(
  entityType: 'workflow' | 'deal' | 'contact',
  entityId: string
): Promise<Checklist[]> {
  try {
    const q = query(
      collection(db, CHECKLISTS_COLLECTION),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const checklists: Checklist[] = [];
    querySnapshot.forEach((doc) => {
      checklists.push({
        id: doc.id,
        ...doc.data(),
      } as Checklist);
    });

    return checklists;
  } catch (error) {
    console.error('Error getting checklists:', error);
    throw new Error('Erro ao buscar checklists');
  }
}

/**
 * Get a single checklist by ID
 */
export async function getChecklist(
  checklistId: string
): Promise<Checklist | null> {
  try {
    const docRef = doc(db, CHECKLISTS_COLLECTION, checklistId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Checklist;
  } catch (error) {
    console.error('Error getting checklist:', error);
    throw new Error('Erro ao buscar checklist');
  }
}

/**
 * Create a new checklist
 */
export async function createChecklist(
  data: CreateChecklistInput
): Promise<string> {
  try {
    // Generate IDs for items
    const items: ChecklistItem[] = data.items.map((item, index) => ({
      ...item,
      id: crypto.randomUUID(),
      status: 'pending',
      order: index,
    }));

    // Calculate initial progress
    const progress = calculateProgress(items);

    const checklistData = {
      name: data.name,
      description: data.description,
      entityType: data.entityType,
      entityId: data.entityId,
      items,
      ...progress,
      createdBy: data.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, CHECKLISTS_COLLECTION),
      checklistData
    );

    console.log('✅ Checklist created successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating checklist:', error);
    throw new Error('Erro ao criar checklist');
  }
}

/**
 * Update a checklist
 */
export async function updateChecklist(
  checklistId: string,
  data: UpdateChecklistInput
): Promise<void> {
  try {
    const docRef = doc(db, CHECKLISTS_COLLECTION, checklistId);

    // If items are being updated, recalculate progress
    let updateData: any = { ...data };

    if (data.items) {
      const progress = calculateProgress(data.items);
      updateData = { ...updateData, ...progress };
    }

    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Checklist updated successfully:', checklistId);
  } catch (error) {
    console.error('Error updating checklist:', error);
    throw new Error('Erro ao atualizar checklist');
  }
}

/**
 * Delete a checklist
 */
export async function deleteChecklist(checklistId: string): Promise<void> {
  try {
    const docRef = doc(db, CHECKLISTS_COLLECTION, checklistId);
    await deleteDoc(docRef);

    console.log('✅ Checklist deleted successfully:', checklistId);
  } catch (error) {
    console.error('Error deleting checklist:', error);
    throw new Error('Erro ao deletar checklist');
  }
}

/**
 * Update a single checklist item
 */
export async function updateChecklistItem(
  checklistId: string,
  itemId: string,
  updates: UpdateChecklistItemInput,
  userId?: string
): Promise<void> {
  try {
    const checklist = await getChecklist(checklistId);
    if (!checklist) {
      throw new Error('Checklist não encontrado');
    }

    const items = checklist.items.map((item) => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };

        // If marking as completed, add timestamp
        if (updates.status === 'completed' && !item.completedAt) {
          updatedItem.completedAt = Timestamp.now();
          updatedItem.completedBy = userId || updates.completedBy;
        }

        return updatedItem;
      }
      return item;
    });

    await updateChecklist(checklistId, { items });

    console.log('✅ Checklist item updated:', itemId);
  } catch (error) {
    console.error('Error updating checklist item:', error);
    throw new Error('Erro ao atualizar item do checklist');
  }
}

/**
 * Complete a checklist item
 */
export async function completeChecklistItem(
  checklistId: string,
  itemId: string,
  userId: string,
  answer?: any
): Promise<void> {
  try {
    const updates: UpdateChecklistItemInput = {
      status: 'completed',
      completedBy: userId,
    };

    // Store answer if provided
    if (answer !== undefined) {
      updates.config = { answer };
    }

    await updateChecklistItem(checklistId, itemId, updates, userId);
  } catch (error) {
    console.error('Error completing checklist item:', error);
    throw new Error('Erro ao completar item do checklist');
  }
}

/**
 * Check if checklist allows progression
 * (all required items are completed)
 */
export async function canProgressWithChecklist(
  checklistId: string
): Promise<boolean> {
  try {
    const checklist = await getChecklist(checklistId);
    if (!checklist) {
      return false;
    }

    return checklist.canProgress;
  } catch (error) {
    console.error('Error checking checklist progression:', error);
    return false;
  }
}

/**
 * Get incomplete required items
 */
export async function getIncompleteRequiredItems(
  checklistId: string
): Promise<ChecklistItem[]> {
  try {
    const checklist = await getChecklist(checklistId);
    if (!checklist) {
      return [];
    }

    return checklist.items.filter(
      (item) => item.required && item.status !== 'completed'
    );
  } catch (error) {
    console.error('Error getting incomplete required items:', error);
    return [];
  }
}

/**
 * Create a checklist from a template
 */
export async function createChecklistFromTemplate(
  templateId: string,
  entityType: 'workflow' | 'deal' | 'contact',
  entityId: string,
  createdBy: string
): Promise<string> {
  try {
    const template = await getChecklistTemplate(templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    return createChecklist({
      name: template.name,
      description: template.description,
      entityType,
      entityId,
      items: template.items,
      createdBy,
    });
  } catch (error) {
    console.error('Error creating checklist from template:', error);
    throw new Error('Erro ao criar checklist a partir do template');
  }
}

// ==================== CHECKLIST TEMPLATES ====================

/**
 * Get all checklist templates
 */
export async function getChecklistTemplates(
  category?: string
): Promise<ChecklistTemplate[]> {
  try {
    let q = query(
      collection(db, TEMPLATES_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    if (category) {
      q = query(q, where('category', '==', category));
    }

    const querySnapshot = await getDocs(q);

    const templates: ChecklistTemplate[] = [];
    querySnapshot.forEach((doc) => {
      templates.push({
        id: doc.id,
        ...doc.data(),
      } as ChecklistTemplate);
    });

    return templates;
  } catch (error) {
    console.error('Error getting checklist templates:', error);
    throw new Error('Erro ao buscar templates de checklist');
  }
}

/**
 * Get a single checklist template
 */
export async function getChecklistTemplate(
  templateId: string
): Promise<ChecklistTemplate | null> {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as ChecklistTemplate;
  } catch (error) {
    console.error('Error getting checklist template:', error);
    throw new Error('Erro ao buscar template de checklist');
  }
}

/**
 * Create a checklist template
 */
export async function createChecklistTemplate(
  data: CreateChecklistTemplateInput
): Promise<string> {
  try {
    const templateData = {
      name: data.name,
      description: data.description,
      category: data.category,
      items: data.items,
      isPublic: data.isPublic || false,
      createdBy: data.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, TEMPLATES_COLLECTION),
      templateData
    );

    console.log('✅ Checklist template created successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating checklist template:', error);
    throw new Error('Erro ao criar template de checklist');
  }
}

/**
 * Delete a checklist template
 */
export async function deleteChecklistTemplate(
  templateId: string
): Promise<void> {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    await deleteDoc(docRef);

    console.log('✅ Checklist template deleted successfully:', templateId);
  } catch (error) {
    console.error('Error deleting checklist template:', error);
    throw new Error('Erro ao deletar template de checklist');
  }
}
