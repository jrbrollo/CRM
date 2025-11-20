/**
 * Custom Fields Types
 *
 * Types for custom fields like Sources, Campaigns, and Branches
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Source (Fonte) - Where the deal came from
 */
export interface Source {
  id: string;
  name: string;
  type: 'referral' | 'planner' | 'marketing' | 'organic' | 'other';
  plannerId?: string; // If type is 'planner', reference to user ID
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface CreateSourceInput {
  name: string;
  type: 'referral' | 'planner' | 'marketing' | 'organic' | 'other';
  plannerId?: string;
  description?: string;
  isActive?: boolean;
  createdBy: string;
}

/**
 * Campaign (Campanha) - Marketing initiative/campaign
 */
export interface Campaign {
  id: string;
  name: string;
  type: 'digital' | 'event' | 'content' | 'partnership' | 'other';
  description?: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface CreateCampaignInput {
  name: string;
  type: 'digital' | 'event' | 'content' | 'partnership' | 'other';
  description?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  createdBy: string;
}

/**
 * Branch (Filial) - Braúna office locations
 */
export type BranchLocation =
  | 'sao_paulo'
  | 'campinas'
  | 'sao_jose'
  | 'piracicaba'
  | 'ribeirao_preto';

export const BRANCH_LABELS: Record<BranchLocation, string> = {
  sao_paulo: 'São Paulo',
  campinas: 'Campinas',
  sao_jose: 'São José',
  piracicaba: 'Piracicaba',
  ribeirao_preto: 'Ribeirão Preto',
};

/**
 * Contact Person - Person associated with a deal
 */
export interface ContactPerson {
  fullName: string;
  phone: string;
  email: string;
  jobTitle?: string;
  company?: string;
}
