"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/auth";
import { api } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { 
  uploadProductPhoto, 
  getProductPhotos, 
  getAllProductPhotos, 
  fileToBase64, 
  decodePhotoUrl,
  ProductPhoto as ApiProductPhoto 
} from "@/api/productPhotos";
import { 
  PlusIcon, 
  TrashIcon, 
  RefreshCwIcon,
  PackageIcon,
  EditIcon,
  ArrowLeftIcon,
  SearchIcon,
  FilterIcon,
  XIcon,
  ImageIcon,
  CameraIcon,
  UploadIcon
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  url_image?: string | null;
  images?: Array<{ id: string; url: string }>;
  photo_url?: string;
}


export default function ProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Estados principais
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para modais
  const [createProductModalOpen, setCreateProductModalOpen] = useState(false);
  const [deleteProductModalOpen, setDeleteProductModalOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  
  // Estados para formulário
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [currentImage, setCurrentImage] = useState<string>('');
  
  // Estados para imagens
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productPhotos, setProductPhotos] = useState<Record<string, string>>({});
  
  // Estados para filtros
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.company_id) {
      fetchProducts();
    }
  }, [user?.company_id]);

  // Buscar produtos
  const fetchProducts = async () => {
    if (!user?.company_id) return;

    try {
      setLoading(true);
      const response = await api.get('/products', {
        headers: {
          company_id: user.company_id.toString(),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      const formattedProducts = (response.data || []).map((product: any) => ({
        id: product.id.toString(),
        name: product.name,
        description: product.description || '',
        price: product.price || 0,
        stock: product.stock || 0,
        category: product.category || '',
        url_image: product.url_image,
        images: product.images || []
      }));
      
      setProducts(formattedProducts);
      
      // Buscar fotos dos produtos
      await fetchAllProductPhotos();
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar todas as fotos dos produtos
  const fetchAllProductPhotos = async () => {
    try {
      const photos = await getAllProductPhotos();
      const photosMap: Record<string, string> = {};
      
      photos.forEach(photo => {
        photosMap[photo.product_id] = decodePhotoUrl(photo.photo_url);
      });
      
      setProductPhotos(photosMap);
    } catch (error) {
      console.error('Erro ao buscar fotos dos produtos:', error);
    }
  };

  // Funções de utilidade
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  // Abrir modal de criação
  const openCreateProductModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: ''
    });
    clearImageSelection();
    setCreateProductModalOpen(true);
  };

  // Abrir modal de edição
  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category
    });
    clearImageSelection();
    setCreateProductModalOpen(true);
  };

  // Criar/Editar produto
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        category: formData.category
      };

      let productId: string;

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productData, {
          headers: {
            company_id: user.company_id.toString(),
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        productId = editingProduct.id;
        
        toast({
          title: "Sucesso!",
          description: "Produto atualizado com sucesso",
        });
      } else {
        const response = await api.post('/products', productData, {
          headers: {
            company_id: user.company_id.toString(),
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        productId = response.data.id.toString();
        
        toast({
          title: "Sucesso!",
          description: "Produto criado com sucesso",
        });
      }

      // Upload da imagem se foi selecionada
      if (selectedImage) {
        await uploadImage(productId);
      }

      setCreateProductModalOpen(false);
      clearImageSelection();
      await fetchProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar produto",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Confirmar exclusão
  const confirmDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setDeleteProductModalOpen(true);
  };

  // Excluir produto
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await api.delete(`/products/${productToDelete.id}`, {
        headers: {
          company_id: user.company_id.toString(),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast({
        title: "Sucesso!",
        description: "Produto excluído com sucesso",
      });

      setDeleteProductModalOpen(false);
      setProductToDelete(null);
      await fetchProducts();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir produto",
        variant: "destructive",
      });
    }
  };

  // Visualizar imagem
  const openImageViewer = (imageUrl: string) => {
    setCurrentImage(imageUrl);
    setImageViewerOpen(true);
  };

  // Filtrar produtos
  const filteredProducts = products.filter((product) => {
    const searchMatch = searchFilter === '' || 
      product.name.toLowerCase().includes(searchFilter.toLowerCase());
    
    const categoryMatch = categoryFilter === 'all' || product.category === categoryFilter;
    
    return searchMatch && categoryMatch;
  });

  // Limpar filtros
  const clearFilters = () => {
    setSearchFilter('');
    setCategoryFilter('all');
  };

  // Funções para gerenciar imagens
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImageSelection = () => {
    setSelectedImage(null);
    setImagePreview('');
  };

  const uploadImage = async (productId: string): Promise<void> => {
    if (!selectedImage) return;

    try {
      setUploadingImage(true);
      const base64Image = await fileToBase64(selectedImage);
      const photo = await uploadProductPhoto(productId, base64Image);
      
      // Atualizar o mapa de fotos
      setProductPhotos(prev => ({
        ...prev,
        [productId]: decodePhotoUrl(photo.photo_url)
      }));
      
      toast({
        title: "Sucesso!",
        description: "Imagem enviada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar imagem",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Obter categorias únicas
  const uniqueCategories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xl">
        <div className="w-full mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                onClick={() => router.push('/')}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-bold text-2xl tracking-wide flex items-center gap-2">
                  <PackageIcon className="h-6 w-6" />
                  Produtos
                </h1>
                <p className="text-emerald-100 text-sm mt-1">
                  Gerencie produtos e estoque
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                onClick={onRefresh}
                disabled={refreshing}
              >
                <RefreshCwIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                onClick={openCreateProductModal}
              >
                <PlusIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="text-emerald-100 text-sm font-medium">Total de Produtos</div>
              <div className="text-3xl font-bold text-white mt-1">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-12 rounded"></div>
                ) : products.length}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="text-emerald-100 text-sm font-medium">Valor Total</div>
              <div className="text-lg font-bold text-white mt-1">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-6 w-16 rounded"></div>
                ) : formatCurrency(products.reduce((sum, p) => sum + (p.price * p.stock), 0))}
              </div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-white/90 text-sm font-medium min-w-fit">Buscar:</Label>
                  <Input
                    placeholder="Nome do produto..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60 w-48"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-white/90 text-sm font-medium min-w-fit">Categoria:</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="bg-white/20 border-white/30 text-white w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {uniqueCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-white/90 hover:text-white hover:bg-white/20"
                >
                  Limpar
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <PackageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {products.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado'}
            </h3>
            <p className="text-gray-500 mb-6">
              {products.length === 0 
                ? 'Comece criando seu primeiro produto'
                : 'Tente ajustar os filtros de busca'
              }
            </p>
            {products.length === 0 && (
              <Button onClick={openCreateProductModal} className="bg-emerald-600 hover:bg-emerald-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Criar Primeiro Produto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              // Usar apenas fotos da API
              const imageUrl = productPhotos[product.id];

              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {imageUrl ? (
                    <div className="relative h-32 bg-gray-100">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openImageViewer(imageUrl)}
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                          Estoque: {product.stock}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-20 bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Sem imagem</p>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                          Estoque: {product.stock}
                        </Badge>
                      </div>
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg truncate flex-1">{product.name}</h3>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600 mb-2">
                      {formatCurrency(product.price)}
                    </p>
                    {product.category && (
                      <Badge variant="outline" className="mb-3">
                        {product.category}
                      </Badge>
                    )}
                    {product.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditProductModal(product)}
                        className="flex-1"
                      >
                        <EditIcon className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmDeleteProduct(product)}
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      <Dialog open={createProductModalOpen} onOpenChange={setCreateProductModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Criar Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitProduct} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome do produto"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Digite a descrição do produto"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Preço *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0,00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="stock">Estoque</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="produtos">Produtos</SelectItem>
                  <SelectItem value="cosmeticos">Cosméticos</SelectItem>
                  <SelectItem value="acessorios">Acessórios</SelectItem>
                  <SelectItem value="equipamentos">Equipamentos</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Campo de Upload de Imagem */}
            <div className="space-y-3">
              <Label>Imagem do Produto</Label>
              
              {/* Preview da imagem */}
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full h-6 w-6"
                    onClick={clearImageSelection}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {/* Botão de upload */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="flex-1"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4 mr-2" />
                  )}
                  {imagePreview ? 'Alterar Imagem' : 'Selecionar Imagem'}
                </Button>
                
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
              
              <p className="text-xs text-gray-500">
                Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateProductModalOpen(false);
                  clearImageSelection();
                }}
                className="flex-1"
                disabled={isCreating || uploadingImage}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={isCreating || uploadingImage}
              >
                {isCreating ? (
                  uploadingImage ? 'Enviando imagem...' : 'Salvando...'
                ) : (
                  editingProduct ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={deleteProductModalOpen} onOpenChange={setDeleteProductModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{productToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteProductModalOpen(false)}
            >
              Cancelar
            </Button>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Visualização de Imagem */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Visualizar Imagem</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={() => setImageViewerOpen(false)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
            <img
              src={currentImage}
              alt="Visualização"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
