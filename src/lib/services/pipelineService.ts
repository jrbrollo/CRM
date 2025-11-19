/**
 * Pipeline Service
 *
 * Manages sales pipelines and stages.
 * Supports multiple pipelines for different sales processes.
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
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Pipeline,
  CreatePipelineInput,
  UpdatePipelineInput,
} from '../types';

const COLLECTION_NAME = 'pipelines';

/**
 * Get all pipelines
 */
export async function getPipelines(): Promise<Pipeline[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const pipelines: Pipeline[] = [];
    querySnapshot.forEach((doc) => {
      pipelines.push({
        id: doc.id,
        ...doc.data(),
      } as Pipeline);
    });

    return pipelines;
  } catch (error) {
    console.error('Error getting pipelines:', error);
    throw new Error(
      `Erro ao buscar pipelines: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Get a single pipeline by ID
 */
export async function getPipeline(pipelineId: string): Promise<Pipeline | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, pipelineId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Pipeline;
  } catch (error) {
    console.error('Error getting pipeline:', error);
    throw new Error(
      `Erro ao buscar pipeline: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Get the default pipeline
 */
export async function getDefaultPipeline(): Promise<Pipeline | null> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('isDefault', '==', true)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Pipeline;
  } catch (error) {
    console.error('Error getting default pipeline:', error);
    throw new Error('Erro ao buscar pipeline padrão');
  }
}

/**
 * Create a new pipeline
 */
export async function createPipeline(
  data: CreatePipelineInput
): Promise<string> {
  try {
    // Generate IDs for stages if not provided
    const stages = data.stages.map((stage, index) => ({
      ...stage,
      id: crypto.randomUUID(),
      order: index,
    }));

    const pipelineData = {
      name: data.name,
      isDefault: data.isDefault || false,
      stages,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // If this is set as default, unset all other defaults
    if (data.isDefault) {
      await unsetAllDefaults();
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), pipelineData);

    console.log('✅ Pipeline created successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating pipeline:', error);
    throw new Error(
      `Erro ao criar pipeline: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Update an existing pipeline
 */
export async function updatePipeline(
  pipelineId: string,
  data: UpdatePipelineInput
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, pipelineId);

    // If setting as default, unset all other defaults first
    if (data.isDefault) {
      await unsetAllDefaults();
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Pipeline updated successfully:', pipelineId);
  } catch (error) {
    console.error('Error updating pipeline:', error);
    throw new Error(
      `Erro ao atualizar pipeline: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Delete a pipeline
 */
export async function deletePipeline(pipelineId: string): Promise<void> {
  try {
    // Check if pipeline has deals
    // In production, you should prevent deletion if there are deals
    // or move deals to another pipeline

    const docRef = doc(db, COLLECTION_NAME, pipelineId);
    await deleteDoc(docRef);

    console.log('✅ Pipeline deleted successfully:', pipelineId);
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    throw new Error(
      `Erro ao deletar pipeline: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Set a pipeline as default
 */
export async function setAsDefault(pipelineId: string): Promise<void> {
  try {
    await unsetAllDefaults();

    const docRef = doc(db, COLLECTION_NAME, pipelineId);
    await updateDoc(docRef, {
      isDefault: true,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Pipeline set as default:', pipelineId);
  } catch (error) {
    console.error('Error setting pipeline as default:', error);
    throw new Error('Erro ao definir pipeline como padrão');
  }
}

/**
 * Unset all default pipelines (internal helper)
 */
async function unsetAllDefaults(): Promise<void> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('isDefault', '==', true)
  );

  const querySnapshot = await getDocs(q);

  const updates = querySnapshot.docs.map((doc) =>
    updateDoc(doc.ref, {
      isDefault: false,
      updatedAt: serverTimestamp(),
    })
  );

  await Promise.all(updates);
}

/**
 * Add a new stage to a pipeline
 */
export async function addStage(
  pipelineId: string,
  stageName: string,
  probability: number,
  rottenDays?: number
): Promise<void> {
  try {
    const pipeline = await getPipeline(pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline não encontrado');
    }

    const newStage = {
      id: crypto.randomUUID(),
      name: stageName,
      order: pipeline.stages.length,
      probability,
      rottenDays,
    };

    const stages = [...pipeline.stages, newStage];

    await updatePipeline(pipelineId, { stages });

    console.log('✅ Stage added to pipeline:', pipelineId);
  } catch (error) {
    console.error('Error adding stage:', error);
    throw new Error('Erro ao adicionar estágio');
  }
}

/**
 * Update a stage in a pipeline
 */
export async function updateStage(
  pipelineId: string,
  stageId: string,
  updates: {
    name?: string;
    probability?: number;
    rottenDays?: number;
  }
): Promise<void> {
  try {
    const pipeline = await getPipeline(pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline não encontrado');
    }

    const stages = pipeline.stages.map((stage) =>
      stage.id === stageId ? { ...stage, ...updates } : stage
    );

    await updatePipeline(pipelineId, { stages });

    console.log('✅ Stage updated:', stageId);
  } catch (error) {
    console.error('Error updating stage:', error);
    throw new Error('Erro ao atualizar estágio');
  }
}

/**
 * Remove a stage from a pipeline
 */
export async function removeStage(
  pipelineId: string,
  stageId: string
): Promise<void> {
  try {
    const pipeline = await getPipeline(pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline não encontrado');
    }

    // Check if stage has deals
    // In production, prevent deletion or move deals to another stage

    const stages = pipeline.stages
      .filter((stage) => stage.id !== stageId)
      .map((stage, index) => ({ ...stage, order: index }));

    await updatePipeline(pipelineId, { stages });

    console.log('✅ Stage removed:', stageId);
  } catch (error) {
    console.error('Error removing stage:', error);
    throw new Error('Erro ao remover estágio');
  }
}

/**
 * Reorder stages in a pipeline
 */
export async function reorderStages(
  pipelineId: string,
  stageIds: string[]
): Promise<void> {
  try {
    const pipeline = await getPipeline(pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline não encontrado');
    }

    // Create a map for quick lookup
    const stageMap = new Map(pipeline.stages.map((s) => [s.id, s]));

    // Reorder stages based on the provided order
    const stages = stageIds
      .map((id) => stageMap.get(id))
      .filter((s) => s !== undefined)
      .map((stage, index) => ({ ...stage!, order: index }));

    await updatePipeline(pipelineId, { stages });

    console.log('✅ Stages reordered in pipeline:', pipelineId);
  } catch (error) {
    console.error('Error reordering stages:', error);
    throw new Error('Erro ao reordenar estágios');
  }
}

/**
 * Create default pipeline (helper for initial setup)
 */
export async function createDefaultPipeline(): Promise<string> {
  return createPipeline({
    name: 'Pipeline de Vendas Principal',
    isDefault: true,
    stages: [
      { name: 'Lead Frio', order: 0, probability: 10 },
      { name: 'Fazer Contato', order: 1, probability: 20 },
      { name: 'Contato Feito', order: 2, probability: 30 },
      { name: 'Reunião Agendada', order: 3, probability: 40 },
      { name: 'Reunião Feita', order: 4, probability: 50 },
      { name: 'Proposta Feita', order: 5, probability: 70 },
      { name: 'Elaboração Contrato', order: 6, probability: 80 },
      { name: 'Assinatura', order: 7, probability: 90 },
      { name: 'Pagamento', order: 8, probability: 95 },
      { name: 'Venda Efetuada', order: 9, probability: 100 },
    ],
  });
}
