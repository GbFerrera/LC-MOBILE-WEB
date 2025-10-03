import { api } from '@/services/api';

export interface ProductPhoto {
  id: string;
  product_id: string;
  photo_url: string;
  firebase_path: string;
  created_at: string;
}

export interface ProductWithPhoto {
  product_id: string;
  name: string;
  photo_url: string;
}

// Upload de foto para um produto específico
export const uploadProductPhoto = async (productId: string, base64Image: string): Promise<ProductPhoto> => {
  const response = await api.post(`/product-photos/${productId}`, {
    base64Image
  });
  return response.data;
};

// Buscar todas as fotos de um produto
export const getProductPhotos = async (productId: string): Promise<ProductPhoto[]> => {
  try {
    const response = await api.get(`/product-photos/${productId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return []; // Retorna array vazio se não encontrar fotos
    }
    throw error;
  }
};

// Buscar primeira foto de todos os produtos da empresa
export const getAllProductPhotos = async (): Promise<ProductWithPhoto[]> => {
  try {
    const response = await api.get('/product-photos');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return []; // Retorna array vazio se não encontrar fotos
    }
    throw error;
  }
};

// Excluir uma foto específica
export const deleteProductPhoto = async (photoId: string): Promise<void> => {
  await api.delete(`/product-photos/photo/${photoId}`);
};

// Função utilitária para converter arquivo para base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Erro ao converter arquivo para base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

// Função utilitária para decodificar URL da foto
export const decodePhotoUrl = (encodedUrl: string): string => {
  try {
    return decodeURIComponent(encodedUrl);
  } catch (error) {
    console.warn('Erro ao decodificar URL da foto:', error);
    return encodedUrl; // Retorna a URL original se não conseguir decodificar
  }
};
