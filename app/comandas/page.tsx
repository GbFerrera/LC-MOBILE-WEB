"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  PercentIcon,
  Banknote,
  QrCode,
  ChevronRight,
  Phone,
  Mail,
  User,
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
  price: string | number;
  quantity: number;
  item_type: string;
  professional_id?: string;
  professional_name?: string;
  original_price?: number;
  discount_type?: "none" | "percentage" | "fixed";
  discount_value?: number;
  final_price?: number;
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
  { value: 'cash', label: 'Dinheiro' },
  { value: 'credit', label: 'Cartão de Crédito' },
  { value: 'debit', label: 'Cartão de Débito' },
  { value: 'pix', label: 'PIX' },
] as const;

function normalizeClientsResponse(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.clients)) return record.clients;
    if (Array.isArray(record.data)) return record.data;
  }
  return [];
}

function formatClientRecord(client: any): Client {
  return {
    id: String(client.id),
    name: client.name || "",
    email: client.email || "",
    phone_number: client.phone_number || "",
    document: client.document || "",
  };
}

function matchesClientFilter(client: Client, filter: string): boolean {
  const normalized = filter.trim().toLowerCase();
  if (!normalized) return true;

  const name = (client.name || "").toLowerCase();
  const email = (client.email || "").toLowerCase();
  const phone = (client.phone_number || "").replace(/\D/g, "");
  const document = (client.document || "").replace(/\D/g, "");
  const filterDigits = normalized.replace(/\D/g, "");

  return (
    name.includes(normalized) ||
    email.includes(normalized) ||
    (filterDigits.length > 0 && phone.includes(filterDigits)) ||
    (filterDigits.length > 0 && document.includes(filterDigits))
  );
}

