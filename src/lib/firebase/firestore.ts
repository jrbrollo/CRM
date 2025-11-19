/**
 * Firestore Helper Functions
 *
 * Utility functions for common Firestore operations with proper error handling.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryConstraint,
  Timestamp,
  serverTimestamp,
  WhereFilterOp,
  OrderByDirection,
} from 'firebase/firestore';
import { db } from './config';

/**
 * Generic type for Firestore documents
 */
export interface FirestoreDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  startAfter?: DocumentSnapshot;
  orderByField?: string;
  orderByDirection?: OrderByDirection;
}

/**
 * Query filter
 */
export interface QueryFilter {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

/**
 * Get server timestamp (for createdAt/updatedAt fields)
 */
export const getServerTimestamp = () => serverTimestamp();

/**
 * Convert Date to Firestore Timestamp
 */
export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

/**
 * Convert Firestore Timestamp to Date
 */
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

/**
 * Get a single document by ID
 */
export async function getDocument<T extends FirestoreDocument>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as T;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw new Error(`Failed to get document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all documents from a collection (with optional filters and pagination)
 */
export async function getDocuments<T extends FirestoreDocument>(
  collectionName: string,
  filters?: QueryFilter[],
  pagination?: PaginationOptions
): Promise<{ documents: T[]; lastDoc?: DocumentSnapshot }> {
  try {
    const constraints: QueryConstraint[] = [];

    // Add filters
    if (filters && filters.length > 0) {
      filters.forEach((filter) => {
        constraints.push(where(filter.field, filter.operator, filter.value));
      });
    }

    // Add ordering
    const orderByField = pagination?.orderByField || 'createdAt';
    const orderByDirection = pagination?.orderByDirection || 'desc';
    constraints.push(orderBy(orderByField, orderByDirection));

    // Add pagination
    if (pagination?.startAfter) {
      constraints.push(startAfter(pagination.startAfter));
    }

    if (pagination?.limit) {
      constraints.push(limit(pagination.limit));
    }

    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);

    const documents: T[] = [];
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data(),
      } as T);
    });

    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

    return { documents, lastDoc };
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw new Error(`Failed to get documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a new document
 */
export async function createDocument<T extends Partial<FirestoreDocument>>(
  collectionName: string,
  data: T
): Promise<string> {
  try {
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, collectionName), docData);
    return docRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw new Error(`Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update an existing document
 */
export async function updateDocument<T>(
  collectionName: string,
  documentId: string,
  data: Partial<T>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw new Error(`Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build query constraints from filters
 */
export function buildQueryConstraints(
  filters: QueryFilter[],
  pagination?: PaginationOptions
): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  // Add filters
  filters.forEach((filter) => {
    constraints.push(where(filter.field, filter.operator, filter.value));
  });

  // Add ordering
  if (pagination?.orderByField) {
    constraints.push(
      orderBy(
        pagination.orderByField,
        pagination.orderByDirection || 'desc'
      )
    );
  }

  // Add pagination
  if (pagination?.startAfter) {
    constraints.push(startAfter(pagination.startAfter));
  }

  if (pagination?.limit) {
    constraints.push(limit(pagination.limit));
  }

  return constraints;
}
