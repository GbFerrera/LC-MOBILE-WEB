"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/auth";
import { api } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  PlusIcon, 
  CreditCardIcon, 
  TrashIcon, 
  RefreshCwIcon,
  ShoppingCartIcon,
  UsersIcon,
  ClockIcon,
  CheckIcon,
  XIcon,
  EyeIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  ArrowLeftIcon,
  FilterIcon,
  SearchIcon,
  CalendarIcon,
  XIcon as X
} from "lucide-react";

// Interfaces
interface Client {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  document: string;
}

interface Service {
  service_id?: string;
  service_name?: string;
  service_price?: number;
  service_duration?: number;
  service_description?: string;
  id?: string;
  name?: string;
  price?: number;
  description?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  stock?: number;
}

interface Professional {
  id: string;
  name: string;
  position: string;
  email?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  original_price: number;
  discount_type: 'none' | 'percentage' | 'fixed';
  discount_value: number;
  final_price: number;
  quantity: number;
  type: 'service' | 'product';
  total: number;
  service_id?: string;
  product_id?: string;
}

interface CommandItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  item_type: string;
}

interface PaymentMethod {
  method: string;
  amount: string;
}

interface Payment {
  id: number;
  total_amount: number;
  status: string;
  paid_at: string;
  payment_methods: PaymentMethod[];
}

interface CommandDetails {
  id: number;
  client_id: string;
  client_name: string;
  professional_id?: string;
  professional_name?: string;
  total: number;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  items: CommandItem[];
  payment?: Payment;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Dinheiro', icon: '💵' },
  { value: 'credit', label: 'Cartão de Crédito', icon: '💳' },
  { value: 'debit', label: 'Cartão de Débito', icon: '💳' },
  { value: 'pix', label: 'PIX', icon: '⚡' },
];

