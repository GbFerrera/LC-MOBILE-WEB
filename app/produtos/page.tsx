"use client";

import React, { useState, useEffect } from 'react';
import { api, setupAPIInterceptors } from '../../services/api';
import { getProductPhotos } from '../../services/productService';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/auth';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export default function Produtos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !user?.company_id) {
      setLoading(false);
      return;
    }

    setupAPIInterceptors(user.company_id);

    const loadProducts = async () => {
      setLoading(true);
      try {
        const response = await api.get('/products');
        const fetchedProducts: Product[] = response.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || 'Sem descrição',
          price: parseFloat(item.price),
          image: item.image_url || 'https://via.placeholder.com/400',
          category: item.category || 'Outros',
        }));
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [user?.company_id, authLoading]);

  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  return (
    <div className="min-h-screen bg-white p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Produtos</h1>

      <div className="mb-6">
        <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-2">
          Pesquisar Produtos:
        </label>
        <input
          type="text"
          id="search-input"
          className="p-3 border border-gray-300 rounded-full w-full max-w-md bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 ease-in-out"
          placeholder="Buscar por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Carregando produtos...</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-center text-gray-600">Nenhum produto encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
              <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
              <div className="p-5">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h2>
                <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-green-600">R$ {product.price.toFixed(2)}</span>
                  <span className="text-sm text-gray-500">{product.category}</span>
                </div>
                <button className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition duration-200 ease-in-out text-lg font-medium">
                  Adicionar ao Carrinho
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}