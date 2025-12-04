"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, Clock, CheckCircle2, XCircle, Banknote, Calendar, Search, Edit, Trash2, ChevronLeftIcon, PencilIcon } from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { toast } from 'sonner';
import { api } from '@/services/api';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Interfaces
interface RemunerationSummary {
  total_pending: number;
  total_paid: number;
  total_canceled: number;
  total_value: number;
}

interface TeamMember {
  id: string;
  name: string;
  position: string;
}

interface Remuneration {
  id: string;
  professional_id: string;
  professional_name: string;
  professional_position: string;
  value: number;
  status: string;
  notes?: string;
  payment_date?: string;
  created_at: string;
  updated_at: string;
}

// Traduções
const statusTranslations: { [key: string]: string } = {
  'pending': 'Aguardando Confirmação',
  'paid': 'Pagamento Confirmado',
  'canceled': 'Pagamento Cancelado'
};

const positionTranslations: { [key: string]: string } = {
  'employee': 'Funcionário',
  'manager': 'Gerente', 
  'admin': 'Administrador',
  'administrator': 'Administrador',
  'funcionario': 'Funcionário',
  'gerente': 'Gerente',
  'administrador': 'Administrador'
};

export default function Remuneration() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [remunerations, setRemunerations] = useState<Remuneration[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [summary, setSummary] = useState<RemunerationSummary>({
    total_pending: 0,
    total_paid: 0,
    total_canceled: 0,
    total_value: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRemuneration, setEditingRemuneration] = useState<Remuneration | null>(null);
  const [reloadKeyword, setReloadKeyword] = useState(0);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    professional_id: "",
    value: "",
    notes: "",
    payment_date: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Funções de carregamento
  const loadTeamMembers = useCallback(async () => {
    try {
      const response = await api.get('/teams', {
        headers: {
          'company_id': user?.company_id
        }
      });
      setTeamMembers(response.data);
    } catch (error) {
      console.error("Erro ao carregar membros da equipe:", error);
    }
  }, [user?.company_id]);

  const loadRemunerations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/remuneration', {
        headers: {
          'company_id': user?.company_id
        }
      });
      
      const data = response.data;
      setRemunerations(data);
      
      // Calcular resumo
      const summary = {
        total_pending: 0,
        total_paid: 0,
        total_canceled: 0,
        total_value: 0
      };

      data.forEach((remuneration: Remuneration) => {
        summary.total_value += parseFloat(remuneration.value.toString());
        if (remuneration.status === 'pending') summary.total_pending++;
        if (remuneration.status === 'paid') summary.total_paid++;
        if (remuneration.status === 'canceled') summary.total_canceled++;
      });

      setSummary(summary);
    } catch (error) {
      console.error("Erro ao carregar remunerações:", error);
      toast.error("Erro ao carregar remunerações");
    } finally {
      setLoading(false);
    }
  }, [user?.company_id]);

  useEffect(() => {
    if (user?.company_id) {
      loadTeamMembers();
      loadRemunerations();
    }
  }, [loadTeamMembers, loadRemunerations, reloadKeyword]);

  // Funções CRUD
  const handleCreateRemuneration = async () => {
    if (!formData.professional_id || !formData.value) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/remuneration', {
        professional_id: formData.professional_id,
        value: parseFloat(formData.value),
        notes: formData.notes,
        payment_date: formData.payment_date || null
      }, {
        headers: {
          'company_id': user?.company_id
        }
      });

      toast.success("Remuneração criada com sucesso!");
      setFormData({ professional_id: "", value: "", notes: "", payment_date: "" });
      setShowCreateModal(false);
      setReloadKeyword(prev => prev + 1);
    } catch (error: any) {
      console.error("Erro ao criar remuneração:", error);
      toast.error(error.response?.data?.message || "Erro ao criar remuneração");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (remunerationId: string) => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      await api.put(`/remuneration/${remunerationId}`, {
        status: 'paid',
        payment_date: currentDate
      }, {
        headers: {
          'company_id': user?.company_id
        }
      });

      toast.success("Remuneração marcada como paga!");
      setReloadKeyword(prev => prev + 1);
    } catch (error: any) {
      console.error("Erro ao marcar como paga:", error);
      toast.error(error.response?.data?.message || "Erro ao marcar como paga");
    }
  };

  const handleEditRemuneration = async () => {
    if (!editingRemuneration) return;

    try {
      setIsSubmitting(true);
      await api.put(`/remuneration/${editingRemuneration.id}`, {
        value: parseFloat(editingRemuneration.value.toString()),
        status: editingRemuneration.status,
        notes: editingRemuneration.notes,
        payment_date: editingRemuneration.payment_date
      }, {
        headers: {
          'company_id': user?.company_id
        }
      });

      toast.success("Remuneração atualizada com sucesso!");
      setShowEditModal(false);
      setEditingRemuneration(null);
      setReloadKeyword(prev => prev + 1);
    } catch (error: any) {
      console.error("Erro ao atualizar remuneração:", error);
      toast.error(error.response?.data?.message || "Erro ao atualizar remuneração");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRemuneration = async (remunerationId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta remuneração?")) return;

    try {
      await api.delete(`/remuneration/${remunerationId}`, {
        headers: {
          'company_id': user?.company_id
        }
      });

      toast.success("Remuneração removida com sucesso!");
      setReloadKeyword(prev => prev + 1);
    } catch (error: any) {
      console.error("Erro ao remover remuneração:", error);
      toast.error(error.response?.data?.message || "Erro ao remover remuneração");
    }
  };

  // Funções utilitárias
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data não disponível';
    return date.toLocaleDateString('pt-BR');
  };

  // Filtrar remunerações
  const filteredRemunerations = remunerations.filter(remuneration =>
    remuneration.professional_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    remuneration.professional_position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    remuneration.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#3D583F]/30 border-t-[#3D583F] rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Carregando remunerações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="p-2 rounded-md border border-[#3D583F] text-[#3D583F] hover:bg-[#3D583F]/10">
              <ChevronLeftIcon className="h-7 w-7" />
            </Link>
            <h1 className="font-bold text-2xl tracking-wide text-gray-900">Remunerações</h1>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-[#3D583F] hover:bg-[#365137] text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nova
                </Button>
              </DialogTrigger>
              
              {/* Modal de Criação */}
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                    <div className="p-2 bg-[#3D583F]/10 rounded-lg">
                      <DollarSign className="h-5 w-5 text-[#3D583F]" />
                    </div>
                    Nova Remuneração
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Preencha os dados para processar o pagamento
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="professional" className="text-sm font-medium text-gray-700 mb-2 block">
                      Profissional *
                    </Label>
                    <Select value={formData.professional_id} onValueChange={(value) => setFormData({ ...formData, professional_id: value })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o profissional" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} - {positionTranslations[member.position.toLowerCase()] || member.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="value" className="text-sm font-medium text-gray-700 mb-2 block">
                      Valor da Remuneração *
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="value"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="payment_date" className="text-sm font-medium text-gray-700 mb-2 block">
                      Data de Pagamento
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="payment_date"
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-2 block">
                      Observações
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Adicione observações sobre esta remuneração..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateRemuneration}
                  disabled={isSubmitting || !formData.professional_id || !formData.value}
                  className="bg-[#3D583F] hover:bg-[#365137] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Criando...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Criar Remuneração
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>

      {/* Main Content */}
      <div className=" min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Pendentes */}
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-medium">Pendentes</p>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">{summary.total_pending}</h3>
                </div>
              </CardContent>
            </Card>

            {/* Pagas */}
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-medium">Pagas</p>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">{summary.total_paid}</h3>
                </div>
              </CardContent>
            </Card>

            {/* Canceladas */}
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg flex-shrink-0">
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-medium">Canceladas</p>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">{summary.total_canceled}</h3>
                </div>
              </CardContent>
            </Card>

            {/* Valor Total */}
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-medium whitespace-nowrap">Valor Total</p>
                  </div>
                  <h3 className="text-sm sm:text-lg font-bold text-gray-900 truncate">{formatCurrency(summary.total_value)}</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Busca */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por profissional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-200 focus:border-[#3D583F] focus:ring-[#3D583F]"
              />
            </div>
          </div>

          {/* Lista de Remunerações */}
          <div className="space-y-4">
            {filteredRemunerations.length === 0 ? (
              <Card className="border border-gray-100 shadow-sm">
                <CardContent className="p-8 text-center">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma remuneração encontrada</h3>
                  <p className="text-gray-500">Não há remunerações que correspondam aos seus critérios de busca.</p>
                </CardContent>
              </Card>
            ) : (
              filteredRemunerations.map((remuneration) => (
                <Card key={remuneration.id} className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col gap-3 sm:gap-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-lg mb-2 truncate">{remuneration.professional_name}</h3>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-lg font-medium ${
                              remuneration.status === 'paid' 
                                ? 'bg-emerald-100 text-emerald-700'
                                : remuneration.status === 'canceled'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {statusTranslations[remuneration.status]}
                            </span>
                            <span className="text-[10px] sm:text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                              {positionTranslations[remuneration.professional_position.toLowerCase()] || remuneration.professional_position}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 text-[#3D583F]">
                            <Banknote className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="font-bold text-sm sm:text-lg whitespace-nowrap">{formatCurrency(remuneration.value)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                        {remuneration.payment_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            <span>Pago em {formatDate(remuneration.payment_date)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                          <span>Criada em {formatDate(remuneration.created_at)}</span>
                        </div>
                        
                        {remuneration.notes && (
                          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg text-gray-600 italic text-xs sm:text-sm">
                            "{remuneration.notes}"
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {remuneration.status !== 'paid' && (
                          <Button
                            onClick={() => handleMarkAsPaid(remuneration.id)}
                            size="sm"
                            className="bg-[#3D583F] hover:bg-[#365137] text-white"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Confirmar
                          </Button>
                        )}
                        
                        <Dialog open={showEditModal && editingRemuneration?.id === remuneration.id} onOpenChange={(open) => {
                          if (!open) {
                            setShowEditModal(false);
                            setEditingRemuneration(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingRemuneration(remuneration);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          
                          {/* Modal de Edição */}
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                                <div className="p-2 bg-[#3D583F]/10 rounded-lg">
                                  <Edit className="h-5 w-5 text-[#3D583F]" />
                                </div>
                                Editar Remuneração
                              </DialogTitle>
                              <DialogDescription className="text-gray-600">
                                Atualize os dados da remuneração
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                              <div>
                                <Label htmlFor="edit-professional" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Profissional
                                </Label>
                                <Input
                                  id="edit-professional"
                                  type="text"
                                  value={editingRemuneration?.professional_name || ''}
                                  disabled
                                  className="bg-gray-50 text-gray-500"
                                />
                              </div>

                              <div>
                                <Label htmlFor="edit-value" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Valor da Remuneração
                                </Label>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input
                                    id="edit-value"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editingRemuneration?.value || 0}
                                    onChange={(e) => editingRemuneration && setEditingRemuneration({
                                      ...editingRemuneration,
                                      value: parseFloat(e.target.value) || 0
                                    })}
                                    className="pl-10"
                                  />
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="edit-status" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Status
                                </Label>
                                <Select 
                                  value={editingRemuneration?.status || 'pending'} 
                                  onValueChange={(value) => editingRemuneration && setEditingRemuneration({
                                    ...editingRemuneration,
                                    status: value
                                  })}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="paid">Pago</SelectItem>
                                    <SelectItem value="canceled">Cancelado</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="edit-payment-date" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Data de Pagamento
                                </Label>
                                <div className="relative">
                                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input
                                    id="edit-payment-date"
                                    type="date"
                                    value={editingRemuneration?.payment_date || ""}
                                    onChange={(e) => editingRemuneration && setEditingRemuneration({
                                      ...editingRemuneration,
                                      payment_date: e.target.value
                                    })}
                                    className="pl-10"
                                  />
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="edit-notes" className="text-sm font-medium text-gray-700 mb-2 block">
                                  Observações
                                </Label>
                                <Textarea
                                  id="edit-notes"
                                  value={editingRemuneration?.notes || ""}
                                  onChange={(e) => editingRemuneration && setEditingRemuneration({
                                    ...editingRemuneration,
                                    notes: e.target.value
                                  })}
                                  rows={3}
                                  className="resize-none"
                                />
                              </div>
                            </div>

                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setShowEditModal(false);
                                  setEditingRemuneration(null);
                                }}
                                disabled={isSubmitting}
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleEditRemuneration}
                                disabled={isSubmitting}
                                className="bg-[#3D583F] hover:bg-[#365137] text-white"
                              >
                                {isSubmitting ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                    Salvando...
                                  </>
                                ) : (
                                  <>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Salvar Alterações
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRemuneration(remuneration.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
