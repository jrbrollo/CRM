import { Timestamp } from 'firebase/firestore';

/**
 * User role types
 */
export type UserRole = 'admin' | 'planner' | 'viewer';

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  timezone: string;
}

/**
 * User document structure in Firestore
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  avatar?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  preferences: UserPreferences;
}

/**
 * Input type for creating a new user
 */
export interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
  permissions?: string[];
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

/**
 * Input type for updating a user
 */
export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  permissions?: string[];
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}
