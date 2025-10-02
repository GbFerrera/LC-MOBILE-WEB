"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { GetAllProducts, CreateProduct, UpdateProduct, DeleteProduct } from '@/services/productService';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  url_image?: string | null;
  images?: Array<{ id: string; url: string }>;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  base64Images: string[];
  removedImageIds: string[];
}

const companyId = "1"; // TODO: Replace with actual company ID from authentication context
const DEFAULT_PLACEHOLDER_IMAGE = "https://via.placeholder.com/150"; // Imagem de placeholder padrão

const ProdutosPage = () => {
  // Estados para gerenciamento de produtos
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para o modal de formulário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Estados do formulário
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ id: string; url: string }>>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);

  // Estados para o visualizador de imagens
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  // Editor de texto rico
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      setDescription(editor.getHTML());
    },
    immediatelyRender: false, // Adicionado para resolver o erro de SSR
  });

  // Buscar produtos
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await GetAllProducts(companyId);
      setProducts(data);
      console.log('Dados dos produtos recebidos:', data);
    } catch (err) {
      setError('Erro ao carregar produtos.');
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Resetar formulário quando modal abre/fecha
  useEffect(() => {
    if (isModalOpen) {
      if (editingProduct) {
        setName(editingProduct.name || '');
        setPrice(editingProduct.price ? String(editingProduct.price) : '');
        setStock(editingProduct.stock ? String(editingProduct.stock) : '');
        setCategory(editingProduct.category || '');
        
        // Decodificar URLs das imagens existentes para edição
        const decodedImages = (editingProduct.images || []).map(img => ({
          id: img.id,
          url: decodeURIComponent(img.url)
        }));
        setExistingImages(decodedImages);
        
        if (editor) {
          setDescription(editingProduct.description || '');
          editor.commands.setContent(editingProduct.description || '');
        }
      } else {
        setName('');
        setDescription('');
        setPrice('');
        setStock('');
        setCategory('');
        setImages([]);
        setImagePreviews([]);
        setExistingImages([]);
        setFormErrors({});
        if (editor) {
          editor.commands.setContent('');
        }
      }
    }
  }, [isModalOpen, editingProduct, editor]);

  // Manipuladores de imagens
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages(prev => [...prev, ...newImages]);
      
      const newPreviews = newImages.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (imageId: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Validação do formulário
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!name || name.length < 3) {
      errors.name = 'Nome do produto é obrigatório e deve ter no mínimo 3 caracteres';
    }
    
    if (!description || description === '<p></p>') {
      errors.description = 'Descrição é obrigatória';
    }
    
    if (!price || parseFloat(price) <= 0) {
      errors.price = 'Preço é obrigatório e deve ser maior que zero';
    }
    
    if (!stock || parseInt(stock) < 0) {
      errors.stock = 'Estoque é obrigatório e não pode ser negativo';
    }
    
    if (!category) {
      errors.category = 'Categoria é obrigatória';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submissão do formulário
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setFormLoading(true);
    
    try {
      // Converter imagens para base64
      const base64Images = await Promise.all(
        images.map(image => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(image);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });
        })
      );
      
      const productData = {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        base64Images,
        removedImageIds: editingProduct 
          ? editingProduct.images
              ?.filter(img => !existingImages.some(eImg => eImg.id === img.id))
              .map(img => img.id) || []
          : []
      };
      
      if (editingProduct) {
        await UpdateProduct(parseInt(editingProduct.id), parseInt(companyId), productData);
      } else {
        await CreateProduct(parseInt(companyId), productData);
      }
      
      fetchProducts();
      setIsModalOpen(false);
    } catch (err) {
      setError('Erro ao salvar produto');
      console.error('Erro ao salvar produto:', err);
    } finally {
      setFormLoading(false);
    }
  };

  // Exclusão de produto
  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await DeleteProduct(parseInt(productId), parseInt(companyId));
        fetchProducts();
      } catch (err) {
        setError('Erro ao excluir produto');
        console.error('Erro ao excluir produto:', err);
      }
    }
  };

  // Funções para o visualizador de imagens
  const handleOpenImageViewer = (imageUrl: string) => {
    console.log("URL da imagem no visualizador:", imageUrl); // Adicionado para depuração
    setCurrentImage(imageUrl);
    setIsImageViewerOpen(true);
  };

  const handleCloseImageViewer = () => {
    setIsImageViewerOpen(false);
    setCurrentImage(null);
  };

  // Renderização condicional
  if (loading) {
    return <div className="container mx-auto p-4">Carregando produtos...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Erro: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Produtos</h1>
      
      <button
        onClick={() => {
          setEditingProduct(null);
          setIsModalOpen(true);
        }}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Adicionar Novo Produto
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => {
          // Tenta pegar a imagem de diferentes fontes possíveis
          const rawUrl = product.url_image || 
                        (product.images && product.images.length > 0 ? product.images[0].url : null);
          
          // DECODIFICA a URL apenas se existir e não for o placeholder
          let imageUrl = DEFAULT_PLACEHOLDER_IMAGE;
          if (rawUrl) {
            try {
              imageUrl = decodeURIComponent(rawUrl);
            } catch (error) {
              console.error('Erro ao decodificar URL:', rawUrl, error);
              imageUrl = rawUrl; // Usa a URL original se falhar ao decodificar
            }
          }
          
          return (
            <div key={product.id} className="border rounded-lg shadow-lg overflow-hidden bg-white">
              {/* Imagem do produto - ocupa toda a largura do card */}
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleOpenImageViewer(imageUrl)}
                  onError={(e) => {
                    console.error('Erro ao carregar imagem:', imageUrl);
                    (e.target as HTMLImageElement).src = DEFAULT_PLACEHOLDER_IMAGE;
                  }}
                />
              </div>
              
              {/* Conteúdo do card */}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 truncate">{product.name}</h2>
                <p className="text-gray-700 mb-1">Preço: <span className="font-bold text-green-600">R$ {parseFloat(product.price.toString()).toFixed(2)}</span></p>
                <p className="text-gray-700 mb-1">Estoque: <span className="font-semibold">{product.stock}</span></p>
                <p className="text-gray-700 mb-3">Categoria: <span className="font-semibold capitalize">{product.category}</span></p>
                
                {/* Botões de ação */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setIsModalOpen(true);
                    }}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded transition-colors"
                  >
                    Editar
                  </button>
                  
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de formulário */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">
              {editingProduct ? 'Editar Produto' : 'Criar Novo Produto'}
            </h3>
            
            <form onSubmit={handleSubmitProduct}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  id="name"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs italic">{formErrors.name}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Descrição
                </label>
                <EditorContent editor={editor} className="border rounded p-2 min-h-[200px]" />
                {formErrors.description && (
                  <p className="text-red-500 text-xs italic">{formErrors.description}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
                  Preço
                </label>
                <input
                  type="number"
                  id="price"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  step="0.01"
                />
                {formErrors.price && (
                  <p className="text-red-500 text-xs italic">{formErrors.price}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="stock">
                  Estoque
                </label>
                <input
                  type="number"
                  id="stock"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
                {formErrors.stock && (
                  <p className="text-red-500 text-xs italic">{formErrors.stock}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                  Categoria
                </label>
                <select
                  id="category"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="eletronicos">Eletrônicos</option>
                  <option value="roupas">Roupas</option>
                  <option value="alimentos">Alimentos</option>
                </select>
                {formErrors.category && (
                  <p className="text-red-500 text-xs italic">{formErrors.category}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="images">
                  Imagens do Produto
                </label>
                <input
                  type="file"
                  id="images"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                />
                
                <div className="mt-2 flex flex-wrap gap-2">
                  {existingImages.map((image) => (
                    <div key={`existing-${image.id}`} className="relative w-24 h-24">
                      <img 
                        src={image.url} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(image.id)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        X
                      </button>
                    </div>
                  ))}
                  
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative w-24 h-24">
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={formLoading}
                >
                  {formLoading ? 'Salvando...' : (editingProduct ? 'Salvar Alterações' : 'Criar Produto')}
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={formLoading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {isImageViewerOpen && currentImage && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative bg-white p-4 rounded-lg shadow-lg max-w-3xl max-h-full overflow-auto">
            <button
              onClick={handleCloseImageViewer}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold"
            >
              X
            </button>
            <img src={currentImage} alt="Visualização da Imagem" className="max-w-full h-auto" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProdutosPage;