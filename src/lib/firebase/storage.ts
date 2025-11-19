/**
 * Firebase Storage Helper Functions
 *
 * Utility functions for file upload/download operations.
 */

import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
  UploadTask,
} from 'firebase/storage';
import { storage } from './config';

/**
 * Upload progress callback
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  try {
    const storageRef = ref(storage, path);

    if (onProgress) {
      // Upload with progress tracking
      const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            console.error('Error uploading file:', error);
            reject(new Error('Erro ao fazer upload do arquivo.'));
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } else {
      // Simple upload without progress
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Erro ao fazer upload do arquivo.');
  }
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Erro ao deletar arquivo.');
  }
}

/**
 * Get download URL for a file
 */
export async function getFileURL(path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw new Error('Erro ao obter URL do arquivo.');
  }
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(
  userId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const path = `avatars/${userId}/${file.name}`;
  return uploadFile(file, path, onProgress);
}

/**
 * Upload contact/deal attachment
 */
export async function uploadAttachment(
  type: 'contact' | 'deal',
  entityId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const path = `attachments/${type}/${entityId}/${file.name}`;
  return uploadFile(file, path, onProgress);
}
