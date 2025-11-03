import { useState, useCallback } from 'react';
import { uploadAPI } from '../services/api';

/**
 * Custom hook for handling file upload operations
 * Manages uploading images, invoices, receipts, and multiple files
 */
export const useUpload = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [progress, setProgress] = useState(0);

  // Upload image
  const uploadImage = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed');
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      const response = await uploadAPI.uploadImage(file);

      if (response.data.success) {
        const uploadedFile = response.data.data;
        setUploadedFiles(prev => [...prev, uploadedFile]);
        setProgress(100);
        return { success: true, file: uploadedFile };
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to upload image';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload invoice
  const uploadInvoice = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only PDF and image files are allowed for invoices');
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      const response = await uploadAPI.uploadInvoice(file);

      if (response.data.success) {
        const uploadedFile = response.data.data;
        setUploadedFiles(prev => [...prev, uploadedFile]);
        setProgress(100);
        return { success: true, file: uploadedFile };
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to upload invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload receipt
  const uploadReceipt = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only PDF and image files are allowed for receipts');
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      const response = await uploadAPI.uploadReceipt(file);

      if (response.data.success) {
        const uploadedFile = response.data.data;
        setUploadedFiles(prev => [...prev, uploadedFile]);
        setProgress(100);
        return { success: true, file: uploadedFile };
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to upload receipt';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload multiple files
  const uploadMultiple = useCallback(async (files) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Validate file count (max 10 files)
      if (files.length > 10) {
        throw new Error('Maximum 10 files can be uploaded at once');
      }

      // Validate each file size
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is larger than 10MB`);
        }
      }

      const response = await uploadAPI.uploadMultiple(files);

      if (response.data.success) {
        const uploadedFilesList = response.data.data;
        setUploadedFiles(prev => [...prev, ...uploadedFilesList]);
        setProgress(100);
        return { success: true, files: uploadedFilesList };
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to upload files';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete file
  const deleteFile = useCallback(async (type, filename) => {
    setLoading(true);
    setError(null);

    try {
      const response = await uploadAPI.deleteFile(type, filename);

      if (response.data.success) {
        setUploadedFiles(prev => prev.filter(f => f.filename !== filename));
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Delete failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete file';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear uploaded files list
  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
    setProgress(0);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Format file size for display
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  return {
    loading,
    error,
    uploadedFiles,
    progress,
    uploadImage,
    uploadInvoice,
    uploadReceipt,
    uploadMultiple,
    deleteFile,
    clearFiles,
    clearError,
    formatFileSize,
  };
};

export default useUpload;
