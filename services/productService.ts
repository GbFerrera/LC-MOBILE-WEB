import { api } from "./api";

interface UpdateProductPayload {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  url_image?: string | null;
}

interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  stock: number;
  url_image?: string | null;
}

export const UpdateProduct = async (
  productId: number,
  companyId: number,
  payload: UpdateProductPayload
) => {
  try {
    const response = await api.put(`/products/${productId}`, payload, {
      headers: {
        "Content-Type": "application/json",
        "company_id": companyId.toString(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    throw error;
  }
};

export const DeleteProduct = async (productId: number, companyId: number) => {
  try {
    const response = await api.delete(`/products/${productId}`, {
      headers: {
        "Content-Type": "application/json",
        "company_id": companyId.toString(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    throw error;
  }
};

export const CreateProduct = async (companyId: number, payload: CreateProductPayload) => {
  try {
    const response = await api.post("/products", payload, {
      headers: {
        "Content-Type": "application/json",
        "company_id": companyId.toString(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    throw error;
  }
};


export const uploadProductPhoto = async (productId: string, base64Image: string, companyId: string) => {
  const response = await api.post(`/product-photos/${productId}`, { base64Image }, {
    headers: {
      company_id: companyId,
    },
  });
  return response.data;
};

export const getPhotosByProduct = async (productId: string, companyId: string) => {
  const response = await api.get(`/product-photos/${productId}`, {
    headers: {
      company_id: companyId,
    },
  });
  return response.data;
};

export const getAllProductPhotos = async (companyId: string) => {
  const response = await api.get('/product-photos', {
    headers: {
      company_id: companyId,
    },
  });
  return response.data;
};

export const GetAllProducts = async (companyId: string) => {
  try {
    const response = await api.get('/products', {
      headers: {
        "Content-Type": "application/json",
        "company_id": companyId,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar todos os produtos:", error);
    throw error;
  }
};