function getPaymentMethodIcon(method: string, className = "h-4 w-4") {
  switch (method) {
    case "cash":
      return <Banknote className={className} />;
    case "credit":
    case "debit":
      return <CreditCardIcon className={className} />;
    case "pix":
      return <QrCode className={className} />;
    default:
      return <CreditCardIcon className={className} />;
  }
}

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commandToDelete, setCommandToDelete] = useState<CommandDetails | null>(null);

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
  const [commandItems, setCommandItems] = useState<CommandItem[]>([]);
  const [discountDrafts, setDiscountDrafts] = useState<Record<number, string>>({});

  // Estados para controle
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCreatingCommand, setIsCreatingCommand] = useState(false);
  const [commandToAddItem, setCommandToAddItem] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<'responsible' | 'items' | 'cart'>('responsible');
  const [itemTab, setItemTab] = useState<'service' | 'product'>('service');
  const [newlyAddedItems, setNewlyAddedItems] = useState<Set<string>>(new Set());
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());
  const [successItems, setSuccessItems] = useState<Set<string>>(new Set());
  const [maxValueReached, setMaxValueReached] = useState(false);

  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [clientNameFilter, setClientNameFilter] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Estados para filtros do modal de criação
  const [clientFilter, setClientFilter] = useState<string>('');
  const [professionalFilter, setProfessionalFilter] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [productFilter, setProductFilter] = useState<string>('');
  const [loadingClients, setLoadingClients] = useState(false);

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
      
      // Buscar comandas e profissionais em paralelo para mapeamento
      const [commandsResponse, professionalsResponse] = await Promise.all([
        api.get(`/commands/company/${user.company_id}`, {
          headers: {
            company_id: user.company_id,
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          params: params
        }),
        api.get('/teams', {
          headers: {
            company_id: user.company_id.toString(),
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
      ]);
      
      // Criar mapeamento de profissionais
      const professionalsMap: Record<string, string> = {};
      (professionalsResponse.data || []).forEach((professional: any) => {
        professionalsMap[professional.id.toString()] = professional.name;
      });
      
      // Enriquecer comandas com nomes dos profissionais
      const enrichedCommands = (commandsResponse.data || []).map((command: any) => {
        const enrichedItems = (command.items || []).map((item: any) => {
          if (item.professional_id) {
            return {
              ...item,
              professional_name: professionalsMap[item.professional_id.toString()] || 'Profissional não encontrado'
            };
          }
          return item;
        });
        
        return {
          ...command,
          items: enrichedItems
        };
      });
      
      setCommands(Array.isArray(enrichedCommands) ? enrichedCommands : []);
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

  const fetchClients = useCallback(async (searchTerm = "") => {
    if (!user?.company_id) return;
    try {
      setLoadingClients(true);
      const params: Record<string, string | number> = {
        limit: 500,
        offset: 0,
      };

      const trimmedSearch = searchTerm.trim();
      if (trimmedSearch) {
        params.term = trimmedSearch;
      }

      const response = await api.get('/clients', {
        headers: {
          company_id: user.company_id.toString(),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        params,
      });

      const clientsData = normalizeClientsResponse(response.data);
      setClients(clientsData.map(formatClientRecord));
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClients([]);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes",
        variant: "destructive",
      });
    } finally {
      setLoadingClients(false);
    }
  }, [user?.company_id]);

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

  const getClientInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  // Funções para formatação de input monetário
  const formatCurrencyInput = (value: string, maxValue?: number, onMaxReached?: (reached: boolean) => void) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    
    // Se vazio, retorna vazio
    if (!numbers) {
      onMaxReached?.(false);
      return '';
    }
    
    // Converte para número e divide por 100 para ter os centavos
    let numberValue = parseInt(numbers) / 100;
    let limitReached = false;
    
    // Limita ao valor máximo se especificado
    if (maxValue !== undefined && numberValue > maxValue) {
      numberValue = maxValue;
      limitReached = true;
    }
    
    // Notifica se o limite foi atingido
    onMaxReached?.(limitReached);
    
    // Formata com separadores brasileiros
    return numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrencyInput = (value: string): number => {
    // Remove pontos (separadores de milhar) e substitui vírgula por ponto
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
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

  const calculateDiscountedPrice = (
    originalPrice: number,
    discountType: string,
    discountValue: number,
  ): number => {
    if (discountType === "percentage") {
      return originalPrice * (1 - discountValue / 100);
    }
    if (discountType === "fixed") {
      return Math.max(0, originalPrice - discountValue);
    }
    return originalPrice;
  };

  const validateDiscount = (
    discountType: string,
    discountValue: number,
    originalPrice: number,
  ): string | null => {
    if (discountType === "percentage") {
      if (discountValue < 0 || discountValue > 100) {
        return "Desconto percentual deve estar entre 0% e 100%";
      }
    } else if (discountType === "fixed") {
      if (discountValue < 0) {
        return "Valor do desconto não pode ser negativo";
      }
      if (discountValue > originalPrice) {
        return "Desconto não pode ser maior que o preço original";
      }
    }
    return null;
  };

  const formatDiscountInfo = (
    discountType: string,
    discountValue: number,
    originalPrice: number,
  ): string => {
    if (discountType === "percentage") {
      return `- ${Number(discountValue)}% de desconto`;
    }
    if (discountType === "fixed") {
      return `- R$ ${Number(discountValue).toFixed(2)} de desconto`;
    }
    return "Sem desconto";
  };

  const calculateCommandTotal = () => {
    return commandItems.reduce((total, item) => {
      const unitPrice = Number(item.final_price ?? item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      return total + unitPrice * quantity;
    }, 0);
  };

  const getRemainingPaymentAmount = () => {
    const paid = selectedPaymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
    return Math.max(0, calculateCommandTotal() - paid);
  };

  const applyDiscountToCommandItem = (
    index: number,
    discountType: "none" | "percentage" | "fixed",
    discountValue: number,
  ) => {
    const newItems = [...commandItems];
    const item = { ...newItems[index] };
    const originalPrice = Number(item.original_price ?? item.price) || 0;

    const validationError = validateDiscount(discountType, discountValue, originalPrice);
    if (validationError) {
      toast({
        title: "Erro no desconto",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    item.discount_type = discountType;
    item.discount_value = discountValue;
    item.final_price = calculateDiscountedPrice(originalPrice, discountType, discountValue);
    newItems[index] = item;
    setCommandItems(newItems);

    toast({
      title: "Desconto aplicado",
      description: formatDiscountInfo(discountType, discountValue, originalPrice),
    });
  };

  const removeDiscountFromCommandItem = (index: number) => {
    const newItems = [...commandItems];
    const item = { ...newItems[index] };
    const originalPrice = Number(item.original_price ?? item.price) || 0;

    item.discount_type = "none";
    item.discount_value = 0;
    item.final_price = originalPrice;
    newItems[index] = item;
    setCommandItems(newItems);
    setDiscountDrafts((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });

    toast({
      title: "Desconto removido",
      description: "O desconto foi removido do item.",
    });
  };

  // Funções do carrinho
  const getItemQuantity = (itemId: string, type?: 'service' | 'product') => {
    const cartItem = cartItems.find(
      (item) => item.id === itemId && (!type || item.type === type),
    );
    if (cartItem) return cartItem.quantity;
    return itemQuantities[itemId] || 1;
  };

  const updateItemQuantity = (
    itemId: string,
    quantity: number,
    type: 'service' | 'product',
  ) => {
    if (quantity <= 0) {
      removeFromCart(itemId, type);
      return;
    }

    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: quantity,
    }));

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId && item.type === type
          ? { ...item, quantity, total: item.price * quantity }
          : item,
      ),
    );
  };

  const addToCart = (item: Service | Product, type: 'service' | 'product') => {
    const itemId = type === 'service' ? (item as Service).service_id || (item as Service).id || '' : item.id || '';
    const itemName = type === 'service' ? (item as Service).service_name || (item as Service).name || '' : item.name || '';
    const itemPrice = type === 'service' ? (item as Service).service_price || (item as Service).price || 0 : item.price || 0;
    
    const quantity = getItemQuantity(itemId, type);
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
    setCartItems((prev) => prev.filter((item) => !(item.id === itemId && item.type === type)));
    setItemQuantities((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.total, 0);
  };

  useEffect(() => {
    if (!createCommandModalOpen) return;

    const timer = window.setTimeout(() => {
      fetchClients(clientFilter);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [clientFilter, createCommandModalOpen, fetchClients]);

  const filteredClients = useMemo(
    () => clients.filter((client) => matchesClientFilter(client, clientFilter)),
    [clients, clientFilter],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCommands();
    setRefreshing(false);
  };

  const openCreateCommandModal = () => {
    setCreateCommandModalOpen(true);
    setCurrentTab('responsible');
    // Limpar filtros
    setClientFilter('');
    setProfessionalFilter('');
    setServiceFilter('');
    setProductFilter('');
    // Carregar dados
    fetchClients();
    fetchServices();
    fetchProducts();
    fetchProfessionals();
  };

  const createCommandSteps = ['responsible', 'items', 'cart'] as const;
  const createCommandStepLabels: Record<(typeof createCommandSteps)[number], string> = {
    responsible: 'Cliente e profissional',
    items: 'Adicionar itens',
    cart: 'Revisar carrinho',
  };
  const createCommandStepIndex = createCommandSteps.indexOf(currentTab);
  const isFirstCreateStep = currentTab === 'responsible';
  const isLastCreateStep = currentTab === 'cart';

  const goToNextCreateStep = () => {
    if (currentTab === 'responsible') {
      if (!selectedClient || !selectedProfessional) {
        toast({
          title: "Dados obrigatórios",
          description: "Selecione um cliente e um profissional antes de continuar.",
          variant: "destructive",
        });
        return;
      }
      setCurrentTab('items');
      return;
    }
    if (currentTab === 'items') {
      setCurrentTab('cart');
    }
  };

  const goToPreviousCreateStep = () => {
    if (currentTab === 'items') setCurrentTab('responsible');
    else if (currentTab === 'cart') setCurrentTab('items');
  };

  const openAddItemModal = (commandId: string) => {
    setCommandToAddItem(commandId);
    setSelectedProfessional(''); // Limpar profissional selecionado
    setAddItemModalOpen(true);
    fetchServices();
    fetchProducts();
    fetchProfessionals(); // Carregar profissionais
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
    setMaxValueReached(false);
    setDiscountDrafts({});

    const itemsWithDiscount = (command.items || []).map((item) => ({
      ...item,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      original_price: Number(item.original_price ?? item.price) || 0,
      discount_type: (item.discount_type || "none") as "none" | "percentage" | "fixed",
      discount_value: Number(item.discount_value) || 0,
      final_price: Number(item.final_price ?? item.price) || 0,
    }));

    setCommandItems(itemsWithDiscount);
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
    
    if (!selectedProfessional) {
      toast({
        title: "Erro",
        description: "Selecione um profissional responsável",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingCommand(true);
    try {
      // Formatar os itens para o formato esperado pela API (igual LC-FRONT)
      const formattedItems = cartItems.map(item => ({
        item_type: item.type,
        [item.type === "service" ? "service_id" : "product_id"]: item.id,
        quantity: item.quantity,
        price: item.price,
        discount_type: 'none',
        discount_value: 0,
        professional_id: selectedProfessional === "none" ? null : selectedProfessional || null
      }));

      const response = await api.post('/commands', {
        client_id: selectedClient,
        company_id: user.company_id,
        items: formattedItems
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
      setCurrentTab('responsible');
      
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
    const parsedAmount = parseCurrencyInput(paymentAmount);
    if (!paymentAmount || parsedAmount <= 0) return;

    const newMethod = {
      method: selectedPaymentType,
      amount: parsedAmount
    };

    setSelectedPaymentMethods(prev => [...prev, newMethod]);
    setPaymentAmount('');
    setMaxValueReached(false);
  };

  const removePaymentMethod = (index: number) => {
    setSelectedPaymentMethods(prev => prev.filter((_, i) => i !== index));
  };

  // Função para processar pagamento
  const processPayment = async () => {
    if (!selectedCommand || selectedPaymentMethods.length === 0) return;

    const finalTotal = calculateCommandTotal();
    const remaining = getRemainingPaymentAmount();

    if (remaining > 0.01) {
      toast({
        title: "Erro",
        description: `Ainda falta pagar ${formatCurrency(remaining)}`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);
    try {
      const itemsWithDiscounts = commandItems.filter(
        (item) => item.discount_type !== "none" && (item.discount_value || 0) > 0,
      );

      if (itemsWithDiscounts.length > 0) {
        await api.patch(
          `/commands/${selectedCommand.id}/items/discounts`,
          {
            items: itemsWithDiscounts.map((item) => ({
              id: item.id,
              discount_type: item.discount_type,
              discount_value: item.discount_value,
            })),
          },
          {
            headers: {
              company_id: user.company_id.toString(),
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
      }

      const totalPaymentAmount = selectedPaymentMethods.reduce((sum, pm) => sum + pm.amount, 0);

      await api.post('/payments', {
        company_id: user.company_id,
        client_id: selectedCommand.client_id,
        command_id: selectedCommand.id,
        total_amount: finalTotal || totalPaymentAmount,
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

      setSelectedPaymentMethods([]);
      setPaymentAmount('');
      setSelectedPaymentType('cash');
      setCommandItems([]);
      setDiscountDrafts({});
      setPaymentModalOpen(false);
      setSelectedCommand(null);

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
    // Validar se profissional foi selecionado
    if (!selectedProfessional) {
      toast({
        title: "Erro",
        description: "Selecione um profissional responsável antes de adicionar itens",
        variant: "destructive",
      });
      return;
    }

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
          price: item.price,
          professional_id: selectedProfessional === 'none' ? null : selectedProfessional
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

  // Função para deletar comanda
  const deleteCommand = async () => {
    if (!commandToDelete) return;

    try {
      await api.delete(`/commands/${commandToDelete.id}`, {
        headers: {
          company_id: user.company_id.toString(),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast({
        title: "Comanda excluída!",
        description: `A comanda foi excluída com sucesso`,
      });

      // Fechar modais
      setDeleteConfirmOpen(false);
      setDetailsModalOpen(false);
      setCommandToDelete(null);
      setSelectedCommandForDetails(null);

      // Refresh commands
      await fetchCommands();
    } catch (error) {
      console.error('Erro ao deletar comanda:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar comanda",
        variant: "destructive",
      });
    }
  };

  // Função para abrir confirmação de exclusão
  const handleDeleteCommand = (command: CommandDetails) => {
    setCommandToDelete(command);
    setDeleteConfirmOpen(true);
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
        <header className="bg-[#3D583F]">
        <div className="w-full mx-auto ">
          <div className="flex items-center justify-between bg-white border-b px-4 py-2">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-[#3D583F] text-[#3D583F] bg-white hover:bg-[#3D583F]/10"
                onClick={() => router.push('/')}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Comandas</h1>
                <p className="text-gray-500 text-xs">Gerencie suas comandas</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-[#3D583F] text-[#3D583F] bg-white hover:bg-[#3D583F]/10"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterIcon className="h-5 w-5" />
              </Button>
             
               
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-[#3D583F] text-[#3D583F] bg-white hover:bg-[#3D583F]/10"
                onClick={openCreateCommandModal}
              >
                <PlusIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 px-4 py-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="text-white/80 text-sm font-medium">Comandas Hoje</div>
              <div className="text-3xl font-bold text-white mt-1">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-12 rounded"></div>
                ) : commands.length}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="text-white/80 text-sm font-medium">Comandas Abertas</div>
              <div className="text-lg font-bold text-white mt-1">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-6 w-16 rounded"></div>
                ) : commands.filter(c => c.status === 'open').length}
              </div>
            </div>

           
          </div>

            <div className="relative flex-1 w-full px-4">
              <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 h-4 w-4" />
              <Input
                placeholder="Buscar por nome do cliente..."
                value={clientNameFilter}
                onChange={(e) => setClientNameFilter(e.target.value)}
                className="pl-10 bg-white/20 w-full border-white/30 text-white placeholder:text-white/70"
              />
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
              <div className="mt-3 text-white/80 text-sm">
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
                            {item.professional_id && (
                              <div className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
                                <User className="h-3 w-3" />
                                {item.professional_name || 'Profissional não encontrado'}
                              </div>
                            )}
                          </div>
                          {command.status === 'open' && (
                            <button 
                              className="text-gray-400 hover:text-red-600 mx-4 transition-colors duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItemFromCommand(command.id, item.id, item.name);
                              }}
                              title="Remover item"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          )}
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
                      <span className="text-xl font-bold text-gray-800">
                        Total: <span className="text-#3D583F">R$ {command.total.toFixed(2)}</span>
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
                            className="w-12 h-12 rounded-full border-2 border-[#3D583F] text-[#3D583F] hover:bg-[#3D583F]/10"
                          >
                            <PlusIcon className="w-5 h-5" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPaymentModal(command);
                            }}
                            className="bg-[#3D583F] hover:bg-[#365137] text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2"
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
                    <div className="mt-4 p-4 bg-[#3D583F]/10 rounded-xl border border-[#3D583F]/30">
                      <p className="text-sm font-medium text-[#3D583F] mb-2">Pagamento processado:</p>
                      <div className="space-y-1">
                        {command.payment.payment_methods.map((method, index) => (
                          <div key={index} className="flex justify-between text-sm text-[#3D583F]">
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
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#3D583F] shadow-2xl transition-all duration-200 hover:scale-110 hover:bg-[#365137]"
          size="icon"
        >
          <PlusIcon className="h-6 w-6" />
        </Button>
      </div>

      {/* Modal para criar comanda */}
      <Dialog open={createCommandModalOpen} onOpenChange={setCreateCommandModalOpen}>
        <DialogContent className="flex h-[95dvh] max-h-[95dvh] w-[95vw] max-w-5xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 rounded-t-lg bg-[#3D583F] p-4 text-white sm:p-6">
            <DialogTitle className="flex items-center gap-2 text-lg sm:gap-3 sm:text-xl">
              <div className="rounded-full bg-white/20 p-1.5 sm:p-2">
                <PlusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-bold">Nova Comanda</h2>
                <p className="mt-1 text-xs font-normal text-white/80 sm:text-sm">
                  {createCommandStepLabels[currentTab]} · Etapa {createCommandStepIndex + 1} de {createCommandSteps.length}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {currentTab === 'responsible' && (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
              <div className="overflow-hidden rounded-2xl border border-[#3D583F]/12 bg-white shadow-sm">
                <div className="border-b border-[#3D583F]/10 px-4 py-4 sm:px-5">
                  <Label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Profissional responsável
                  </Label>
                  <Select value={selectedProfessional || undefined} onValueChange={setSelectedProfessional}>
                    <SelectTrigger className="h-11 w-full border-[#3D583F]/15 bg-gray-50/80 focus:border-[#3D583F]">
                      <SelectValue placeholder="Selecione o profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.map((professional) => (
                        <SelectItem key={professional.id} value={professional.id}>
                          {professional.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-b border-[#3D583F]/10 px-4 py-3 sm:px-5">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Buscar cliente por nome ou telefone..."
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                      className="h-10 border-0 bg-gray-50/80 pl-10 shadow-none focus-visible:ring-[#3D583F]/25"
                    />
                  </div>
                </div>

                {loadingClients ? (
                  <div className="flex flex-col items-center py-14 text-gray-500">
                    <RefreshCwIcon className="mb-2 h-7 w-7 animate-spin text-[#3D583F]/40" />
                    <p className="text-sm">Buscando clientes...</p>
                  </div>
                ) : filteredClients.length > 0 ? (
                  <ul className="divide-y divide-[#3D583F]/8">
                    {filteredClients.map((client) => {
                      const isSelected = selectedClient === client.id;
                      return (
                        <li key={client.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedClient(client.id)}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors sm:gap-4 sm:px-5 sm:py-4",
                              isSelected ? "bg-[#3D583F]/8" : "hover:bg-gray-50",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                                isSelected
                                  ? "bg-[#3D583F] text-white"
                                  : "bg-[#3D583F]/10 text-[#3D583F]",
                              )}
                            >
                              {getClientInitials(client.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-gray-900">{client.name}</p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                                {client.phone_number && (
                                  <span className="inline-flex items-center gap-1">
                                    <Phone className="h-3 w-3 shrink-0" />
                                    {client.phone_number}
                                  </span>
                                )}
                                {client.email && (
                                  <span className="inline-flex min-w-0 items-center gap-1">
                                    <Mail className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{client.email}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckIcon className="h-5 w-5 shrink-0 text-[#3D583F]" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center py-14 text-center text-gray-500">
                    {clientFilter ? (
                      <>
                        <SearchIcon className="mb-2 h-8 w-8 text-gray-300" />
                        <p className="text-sm font-medium text-gray-600">Nenhum cliente encontrado</p>
                      </>
                    ) : (
                      <>
                        <UsersIcon className="mb-2 h-8 w-8 text-gray-300" />
                        <p className="text-sm font-medium text-gray-600">Nenhum cliente cadastrado</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {(!selectedClient || !selectedProfessional) && (
                <p className="mt-3 text-center text-xs text-gray-500">
                  Selecione o profissional e o cliente para continuar
                </p>
              )}
            </div>
            )}

            {currentTab === 'items' && (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
              <div className="mb-4 flex rounded-xl border border-[#3D583F]/12 bg-[#3D583F]/5 p-1">
                <button
                  type="button"
                  onClick={() => setItemTab('service')}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
                    itemTab === 'service'
                      ? "bg-white text-[#3D583F] shadow-sm"
                      : "text-gray-600 hover:text-[#3D583F]",
                  )}
                >
                  <ClockIcon className="h-4 w-4" />
                  Serviços
                </button>
                <button
                  type="button"
                  onClick={() => setItemTab('product')}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
                    itemTab === 'product'
                      ? "bg-white text-[#3D583F] shadow-sm"
                      : "text-gray-600 hover:text-[#3D583F]",
                  )}
                >
                  <ShoppingCartIcon className="h-4 w-4" />
                  Produtos
                </button>
              </div>

              {itemTab === 'service' && (
                <div className="overflow-hidden rounded-2xl border border-[#3D583F]/12 bg-white shadow-sm">
                  <div className="border-b border-[#3D583F]/10 px-4 py-3 sm:px-5">
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Buscar serviços..."
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="h-10 border-0 bg-gray-50/80 pl-10 shadow-none focus-visible:ring-[#3D583F]/25"
                      />
                    </div>
                  </div>

                  {services.filter((service) =>
                    serviceFilter === '' ||
                    (service.service_name || service.name || '').toLowerCase().includes(serviceFilter.toLowerCase()),
                  ).length === 0 ? (
                    <div className="flex flex-col items-center py-14 text-center text-gray-500">
                      <ClockIcon className="mb-2 h-8 w-8 text-gray-300" />
                      <p className="text-sm font-medium text-gray-600">
                        {serviceFilter ? 'Nenhum serviço encontrado' : 'Nenhum serviço disponível'}
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-[#3D583F]/8">
                      {services
                        .filter((service) =>
                          serviceFilter === '' ||
                          (service.service_name || service.name || '').toLowerCase().includes(serviceFilter.toLowerCase()),
                        )
                        .map((service) => {
                          const serviceId = service.service_id || service.id || '';
                          const serviceName = service.service_name || service.name || '';
                          const servicePrice = service.service_price || service.price || 0;
                          const quantity = getItemQuantity(serviceId, 'service');
                          const isInCart = cartItems.some((item) => item.id === serviceId && item.type === 'service');

                          return (
                            <li key={serviceId} className={cn("px-4 py-3.5 sm:px-5 sm:py-4", isInCart && "bg-[#3D583F]/[0.03]")}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-gray-900">{serviceName}</p>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    {service.service_duration ? `${service.service_duration} min` : 'Serviço'}
                                    {service.service_description && ` · ${service.service_description}`}
                                  </p>
                                </div>
                                <p className="shrink-0 text-sm font-semibold tabular-nums text-[#3D583F]">
                                  {formatCurrency(servicePrice)}
                                </p>
                              </div>
                              <div className="mt-3 flex items-center justify-between gap-3">
                                <div className="flex items-center rounded-lg border border-[#3D583F]/15">
                                  <button
                                    type="button"
                                    onClick={() => updateItemQuantity(serviceId, quantity - 1, 'service')}
                                    className="flex h-8 w-8 items-center justify-center text-[#3D583F] transition-colors hover:bg-[#3D583F]/10"
                                    aria-label="Diminuir quantidade"
                                  >
                                    <MinusCircleIcon className="h-4 w-4" />
                                  </button>
                                  <span className="w-8 text-center text-sm font-medium tabular-nums text-gray-700">
                                    {quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isInCart) {
                                        updateItemQuantity(serviceId, quantity + 1, 'service');
                                      } else {
                                        setItemQuantities((prev) => ({ ...prev, [serviceId]: quantity + 1 }));
                                      }
                                    }}
                                    className="flex h-8 w-8 items-center justify-center text-[#3D583F] transition-colors hover:bg-[#3D583F]/10"
                                    aria-label="Aumentar quantidade"
                                  >
                                    <PlusCircleIcon className="h-4 w-4" />
                                  </button>
                                </div>
                                <Button
                                  size="sm"
                                  variant={isInCart ? "outline" : "default"}
                                  onClick={() =>
                                    isInCart
                                      ? removeFromCart(serviceId, 'service')
                                      : addToCart(service, 'service')
                                  }
                                  className={cn(
                                    "h-8 shrink-0",
                                    isInCart
                                      ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                      : "bg-[#3D583F] text-white hover:bg-[#365137]",
                                  )}
                                >
                                  {isInCart ? (
                                    <>
                                      <TrashIcon className="mr-1.5 h-3.5 w-3.5" />
                                      Remover
                                    </>
                                  ) : (
                                    <>
                                      <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                                      Adicionar
                                    </>
                                  )}
                                </Button>
                              </div>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </div>
              )}

              {itemTab === 'product' && (
                <div className="overflow-hidden rounded-2xl border border-[#3D583F]/12 bg-white shadow-sm">
                  <div className="border-b border-[#3D583F]/10 px-4 py-3 sm:px-5">
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Buscar produtos..."
                        value={productFilter}
                        onChange={(e) => setProductFilter(e.target.value)}
                        className="h-10 border-0 bg-gray-50/80 pl-10 shadow-none focus-visible:ring-[#3D583F]/25"
                      />
                    </div>
                  </div>

                  {products.filter((product) =>
                    productFilter === '' ||
                    product.name.toLowerCase().includes(productFilter.toLowerCase()),
                  ).length === 0 ? (
                    <div className="flex flex-col items-center py-14 text-center text-gray-500">
                      <ShoppingCartIcon className="mb-2 h-8 w-8 text-gray-300" />
                      <p className="text-sm font-medium text-gray-600">
                        {productFilter ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-[#3D583F]/8">
                      {products
                        .filter((product) =>
                          productFilter === '' ||
                          product.name.toLowerCase().includes(productFilter.toLowerCase()),
                        )
                        .map((product) => {
                          const quantity = getItemQuantity(product.id, 'product');
                          const isInCart = cartItems.some((item) => item.id === product.id && item.type === 'product');
                          const outOfStock = product.stock !== undefined && product.stock === 0;

                          return (
                            <li
                              key={product.id}
                              className={cn(
                                "px-4 py-3.5 sm:px-5 sm:py-4",
                                isInCart && "bg-[#3D583F]/[0.03]",
                                outOfStock && "opacity-60",
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-gray-900">{product.name}</p>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    Produto
                                    {product.stock !== undefined && ` · Estoque: ${product.stock}`}
                                    {product.description && ` · ${product.description}`}
                                  </p>
                                </div>
                                <p className="shrink-0 text-sm font-semibold tabular-nums text-[#3D583F]">
                                  {formatCurrency(product.price)}
                                </p>
                              </div>
                              <div className="mt-3 flex items-center justify-between gap-3">
                                <div className="flex items-center rounded-lg border border-[#3D583F]/15">
                                  <button
                                    type="button"
                                    onClick={() => updateItemQuantity(product.id, quantity - 1, 'product')}
                                    className="flex h-8 w-8 items-center justify-center text-[#3D583F] transition-colors hover:bg-[#3D583F]/10"
                                    aria-label="Diminuir quantidade"
                                  >
                                    <MinusCircleIcon className="h-4 w-4" />
                                  </button>
                                  <span className="w-8 text-center text-sm font-medium tabular-nums text-gray-700">
                                    {quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isInCart) {
                                        updateItemQuantity(product.id, quantity + 1, 'product');
                                      } else {
                                        setItemQuantities((prev) => ({ ...prev, [product.id]: quantity + 1 }));
                                      }
                                    }}
                                    disabled={product.stock !== undefined && quantity >= product.stock}
                                    className="flex h-8 w-8 items-center justify-center text-[#3D583F] transition-colors hover:bg-[#3D583F]/10 disabled:opacity-40"
                                    aria-label="Aumentar quantidade"
                                  >
                                    <PlusCircleIcon className="h-4 w-4" />
                                  </button>
                                </div>
                                <Button
                                  size="sm"
                                  variant={isInCart ? "outline" : "default"}
                                  onClick={() =>
                                    isInCart
                                      ? removeFromCart(product.id, 'product')
                                      : addToCart(product, 'product')
                                  }
                                  disabled={outOfStock}
                                  className={cn(
                                    "h-8 shrink-0",
                                    isInCart
                                      ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                      : "bg-[#3D583F] text-white hover:bg-[#365137]",
                                  )}
                                >
                                  {isInCart ? (
                                    <>
                                      <TrashIcon className="mr-1.5 h-3.5 w-3.5" />
                                      Remover
                                    </>
                                  ) : (
                                    <>
                                      <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                                      Adicionar
                                    </>
                                  )}
                                </Button>
                              </div>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </div>
              )}

              {cartItems.length > 0 && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-[#3D583F]/12 bg-[#3D583F]/5 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-[#3D583F]">
                    <ShoppingCartIcon className="h-4 w-4" />
                    <span className="font-medium">
                      {cartItems.length} {cartItems.length === 1 ? 'item no carrinho' : 'itens no carrinho'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-[#3D583F]">
                    {formatCurrency(getCartTotal())}
                  </span>
                </div>
              )}
            </div>
            )}

            {currentTab === 'cart' && (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShoppingCartIcon className="mb-3 h-10 w-10 text-[#3D583F]/25" />
                  <p className="font-medium text-gray-700">Carrinho vazio</p>
                  <p className="mt-1 text-sm text-gray-500">Volte e adicione serviços ou produtos</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-[#3D583F]/12 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#3D583F]/10 px-4 py-3 sm:px-5">
                    <p className="text-sm font-medium text-gray-700">
                      {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setCartItems([])}
                      className="text-xs font-medium text-red-500 transition-colors hover:text-red-600"
                    >
                      Limpar tudo
                    </button>
                  </div>

                  <ul className="divide-y divide-[#3D583F]/8">
                    {cartItems.map((item) => (
                      <li
                        key={`${item.id}-${item.type}`}
                        className="flex items-start gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4"
                      >
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3D583F]/8 text-[#3D583F]">
                          {item.type === 'service' ? (
                            <ClockIcon className="h-4 w-4" />
                          ) : (
                            <ShoppingCartIcon className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="truncate font-medium text-gray-900">{item.name}</p>
                            <p className="shrink-0 text-sm font-semibold tabular-nums text-[#3D583F]">
                              {formatCurrency(item.total)}
                            </p>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {item.type === 'service' ? 'Serviço' : 'Produto'}
                            {' · '}
                            {item.quantity}× {formatCurrency(item.price)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id, item.type)}
                          className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          aria-label={`Remover ${item.name}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between border-t border-[#3D583F]/10 bg-[#3D583F]/[0.04] px-4 py-4 sm:px-5">
                    <span className="text-sm font-medium text-gray-600">Total da comanda</span>
                    <span className="text-2xl font-bold tabular-nums tracking-tight text-[#3D583F]">
                      {formatCurrency(getCartTotal())}
                    </span>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-[#3D583F]/10 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button 
                variant="outline" 
                onClick={() => setCreateCommandModalOpen(false)}
                className="w-full border-[#3D583F]/30 text-[#3D583F] hover:bg-[#3D583F]/10 sm:w-auto"
              >
                Cancelar
              </Button>
              {!isFirstCreateStep && (
                <Button
                  variant="outline"
                  onClick={goToPreviousCreateStep}
                  className="w-full border-[#3D583F]/30 text-[#3D583F] hover:bg-[#3D583F]/10 sm:w-auto"
                >
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              )}
            </div>
            {!isLastCreateStep ? (
              <Button
                onClick={goToNextCreateStep}
                disabled={isFirstCreateStep && (!selectedClient || !selectedProfessional)}
                className="w-full bg-[#3D583F] text-white hover:bg-[#365137] sm:w-auto"
              >
                {currentTab === 'items' && cartItems.length > 0
                  ? `Ver carrinho (${cartItems.length})`
                  : 'Próxima etapa'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={createCommand}
                disabled={!selectedClient || !selectedProfessional || cartItems.length === 0 || isCreatingCommand}
                className="w-full bg-[#3D583F] text-white hover:bg-[#365137] sm:w-auto"
              >
                {isCreatingCommand ? 'Criando...' : 'Criar Comanda'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#3D583F]">
              <CreditCardIcon className="h-5 w-5" />
              Fechar Comanda #{selectedCommand?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedCommand && (
            <div className="space-y-6">
              {/* Itens com desconto */}
              <div className="space-y-3 rounded-xl border border-[#3D583F]/20 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#3D583F]">
                  <ShoppingCartIcon className="h-4 w-4" />
                  Itens da Comanda
                </h3>

                <div className="max-h-56 space-y-3 overflow-y-auto">
                  {commandItems.map((item, index) => {
                    const originalPrice = Number(item.original_price ?? item.price) || 0;
                    const unitPrice = Number(item.final_price ?? item.price) || 0;
                    const hasDiscount =
                      item.discount_type !== "none" && (item.discount_value || 0) > 0;

                    return (
                      <div
                        key={`${item.id}-${index}`}
                        className="rounded-lg border border-[#3D583F]/15 bg-[#3D583F]/5 p-3"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[#3D583F]">
                              {item.name}
                            </p>
                            <p className="mt-1 text-xs text-[#3D583F]/70">
                              Qtd: {item.quantity} · Unitário: {formatCurrency(originalPrice)}
                            </p>
                          </div>
                          <div className="text-right">
                            {hasDiscount && (
                              <>
                                <p className="text-xs text-gray-400 line-through">
                                  {formatCurrency(originalPrice * Number(item.quantity))}
                                </p>
                                <p className="text-xs font-medium text-[#3D583F]">
                                  {formatDiscountInfo(
                                    item.discount_type || "none",
                                    item.discount_value || 0,
                                    originalPrice,
                                  )}
                                </p>
                              </>
                            )}
                            <p className="text-sm font-bold text-[#3D583F]">
                              {formatCurrency(unitPrice * Number(item.quantity))}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-md border border-[#3D583F]/15 bg-white p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-1 text-xs font-medium text-[#3D583F]">
                              <PercentIcon className="h-3 w-3" />
                              Aplicar desconto
                            </span>
                            {hasDiscount && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-red-500 hover:text-red-700"
                                onClick={() => removeDiscountFromCommandItem(index)}
                              >
                                Remover
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <select
                              className="rounded-md border border-[#3D583F]/20 bg-white px-2 py-2 text-xs text-[#3D583F]"
                              value={item.discount_type || "none"}
                              onChange={(e) => {
                                const value = e.target.value as "none" | "percentage" | "fixed";
                                if (value === "none") {
                                  removeDiscountFromCommandItem(index);
                                  return;
                                }
                                const newItems = [...commandItems];
                                newItems[index] = {
                                  ...newItems[index],
                                  discount_type: value,
                                  discount_value: 0,
                                  final_price: originalPrice,
                                };
                                setCommandItems(newItems);
                              }}
                            >
                              <option value="none">Sem desconto</option>
                              <option value="percentage">% Percentual</option>
                              <option value="fixed">R$ Valor fixo</option>
                            </select>

                            {item.discount_type !== "none" && (
                              <>
                                <Input
                                  type="number"
                                  min="0"
                                  max={
                                    item.discount_type === "percentage"
                                      ? "100"
                                      : originalPrice.toString()
                                  }
                                  step={item.discount_type === "percentage" ? "1" : "0.01"}
                                  placeholder={
                                    item.discount_type === "percentage" ? "0" : "0,00"
                                  }
                                  value={discountDrafts[index] ?? ""}
                                  onChange={(e) =>
                                    setDiscountDrafts((prev) => ({
                                      ...prev,
                                      [index]: e.target.value,
                                    }))
                                  }
                                  className="h-9 text-xs"
                                />
                                <Button
                                  size="sm"
                                  className="h-9 bg-[#3D583F] text-white hover:bg-[#365137]"
                                  onClick={() => {
                                    const value = parseFloat(discountDrafts[index] || "0");
                                    if (!Number.isNaN(value) && value > 0) {
                                      applyDiscountToCommandItem(
                                        index,
                                        item.discount_type || "none",
                                        value,
                                      );
                                    }
                                  }}
                                >
                                  Aplicar
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumo da Comanda */}
              <Card className="border-[#3D583F]/20 bg-[#3D583F]/10 p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-[#3D583F]">Resumo da Comanda</h3>
                  <p className="text-[#3D583F]/80">{selectedCommand.client_name}</p>
                  {(() => {
                    const originalTotal = commandItems.reduce((sum, item) => {
                      return (
                        sum +
                        Number(item.original_price ?? item.price) * Number(item.quantity)
                      );
                    }, 0);
                    const finalTotal = calculateCommandTotal();
                    const totalDiscount = originalTotal - finalTotal;
                    const hasDiscounts = totalDiscount > 0.009;

                    return (
                      <>
                        {hasDiscounts && (
                          <div className="flex justify-between text-sm text-[#3D583F]/70">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(originalTotal)}</span>
                          </div>
                        )}
                        {hasDiscounts && (
                          <div className="flex justify-between text-sm text-[#3D583F]">
                            <span>Desconto:</span>
                            <span>- {formatCurrency(totalDiscount)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[#3D583F]">Total:</span>
                          <span className="text-2xl font-bold text-[#3D583F]">
                            {formatCurrency(finalTotal)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                  <div className="flex justify-between items-center">
                    <span className="text-[#3D583F]">Restante:</span>
                    <span className="font-semibold text-[#3D583F]">
                      {formatCurrency(getRemainingPaymentAmount())}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Adicionar Pagamento */}
              <div className="space-y-4">
                <Label className="text-base font-semibold text-[#3D583F]">
                  Adicionar Pagamento
                </Label>

                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <Button
                      key={method.value}
                      variant={selectedPaymentType === method.value ? "default" : "outline"}
                      className={`flex items-center justify-center gap-2 ${
                        selectedPaymentType === method.value
                          ? "bg-[#3D583F] text-white hover:bg-[#365137]"
                          : "border-[#3D583F]/30 text-[#3D583F] hover:bg-[#3D583F]/10"
                      }`}
                      onClick={() => setSelectedPaymentType(method.value as any)}
                    >
                      {getPaymentMethodIcon(
                        method.value,
                        selectedPaymentType === method.value
                          ? "h-4 w-4 text-white"
                          : "h-4 w-4 text-[#3D583F]",
                      )}
                      <span className="text-sm">{method.label}</span>
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentAmount" className="text-[#3D583F]">
                    Valor (Máx: {formatCurrency(getRemainingPaymentAmount())})
                  </Label>
                  <Input
                    id="paymentAmount"
                    type="text"
                    placeholder="0,00"
                    value={paymentAmount}
                    onChange={(e) => {
                      const remainingValue = getRemainingPaymentAmount();
                      const formatted = formatCurrencyInput(
                        e.target.value,
                        remainingValue,
                        setMaxValueReached,
                      );
                      setPaymentAmount(formatted);
                    }}
                    className={`text-lg ${maxValueReached ? "border-orange-400 bg-orange-50" : "border-[#3D583F]/20"}`}
                  />
                  {maxValueReached && (
                    <p className="flex items-center gap-1 text-sm text-orange-600">
                      <XIcon className="h-4 w-4" />
                      Valor limitado ao máximo disponível da comanda
                    </p>
                  )}
                </div>

                <Button
                  onClick={addPaymentMethod}
                  className="w-full bg-[#3D583F] text-white hover:bg-[#365137]"
                  disabled={!paymentAmount || parseCurrencyInput(paymentAmount) <= 0}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Adicionar Método
                </Button>
              </div>

              {/* Métodos Selecionados */}
              {selectedPaymentMethods.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-[#3D583F]">
                    Métodos Selecionados
                  </Label>
                  <div className="space-y-2">
                    {selectedPaymentMethods.map((method, index) => (
                      <Card key={index} className="border-[#3D583F]/15 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(method.method, "h-4 w-4 text-[#3D583F]")}
                            <span className="text-[#3D583F]">
                              {getPaymentMethodLabel(method.method)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#3D583F]">
                              {formatCurrency(method.amount)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePaymentMethod(index)}
                              className="text-red-600 hover:bg-red-50 hover:text-red-800"
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

              <div className="flex justify-between border-t pt-6">
                <Button
                  variant="outline"
                  onClick={() => setPaymentModalOpen(false)}
                  className="border-[#3D583F]/30 text-[#3D583F] hover:bg-[#3D583F]/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={processPayment}
                  disabled={
                    getRemainingPaymentAmount() > 0.01 ||
                    selectedPaymentMethods.length === 0 ||
                    isProcessingPayment
                  }
                  className="bg-[#3D583F] text-white hover:bg-[#365137]"
                >
                  {isProcessingPayment ? "Processando..." : "Finalizar Pagamento"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Comanda */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#3D583F]/20">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg text-[#3D583F]">
              <EyeIcon className="h-5 w-5 flex-shrink-0" />
              Detalhes da Comanda
            </DialogTitle>
          </DialogHeader>

          {selectedCommandForDetails && (
            <div className="space-y-4 sm:space-y-6">
              {/* Informações da Comanda */}
              <Card className="p-3 sm:p-4 border border-[#3D583F]/20">
                <div className="space-y-3">
                  <h3 className="font-semibold text-base sm:text-lg mb-3 text-[#3D583F]">Informações da Comanda</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs sm:text-sm text-gray-600">Cliente:</Label>
                      <p className="font-medium text-sm sm:text-base">{selectedCommandForDetails.client_name}</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm text-gray-600">Data:</Label>
                      <p className="font-medium text-sm sm:text-base">{formatDate(selectedCommandForDetails.created_at)}</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm text-gray-600">Status:</Label>
                      <Badge variant={selectedCommandForDetails.status === 'closed' ? 'default' : 'secondary'} className="text-xs sm:text-sm">
                        {selectedCommandForDetails.status === 'closed' ? 'Paga' : 'Aberta'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm text-gray-600">Total:</Label>
                      <p className="text-xl sm:text-2xl font-bold text-[#3D583F]">
                        {formatCurrency(selectedCommandForDetails.total)}
                      </p>
                    </div>
                  </div>
                  {selectedCommandForDetails.professional_name && (
                    <div>
                      <Label className="text-xs sm:text-sm text-gray-600">Profissional:</Label>
                      <p className="font-medium text-[#3D583F] text-sm sm:text-base">{selectedCommandForDetails.professional_name}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Lista de Itens */}
              <Card className="p-3 sm:p-4 border border-[#3D583F]/20">
                <h3 className="font-semibold text-base sm:text-lg mb-3 text-[#3D583F]">
                  Itens da Comanda ({selectedCommandForDetails.items.length})
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {selectedCommandForDetails.items.map((item, index) => (
                    <Card key={index} className="p-2 sm:p-3 bg-[#3D583F]/5 border border-[#3D583F]/20">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm sm:text-base truncate">{item.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Qtd: {item.quantity} | Unit: {formatCurrency(parseFloat(item.price))}
                          </p>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                          <p className="font-semibold text-[#3D583F] text-sm sm:text-base">
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
                <Card className="p-3 sm:p-4 bg-[#3D583F]/10 border-[#3D583F]/30">
                  <h3 className="font-semibold text-base sm:text-lg mb-3 text-[#3D583F]">Detalhes do Pagamento</h3>
                  <div className="space-y-2">
                    {selectedCommandForDetails.payment.paid_at && (
                      <p className="text-xs sm:text-sm text-[#3D583F]">
                        Pago em: {formatDate(selectedCommandForDetails.payment.paid_at)}
                      </p>
                    )}
                    {selectedCommandForDetails.payment.payment_methods.map((method, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-[#3D583F] text-xs sm:text-sm">
                          {getPaymentMethodLabel(method.method)}
                        </span>
                        <span className="font-semibold text-[#3D583F] text-xs sm:text-sm">
                          {formatCurrency(parseFloat(method.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-0 pt-4 sm:pt-6 border-t">
                <Button 
                  variant="destructive"
                  onClick={() => handleDeleteCommand(selectedCommandForDetails)}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto text-sm"
                >
                  <TrashIcon className="h-4 w-4" />
                  Excluir Comanda
                </Button>
                <Button 
                  onClick={() => setDetailsModalOpen(false)}
                  className="bg-[#3D583F] hover:bg-[#365137] w-full sm:w-auto text-sm"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 text-lg">
              <TrashIcon className="h-5 w-5 flex-shrink-0" />
              Confirmar Exclusão da Comanda
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <div className="text-gray-700">Tem certeza que deseja excluir esta comanda?</div>
                {commandToDelete && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="font-medium text-gray-900">
                      Cliente: {commandToDelete.client_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Total: {formatCurrency(commandToDelete.total)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Itens: {commandToDelete.items.length}
                    </div>
                  </div>
                )}
                <div className="text-red-600 font-medium">Esta ação não pode ser desfeita!</div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setCommandToDelete(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={deleteCommand}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <TrashIcon className="h-4 w-4" />
              Excluir Comanda
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Adicionar Itens */}
      <Dialog open={addItemModalOpen} onOpenChange={setAddItemModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircleIcon className="h-5 w-5" />
              Adicionar Itens à Comanda #{commandToAddItem}
            </DialogTitle>
          </DialogHeader>

          {/* Primeira etapa: Seleção obrigatória de profissional */}
          {!selectedProfessional ? (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-amber-100 p-1.5 rounded-md">
                    <UsersIcon className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="text-base font-semibold text-amber-800">Seleção de Profissional</h3>
                </div>
                <p className="text-sm text-amber-700">
                  Para adicionar um item à comanda, é obrigatório selecionar o profissional responsável.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Selecione o Profissional *
                </Label>
                <Select
                  value={selectedProfessional || undefined}
                  onValueChange={setSelectedProfessional}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals && professionals.length > 0 ? (
                      professionals.map(prof => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        Carregando profissionais...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            /* Segunda etapa: Seleção de serviços e produtos após escolher profissional */
            <div className="space-y-4">
              {/* Profissional selecionado */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-100 p-1.5 rounded-md">
                      <UsersIcon className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Profissional Selecionado:</p>
                      <p className="text-sm text-green-700">
                        {(() => {
                          const professional = professionals?.find(p => p.id === selectedProfessional);
                          if (professional) {
                            const position = professional.position === 'admin' ? 'Administrador' : 
                                           professional.position === 'manager' ? 'Gerente' : 
                                           professional.position === 'employee' ? 'Funcionário' : 
                                           professional.position;
                            return `${professional.name} - ${position}`;
                          }
                          return 'Nenhum profissional selecionado';
                        })()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProfessional('')}
                    className="text-green-600 border-green-300 hover:bg-green-100"
                  >
                    Alterar
                  </Button>
                </div>
              </div>

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
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 animate-bounce">
                                <CheckIcon className="h-3 w-3" />
                                Adicionado!
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
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 animate-bounce">
                                <CheckIcon className="h-3 w-3" />
                                Adicionado!
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
            </div>
          )}

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
