/**
 * Deal Service
 *
 * Handles all CRUD operations for deals/opportunities in Firestore.
 * Includes pipeline management and deal progression logic.
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Deal,
  CreateDealInput,
  UpdateDealInput,
  DealFilters,
} from '../types';
import {
  createDealSchema,
  updateDealSchema,
  dealFiltersSchema,
} from '../validators';
import { getActiveWorkflows } from './workflowService';
import {
  handleDealCreated,
  handleDealStageChanged,
  handleDealWon,
  handleDealLost,
} from './workflowExecutionEngine';

const COLLECTION_NAME = 'deals';

/**
 * Get all deals with optional filters and pagination
 */
export async function getDeals(
  filters?: DealFilters,
  pageLimit: number = 50,
  startAfterDoc?: DocumentSnapshot
): Promise<{ deals: Deal[]; lastDoc?: DocumentSnapshot }> {
  try {
    // Validate filters
    if (filters) {
      dealFiltersSchema.parse(filters);
    }

    // Build query constraints
    const constraints: QueryConstraint[] = [];

    // Apply filters
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        constraints.push(where('status', 'in', filters.status));
      } else {
        constraints.push(where('status', '==', filters.status));
      }
    }

    if (filters?.pipelineId) {
      constraints.push(where('pipelineId', '==', filters.pipelineId));
    }

    if (filters?.stageId) {
      if (Array.isArray(filters.stageId)) {
        constraints.push(where('stageId', 'in', filters.stageId));
      } else {
        constraints.push(where('stageId', '==', filters.stageId));
      }
    }

    if (filters?.ownerId) {
      constraints.push(where('ownerId', '==', filters.ownerId));
    }

    if (filters?.contactId) {
      constraints.push(where('contactId', '==', filters.contactId));
    }

    if (filters?.amountMin !== undefined) {
      constraints.push(where('amount', '>=', filters.amountMin));
    }

    if (filters?.amountMax !== undefined) {
      constraints.push(where('amount', '<=', filters.amountMax));
    }

    // Ordering and pagination
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(pageLimit));

    if (startAfterDoc) {
      constraints.push(startAfterDoc);
    }

    // Execute query
    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);

    const deals: Deal[] = [];
    querySnapshot.forEach((doc) => {
      deals.push({
        id: doc.id,
        ...doc.data(),
      } as Deal);
    });

    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

    return { deals, lastDoc };
  } catch (error) {
    console.error('Error getting deals:', error);
    throw new Error(
      `Erro ao buscar negócios: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Get a single deal by ID
 */
export async function getDeal(dealId: string): Promise<Deal | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, dealId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Deal;
  } catch (error) {
    console.error('Error getting deal:', error);
    throw new Error(
      `Erro ao buscar negócio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Get deals by pipeline and stage (for Kanban view)
 */
export async function getDealsByStage(
  pipelineId: string,
  stageId: string
): Promise<Deal[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('pipelineId', '==', pipelineId),
      where('stageId', '==', stageId),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const deals: Deal[] = [];
    querySnapshot.forEach((doc) => {
      deals.push({
        id: doc.id,
        ...doc.data(),
      } as Deal);
    });

    return deals;
  } catch (error) {
    console.error('Error getting deals by stage:', error);
    throw new Error('Erro ao buscar negócios por estágio');
  }
}

/**
 * Create a new deal
 */
export async function createDeal(data: CreateDealInput): Promise<string> {
  try {
    // Validate input
    const validatedData = createDealSchema.parse(data);

    // Prepare deal data
    const dealData = {
      ...validatedData,
      currency: 'BRL' as const,
      status: 'open' as const,
      probability: validatedData.probability || 0,
      products: validatedData.products || [],
      notes: validatedData.notes || '',
      customFields: validatedData.customFields || {},
      lastActivityAt: serverTimestamp(), // Track activity
      contactAttempts: 0,
      isStale: false,
      slaViolations: 0,
      clientStatus: 'lead', // Initial status
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), dealData);

    console.log('✅ Deal created successfully:', docRef.id);

    // Trigger workflows asynchronously
    const dealId = docRef.id;
    getDeal(dealId).then(async (deal) => {
      if (deal) {
        try {
          const workflows = await getActiveWorkflows();
          await handleDealCreated(deal, workflows);
          console.log('🔄 Workflows triggered for new deal:', dealId);
        } catch (error) {
          console.error('Error triggering workflows for new deal:', error);
          // Don't throw - deal was created successfully, workflows are async
        }
      }
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating deal:', error);
    throw new Error(
      `Erro ao criar negócio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Update an existing deal
 */
export async function updateDeal(
  dealId: string,
  data: UpdateDealInput
): Promise<void> {
  try {
    // Validate input
    const validatedData = updateDealSchema.parse(data);

    const docRef = doc(db, COLLECTION_NAME, dealId);

    await updateDoc(docRef, {
      ...validatedData,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Deal updated successfully:', dealId);
  } catch (error) {
    console.error('Error updating deal:', error);
    throw new Error(
      `Erro ao atualizar negócio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Move deal to a different stage
 */
export async function moveDealToStage(
  dealId: string,
  newStageId: string,
  newProbability?: number
): Promise<void> {
  try {
    // Get old deal data before update
    const oldDeal = await getDeal(dealId);
    if (!oldDeal) {
      throw new Error('Deal not found');
    }

    const updateData: any = {
      stageId: newStageId,
      lastActivityAt: serverTimestamp(), // Track activity
      updatedAt: serverTimestamp(),
    };

    if (newProbability !== undefined) {
      updateData.probability = newProbability;
    }

    const docRef = doc(db, COLLECTION_NAME, dealId);
    await updateDoc(docRef, updateData);

    console.log('✅ Deal moved to new stage:', dealId, '→', newStageId);

    // Trigger workflows asynchronously if stage changed
    if (oldDeal.stageId !== newStageId) {
      getDeal(dealId).then(async (deal) => {
        if (deal) {
          try {
            const workflows = await getActiveWorkflows();
            await handleDealStageChanged(
              deal,
              oldDeal.stageId,
              newStageId,
              workflows
            );
            console.log('🔄 Stage change workflows triggered:', dealId);
          } catch (error) {
            console.error('Error triggering stage change workflows:', error);
          }
        }
      });
    }
  } catch (error) {
    console.error('Error moving deal to stage:', error);
    throw new Error('Erro ao mover negócio');
  }
}

/**
 * Mark deal as won
 */
export async function markDealAsWon(dealId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, dealId);
    await updateDoc(docRef, {
      status: 'won',
      closedDate: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Deal marked as won:', dealId);

    // Trigger workflows asynchronously
    getDeal(dealId).then(async (deal) => {
      if (deal) {
        try {
          const workflows = await getActiveWorkflows();
          await handleDealWon(deal, workflows);
          console.log('🔄 Deal won workflows triggered:', dealId);
        } catch (error) {
          console.error('Error triggering deal won workflows:', error);
        }
      }
    });
  } catch (error) {
    console.error('Error marking deal as won:', error);
    throw new Error('Erro ao marcar negócio como ganho');
  }
}

/**
 * Mark deal as lost
 */
export async function markDealAsLost(
  dealId: string,
  reason?: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, dealId);
    await updateDoc(docRef, {
      status: 'lost',
      lostReason: reason || '',
      lostDate: serverTimestamp(),
      closedDate: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Deal marked as lost:', dealId);

    // Trigger workflows asynchronously
    getDeal(dealId).then(async (deal) => {
      if (deal) {
        try {
          const workflows = await getActiveWorkflows();
          await handleDealLost(deal, workflows);
          console.log('🔄 Deal lost workflows triggered:', dealId);
        } catch (error) {
          console.error('Error triggering deal lost workflows:', error);
        }
      }
    });
  } catch (error) {
    console.error('Error marking deal as lost:', error);
    throw new Error('Erro ao marcar negócio como perdido');
  }
}

/**
 * Reopen a closed deal
 */
export async function reopenDeal(dealId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, dealId);
    await updateDoc(docRef, {
      status: 'open',
      closedDate: null,
      lostReason: null,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Deal reopened:', dealId);
  } catch (error) {
    console.error('Error reopening deal:', error);
    throw new Error('Erro ao reabrir negócio');
  }
}

/**
 * Delete a deal
 */
export async function deleteDeal(dealId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, dealId);
    await deleteDoc(docRef);

    console.log('✅ Deal deleted successfully:', dealId);
  } catch (error) {
    console.error('Error deleting deal:', error);
    throw new Error(
      `Erro ao deletar negócio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Get total value of deals by status
 */
export async function getDealValueByStatus(
  ownerId?: string
): Promise<{
  open: number;
  won: number;
  lost: number;
  total: number;
}> {
  try {
    const constraints: QueryConstraint[] = [];

    if (ownerId) {
      constraints.push(where('ownerId', '==', ownerId));
    }

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);

    const totals = {
      open: 0,
      won: 0,
      lost: 0,
      total: 0,
    };

    querySnapshot.forEach((doc) => {
      const deal = doc.data() as Deal;
      totals[deal.status] += deal.amount;
      totals.total += deal.amount;
    });

    return totals;
  } catch (error) {
    console.error('Error calculating deal values:', error);
    throw new Error('Erro ao calcular valores dos negócios');
  }
}

/**
 * Get weighted pipeline value (amount * probability)
 */
export async function getWeightedPipelineValue(
  pipelineId: string
): Promise<number> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('pipelineId', '==', pipelineId),
      where('status', '==', 'open')
    );

    const querySnapshot = await getDocs(q);

    let weightedValue = 0;

    querySnapshot.forEach((doc) => {
      const deal = doc.data() as Deal;
      weightedValue += deal.amount * (deal.probability / 100);
    });

    return weightedValue;
  } catch (error) {
    console.error('Error calculating weighted pipeline value:', error);
    throw new Error('Erro ao calcular valor ponderado do pipeline');
  }
}

/**
 * Transfer deal ownership (passagem de bastão)
 */
export async function transferDealOwnership(
  dealId: string,
  newOwnerId: string,
  reason?: string
): Promise<void> {
  try {
    const deal = await getDeal(dealId);
    if (!deal) {
      throw new Error('Negócio não encontrado');
    }

    // Create activity log for ownership transfer
    // This will be implemented in activityService

    await updateDeal(dealId, {
      ownerId: newOwnerId,
    });

    console.log('✅ Deal ownership transferred:', dealId, '→', newOwnerId);
  } catch (error) {
    console.error('Error transferring deal ownership:', error);
    throw new Error('Erro ao transferir responsabilidade do negócio');
  }
}
