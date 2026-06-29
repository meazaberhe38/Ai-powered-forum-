import { apiClient } from '../core/api.client';

export const listDocuments = async () => {
  try {
    const response = await apiClient.get('/api/rag/documents');
    const docs = response.data.data || [];
    return docs.map(doc => ({
      ...doc,
      id: doc.document_id || doc.id,
      file_name: doc.title || doc.file_name,
      // storage_path is the full Cloudinary HTTPS URL
      storage_path: doc.storage_path,
    }));
  } catch (error) {
    console.error('Error listing documents:', error);
    throw error;
  }
};

export const uploadPdf = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/rag/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
};

export const deleteDocument = async (documentId) => {
  try {
    const response = await apiClient.delete(`/api/rag/documents/${documentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

export const searchInDocument = async (documentId, query) => {
  try {
    const response = await apiClient.get(
      `/api/rag/documents/${documentId}/search?query=${encodeURIComponent(query)}`
    );
    const data = response.data.data;
    return data?.results || [];
  } catch (error) {
    console.error('Error searching document:', error);
    throw error;
  }
};

export const queryDocument = async (documentId, query) => {
  try {
    const response = await apiClient.post(
      `/api/rag/documents/${documentId}/query`,
      { query }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error querying document:', error);
    throw error;
  }
};

/**
 * Returns a URL suitable for embedding the PDF in an <iframe>.
 *
 * We use the Cloudinary storage_path directly — it's a public HTTPS URL
 * and doesn't need to be proxied through the backend. The old /file proxy
 * endpoint was causing 502s because Cloudinary raw assets aren't publicly
 * accessible via unauthenticated fetch from the server.
 *
 * @param {string} storagePath - The Cloudinary URL stored in the document record
 * @returns {string}
 */
export const getPdfUrl = (storagePath) => {
  return storagePath;
};

/**
 * @deprecated Use getPdfUrl(doc.storage_path) instead.
 * Kept for backwards-compatibility; no longer proxies through the backend.
 */
export const fetchPdfObjectUrl = async (_documentId, storagePath) => {
  if (!storagePath) {
    throw new Error('No storage path available for this document');
  }
  return storagePath;
};