export default function CommandsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [commands, setCommands] = useState<CommandDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para modais
  const [createCommandModalOpen, setCreateCommandModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [cashDrawerAlertOpen, setCashDrawerAlertOpen] = useState(false);

  // Estados para dados
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  // Estados para seleções
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [selectedCommand, setSelectedCommand] = useState<CommandDetails | null>(null);
  const [selectedCommandForDetails, setSelectedCommandForDetails] = useState<CommandDetails | null>(null);

  // Estados para carrinho
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  // Estados para pagamento
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<{
    method: 'cash' | 'credit' | 'debit' | 'pix';
    amount: number;
  }[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState<'cash' | 'credit' | 'debit' | 'pix'>('cash');

  // Estados para controle
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCreatingCommand, setIsCreatingCommand] = useState(false);
  const [commandToAddItem, setCommandToAddItem] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<'client' | 'items' | 'cart'>('client');
  const [itemTab, setItemTab] = useState<'service' | 'product'>('service');
  const [newlyAddedItems, setNewlyAddedItems] = useState<Set<string>>(new Set());
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());
  const [successItems, setSuccessItems] = useState<Set<string>>(new Set());

  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [clientNameFilter, setClientNameFilter] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.company_id) {
      fetchCommands();
    }
  }, [user?.company_id, selectedDate, statusFilter]);

  // Funções para buscar dados
  const fetchCommands = async () => {
    if (!user?.company_id) return;

    try {
      setLoading(true);
      
      // Preparar parâmetros de filtro
      const params: Record<string, string> = {};
      
      // Se nenhuma data for selecionada, usar hoje por padrão
      const dateToFilter = selectedDate || new Date().toISOString().split('T')[0];
      params.date = dateToFilter;
      
      // Adicionar filtro por status se estiver selecionado
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      
      const response = await api.get(`/commands/company/${user.company_id}`, {
        headers: {
          company_id: user.company_id,
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        params: params
      });
      setCommands(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao buscar comandas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as comandas",
        variant: "destructive",
      });
      setCommands([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    if (!user?.company_id) return;
    try {
      const response = await api.get('/clients', {
        headers: {
          company_id: user.company_id.toString(),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const formattedClients = (response.data || []).map((client: any) => ({
        id: client.id.toString(),
        name: client.name,
        email: client.email,
        phone_number: client.phone_number,
        document: client.document
      }));
      setClients(formattedClients);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes",
        variant: "destructive",
      });
    }
  };

  const fetchServices = async () => {
    if (!user?.company_id) return;
    try {
      const response = await api.get('/service', {
        headers: {
          company_id: user.company_id.toString(),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const formattedServices = (response.data || []).map((service: any) => ({
        service_id: service.service_id?.toString() || service.id?.toString(),
        service_name: service.service_name || service.name,
        service_price: parseFloat(service.service_price || service.price || '0'),
        service_duration: service.service_duration,
        service_description: service.service_description || service.description,
        id: service.service_id?.toString() || service.id?.toString(),
        name: service.service_name || service.name,
        price: parseFloat(service.service_price || service.price || '0')
      }));
      setServices(formattedServices);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os serviços",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    if (!user?.company_id) return;
    try {
      const response = await api.get('/products', {
        headers: {
          company_id: user.company_id.toString(),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const formattedProducts = (response.data || []).map((product: any) => ({
        id: product.id.toString(),
        name: product.name,
        price: product.price || 0,
        description: product.description,
        stock: product.stock
      }));
      setProducts(formattedProducts);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProducts([]);
    }
  };

  const fetchProfessionals = async () => {
    if (!user?.company_id) return;
    try {
      const response = await api.get('/teams', {
        headers: {
          company_id: user.company_id.toString(),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const formattedProfessionals = (response.data || []).map((professional: any) => ({
        id: professional.id.toString(),
        name: professional.name,
        position: professional.position,
        email: professional.email
      }));
      setProfessionals(formattedProfessionals);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os profissionais",
        variant: "destructive",
      });
    }
  };

  // Funções de utilidade
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const paymentMethod = PAYMENT_METHODS.find(pm => pm.value === method);
    return paymentMethod?.label || method;
  };

  // Funções do carrinho
  const getItemQuantity = (itemId: string) => {
    return itemQuantities[itemId] || 1;
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, quantity)
    }));
  };

  const addToCart = (item: Service | Product, type: 'service' | 'product') => {
    const itemId = type === 'service' ? (item as Service).service_id || (item as Service).id || '' : item.id || '';
    const itemName = type === 'service' ? (item as Service).service_name || (item as Service).name || '' : item.name || '';
    const itemPrice = type === 'service' ? (item as Service).service_price || (item as Service).price || 0 : item.price || 0;
    
    const quantity = getItemQuantity(itemId);
    const cartItem: CartItem = {
      id: itemId,
      name: itemName,
      price: itemPrice,
      original_price: itemPrice,
      discount_type: 'none',
      discount_value: 0,
      final_price: itemPrice,
      quantity,
      type,
      total: itemPrice * quantity
    };

    setCartItems(prev => {
      const existingIndex = prev.findIndex(cartItem => cartItem.id === itemId && cartItem.type === type);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = cartItem;
        return updated;
      }
      return [...prev, cartItem];
    });

    toast({
      title: "Item adicionado",
      description: `${itemName} foi adicionado ao carrinho`,
    });
  };

  const removeFromCart = (itemId: string, type: 'service' | 'product') => {
    setCartItems(prev => prev.filter(item => !(item.id === itemId && item.type === type)));
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.total, 0);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCommands();
    setRefreshing(false);
  };

  const openCreateCommandModal = () => {
    setCreateCommandModalOpen(true);
    setCurrentTab('client');
    fetchClients();
    fetchServices();
    fetchProducts();
    fetchProfessionals();
  };

  const openAddItemModal = (commandId: string) => {
    setCommandToAddItem(commandId);
    setAddItemModalOpen(true);
    fetchServices();
    fetchProducts();
  };

  const openPaymentModal = (command: CommandDetails) => {
    if (command.status === 'closed') {
      toast({
        title: "Comanda já fechada",
        description: "Esta comanda já foi paga e fechada.",
        variant: "destructive",
      });
      return;
    }

    setSelectedCommand(command);
    setSelectedPaymentMethods([]);
    setPaymentAmount('');
    setSelectedPaymentType('cash');
    setPaymentModalOpen(true);
  };

  const openCommandDetailsModal = (command: CommandDetails) => {
    setSelectedCommandForDetails(command);
    setDetailsModalOpen(true);
  };

  const createCommand = async () => {
    if (!user?.company_id || !selectedClient || cartItems.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione um cliente e adicione itens ao carrinho",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingCommand(true);
    try {
      const items = cartItems.map(item => ({
        id: item.id,
        type: item.type,
        quantity: item.quantity,
        price: item.price
      }));

      const response = await api.post('/commands', {
        client_id: selectedClient,
        professional_id: selectedProfessional || null,
        items: items.map(item => ({
          item_type: item.type,
          product_id: item.type === 'product' ? item.id : null,
          service_id: item.type === 'service' ? item.id : null,
          quantity: item.quantity,
          price: item.price
        }))
      }, {
        headers: {
          company_id: user.company_id.toString(),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast({
        title: "Sucesso!",
        description: "Comanda criada com sucesso",
      });

      // Reset form
      setSelectedClient('');
      setSelectedProfessional('');
      setCartItems([]);
      setCreateCommandModalOpen(false);
      setCurrentTab('client');
      
      // Refresh commands
      await fetchCommands();
    } catch (error) {
      console.error('Erro ao criar comanda:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar comanda",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCommand(false);
    }
  };

  // Funções para gerenciar métodos de pagamento
  const addPaymentMethod = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;

    const newMethod = {
      method: selectedPaymentType,
      amount: parseFloat(paymentAmount)
    };

    setSelectedPaymentMethods(prev => [...prev, newMethod]);
    setPaymentAmount('');
  };

  const removePaymentMethod = (index: number) => {
    setSelectedPaymentMethods(prev => prev.filter((_, i) => i !== index));
  };

  // Função para processar pagamento
  const processPayment = async () => {
    if (!selectedCommand || selectedPaymentMethods.length === 0) return;

    setIsProcessingPayment(true);
    try {
      const totalPaymentAmount = selectedPaymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
      
      const response = await api.post('/payments', {
        company_id: user.company_id,
        client_id: selectedCommand.client_id,
        command_id: selectedCommand.id,
        total_amount: totalPaymentAmount,
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_methods: selectedPaymentMethods.map(pm => ({
          method: pm.method,
          amount: pm.amount
        }))
      }, {
        headers: {
          company_id: user.company_id.toString(),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast({
        title: "Sucesso!",
        description: "Pagamento processado com sucesso",
      });

      // Reset payment form
      setSelectedPaymentMethods([]);
      setPaymentAmount('');
      setSelectedPaymentType('cash');
      setPaymentModalOpen(false);
      setSelectedCommand(null);
      
      // Refresh commands
      await fetchCommands();
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      
      // Verificar se o erro é relacionado à gaveta de caixa não aberta
      if (error?.response?.status === 400 || 
          error?.toString().includes("400") || 
          error.response?.status === 400) {
        
        // Exibir a mensagem específica sobre a gaveta de caixa
        toast({
          title: "Erro",
          description: "Não é possível criar um pagamento sem uma gaveta de caixa aberta para hoje. Abra uma gaveta primeiro.",
          variant: "destructive",
        });
        
        // Exibir um alerta personalizado para garantir que o usuário veja a mensagem
        setCashDrawerAlertOpen(true);
      } else {
        toast({
          title: "Erro",
          description: "Erro ao processar pagamento",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Função para atualizar quantidade de item
  const updateQuantity = (itemId: string, newQuantity: number) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, newQuantity)
    }));
  };

  // Função para adicionar item à comanda existente
  const addItemToExistingCommand = async (item: {
    id: string;
    name: string;
    price: number;
    type: 'service' | 'product';
    quantity: number;
  }) => {
    const itemId = item.id;
    
    try {
      // Marcar como carregando
      setAddingItems(prev => {
        const newSet = new Set(prev);
        newSet.add(itemId);
        return newSet;
      });

      const response = await api.post(`/commands/${commandToAddItem}/items`, {
        items: [{
          item_type: item.type,
          product_id: item.type === 'product' ? item.id : null,
          service_id: item.type === 'service' ? item.id : null,
          quantity: item.quantity,
          price: item.price
        }]
      }, {
        headers: {
          company_id: user.company_id.toString(),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Remover loading e adicionar sucesso
      setAddingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      
      setSuccessItems(prev => {
        const newSet = new Set(prev);
        newSet.add(itemId);
        return newSet;
      });
      
      // Remover marcação de sucesso após animação
      setTimeout(() => {
        setSuccessItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);

      // Marcar item como recém-adicionado para animação na lista principal
      const itemKey = `${commandToAddItem}-${item.name}`;
      setNewlyAddedItems(prev => {
        const newSet = new Set(prev);
        newSet.add(itemKey);
        return newSet;
      });
      
      // Remover a marcação após a animação
      setTimeout(() => {
        setNewlyAddedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemKey);
          return newSet;
        });
      }, 2000);

      toast({
        title: "Sucesso!",
        description: `${item.name} adicionado à comanda`,
      });

      // Reset quantity for this item
      setItemQuantities(prev => ({
        ...prev,
        [item.id]: 1
      }));
      
      // Refresh commands
      await fetchCommands();
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      
      // Remover loading em caso de erro
      setAddingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      
      toast({
        title: "Erro",
        description: "Erro ao adicionar item à comanda",
        variant: "destructive",
      });
    }
  };

  // Função para remover item da comanda
  const removeItemFromCommand = async (commandId: number, itemId: number, itemName: string) => {
    try {
      await api.delete(`/commands/${commandId}/items/${itemId}`, {
        headers: {
          company_id: user.company_id.toString(),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast({
        title: "Item removido!",
        description: `${itemName} foi removido da comanda`,
      });

      // Refresh commands
      await fetchCommands();
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover item da comanda",
        variant: "destructive",
      });
    }
  };

  // Função para filtrar comandas
  const filteredCommands = commands.filter((command) => {
    // Filtro por status
    const statusMatch = statusFilter === 'all' || command.status === statusFilter;
    
    // Filtro por nome do cliente
    const nameMatch = clientNameFilter === '' || 
      command.client_name.toLowerCase().includes(clientNameFilter.toLowerCase());
    
    // Filtro por data
    let dateMatch = true;
    if (selectedDate) {
      const dateFilter = new Date(selectedDate).toISOString().split('T')[0];
      
      // Verificar se created_at existe
      if (command.created_at) {
        // Extrair a data do formato DD/MM/YYYY HH:mm:ss ou ISO
        if (typeof command.created_at === 'string' && command.created_at.includes('/')) {
          const parts = command.created_at.split(' ')[0].split('/');
          if (parts.length === 3) {
            // Converter para YYYY-MM-DD para comparação
            const cmdDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            dateMatch = cmdDate === dateFilter;
          }
        } else {
          // Se não for no formato brasileiro, tentar formato padrão
          try {
            const date = new Date(command.created_at);
            if (!isNaN(date.getTime())) {
              const cmdDate = date.toISOString().split('T')[0];
              dateMatch = cmdDate === dateFilter;
            }
          } catch (error) {
            dateMatch = false;
          }
        }
      } else {
        dateMatch = false;
      }
    }
    
    return statusMatch && nameMatch && dateMatch;
  });

  // Função para limpar filtros
  const clearFilters = () => {
    setStatusFilter('all');
    setClientNameFilter('');
    setSelectedDate('');
  };

  // Função para lidar com mudança de data
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date.toISOString().split('T')[0]);
    } else {
      setSelectedDate('');
    }
  };

  // Função para converter string de data para objeto Date
  const parseDate = (dateString: string): Date => {
    return new Date(dateString + 'T00:00:00');
  };

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
                  <ShoppingCartIcon className="h-6 w-6" />
                  Comandas
                </h1>
                <p className="text-emerald-100 text-sm mt-1">
                  Gerencie comandas e pagamentos
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
                onClick={openCreateCommandModal}
              >
                <PlusIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="text-emerald-100 text-sm font-medium">Comandas Hoje</div>
              <div className="text-3xl font-bold text-white mt-1">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-12 rounded"></div>
                ) : commands.length}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="text-emerald-100 text-sm font-medium">Comandas Abertas</div>
              <div className="text-lg font-bold text-white mt-1">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-6 w-16 rounded"></div>
                ) : commands.filter(c => c.status === 'open').length}
              </div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-white/90 text-sm font-medium min-w-fit">Status:</Label>
                  <Select value={statusFilter} onValueChange={(value: 'all' | 'open' | 'closed') => setStatusFilter(value)}>
                    <SelectTrigger className="w-32 bg-white/20 border-white/30 text-white placeholder:text-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="open">Abertas</SelectItem>
                      <SelectItem value="closed">Fechadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-white/90 text-sm font-medium min-w-fit">Cliente:</Label>
                  <Input
                    placeholder="Nome do cliente"
                    value={clientNameFilter}
                    onChange={(e) => setClientNameFilter(e.target.value)}
                    className="w-40 bg-white/20 border-white/30 text-white placeholder:text-white/70"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-white/90 text-sm font-medium min-w-fit">Data:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-48 justify-start text-left font-normal bg-white/20 border-white/30 text-white hover:bg-white/30",
                          !selectedDate && "text-white/70"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(parseDate(selectedDate), "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate ? parseDate(selectedDate) : undefined}
                        onSelect={handleDateChange}
                        initialFocus
                      />
                      <div className="p-3 pt-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-sm"
                          onClick={() => setSelectedDate('')}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Limpar filtro de data
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 justify-between mt-6">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
              <Input
                placeholder="Buscar por nome do cliente..."
                value={clientNameFilter}
                onChange={(e) => setClientNameFilter(e.target.value)}
                className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {(statusFilter !== 'all' || clientNameFilter !== '' || selectedDate !== '') && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-white/80 hover:text-white hover:bg-white/20"
                    size="sm"
                  >
                    <XIcon className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
            </div>
            
            {filteredCommands.length !== commands.length && (
              <div className="mt-3 text-emerald-100 text-sm">
                Mostrando {filteredCommands.length} de {commands.length} comandas
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Lista de Comandas */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCommands.length === 0 && commands.length > 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <FilterIcon className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-600 font-medium">Nenhuma comanda encontrada com os filtros aplicados</p>
              <p className="text-gray-500 text-sm mt-1">Tente ajustar os filtros para ver mais resultados</p>
              <Button 
                onClick={clearFilters}
                variant="outline"
                className="mt-4"
              >
                <XIcon className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        ) : commands.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <ShoppingCartIcon className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-600 font-medium">Nenhuma comanda encontrada</p>
              <p className="text-gray-500 text-sm mt-1">Crie uma nova comanda para começar</p>
              <Button 
                onClick={openCreateCommandModal}
                className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Nova Comanda
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCommands.map((command) => (
              <Card key={command.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" onClick={() => openCommandDetailsModal(command)}>
                <CardContent className="p-6">
                  {/* Header com nome, ID e status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-800">{command.client_name}</h2>
  
                    </div>
                    <Badge 
                      variant={command.status === 'closed' ? 'default' : 'secondary'}
                      className={`${command.status === 'closed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} font-medium px-3 py-1`}
                    >
                      {command.status === 'closed' ? 'Fechada' : 'Aberta'}
                    </Badge>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
                      </svg>
                    </button>
                  </div>

                  {/* Data */}
                  <p className="text-gray-500 text-sm mb-6">
                    {parseISO(command.created_at).toLocaleDateString('pt-BR')}
                  </p>

                  {/* Lista de itens */}
                  <div className="space-y-3 mb-6">
                    {command.items.map((item, index) => {
                      const itemKey = `${command.id}-${item.name}`;
                      const isNewlyAdded = newlyAddedItems.has(itemKey);
                      
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between transition-all duration-500 ease-in-out ${
                            isNewlyAdded 
                              ? 'animate-pulse bg-emerald-50 border border-emerald-200 rounded-lg p-2 shadow-sm scale-105' 
                              : 'hover:bg-gray-50 rounded-lg p-2'
                          }`}
                        >
                          <div className="flex-1">
                            <span className={`text-gray-800 ${
                              isNewlyAdded ? 'font-medium text-emerald-700' : ''
                            }`}>
                              {item.name} x {item.quantity}
                              {isNewlyAdded && (
                                <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full animate-bounce">
                                  Novo!
                                </span>
                              )}
                            </span>
                          </div>
                          <button 
                            className="text-gray-400 hover:text-red-600 mx-4 transition-colors duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (command.status === 'open') {
                                removeItemFromCommand(command.id, item.id, item.name);
                              }
                            }}
                            disabled={command.status === 'closed'}
                            title={command.status === 'closed' ? 'Não é possível remover itens de comandas fechadas' : 'Remover item'}
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                          <div className="text-right">
                            <span className={`font-medium ${
                              isNewlyAdded ? 'text-emerald-600 font-bold' : 'text-gray-800'
                            }`}>
                              R$ {(parseFloat(item.price) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total e ações */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-gray-800">
                        Total: <span className="text-emerald-600">R$ {command.total.toFixed(2)}</span>
                      </span>
                    </div>
                    
                    <div className="flex gap-3">
                      {command.status === 'open' && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddItemModal(command.id.toString());
                            }}
                            className="w-12 h-12 rounded-full border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-50"
                          >
                            <PlusIcon className="w-5 h-5" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPaymentModal(command);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2"
                          >
                            <CreditCardIcon className="w-5 h-5" />
                            Fechar Comanda
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Informações de pagamento para comandas fechadas */}
                  {command.status === 'closed' && command.payment?.payment_methods && (
                    <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-sm font-medium text-green-800 mb-2">Pagamento processado:</p>
                      <div className="space-y-1">
                        {command.payment.payment_methods.map((method, index) => (
                          <div key={index} className="flex justify-between text-sm text-green-700">
                            <span>{getPaymentMethodLabel(method.method)}</span>
                            <span className="font-medium">{formatCurrency(parseFloat(method.amount))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Botão flutuante para criar comanda */}
        <Button
          onClick={openCreateCommandModal}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 hover:scale-110 transition-all duration-200"
          size="icon"
        >
          <PlusIcon className="h-6 w-6" />
        </Button>
      </div>

      {/* Modal para criar comanda */}
      <Dialog open={createCommandModalOpen} onOpenChange={setCreateCommandModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Nova Comanda
            </DialogTitle>
          </DialogHeader>

          <Tabs value={currentTab} onValueChange={(value: any) => setCurrentTab(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="client" className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                Cliente
              </TabsTrigger>
              <TabsTrigger value="items" className="flex items-center gap-2">
                <ShoppingCartIcon className="h-4 w-4" />
                Itens
              </TabsTrigger>
              <TabsTrigger value="cart" className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4" />
                Carrinho ({cartItems.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="client" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Selecionar Cliente</Label>
                  <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedClient === client.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-emerald-300'
                        }`}
                        onClick={() => setSelectedClient(client.id)}
                      >
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.phone_number}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Profissional (Opcional)</Label>
                  <div className="space-y-2 mt-2">
                    {professionals.map((professional) => (
                      <div
                        key={professional.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedProfessional === professional.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-emerald-300'
                        }`}
                        onClick={() => setSelectedProfessional(professional.id)}
                      >
                        <div className="font-medium">{professional.name}</div>
                        <div className="text-sm text-gray-500">{professional.position}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="items" className="space-y-4">
              <Tabs value={itemTab} onValueChange={(value: any) => setItemTab(value)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="service">Serviços</TabsTrigger>
                  <TabsTrigger value="product">Produtos</TabsTrigger>
                </TabsList>

                <TabsContent value="service" className="space-y-4">
                  {services.map((service) => (
                    <Card key={service.service_id || service.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{service.service_name || service.name}</h4>
                          <p className="text-emerald-600 font-semibold">
                            {formatCurrency(service.service_price || service.price || 0)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateItemQuantity(
                                service.service_id || service.id || '',
                                getItemQuantity(service.service_id || service.id || '') - 1
                              )}
                            >
                              <MinusCircleIcon className="h-4 w-4" />
                            </Button>
                            <span className="font-medium w-8 text-center">
                              {getItemQuantity(service.service_id || service.id || '')}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateItemQuantity(
                                service.service_id || service.id || '',
                                getItemQuantity(service.service_id || service.id || '') + 1
                              )}
                            >
                              <PlusCircleIcon className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addToCart(service, 'service')}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="product" className="space-y-4">
                  {products.map((product) => (
                    <Card key={product.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-emerald-600 font-semibold">
                            {formatCurrency(product.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateItemQuantity(product.id, getItemQuantity(product.id) - 1)}
                            >
                              <MinusCircleIcon className="h-4 w-4" />
                            </Button>
                            <span className="font-medium w-8 text-center">
                              {getItemQuantity(product.id)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateItemQuantity(product.id, getItemQuantity(product.id) + 1)}
                            >
                              <PlusCircleIcon className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addToCart(product, 'product')}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="cart" className="space-y-4">
              <div className="space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCartIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>Nenhum item no carrinho</p>
                  </div>
                ) : (
                  <>
                    {cartItems.map((item) => (
                      <Card key={`${item.id}-${item.type}`} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-gray-600">
                              {item.quantity}x {formatCurrency(item.price)} = {formatCurrency(item.total)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id, item.type)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}

                    <Card className="p-4 bg-emerald-50 border-emerald-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(getCartTotal())}
                        </span>
                      </div>
                    </Card>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => setCreateCommandModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={createCommand}
              disabled={!selectedClient || cartItems.length === 0 || isCreatingCommand}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {isCreatingCommand ? 'Criando...' : 'Criar Comanda'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5" />
              Fechar Comanda #{selectedCommand?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedCommand && (
            <div className="space-y-6">
              {/* Resumo da Comanda */}
              <Card className="p-4 bg-emerald-50 border-emerald-200">
                <div className="space-y-2">
                  <h3 className="font-semibold text-emerald-800">Resumo da Comanda</h3>
                  <p className="text-emerald-700">{selectedCommand.client_name}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-700">Total:</span>
                    <span className="text-2xl font-bold text-emerald-800">
                      {formatCurrency(selectedCommand.total)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-700">Restante:</span>
                    <span className="font-semibold text-emerald-800">
                      {formatCurrency(selectedCommand.total - selectedPaymentMethods.reduce((sum, pm) => sum + pm.amount, 0))}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Adicionar Pagamento */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Adicionar Pagamento</Label>
                
                {/* Seletor de método de pagamento */}
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <Button
                      key={method.value}
                      variant={selectedPaymentType === method.value ? "default" : "outline"}
                      className={`flex items-center justify-center gap-2 ${
                        selectedPaymentType === method.value 
                          ? 'bg-emerald-600 hover:bg-emerald-700' 
                          : 'hover:bg-emerald-50'
                      }`}
                      onClick={() => setSelectedPaymentType(method.value as any)}
                    >
                      <span>{method.icon}</span>
                      <span className="text-sm">{method.label}</span>
                    </Button>
                  ))}
                </div>

                {/* Campo de valor */}
                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">Valor</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <Button
                  onClick={addPaymentMethod}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Adicionar Método
                </Button>
              </div>

              {/* Métodos Selecionados */}
              {selectedPaymentMethods.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Métodos Selecionados</Label>
                  <div className="space-y-2">
                    {selectedPaymentMethods.map((method, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span>
                              {PAYMENT_METHODS.find(pm => pm.value === method.method)?.icon}
                            </span>
                            <span>{getPaymentMethodLabel(method.method)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {formatCurrency(method.amount)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePaymentMethod(index)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setPaymentModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={processPayment}
                  disabled={
                    selectedCommand.total - selectedPaymentMethods.reduce((sum, pm) => sum + pm.amount, 0) > 0.01 ||
                    selectedPaymentMethods.length === 0 ||
                    isProcessingPayment
                  }
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  {isProcessingPayment ? 'Processando...' : 'Finalizar Pagamento'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Comanda */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EyeIcon className="h-5 w-5" />
              Detalhes da Comanda #{selectedCommandForDetails?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedCommandForDetails && (
            <div className="space-y-6">
              {/* Informações da Comanda */}
              <Card className="p-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg mb-3">Informações da Comanda</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Cliente:</Label>
                      <p className="font-medium">{selectedCommandForDetails.client_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Data:</Label>
                      <p className="font-medium">{formatDate(selectedCommandForDetails.created_at)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Status:</Label>
                      <Badge variant={selectedCommandForDetails.status === 'closed' ? 'default' : 'secondary'}>
                        {selectedCommandForDetails.status === 'closed' ? 'Paga' : 'Aberta'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Total:</Label>
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(selectedCommandForDetails.total)}
                      </p>
                    </div>
                  </div>
                  {selectedCommandForDetails.professional_name && (
                    <div>
                      <Label className="text-sm text-gray-600">Profissional:</Label>
                      <p className="font-medium text-emerald-600">{selectedCommandForDetails.professional_name}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Lista de Itens */}
              <Card className="p-4">
                <h3 className="font-semibold text-lg mb-3">
                  Itens da Comanda ({selectedCommandForDetails.items.length})
                </h3>
                <div className="space-y-3">
                  {selectedCommandForDetails.items.map((item, index) => (
                    <Card key={index} className="p-3 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">
                            Quantidade: {item.quantity} | Preço unitário: {formatCurrency(parseFloat(item.price))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-emerald-600">
                            {formatCurrency(parseFloat(item.price) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>

              {/* Informações de Pagamento */}
              {selectedCommandForDetails.status === 'closed' && selectedCommandForDetails.payment?.payment_methods && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <h3 className="font-semibold text-lg mb-3 text-green-800">Detalhes do Pagamento</h3>
                  <div className="space-y-2">
                    {selectedCommandForDetails.payment.paid_at && (
                      <p className="text-sm text-green-700">
                        Pago em: {formatDate(selectedCommandForDetails.payment.paid_at)}
                      </p>
                    )}
                    {selectedCommandForDetails.payment.payment_methods.map((method, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-green-700">
                          {getPaymentMethodLabel(method.method)}
                        </span>
                        <span className="font-semibold text-green-800">
                          {formatCurrency(parseFloat(method.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <div className="flex justify-end pt-6 border-t">
                <Button 
                  onClick={() => setDetailsModalOpen(false)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Adicionar Itens */}
      <Dialog open={addItemModalOpen} onOpenChange={setAddItemModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircleIcon className="h-5 w-5" />
              Adicionar Itens à Comanda #{commandToAddItem}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={itemTab} onValueChange={setItemTab as any}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="service">Serviços</TabsTrigger>
              <TabsTrigger value="product">Produtos</TabsTrigger>
            </TabsList>

            {/* Tab de Serviços */}
            <TabsContent value="service" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {services.map((service) => {
                  const serviceId = service.service_id || service.id || '';
                  const serviceName = service.service_name || service.name || '';
                  const servicePrice = service.service_price || service.price || 0;
                  const quantity = itemQuantities[serviceId] || 1;
                  const isAdding = addingItems.has(serviceId);
                  const isSuccess = successItems.has(serviceId);

                  return (
                    <Card 
                      key={serviceId} 
                      className={`p-4 transition-all duration-300 ${
                        isSuccess 
                          ? 'border-2 border-green-400 bg-green-50 shadow-lg scale-105' 
                          : 'hover:shadow-lg border border-gray-200'
                      }`}
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className={`font-semibold text-lg ${
                            isSuccess ? 'text-green-700' : 'text-gray-900'
                          }`}>
                            {serviceName}
                            {isSuccess && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-bounce">
                                ✓ Adicionado!
                              </span>
                            )}
                          </h3>
                          <p className={`text-2xl font-bold ${
                            isSuccess ? 'text-green-600' : 'text-emerald-600'
                          }`}>
                            {formatCurrency(servicePrice)}
                          </p>
                          {service.service_description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {service.service_description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(serviceId, Math.max(1, quantity - 1))}
                              className="h-8 w-8"
                              disabled={isAdding}
                            >
                              <MinusCircleIcon className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(serviceId, quantity + 1)}
                              className="h-8 w-8"
                              disabled={isAdding}
                            >
                              <PlusCircleIcon className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <Button
                            onClick={() => addItemToExistingCommand({
                              id: serviceId,
                              name: serviceName,
                              price: servicePrice,
                              type: 'service' as const,
                              quantity
                            })}
                            className={`transition-all duration-200 ${
                              isSuccess 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                            size="sm"
                            disabled={isAdding || isSuccess}
                          >
                            {isAdding ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                Adicionando...
                              </>
                            ) : isSuccess ? (
                              <>
                                <CheckIcon className="h-4 w-4 mr-1" />
                                Adicionado!
                              </>
                            ) : (
                              <>
                                <PlusIcon className="h-4 w-4 mr-1" />
                                Adicionar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Tab de Produtos */}
            <TabsContent value="product" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {products.map((product) => {
                  const quantity = itemQuantities[product.id] || 1;
                  const isAdding = addingItems.has(product.id);
                  const isSuccess = successItems.has(product.id);
                  
                  return (
                    <Card 
                      key={product.id} 
                      className={`p-4 transition-all duration-300 ${
                        isSuccess 
                          ? 'border-2 border-green-400 bg-green-50 shadow-lg scale-105' 
                          : 'hover:shadow-lg border border-gray-200'
                      }`}
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className={`font-semibold text-lg ${
                            isSuccess ? 'text-green-700' : 'text-gray-900'
                          }`}>
                            {product.name}
                            {isSuccess && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-bounce">
                                ✓ Adicionado!
                              </span>
                            )}
                          </h3>
                          <p className={`text-2xl font-bold ${
                            isSuccess ? 'text-green-600' : 'text-emerald-600'
                          }`}>
                            {formatCurrency(product.price)}
                          </p>
                          {product.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {product.description}
                            </p>
                          )}
                          {product.stock !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">
                              Estoque: {product.stock}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(product.id, Math.max(1, quantity - 1))}
                              className="h-8 w-8"
                              disabled={isAdding}
                            >
                              <MinusCircleIcon className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              className="h-8 w-8"
                              disabled={isAdding || (product.stock !== undefined && quantity >= product.stock)}
                            >
                              <PlusCircleIcon className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <Button
                            onClick={() => addItemToExistingCommand({
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              type: 'product' as const,
                              quantity
                            })}
                            className={`transition-all duration-200 ${
                              isSuccess 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                            size="sm"
                            disabled={isAdding || isSuccess || (product.stock !== undefined && product.stock === 0)}
                          >
                            {isAdding ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                Adicionando...
                              </>
                            ) : isSuccess ? (
                              <>
                                <CheckIcon className="h-4 w-4 mr-1" />
                                Adicionado!
                              </>
                            ) : (
                              <>
                                <PlusIcon className="h-4 w-4 mr-1" />
                                Adicionar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-6 border-t">
            <Button 
              onClick={() => setAddItemModalOpen(false)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para gaveta de caixa */}
      <AlertDialog open={cashDrawerAlertOpen} onOpenChange={setCashDrawerAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-amber-600 font-bold text-sm">!</span>
              </div>
              Atenção
            </AlertDialogTitle>
            <AlertDialogDescription>
              Não é possível criar um pagamento sem uma gaveta de caixa aberta para hoje. Você será redirecionado para a página de Finanças ao clicar em 'Entendi'.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => {
                setCashDrawerAlertOpen(false);
                router.push("/financas");
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
