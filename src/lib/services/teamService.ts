/**
 * Team and Assignment Service
 *
 * Manages teams, planners, and round-robin assignment
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type {
  Team,
  PlannerProfile,
  RoundRobinState,
  AssignmentRule,
  PlannerStatus,
} from '../types/team.types';

const TEAMS_COLLECTION = 'teams';
const PLANNERS_COLLECTION = 'plannerProfiles';
const ROUND_ROBIN_COLLECTION = 'roundRobinState';
const ASSIGNMENT_RULES_COLLECTION = 'assignmentRules';

// ============================================================================
// TEAMS
// ============================================================================

export async function createTeam(data: {
  name: string;
  description?: string;
  leaderId: string;
  memberIds: string[];
}): Promise<string> {
  const teamData = {
    ...data,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, TEAMS_COLLECTION), teamData);
  return docRef.id;
}

export async function getTeams(): Promise<Team[]> {
  const q = query(collection(db, TEAMS_COLLECTION), where('isActive', '==', true));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Team[];
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const docRef = doc(db, TEAMS_COLLECTION, teamId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Team;
}

export async function updateTeam(
  teamId: string,
  updates: Partial<Omit<Team, 'id' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, TEAMS_COLLECTION, teamId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ============================================================================
// PLANNER PROFILES
// ============================================================================

export async function createPlannerProfile(data: {
  userId: string;
  seniority: PlannerProfile['seniority'];
  teamId?: string;
  maxActiveDeals?: number;
}): Promise<string> {
  const profileData = {
    ...data,
    status: 'active' as PlannerStatus,
    availableForAssignment: true,
    activeDealsCount: 0,
    totalDealsWon: 0,
    totalDealsLost: 0,
    slaViolations: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, PLANNERS_COLLECTION), profileData);
  return docRef.id;
}

export async function getPlannerProfile(
  userId: string
): Promise<PlannerProfile | null> {
  const q = query(
    collection(db, PLANNERS_COLLECTION),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    ...doc.data(),
  } as PlannerProfile;
}

export async function getPlannersByTeam(teamId: string): Promise<PlannerProfile[]> {
  const q = query(
    collection(db, PLANNERS_COLLECTION),
    where('teamId', '==', teamId),
    where('status', '==', 'active')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data()) as PlannerProfile[];
}

export async function getAvailablePlanners(teamId?: string): Promise<PlannerProfile[]> {
  let q;

  if (teamId) {
    q = query(
      collection(db, PLANNERS_COLLECTION),
      where('teamId', '==', teamId),
      where('status', '==', 'active'),
      where('availableForAssignment', '==', true)
    );
  } else {
    q = query(
      collection(db, PLANNERS_COLLECTION),
      where('status', '==', 'active'),
      where('availableForAssignment', '==', true)
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data()) as PlannerProfile[];
}

export async function updatePlannerProfile(
  userId: string,
  updates: Partial<Omit<PlannerProfile, 'userId' | 'createdAt'>>
): Promise<void> {
  const q = query(
    collection(db, PLANNERS_COLLECTION),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('Planner profile not found');
  }

  const docRef = snapshot.docs[0].ref;

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function incrementPlannerDeals(
  userId: string,
  won: boolean
): Promise<void> {
  const profile = await getPlannerProfile(userId);
  if (!profile) return;

  const updates: any = {
    activeDealsCount: profile.activeDealsCount + 1,
  };

  if (won) {
    updates.totalDealsWon = profile.totalDealsWon + 1;
  } else {
    updates.totalDealsLost = profile.totalDealsLost + 1;
  }

  await updatePlannerProfile(userId, updates);
}

export async function incrementSLAViolations(userId: string): Promise<void> {
  const profile = await getPlannerProfile(userId);
  if (!profile) return;

  await updatePlannerProfile(userId, {
    slaViolations: profile.slaViolations + 1,
  });
}

// ============================================================================
// ROUND-ROBIN ASSIGNMENT
// ============================================================================

export async function getRoundRobinState(
  teamId: string
): Promise<RoundRobinState | null> {
  const docRef = doc(db, ROUND_ROBIN_COLLECTION, teamId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as RoundRobinState;
}

export async function initializeRoundRobin(teamId: string): Promise<void> {
  const planners = await getAvailablePlanners(teamId);

  if (planners.length === 0) {
    throw new Error('No available planners in team');
  }

  const state: RoundRobinState = {
    teamId,
    currentIndex: 0,
    eligiblePlannerIds: planners.map((p) => p.userId),
    lastAssignedAt: serverTimestamp() as any,
    lastAssignedTo: '',
  };

  const docRef = doc(db, ROUND_ROBIN_COLLECTION, teamId);
  await updateDoc(docRef, state).catch(() => {
    // If doesn't exist, create it
    return addDoc(collection(db, ROUND_ROBIN_COLLECTION), state);
  });
}

export async function getNextPlannerRoundRobin(
  teamId: string
): Promise<string | null> {
  let state = await getRoundRobinState(teamId);

  // Initialize if doesn't exist
  if (!state) {
    await initializeRoundRobin(teamId);
    state = await getRoundRobinState(teamId);
  }

  if (!state || state.eligiblePlannerIds.length === 0) {
    return null;
  }

  // Get next planner
  const nextPlannerId = state.eligiblePlannerIds[state.currentIndex];

  // Update state
  const nextIndex = (state.currentIndex + 1) % state.eligiblePlannerIds.length;

  const docRef = doc(db, ROUND_ROBIN_COLLECTION, teamId);
  await updateDoc(docRef, {
    currentIndex: nextIndex,
    lastAssignedAt: serverTimestamp(),
    lastAssignedTo: nextPlannerId,
  });

  return nextPlannerId;
}

export async function refreshRoundRobinEligibility(teamId: string): Promise<void> {
  const planners = await getAvailablePlanners(teamId);

  const docRef = doc(db, ROUND_ROBIN_COLLECTION, teamId);
  await updateDoc(docRef, {
    eligiblePlannerIds: planners.map((p) => p.userId),
    currentIndex: 0,
    updatedAt: serverTimestamp(),
  });
}

// ============================================================================
// ASSIGNMENT RULES
// ============================================================================

export async function getAssignmentRules(): Promise<AssignmentRule[]> {
  const q = query(
    collection(db, ASSIGNMENT_RULES_COLLECTION),
    where('isActive', '==', true)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AssignmentRule[];
}

export async function createAssignmentRule(
  data: Omit<AssignmentRule, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ruleData = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(
    collection(db, ASSIGNMENT_RULES_COLLECTION),
    ruleData
  );
  return docRef.id;
}
