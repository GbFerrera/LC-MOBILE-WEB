import { api } from './api';

export const getProductPhotos = async (productId: string, companyId: string) => {
  if (!companyId) {
    throw new Error('Company ID is required for authorization.');
  }
  if (!productId) {
    throw new Error('Product ID is required.');
  }

  try {
    const response = await api.get(`/product-photos/${productId}`, {
      headers: {
        company_id: companyId,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error fetching product photos:', error.response.data);
      throw new Error(error.response.data.message || 'Failed to fetch product photos.');
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error fetching product photos: No response received', error.request);
      throw new Error('No response received from server.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error fetching product photos:', error.message);
      throw new Error('Error setting up the request.');
    }
  }
};