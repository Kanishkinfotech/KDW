import axios from 'axios';

export const uploadImage = async (
  file: File, 
  type: string = 'general', 
  onProgress?: (progress: number) => void
): Promise<string | null> => {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('file', file);

  try {
    const token = localStorage.getItem('token');
    const res = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          onProgress(percentCompleted);
        }
      }
    });

    if (res.data.success) {
      return res.data.url;
    } else {
      throw new Error(res.data.message || 'Upload failed');
    }
  } catch (err: any) {
    console.error('Upload error:', err);
    throw err;
  }
};
