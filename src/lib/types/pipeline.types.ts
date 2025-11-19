import { Timestamp } from 'firebase/firestore';

/**
 * Pipeline stage
 */
export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number; // % de fechamento (0-100)
  rottenDays?: number; // Dias até considerar "apodrecido"
}

/**
 * Pipeline document structure in Firestore
 */
export interface Pipeline {
  id: string;
  name: string;
  isDefault: boolean;
  stages: PipelineStage[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Input type for creating a pipeline
 */
export interface CreatePipelineInput {
  name: string;
  isDefault?: boolean;
  stages: Omit<PipelineStage, 'id'>[];
}

/**
 * Input type for updating a pipeline
 */
export interface UpdatePipelineInput {
  name?: string;
  isDefault?: boolean;
  stages?: PipelineStage[];
}
