/**
 * Contact Service
 *
 * Handles all CRUD operations for contacts in Firestore.
 * Includes validation, error handling, and business logic.
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
  Contact,
  CreateContactInput,
  UpdateContactInput,
  ContactFilters
} from '../types';
import {
  createContactSchema,
  updateContactSchema,
  contactFiltersSchema
} from '../validators';

const COLLECTION_NAME = 'contacts';

/**
 * Get all contacts with optional filters and pagination
 */
export async function getContacts(
  filters?: ContactFilters,
  pageLimit: number = 50,
  startAfterDoc?: DocumentSnapshot
): Promise<{ contacts: Contact[]; lastDoc?: DocumentSnapshot }> {
  try {
    // Validate filters
    if (filters) {
      contactFiltersSchema.parse(filters);
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

    if (filters?.ownerId) {
      constraints.push(where('ownerId', '==', filters.ownerId));
    }

    if (filters?.source) {
      if (Array.isArray(filters.source)) {
        constraints.push(where('source', 'in', filters.source));
      } else {
        constraints.push(where('source', '==', filters.source));
      }
    }

    if (filters?.leadScoreMin !== undefined) {
      constraints.push(where('leadScore', '>=', filters.leadScoreMin));
    }

    if (filters?.leadScoreMax !== undefined) {
      constraints.push(where('leadScore', '<=', filters.leadScoreMax));
    }

    // Date filters
    if (filters?.createdAfter) {
      constraints.push(
        where('createdAt', '>=', Timestamp.fromDate(filters.createdAfter))
      );
    }

    if (filters?.createdBefore) {
      constraints.push(
        where('createdAt', '<=', Timestamp.fromDate(filters.createdBefore))
      );
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

    const contacts: Contact[] = [];
    querySnapshot.forEach((doc) => {
      contacts.push({
        id: doc.id,
        ...doc.data(),
      } as Contact);
    });

    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

    return { contacts, lastDoc };
  } catch (error) {
    console.error('Error getting contacts:', error);
    throw new Error(
      `Erro ao buscar contatos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Get a single contact by ID
 */
export async function getContact(contactId: string): Promise<Contact | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, contactId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Contact;
  } catch (error) {
    console.error('Error getting contact:', error);
    throw new Error(
      `Erro ao buscar contato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Search contacts by name, email, or company
 */
export async function searchContacts(
  searchQuery: string,
  pageLimit: number = 20
): Promise<Contact[]> {
  try {
    // Note: Firestore doesn't support full-text search natively
    // For production, consider using Algolia or Elasticsearch
    // This is a simple implementation that searches by exact match

    const queries = [
      query(
        collection(db, COLLECTION_NAME),
        where('firstName', '>=', searchQuery),
        where('firstName', '<=', searchQuery + '\uf8ff'),
        limit(pageLimit)
      ),
      query(
        collection(db, COLLECTION_NAME),
        where('lastName', '>=', searchQuery),
        where('lastName', '<=', searchQuery + '\uf8ff'),
        limit(pageLimit)
      ),
      query(
        collection(db, COLLECTION_NAME),
        where('email', '>=', searchQuery),
        where('email', '<=', searchQuery + '\uf8ff'),
        limit(pageLimit)
      ),
    ];

    const results = await Promise.all(queries.map((q) => getDocs(q)));

    const contactsMap = new Map<string, Contact>();
    results.forEach((snapshot) => {
      snapshot.forEach((doc) => {
        contactsMap.set(doc.id, {
          id: doc.id,
          ...doc.data(),
        } as Contact);
      });
    });

    return Array.from(contactsMap.values());
  } catch (error) {
    console.error('Error searching contacts:', error);
    throw new Error(
      `Erro ao buscar contatos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Create a new contact
 */
export async function createContact(
  data: CreateContactInput
): Promise<string> {
  try {
    // Validate input
    const validatedData = createContactSchema.parse(data);

    // Prepare contact data
    const contactData = {
      ...validatedData,
      status: validatedData.status || 'lead',
      leadScore: validatedData.leadScore || 0,
      lifecycle_stage: validatedData.lifecycle_stage || 'lead',
      tags: validatedData.tags || [],
      lists: validatedData.lists || [],
      enrolledWorkflows: [],
      workflowHistory: [],
      customFields: validatedData.customFields || {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), contactData);

    console.log('✅ Contact created successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating contact:', error);
    throw new Error(
      `Erro ao criar contato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Update an existing contact
 */
export async function updateContact(
  contactId: string,
  data: UpdateContactInput
): Promise<void> {
  try {
    // Validate input
    const validatedData = updateContactSchema.parse(data);

    const docRef = doc(db, COLLECTION_NAME, contactId);

    await updateDoc(docRef, {
      ...validatedData,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Contact updated successfully:', contactId);
  } catch (error) {
    console.error('Error updating contact:', error);
    throw new Error(
      `Erro ao atualizar contato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Delete a contact
 */
export async function deleteContact(contactId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, contactId);
    await deleteDoc(docRef);

    console.log('✅ Contact deleted successfully:', contactId);
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw new Error(
      `Erro ao deletar contato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Update contact's last contacted date
 */
export async function markContactAsContacted(
  contactId: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, contactId);
    await updateDoc(docRef, {
      lastContactedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking contact as contacted:', error);
    throw new Error('Erro ao atualizar data de contato');
  }
}

/**
 * Add tag to contact
 */
export async function addTagToContact(
  contactId: string,
  tag: string
): Promise<void> {
  try {
    const contact = await getContact(contactId);
    if (!contact) {
      throw new Error('Contato não encontrado');
    }

    const tags = contact.tags || [];
    if (!tags.includes(tag)) {
      tags.push(tag);
      await updateContact(contactId, { tags });
    }
  } catch (error) {
    console.error('Error adding tag to contact:', error);
    throw new Error('Erro ao adicionar tag');
  }
}

/**
 * Remove tag from contact
 */
export async function removeTagFromContact(
  contactId: string,
  tag: string
): Promise<void> {
  try {
    const contact = await getContact(contactId);
    if (!contact) {
      throw new Error('Contato não encontrado');
    }

    const tags = (contact.tags || []).filter((t) => t !== tag);
    await updateContact(contactId, { tags });
  } catch (error) {
    console.error('Error removing tag from contact:', error);
    throw new Error('Erro ao remover tag');
  }
}

/**
 * Update lead score
 */
export async function updateLeadScore(
  contactId: string,
  score: number
): Promise<void> {
  try {
    if (score < 0 || score > 100) {
      throw new Error('Lead score deve estar entre 0 e 100');
    }

    await updateContact(contactId, { leadScore: score });
  } catch (error) {
    console.error('Error updating lead score:', error);
    throw new Error('Erro ao atualizar lead score');
  }
}

/**
 * Enroll contact in workflow
 */
export async function enrollInWorkflow(
  contactId: string,
  workflowId: string
): Promise<void> {
  try {
    const contact = await getContact(contactId);
    if (!contact) {
      throw new Error('Contato não encontrado');
    }

    const enrolledWorkflows = contact.enrolledWorkflows || [];
    if (!enrolledWorkflows.includes(workflowId)) {
      enrolledWorkflows.push(workflowId);

      const workflowHistory = contact.workflowHistory || [];
      workflowHistory.push({
        workflowId,
        enrolledAt: Timestamp.now(),
        status: 'active',
      });

      await updateContact(contactId, {
        enrolledWorkflows,
        workflowHistory,
      });
    }
  } catch (error) {
    console.error('Error enrolling contact in workflow:', error);
    throw new Error('Erro ao inscrever contato no workflow');
  }
}

/**
 * Unenroll contact from workflow
 */
export async function unenrollFromWorkflow(
  contactId: string,
  workflowId: string
): Promise<void> {
  try {
    const contact = await getContact(contactId);
    if (!contact) {
      throw new Error('Contato não encontrado');
    }

    const enrolledWorkflows = (contact.enrolledWorkflows || []).filter(
      (id) => id !== workflowId
    );

    const workflowHistory = contact.workflowHistory || [];
    const historyEntry = workflowHistory.find(
      (entry) => entry.workflowId === workflowId && entry.status === 'active'
    );

    if (historyEntry) {
      historyEntry.status = 'unenrolled';
      historyEntry.completedAt = Timestamp.now();
    }

    await updateContact(contactId, {
      enrolledWorkflows,
      workflowHistory,
    });
  } catch (error) {
    console.error('Error unenrolling contact from workflow:', error);
    throw new Error('Erro ao desinscrever contato do workflow');
  }
}
