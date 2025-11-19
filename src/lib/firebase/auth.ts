/**
 * Firebase Authentication Helper Functions
 *
 * Utility functions for authentication operations.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { auth } from './config';
import { User, CreateUserInput } from '../types';
import { createDocument, getDocument } from './firestore';

/**
 * Sign up a new user
 */
export async function signUp(
  email: string,
  password: string,
  userData: Omit<CreateUserInput, 'email'>
): Promise<{ user: FirebaseUser; userId: string }> {
  try {
    // Create auth user
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const { user } = userCredential;

    // Update display name
    await updateProfile(user, {
      displayName: userData.name,
    });

    // Create user document in Firestore
    const userDoc: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      email,
      name: userData.name,
      role: userData.role,
      permissions: userData.permissions || [],
      avatar: userData.avatar,
      preferences: {
        theme: 'light',
        notifications: true,
        timezone: 'America/Sao_Paulo',
        ...userData.preferences,
      },
    };

    await createDocument('users', {
      ...userDoc,
      id: user.uid,
    });

    return { user, userId: user.uid };
  } catch (error: any) {
    console.error('Error signing up:', error);

    // Provide user-friendly error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este email já está em uso.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Email inválido.');
    }

    throw new Error('Erro ao criar conta. Tente novamente.');
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: FirebaseUser; userDoc: User | null }> {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const { user } = userCredential;

    // Get user document from Firestore
    const userDoc = await getDocument<User>('users', user.uid);

    return { user, userDoc };
  } catch (error: any) {
    console.error('Error signing in:', error);

    // Provide user-friendly error messages
    if (error.code === 'auth/user-not-found') {
      throw new Error('Usuário não encontrado.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Senha incorreta.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Email inválido.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('Esta conta foi desativada.');
    }

    throw new Error('Erro ao fazer login. Tente novamente.');
  }
}

/**
 * Sign out the current user
 */
export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw new Error('Erro ao fazer logout. Tente novamente.');
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error sending password reset email:', error);

    if (error.code === 'auth/user-not-found') {
      throw new Error('Usuário não encontrado.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Email inválido.');
    }

    throw new Error('Erro ao enviar email de recuperação. Tente novamente.');
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Get current user ID
 */
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid || null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}
