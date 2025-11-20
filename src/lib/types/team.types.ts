/**
 * Team and Assignment Types
 *
 * Sistema de times, planejadores e regras de atribuição
 */

import { Timestamp } from 'firebase/firestore';

export type PlannerSeniority = 'junior' | 'pleno' | 'senior';
export type PlannerStatus = 'active' | 'inactive' | 'on_leave'; // ativo, inativo, ausente/férias

export interface Team {
  id: string;
  name: string;
  description?: string;
  leaderId: string; // User ID do líder do time
  memberIds: string[]; // User IDs dos membros
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PlannerProfile {
  userId: string;

  // Profile info
  seniority: PlannerSeniority;
  teamId?: string;
  mentorId?: string; // Para onboarding de novos planejadores

  // Status
  status: PlannerStatus;
  availableForAssignment: boolean; // Se está na rotação de round-robin

  // Leave/Absence management
  onLeaveUntil?: Timestamp;
  substituteId?: string; // Quem substitui durante ausência

  // Performance tracking
  activeDealsCount: number; // Deals ativos no momento
  maxActiveDeals?: number; // Limite de deals simultâneos
  totalDealsWon: number;
  totalDealsLost: number;
  slaViolations: number;

  // Assignment preferences
  preferredSources?: string[]; // IDs de fontes que prefere

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AssignmentRule {
  id: string;
  name: string;
  priority: number; // Rules com prioridade maior são verificadas primeiro
  isActive: boolean;

  // Conditions (all must match)
  conditions: AssignmentCondition[];

  // Action
  action: AssignmentAction;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface AssignmentCondition {
  field: 'sourceId' | 'campaignId' | 'branch' | 'value' | 'custom';
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'in';
  value: any;
}

export interface AssignmentAction {
  type: 'assign_to_planner' | 'assign_to_team' | 'round_robin';
  targetId?: string; // Planner ID ou Team ID
  teamId?: string; // Para round-robin
}

export interface RoundRobinState {
  teamId: string;
  currentIndex: number; // Índice do próximo planejador na rotação
  eligiblePlannerIds: string[]; // Planejadores disponíveis para rotação
  lastAssignedAt: Timestamp;
  lastAssignedTo: string;
}

export const PLANNER_SENIORITY_LABELS: Record<PlannerSeniority, string> = {
  junior: 'Júnior',
  pleno: 'Pleno',
  senior: 'Sênior',
};

export const PLANNER_STATUS_LABELS: Record<PlannerStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  on_leave: 'Ausente/Férias',
};
