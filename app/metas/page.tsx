"use client";

import { useState, useEffect } from 'react';
import { Target, Plus, TrendingUp, Calendar, User, Package, Briefcase, Edit2, Trash2, Award, Clock, X, ChevronLeft, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';

interface Goal {
  id: number;
  meta_quantity: number;
  description: string;
  professional_id?: number;
  professional_name?: string;
  professional_position?: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  items: GoalItem[];
  items_count: number;
}

interface GoalItem {
  id: number;
  goals_id: number;
  item_type: 'product' | 'service';
  product_id?: number;
  service_id?: number;
  name: string;
  description?: string;
  price: number;
  duration?: number;
}

interface GoalProgress {
  goal: {
    id: number;
    meta_quantity: number;
    description: string;
    professional_id?: number;
    professional_name?: string;
    professional_position?: string;
    start_date: string;
    end_date: string;
    is_expired: boolean;
  };
  progress: {
    current_quantity: number;
    current_value: number;
    target_quantity: number;
    percentage: number;
    status: 'em_andamento' | 'no_meio_do_caminho' | 'proximo_da_meta' | 'concluida';
    remaining_quantity: number;
  };
  items_progress: {
    item_id: number;
    item_type: 'product' | 'service';
    item_name: string;
    quantity: number;
    value: number;
  }[];
  items_count: number;
}

interface Professional {
  id: number;
  name: string;
  position: string;
}

interface Product {
  id: number;
  name: string;
  price: string;
  description: string;
  company_id: number;
}

interface Service {
  service_id: number;
  service_name: string;
  service_price: string;
  service_duration: number;
  service_description?: string;
}

export default function Metas() {
  const { user } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    meta_quantity: '',
    description: '',
    professional_id: '',
    start_date: '',
    end_date: '',
    items: [] as Array<{item_type: 'product' | 'service'; product_id?: number; service_id?: number}>
  });

  const [editFormData, setEditFormData] = useState({
    meta_quantity: '',
    description: '',
    professional_id: '',
    start_date: '',
    end_date: ''
  });

  const [selectedItems, setSelectedItems] = useState<{products: number[]; services: number[]}>({products: [], services: []});
  
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedGoalProgress, setSelectedGoalProgress] = useState<GoalProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    loadGoals();
    loadProfessionals();
    loadProducts();
    loadServices();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadGoals(),
        loadProfessionals(),
        loadProducts(),
        loadServices()
      ]);
      toast.success('Dados atualizados com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar dados');
    } finally {
      setRefreshing(false);
    }
  };

  const loadGoals = async () => {
    try {
      const response = await api.get(`/goals`, {
        headers: {
          'company_id': user?.company_id
        }
      });
      
      setGoals(response.data);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      toast.error('Erro ao carregar metas');
    } finally {
      setLoading(false);
    }
  };

  const loadProfessionals = async () => {
    try {
      const response = await api.get(`/teams`, {
        headers: {
          'company_id': user?.company_id
        }
      });
      
      setProfessionals(response.data);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get(`/products`, {
        headers: {
          'company_id': user?.company_id
        }
      });
      
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await api.get(`/service`, {
        headers: {
          'company_id': user?.company_id
        }
      });
      
      setServices(response.data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.meta_quantity || !formData.start_date || !formData.end_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsCreating(true);
    
    try {
      const items = [
        ...selectedItems.products.map(id => ({ item_type: 'product' as const, product_id: id })),
        ...selectedItems.services.map(id => ({ item_type: 'service' as const, service_id: id }))
      ];

      const payload = {
        meta_quantity: parseInt(formData.meta_quantity),
        description: formData.description,
        professional_id: formData.professional_id ? parseInt(formData.professional_id) : null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        items
      };

      const response = await api.post(`/goals`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'company_id': user?.company_id
        }
      });

      if (response.status === 201 || response.status === 200) {
        toast.success('Meta criada com sucesso!');
        setShowCreateModal(false);
        resetForm();
        loadGoals();
      } else {
        toast.error('Erro ao criar meta');
      }
    } catch (error: any) {
      console.error('Erro ao criar meta:', error);
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Erro ao criar meta');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingGoal) return;

    setIsUpdating(true);
    
    try {
      const payload = {
        meta_quantity: parseInt(editFormData.meta_quantity),
        description: editFormData.description,
        professional_id: editFormData.professional_id ? parseInt(editFormData.professional_id) : null,
        start_date: editFormData.start_date,
        end_date: editFormData.end_date
      };

      const response = await api.put(`/goals/${editingGoal.id}`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'company_id': user?.company_id
        }
      });

      if (response.status === 200) {
        toast.success('Meta atualizada com sucesso!');
        setEditingGoal(null);
        loadGoals();
      } else {
        toast.error('Erro ao atualizar meta');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar meta:', error);
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Erro ao atualizar meta');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;

    setIsDeleting(true);
    
    try {
      const response = await api.delete(`/goals/${goalToDelete.id}`, {
        headers: {
          'company_id': user?.company_id
        }
      });

      if (response.status === 200) {
        toast.success('Meta excluída com sucesso!');
        setGoalToDelete(null);
        loadGoals();
      } else {
        toast.error('Erro ao excluir meta');
      }
    } catch (error: any) {
      console.error('Erro ao excluir meta:', error);
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Erro ao excluir meta');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      meta_quantity: '',
      description: '',
      professional_id: '',
      start_date: '',
      end_date: '',
      items: []
    });
    setSelectedItems({products: [], services: []});
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setEditFormData({
      meta_quantity: goal.meta_quantity.toString(),
      description: goal.description,
      professional_id: goal.professional_id?.toString() || '',
      start_date: goal.start_date.split('T')[0],
      end_date: goal.end_date.split('T')[0]
    });
  };

  const loadGoalProgress = async (goalId: number) => {
    if (!user?.company_id) return;
    
    setLoadingProgress(true);
    try {
      const response = await api.get(`/goals/${goalId}/progress`, {
        headers: {
          'company_id': user?.company_id
        }
      });

      if (response.status === 200) {
        setSelectedGoalProgress(response.data);
        setShowProgressModal(true);
      } else {
        toast.error('Erro ao carregar progresso da meta');
      }
    } catch (error: any) {
      console.error('Erro ao carregar progresso:', error);
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Erro ao carregar progresso da meta');
      }
    } finally {
      setLoadingProgress(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'proximo_da_meta':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'no_meio_do_caminho':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'concluida':
        return '🎉 Concluída';
      case 'proximo_da_meta':
        return '🔥 Próximo da meta';
      case 'no_meio_do_caminho':
        return '⚡ No meio do caminho';
      default:
        return '📈 Em andamento';
    }
  };

  const translatePosition = (position: string | undefined): string => {
    if (!position) return '';
    
    switch (position.toLowerCase()) {
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Gerente';
      case 'employee':
        return 'Funcionário';
      default:
        return position;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedItems(prev => ({
      ...prev,
      products: prev.products.includes(productId)
        ? prev.products.filter(id => id !== productId)
        : [...prev.products, productId]
    }));
  };

  const toggleServiceSelection = (serviceId: number) => {
    setSelectedItems(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(id => id !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const toggleAllProducts = () => {
    setSelectedItems(prev => ({
      ...prev,
      products: prev.products.length === products.length ? [] : products.map(p => p.id)
    }));
  };

  const toggleAllServices = () => {
    setSelectedItems(prev => ({
      ...prev,
      services: prev.services.length === services.length ? [] : services.map(s => s.service_id)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-200 rounded-2xl"></div>
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header com Gradiente */}
      <div className="bg-white border-b px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.push('/')}
            className="p-2 rounded-md border border-[#3D583F] text-[#3D583F] hover:bg-[#3D583F]/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-md border border-[#3D583F] text-[#3D583F] hover:bg-[#3D583F]/10 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#3D583F] hover:bg-[#365137] text-white px-4 py-2 rounded-md font-semibold transition-all flex items-center gap-2 text-sm shadow"
            >
              <Plus className="h-4 w-4" />
              Nova Meta
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#3D583F]/10 rounded-2xl flex items-center justify-center">
            <Target className="h-6 w-6 text-[#3D583F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Metas</h1>
            <p className="text-gray-600 text-sm">Acompanhe suas metas de vendas</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 border border-[#3D583F]/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#3D583F]/10 rounded-lg flex items-center justify-center">
                <Award className="h-4 w-4 text-[#3D583F]" />
              </div>
              <span className="text-[#3D583F] text-xs font-medium">METAS ATIVAS</span>
            </div>
            <p className="text-2xl font-bold text-[#3D583F]">{goals.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#3D583F]/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#3D583F]/10 rounded-lg flex items-center justify-center">
                <Package className="h-4 w-4 text-[#3D583F]" />
              </div>
              <span className="text-[#3D583F] text-xs font-medium">ITENS TOTAIS</span>
            </div>
            <p className="text-2xl font-bold text-[#3D583F]">{goals.reduce((total, goal) => total + goal.items_count, 0)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">

        {/* Goals List */}
        {goals.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-[#3D583F] rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Nenhuma meta encontrada</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">Comece criando sua primeira meta de vendas para acompanhar o desempenho</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#3D583F] hover:bg-[#365137] text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              Criar Primeira Meta
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.id} className="bg-white rounded-xl shadow-lg overflow-hidden border-0 hover:shadow-xl transition-shadow">
                <div className="bg-[#3D583F]/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#3D583F] rounded-xl flex items-center justify-center shadow-lg">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {goal.meta_quantity} <span className="text-base text-gray-500">un</span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">Meta de Quantidade</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => loadGoalProgress(goal.id)}
                        disabled={loadingProgress}
                        className="p-2 bg-white/60 backdrop-blur-sm hover:bg-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                        title="Ver Progresso"
                      >
                        <TrendingUp className="h-4 w-4 text-[#3D583F]" />
                      </button>
                      <button
                        onClick={() => openEditModal(goal)}
                        className="p-2 bg-white/60 backdrop-blur-sm hover:bg-white rounded-lg transition-colors shadow-sm"
                      >
                        <Edit2 className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => setGoalToDelete(goal)}
                        className="p-2 bg-white/60 backdrop-blur-sm hover:bg-white rounded-lg transition-colors shadow-sm"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  {goal.description && (
                    <p className="text-gray-600 mb-3 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">{goal.description}</p>
                  )}
                  
                  <div className="space-y-2 mb-3">
                    {goal.professional_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
                          <User className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-gray-700 font-medium">{goal.professional_name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500 text-xs">{translatePosition(goal.professional_position)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 bg-purple-50 rounded-lg flex items-center justify-center">
                        <Calendar className="h-3 w-3 text-purple-600" />
                      </div>
                      <span className="text-gray-600 text-xs">{formatDate(goal.start_date)} até {formatDate(goal.end_date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 bg-orange-50 rounded-lg flex items-center justify-center">
                        <Package className="h-3 w-3 text-orange-600" />
                      </div>
                      <span className="text-gray-600 text-xs font-medium">{goal.items_count} {goal.items_count === 1 ? 'item' : 'itens'}</span>
                    </div>
                  </div>
                  
                  {goal.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Itens Vinculados</div>
                      <div className="space-y-1.5">
                        {goal.items.slice(0, 2).map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm bg-gradient-to-r from-gray-50 to-white p-2 rounded-lg">
                            <div className="flex items-center gap-2 flex-1">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${item.item_type === 'product' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                                {item.item_type === 'product' ? (
                                  <Package className="h-3 w-3 text-blue-600" />
                                ) : (
                                  <Briefcase className="h-3 w-3 text-orange-600" />
                                )}
                              </div>
                              <span className="text-gray-700 text-xs font-medium truncate">{item.name}</span>
                            </div>
                            <span className="text-[#3D583F] font-bold text-xs ml-2">{formatCurrency(item.price)}</span>
                          </div>
                        ))}
                        {goal.items.length > 2 && (
                          <div className="text-xs text-gray-400 text-center py-1">
                            +{goal.items.length - 2} mais
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
            <div className="bg-[#3D583F] p-6 sticky top-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Nova Meta</h2>
                    <p className="text-white/80 text-sm">Defina uma nova meta de vendas</p>
                  </div>
                </div>
                <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <input type="number" min="1" value={formData.meta_quantity} onChange={(e) => setFormData(prev => ({ ...prev, meta_quantity: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" placeholder="Quantidade *" required />
                <select value={formData.professional_id} onChange={(e) => setFormData(prev => ({ ...prev, professional_id: e.target.value }))} className="w-full px-4 py-2 border rounded-lg">
                  <option value="">Profissional (opcional)</option>
                  {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" placeholder="Descrição" rows={3} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" value={formData.start_date} onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))} className="px-4 py-2 border rounded-lg" required />
                  <input type="date" value={formData.end_date} onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))} className="px-4 py-2 border rounded-lg" required />
                </div>
                
                {products.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-semibold">Produtos ({selectedItems.products.length} selecionados)</label>
                      <button
                        type="button"
                        onClick={toggleAllProducts}
                        className="text-xs text-[#3D583F] hover:text-[#365137] font-semibold px-3 py-1 rounded-lg hover:bg-[#3D583F]/10 transition-colors"
                      >
                        {selectedItems.products.length === products.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                      {products.map(product => (
                        <label key={product.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input type="checkbox" checked={selectedItems.products.includes(product.id)} onChange={() => toggleProductSelection(product.id)} className="rounded border-gray-300 text-[#3D583F] focus:ring-[#3D583F]" />
                          <Package className="h-4 w-4 text-blue-500" />
                          <span className="flex-1 text-sm">{product.name}</span>
                          <span className="text-xs text-gray-500">{formatCurrency(parseFloat(product.price))}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                {services.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-semibold">Serviços ({selectedItems.services.length} selecionados)</label>
                      <button
                        type="button"
                        onClick={toggleAllServices}
                        className="text-xs text-[#3D583F] hover:text-[#365137] font-semibold px-3 py-1 rounded-lg hover:bg-[#3D583F]/10 transition-colors"
                      >
                        {selectedItems.services.length === services.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                      {services.map(service => (
                        <label key={service.service_id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input type="checkbox" checked={selectedItems.services.includes(service.service_id)} onChange={() => toggleServiceSelection(service.service_id)} className="rounded border-gray-300 text-[#3D583F] focus:ring-[#3D583F]" />
                          <Briefcase className="h-4 w-4 text-orange-500" />
                          <span className="flex-1 text-sm">{service.service_name}</span>
                          <span className="text-xs text-gray-500">{formatCurrency(parseFloat(service.service_price))}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4 border-t">
                  <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button type="submit" disabled={isCreating} className="flex-1 bg-[#3D583F] text-white px-4 py-2 rounded-lg hover:bg-[#365137] disabled:opacity-50 flex items-center justify-center gap-2">
                    {isCreating ? <><Loader2 className="h-4 w-4 animate-spin" />Criando...</> : <><Target className="h-4 w-4" />Criar</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Edição */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-[#3D583F] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Edit2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Editar Meta</h2>
                    <p className="text-white/80 text-sm">Atualize os dados da meta</p>
                  </div>
                </div>
                <button onClick={() => setEditingGoal(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="h-5 w-5 text-white" /></button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleEditGoal} className="space-y-4">
                <input type="number" min="1" value={editFormData.meta_quantity} onChange={(e) => setEditFormData(prev => ({ ...prev, meta_quantity: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" required />
                <select value={editFormData.professional_id} onChange={(e) => setEditFormData(prev => ({ ...prev, professional_id: e.target.value }))} className="w-full px-4 py-2 border rounded-lg">
                  <option value="">Profissional (opcional)</option>
                  {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <textarea value={editFormData.description} onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" rows={3} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" value={editFormData.start_date} onChange={(e) => setEditFormData(prev => ({ ...prev, start_date: e.target.value }))} className="px-4 py-2 border rounded-lg" required />
                  <input type="date" value={editFormData.end_date} onChange={(e) => setEditFormData(prev => ({ ...prev, end_date: e.target.value }))} className="px-4 py-2 border rounded-lg" required />
                </div>
                <div className="bg-[#3D583F]/10 border border-[#3D583F]/20 rounded-lg p-3">
                  <p className="text-sm text-[#3D583F]">Esta meta possui {editingGoal.items_count} itens. Para modificar, exclua e crie uma nova.</p>
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setEditingGoal(null)} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
                  <button type="submit" disabled={isUpdating} className="flex-1 bg-[#3D583F] text-white px-4 py-2 rounded-lg hover:bg-[#365137] disabled:opacity-50 flex items-center justify-center gap-2">
                    {isUpdating ? <><Loader2 className="h-4 w-4 animate-spin" />Atualizando...</> : <>Atualizar</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Exclusão */}
      {goalToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Excluir Meta</h2>
                  <p className="text-sm text-white/80">Esta ação não pode ser desfeita</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold">{goalToDelete.meta_quantity} unidades</div>
                <div className="text-sm text-gray-600">{goalToDelete.professional_name || 'Meta geral'}</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-700">Esta meta possui {goalToDelete.items_count} itens vinculados.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setGoalToDelete(null)} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
                <button onClick={handleDeleteGoal} disabled={isDeleting} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {isDeleting ? <><Loader2 className="h-4 w-4 animate-spin" />Excluindo...</> : <>Excluir</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Progresso */}
      {showProgressModal && selectedGoalProgress && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
            <div className="bg-[#3D583F] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"><TrendingUp className="h-5 w-5 text-white" /></div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Progresso da Meta</h2>
                    <p className="text-sm text-white/80">{selectedGoalProgress.goal.description}</p>
                  </div>
                </div>
                <button onClick={() => { setShowProgressModal(false); setSelectedGoalProgress(null); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="h-5 w-5 text-white" /></button>
              </div>
            </div>
            
            <div className="p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
              <div className="bg-[#3D583F]/10 rounded-xl p-5 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center bg-white/50 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-2xl font-bold text-[#3D583F] mb-1">{selectedGoalProgress.progress.current_quantity}</div>
                    <div className="text-xs text-gray-600 font-medium">Vendido</div>
                  </div>
                  <div className="text-center bg-white/50 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{selectedGoalProgress.goal.meta_quantity}</div>
                    <div className="text-xs text-gray-600 font-medium">Meta</div>
                  </div>
                  <div className="text-center bg-white/50 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{selectedGoalProgress.progress.remaining_quantity}</div>
                    <div className="text-xs text-gray-600 font-medium">Faltam</div>
                  </div>
                  <div className="text-center bg-white/50 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-xl font-bold text-[#3D583F] mb-1">{formatCurrency(selectedGoalProgress.progress.current_value)}</div>
                    <div className="text-xs text-gray-600 font-medium">Valor</div>
                  </div>
                </div>
              </div>

              <div className="mb-6 bg-gray-50 rounded-xl p-5">
                <div className="flex justify-between mb-3 text-sm">
                  <span className="font-bold text-gray-700">Progresso</span>
                  <span className="font-bold text-[#3D583F] text-lg">{selectedGoalProgress.progress.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                  <div className="bg-[#3D583F] h-4 rounded-full transition-all duration-500 shadow-lg" style={{ width: `${Math.min(selectedGoalProgress.progress.percentage, 100)}%` }} />
                </div>
                <div className="mt-3 text-center">
                  <span className={`inline-block px-4 py-2 rounded-full text-xs font-bold border-2 ${getStatusColor(selectedGoalProgress.progress.status)}`}>
                    {getStatusText(selectedGoalProgress.progress.status)}
                  </span>
                </div>
              </div>

              {selectedGoalProgress.items_progress.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Progresso por Item</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedGoalProgress.items_progress.map((item) => (
                      <div key={item.item_id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {item.item_type === 'product' ? <Package className="h-4 w-4 text-blue-500" /> : <Briefcase className="h-4 w-4 text-orange-500" />}
                            <span className="font-medium text-sm">{item.item_name}</span>
                          </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-[#3D583F]">{item.quantity} un</div>
                              <div className="text-xs text-gray-500">{formatCurrency(item.value)}</div>
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${item.item_type === 'product' ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${item.quantity > 0 ? Math.min((item.quantity / selectedGoalProgress.goal.meta_quantity) * 100, 100) : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
