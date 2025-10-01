"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const translatePaymentMethod = (method: string) => {
  switch (method) {
    case 'cash':
      return 'Dinheiro';
    case 'credit':
      return 'Cartão Crédito';
    case 'debit':
      return 'Cartão Débito';
    case 'pix':
      return 'PIX';
    default:
      return method; // Retorna o original se não houver tradução
  }
};
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  DollarSign, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Lock, 
  LockOpen, 
  Plus, 
  Minus, 
  CreditCard, 
  FileText, 
  RefreshCw, 
  Receipt, 
  User, 
  Eye, 
  AlertCircle,
  Wallet,
  CheckCircle,
  Settings,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Building,
  Users,
  Download,
  Filter,
  Search,
  MoreVertical,
  Info,
  PlayCircle,
  StopCircle,
  PieChart,
  BarChart3,
  Activity
} from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { useToast } from "@/hooks/use-toast";
import { api } from '@/services/api';
import { cashDrawerService, type CashDrawer as ServiceCashDrawer, type CreateCashDrawerData, type CloseCashDrawerData } from '@/services/cashDrawerService';
import { financialTransactionsService, type CreateTransactionData } from '@/services/financialTransactionsService';

// Interfaces

interface CashDrawer {
  id?: number;
  company_id: number;
  opened_by_id: number;
  closed_by_id?: number;
  value_inicial: string;
  value_final?: string;
  status: 'open' | 'closed';
  date_open: string;
  date_close?: string;
  opened_at?: string;
  closed_at?: string;
  notes?: string;
  opener_name?: string;
  closer_name?: string;
  user?: {
    id: number;
    name: string;
  };
}

interface Transaction {
  id: number;
  cash_drawer_id: number;
  type: 'income' | 'expense' | 'cash_out';
  category: string;
  amount: string;
  description: string;
  created_at: string;
  transaction_date?: string;
  command_id?: number; // Adicionado para suporte a comandas
  user?: {
    id: number;
    name: string;
  };
}

interface CashBalance {
  balance: number;
  total_income: number;
  total_expense: number;
  total_cash_out: number;
  date_open: string;
  date_close?: string;
  notes?: string;
  opener_name?: string;
  closer_name?: string;
}

interface CashDrawerDetails {
  id: number;
  company_id: number;
  opened_by_id: number;
  closed_by_id?: number;
  value_inicial: string;
  value_final?: string;
  status: 'open' | 'closed';
  date_open: string;
  date_close?: string;
  notes?: string;
  opener_name: string;
  closer_name?: string;
  transactions: Transaction[];
  payments: Payment[];
}

interface Payment {
  id: number;
  company_id: number;
  client_id: number;
  command_id?: number;
  total_amount: string;
  paid_at: string;
  client_name: string;
  payment_methods: PaymentMethod[];
}

interface PaymentMethod {
  method: 'cash' | 'credit' | 'debit' | 'pix';
  amount: number;
}

interface CashBalancePeriod {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_income: number;
    total_expense: number;
    total_cash_out: number;
    net_balance: number;
    drawers_count: number;
  };
  drawers: CashDrawer[];
}

// Interfaces baseadas no Link-Front
interface CommandItem {
  id: number;
  command_id: number;
  item_type: 'product' | 'service';
  product_id?: number;
  service_id?: number;
  name: string;
  description: string;
  price: string;
  quantity: number;
  duration?: number;
}

interface CommandDetails {
  id: number;
  company_id: number;
  client_id: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  created_at: string;
  updated_at: string;
  items: CommandItem[];
  total: number;
}

// Categorias de transações (idênticas ao mobile)
const INCOME_CATEGORIES = [
  'Vendas',
  'Serviços',
  'Comissões',
  'Juros Recebidos',
  'Outros Recebimentos'
];

const EXPENSE_CATEGORIES = [
  'Fornecedores',
  'Salários',
  'Aluguel',
  'Energia Elétrica',
  'Água',
  'Internet/Telefone',
  'Combustível',
  'Manutenção',
  'Material de Escritório',
  'Impostos',
  'Outros Gastos'
];

const WITHDRAWAL_CATEGORIES = [
  'Depósito Banco do Brasil',
  'Depósito Itaú',
  'Depósito Bradesco',
  'Depósito Santander',
  'Depósito Caixa Econômica',
  'Depósito Nubank',
  'Depósito Banco Inter',
  'Depósito Sicoob',
  'Depósito Sicredi',
  'Depósito Outros Bancos'
];

const TRANSACTION_CATEGORIES = {
  entrada: INCOME_CATEGORIES,
  saida: EXPENSE_CATEGORIES,
  sangria: WITHDRAWAL_CATEGORIES
};

export default function FinancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  // Estados principais
  const [currentDrawer, setCurrentDrawer] = useState<CashDrawer | null>(null);
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<CashBalance>({
    balance: 0,
    total_income: 0,
    total_expense: 0,
    total_cash_out: 0,
    date_open: '',
    date_close: undefined,
    notes: '',
    opener_name: '',
    closer_name: ''
  });
  
  // Estados de loading e modais
  const [loading, setLoading] = useState(false);
  const [openDrawerDialog, setOpenDrawerDialog] = useState(false);
  const [closeDrawerDialog, setCloseDrawerDialog] = useState(false);
  const [transactionDialog, setTransactionDialog] = useState(false);
  const [drawerDetailsDialog, setDrawerDetailsDialog] = useState(false);
  // Estados para tooltip de detalhes da comanda (baseado no Link-Front)
  const [hoveredPayment, setHoveredPayment] = useState<number | null>(null);
  const [commandDetails, setCommandDetails] = useState<CommandDetails | null>(null);
  
  // Estados para dialog de detalhes da gaveta
  const [drawerDetailsOpen, setDrawerDetailsOpen] = useState(false);
  const [selectedDrawerForDetails, setSelectedDrawerForDetails] = useState<any>(null);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all');
  
  // Estados de formulários
  const [openValue, setOpenValue] = useState('');
  const [closeValue, setCloseValue] = useState('');
  const [drawerNotes, setDrawerNotes] = useState('');
  const [transactionForm, setTransactionForm] = useState({
    type: 'entrada' as 'entrada' | 'saida' | 'sangria',
    category: '',
    amount: '',
    description: ''
  });
  
  // Estados adicionais da tela mobile
  const [cashDrawers, setCashDrawers] = useState<CashDrawer[]>([]);
  const [openCashDrawers, setOpenCashDrawers] = useState<CashDrawer[]>([]);
  const [drawerDetails, setDrawerDetails] = useState<CashDrawerDetails | null>(null);
  // Estados de comandas removidos
  const [periodBalance, setPeriodBalance] = useState<CashBalancePeriod | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  // Filtro de comandas não necessário na nova implementação
  const [hasDrawerOpenedToday, setHasDrawerOpenedToday] = useState(false);
  const [todayClosedDrawer, setTodayClosedDrawer] = useState<CashDrawer | null>(null);
  
  // Estados de loading específicos
  const [isLoadingDrawers, setIsLoadingDrawers] = useState(false);
  const [isLoadingOpenDrawers, setIsLoadingOpenDrawers] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingPeriodBalance, setIsLoadingPeriodBalance] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [loadingDrawerDetails, setLoadingDrawerDetails] = useState(false);
  // Loading de comandas não necessário
  const [openingDrawer, setOpeningDrawer] = useState(false);
  const [isClosingDrawer, setIsClosingDrawer] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  

  // Funções da API usando cashDrawerService
  const fetchCurrentDrawer = async () => {
    if (!user?.company_id) return;
    
    try {
      setLoading(true);
      const drawer = await cashDrawerService.getCurrentDrawer(user.company_id);
      
      console.log('Gaveta atual:', drawer);
      setCurrentDrawer(drawer);
    } catch (error: any) {
      console.error('Erro ao buscar gaveta atual:', error);
      setCurrentDrawer(null);
      
      toast({
        title: "Erro",
        description: "Erro ao buscar gaveta de caixa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar gavetas de caixa usando cashDrawerService
  const fetchCashDrawers = async () => {
    if (!user?.company_id) return;
    
    try {
      setIsLoadingDrawers(true);
      
      let allDrawers: CashDrawer[] = [];
      
      // 1. SEMPRE buscar gavetas abertas dos últimos 5 dias por padrão
      const today = new Date();
      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(today.getDate() - 5);
      
      const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      
      try {
        // Buscar gavetas abertas dos últimos 5 dias
        const openDrawers = await cashDrawerService.getCashDrawers(user.company_id, fiveDaysAgoStr, todayStr, 'open');
        allDrawers = [...openDrawers];
      } catch (error) {
        console.warn('Erro ao buscar gavetas abertas:', error);
      }
      
      // 2. Se há filtro de data, buscar TAMBÉM gavetas fechadas do período
      if (selectedPeriod !== 'week' || startDate || endDate) {
        const { start, end } = getDateRange();
        const startDateStr = start.toISOString().split('T')[0];
        const endDateStr = end.toISOString().split('T')[0];
        
        try {
          const filteredDrawers = await cashDrawerService.getCashDrawers(user.company_id, startDateStr, endDateStr);
          
          // Adicionar gavetas fechadas que não estão já na lista
          const closedDrawers = filteredDrawers.filter((drawer: CashDrawer) => 
            drawer.status === 'closed' && 
            !allDrawers.some(existing => existing.id === drawer.id)
          );
          
          allDrawers = [...allDrawers, ...closedDrawers];
        } catch (error) {
          console.warn('Erro ao buscar gavetas do período:', error);
        }
      }
      
      // Ordenar por data de abertura (mais recente primeiro)
      allDrawers.sort((a, b) => new Date(b.date_open).getTime() - new Date(a.date_open).getTime());
      
      setCashDrawers(allDrawers);
    } catch (error) {
      console.error('Erro ao buscar gavetas de caixa:', error);
      setCashDrawers([]);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as gavetas de caixa",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDrawers(false);
    }
  };

  // Função para buscar gavetas abertas (igual ao mobile)
  const fetchOpenCashDrawers = async () => {
    if (!user?.company_id) return;
    
    try {
      setIsLoadingOpenDrawers(true);
      
      // Calcular data 5 dias atrás
      const today = new Date();
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(today.getDate() - 5);
      
      const startDate = fiveDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      // Buscar gavetas abertas no período
      const response = await api.get(`/cash-drawers?start_date=${startDate}&end_date=${endDate}&status=open`, {
        headers: {
          'company_id': user.company_id,
          'user_id': user.id
        }
      });
      
      setOpenCashDrawers(response.data);
    } catch (error) {
      console.error('Erro ao buscar gavetas abertas:', error);
      setOpenCashDrawers([]);
    } finally {
      setIsLoadingOpenDrawers(false);
    }
  };

  // Função para verificar se já foi aberta uma gaveta hoje (igual ao mobile)
  const checkIfDrawerOpenedToday = async () => {
    if (!user?.company_id) return false;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/cash-drawers?start_date=${today}&end_date=${today}`, {
        headers: {
          'company_id': user.company_id,
          'user_id': user.id
        }
      });
      
      const drawers = response.data;
      const hasOpenedToday = drawers.length > 0;
      setHasDrawerOpenedToday(hasOpenedToday);
      
      // Se há gaveta de hoje, verificar se está fechada
      if (hasOpenedToday) {
        const closedDrawer = drawers.find((drawer: CashDrawer) => drawer.status === 'closed');
        if (closedDrawer) {
          setTodayClosedDrawer(closedDrawer);
        } else {
          setTodayClosedDrawer(null);
        }
      } else {
        setTodayClosedDrawer(null);
      }
      
      return hasOpenedToday;
    } catch (error) {
      console.error('Erro ao verificar gavetas do dia:', error);
      return false;
    }
  };

  // Função para buscar saldo por período (igual ao mobile)
  const fetchCashBalanceByPeriod = async () => {
    if (!user?.company_id || !selectedPeriod) return;
    
    try {
      setIsLoadingPeriodBalance(true);
      
      const { start, end } = getDateRange();
      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];
      
      const response = await api.get(`/financial/balance/period?start_date=${startDate}&end_date=${endDate}`, {
        headers: {
          'company_id': user.company_id,
          'user_id': user.id
        }
      });
      
      setPeriodBalance(response.data);
      
      // Atualizar também a lista de gavetas abertas quando buscar saldo por período
      fetchOpenCashDrawers();
      
    } catch (error) {
      console.error('Erro ao buscar saldo por período:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o saldo do período",
        variant: "destructive"
      });
      setPeriodBalance(null);
    } finally {
      setIsLoadingPeriodBalance(false);
    }
  };

  // Função para calcular datas baseadas no período selecionado
  const getDateRange = () => {
    const now = new Date();
    let start: Date;
    let end: Date = now;
    
    switch (selectedPeriod) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start = new Date(now);
        start.setDate(now.getDate() - 30);
        break;
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate);
          end = new Date(endDate);
        } else {
          // Fallback para última semana se datas customizadas não estão definidas
          start = new Date(now);
          start.setDate(now.getDate() - 7);
        }
        break;
      default:
        start = new Date(now);
        start.setDate(now.getDate() - 7);
    }
    
    return { start, end };
  };
  
  // Função para buscar transações usando cashDrawerService
  const fetchTransactions = async () => {
    if (!currentDrawer || !user?.company_id) return;
    
    try {
      setIsLoadingTransactions(true);
      const details = await cashDrawerService.getCashDrawer(user.company_id, currentDrawer.id);
      
      console.log('Detalhes da gaveta para transações:', details);
      
      // Pegar as transações mais recentes
      const allTransactions = [...(details.transactions || []), ...(details.payments || [])];
      
      const sortedTransactions = allTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Formatar transações para a UI e calcular resumo
      let totalIncome = 0;
      let totalExpenses = 0;
      
      const formattedTransactions = sortedTransactions.map(tx => {
        // Verificar se é transação ou pagamento
        const isTransaction = 'type' in tx;
        const isPayment = 'total_amount' in tx;
        
        let type: string;
        let description: string;
        let amount: number;
        let category: string;
        
        if (isTransaction) {
          // É uma CashDrawerTransaction
          const transaction = tx as any;
          type = transaction.type;
          description = transaction.description || 'Transação';
          amount = Math.abs(parseFloat(transaction.amount) || 0);
          category = transaction.category || 'Geral';
        } else if (isPayment) {
          // É um CashDrawerPayment
          const payment = tx as any;
          type = 'income'; // Pagamentos são sempre receita
          description = `Pagamento - ${payment.client_name || 'Cliente'}`;
          amount = Math.abs(parseFloat(payment.total_amount) || 0);
          category = payment.payment_methods?.[0]?.method || 'Pagamento';
          // Adicionar command_id se disponível
          (tx as any).command_id = payment.command_id;
        } else {
          // Fallback
          type = 'expense';
          description = 'Transação';
          amount = 0;
          category = 'Geral';
        }
        
        // Somar para o resumo
        if (type === 'income') {
          totalIncome += amount;
        } else {
          totalExpenses += amount;
        }
        
        return {
          id: tx.id,
          cash_drawer_id: currentDrawer.id!,
          type: type as 'income' | 'expense' | 'cash_out',
          description,
          amount: amount.toString(),
          created_at: tx.created_at,
          category
        };
      });
      
      // Calcular saldo atual - usar o valor inicial dos detalhes da gaveta
      const initialValue = parseFloat(details.value_inicial || currentDrawer.value_inicial || '0');
      const currentBalance = initialValue + totalIncome - totalExpenses;
      
      // Atualizar resumo da gaveta
      setBalance({
        balance: currentBalance,
        total_income: totalIncome,
        total_expense: totalExpenses,
        total_cash_out: 0,
        date_open: currentDrawer.date_open,
        date_close: currentDrawer.date_close,
        opener_name: currentDrawer.opener_name || '',
        closer_name: currentDrawer.closer_name || ''
      });
      
      setTransactions(formattedTransactions);
    } catch (error: any) {
      console.error('Erro ao buscar transações recentes:', error);
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Função para buscar detalhes da gaveta
  const fetchDrawerDetails = async (drawerId: number) => {
    try {
      if (!user?.company_id) return;
      
      setLoadingDrawerDetails(true);
      
      const response = await api.get(`/cash-drawers/${drawerId}/details`, {
        headers: {
          'company_id': user.company_id,
          'user_id': user.id
        }
      });
      
      setDrawerDetails(response.data);
      setDrawerDetailsDialog(true);
      
    } catch (error) {
      console.error('Erro ao buscar detalhes da gaveta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes da gaveta",
        variant: "destructive"
      });
    } finally {
      setLoadingDrawerDetails(false);
    }
  };

  // Service para comandas baseado no Link-Front
  const commandService = {
    getHeaders(companyId: number) {
      return {
        'company_id': companyId.toString()
      };
    },

    // Buscar detalhes de uma comanda específica
    async getCommandDetails(companyId: number, commandId: number): Promise<CommandDetails> {
      const response = await api.get(`/commands/${commandId}`, {
        headers: this.getHeaders(companyId)
      });
      return response.data;
    }
  };

  // Função para buscar detalhes da comanda quando hover no pagamento (baseado no Link-Front)
  const handlePaymentHover = async (paymentId: number, commandId: number) => {
    if (!user?.company_id) return;
    
    try {
      setHoveredPayment(paymentId);
      const details = await commandService.getCommandDetails(user.company_id, commandId);
      setCommandDetails(details);
    } catch (error) {
      console.error('Erro ao buscar detalhes da comanda:', error);
      setCommandDetails(null);
    }
  };

  // Função para limpar hover
  const handlePaymentLeave = () => {
    setHoveredPayment(null);
    setCommandDetails(null);
  };

  // Função para abrir dialog de detalhes da gaveta
  const openDrawerDetails = async (drawer: CashDrawer) => {
    if (!user?.company_id || !drawer.id) return;
    
    try {
      setIsLoadingDetails(true);
      const details = await cashDrawerService.getCashDrawer(user.company_id, drawer.id);
      setSelectedDrawerForDetails(details);
      setDrawerDetailsOpen(true);
      setPaymentTypeFilter('all'); // Reset filter
    } catch (error) {
      console.error('Erro ao buscar detalhes da gaveta:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar detalhes da gaveta",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Função para filtrar pagamentos por tipo
  const getFilteredPayments = () => {
    if (!selectedDrawerForDetails?.payments || !Array.isArray(selectedDrawerForDetails.payments)) {
      return [];
    }
    
    if (paymentTypeFilter === 'all') {
      return selectedDrawerForDetails.payments;
    }
    
    return selectedDrawerForDetails.payments.filter(payment => {
      if (!payment.payment_methods || !Array.isArray(payment.payment_methods)) {
        return false;
      }
      return payment.payment_methods.some(method => 
        method && method.method === paymentTypeFilter
      );
    });
  };

  // Função para calcular totais por tipo de pagamento
  const getPaymentTypeTotals = () => {
    if (!selectedDrawerForDetails?.payments) {
      return {
        cash: 0,
        pix: 0,
        credit: 0,
        debit: 0
      };
    }
    
    const totals = {
      cash: 0,
      pix: 0,
      credit: 0,
      debit: 0
    };
    
    selectedDrawerForDetails.payments.forEach(payment => {
      if (payment.payment_methods && Array.isArray(payment.payment_methods)) {
        payment.payment_methods.forEach(method => {
          if (method && method.method && typeof method.amount === 'number') {
            if (totals.hasOwnProperty(method.method)) {
              totals[method.method] += method.amount;
            }
          }
        });
      }
    });
    
    return totals;
  };

  // Função para abrir gaveta de caixa usando cashDrawerService
  const openCashDrawer = async () => {
    if (!user?.company_id || !openValue) return;
    
    try {
      setLoading(true);
      const drawerData: CreateCashDrawerData = {
        opened_by_id: parseInt(user.id),
        value_inicial: parseFloat(openValue)
      };
      
      await cashDrawerService.createCashDrawer(user.company_id, drawerData);
      
      toast({
        title: "Sucesso",
        description: "Gaveta de caixa aberta com sucesso!"
      });
      
      setOpenDrawerDialog(false);
      setOpenValue('');
      await fetchCurrentDrawer();
    } catch (error: any) {
      console.error('Erro ao abrir gaveta:', error);
      toast({
        title: "Erro",
        description: "Erro ao abrir gaveta de caixa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para fechar gaveta de caixa usando cashDrawerService
  const closeCashDrawer = async () => {
    if (!currentDrawer || !user?.company_id || !closeValue) return;
    
    try {
      setLoading(true);
      const closeData: CloseCashDrawerData = {
        closed_by_id: parseInt(user.id),
        value_final: parseFloat(closeValue)
      };
      
      await cashDrawerService.closeCashDrawer(user.company_id, currentDrawer.id, closeData);
      
      toast({
        title: "Sucesso",
        description: "Gaveta de caixa fechada com sucesso!"
      });
      
      setCloseDrawerDialog(false);
      setCloseValue('');
      setCurrentDrawer(null);
      setTransactions([]);
      setBalance({
        balance: 0,
        total_income: 0,
        total_expense: 0,
        total_cash_out: 0,
        date_open: '',
        date_close: undefined,
        opener_name: '',
        closer_name: ''
      });
    } catch (error: any) {
      console.error('Erro ao fechar gaveta:', error);
      toast({
        title: "Erro",
        description: "Erro ao fechar gaveta de caixa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para exportar relatório em PDF
  const exportToPDF = async (period: { start: Date; end: Date }) => {
    try {
      if (!user?.company_id) return;
      
      setLoading(true);
      
      const startDate = period.start.toISOString().split('T')[0];
      const endDate = period.end.toISOString().split('T')[0];
      
      const response = await api.get(`/reports/financial-pdf?start_date=${startDate}&end_date=${endDate}`, {
        headers: {
          'company_id': user.company_id,
          'user_id': user.id
        },
        responseType: 'blob'
      });
      
      // Criar URL do blob e fazer download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-financeiro-${startDate}-${endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso"
      });
      
    } catch (error: any) {
      console.error('Erro ao exportar relatório:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao exportar relatório",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar relatório de vendas
  const generateSalesReport = async (period: { start: Date; end: Date }) => {
    try {
      if (!user?.company_id) return;
      
      setLoading(true);
      
      const startDate = period.start.toISOString().split('T')[0];
      const endDate = period.end.toISOString().split('T')[0];
      
      const response = await api.get(`/reports/sales?start_date=${startDate}&end_date=${endDate}`, {
        headers: {
          'company_id': user.company_id,
          'user_id': user.id
        }
      });
      
      console.log('Relatório de vendas:', response.data);
      
      return response.data;
      
    } catch (error: any) {
      console.error('Erro ao gerar relatório de vendas:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao gerar relatório de vendas",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const calculateBalance = () => {
    if (!currentDrawer || !transactions.length) return;
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const cashOut = transactions
      .filter(t => t.type === 'cash_out')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const initialValue = parseFloat(currentDrawer.value_inicial || '0');
    const currentBalance = initialValue + income - expenses - cashOut;
    
    setBalance({
      balance: currentBalance,
      total_income: income,
      total_expense: expenses,
      total_cash_out: cashOut,
      date_open: currentDrawer.date_open,
      date_close: currentDrawer.date_close,
      opener_name: currentDrawer.opener_name || '',
      closer_name: currentDrawer.closer_name || ''
    });
  };

  // Função para criar transação usando financialTransactionsService
  const createTransaction = async () => {
    if (!currentDrawer || !user?.company_id || !transactionForm.category || !transactionForm.amount) return;
    
    try {
      setLoading(true);
      
      // Mapear tipos para o formato esperado pelo backend
      const typeMapping: { [key: string]: 'income' | 'expense' | 'cash_out' } = {
        'entrada': 'income',
        'saida': 'expense', 
        'sangria': 'cash_out'
      };
      
      const transactionData: CreateTransactionData = {
        cash_drawer_id: currentDrawer.id,
        type: typeMapping[transactionForm.type],
        category: transactionForm.category,
        amount: parseFloat(transactionForm.amount),
        description: transactionForm.description
      };
      
      const result = await financialTransactionsService.createTransaction(user.company_id, transactionData);
      
      console.log('Transação criada:', result);
      
      toast({
        title: "Sucesso",
        description: "Transação registrada com sucesso!"
      });
      
      setTransactionDialog(false);
      setTransactionForm({
        type: 'entrada',
        category: '',
        amount: '',
        description: ''
      });
      
      // Atualizar transações
      if (currentDrawer) {
        await fetchTransactions();
      }
    } catch (error: any) {
      console.error('Erro ao criar transação:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao registrar transação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  

  // Função de status removida

  // Effects
  useEffect(() => {
    if (user?.company_id) {
      fetchCurrentDrawer();
      // Funções de inicialização removidas
    }
  }, [user?.company_id]);

  
  useEffect(() => {
    if (currentDrawer) {
      fetchTransactions();
    }
  }, [currentDrawer]);
  
  useEffect(() => {
    calculateBalance();
  }, [transactions, currentDrawer]);

  // useEffect de comandas removido
  
  // Formatação
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case 'expense':
        return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case 'cash_out':
        return <Minus className="h-4 w-4 text-orange-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };
  
  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600';
      case 'expense':
        return 'text-red-600';
      case 'cash_out':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#236F5D] to-[#2d8a6b] text-white shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-bold text-2xl tracking-wide flex items-center gap-2">
                  <Wallet className="h-6 w-6" />
                  Finanças
                </h1>
                <p className="text-emerald-100 text-sm mt-1">
                  Gerencie gavetas e transações
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                onClick={async () => {
                  fetchCurrentDrawer();
                  if (currentDrawer) {
                    await fetchTransactions();
                  }
                }}
                disabled={loading}
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              {currentDrawer && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                  onClick={() => setTransactionDialog(true)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Status da Gaveta */}
        {!currentDrawer ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#236F5D] to-[#2d8a6b] rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Nenhuma gaveta de caixa aberta
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Abra uma gaveta de caixa para começar a registrar transações financeiras
              </p>
              <Button 
                onClick={() => setOpenDrawerDialog(true)}
                className="bg-gradient-to-r from-[#236F5D] to-[#2d8a6b] hover:from-[#1e5d4f] hover:to-[#236F5D] text-white px-8 py-3 rounded-xl font-semibold shadow-lg"
              >
                <LockOpen className="h-5 w-5 mr-2" />
                Abrir Gaveta
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Card Principal de Saldo */}
            <div className="bg-gradient-to-br from-[#236F5D] to-[#2d8a6b] rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <span className="text-white/80 text-sm font-medium">Saldo Atual</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/60 text-xs">Ativo</span>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-3xl font-bold mb-1">
                  {formatCurrency(balance.balance)}
                </p>
                <p className="text-white/70 text-sm">
                  Gaveta #{currentDrawer.id} • Aberta às {formatDate(currentDrawer.opened_at).split(' ')[1]}
                </p>
              </div>
              
              {/* Mini Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-white/60 text-xs mb-1">Entradas</p>
                  <p className="text-white font-bold text-sm">{formatCurrency(balance.total_income)}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/60 text-xs mb-1">Saídas</p>
                  <p className="text-white font-bold text-sm">{formatCurrency(balance.total_expense)}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/60 text-xs mb-1">Sangrias</p>
                  <p className="text-white font-bold text-sm">{formatCurrency(balance.total_cash_out)}</p>
                </div>
              </div>
            </div>

            {/* Cards de Estatísticas Detalhadas */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <ArrowDownCircle className="h-6 w-6 text-white/70" />
                  </div>
                  <p className="text-white/80 text-xs font-medium mb-1">ENTRADAS</p>
                  <p className="text-white text-xl font-bold">
                    {formatCurrency(balance.total_income)}
                  </p>
                </div>
              </Card>
              
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-white" />
                    </div>
                    <ArrowUpCircle className="h-6 w-6 text-white/70" />
                  </div>
                  <p className="text-white/80 text-xs font-medium mb-1">SAÍDAS</p>
                  <p className="text-white text-xl font-bold">
                    {formatCurrency(balance.total_expense)}
                  </p>
                </div>
              </Card>
              
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Minus className="h-5 w-5 text-white" />
                    </div>
                    <Wallet className="h-6 w-6 text-white/70" />
                  </div>
                  <p className="text-white/80 text-xs font-medium mb-1">SANGRIAS</p>
                  <p className="text-white text-xl font-bold">
                    {formatCurrency(balance.total_cash_out)}
                  </p>
                </div>
              </Card>
              
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-white" />
                    </div>
                    <Calendar className="h-6 w-6 text-white/70" />
                  </div>
                  <p className="text-white/80 text-xs font-medium mb-1">TRANSAÇÕES</p>
                  <p className="text-white text-xl font-bold">
                    {transactions.length}
                  </p>
                </div>
              </Card>
            </div>

            {/* Ações Rápidas */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => setTransactionDialog(true)}
                className="bg-gradient-to-r from-[#236F5D] to-[#2d8a6b] hover:from-[#1e5d4f] hover:to-[#236F5D] text-white py-4 rounded-xl font-semibold shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nova Transação
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCloseDrawerDialog(true)}
                className="border-2 border-red-200 text-red-600 hover:bg-red-50 py-4 rounded-xl font-semibold"
              >
                <Lock className="h-5 w-5 mr-2" />
                Fechar Gaveta
              </Button>
            </div>

            {/* Lista de Transações */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#236F5D] to-[#2d8a6b] rounded-lg flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-white" />
                    </div>
                    Transações Recentes
                  </CardTitle>
                  {currentDrawer && (
                    <Button 
                      onClick={() => openDrawerDetails(currentDrawer)}
                      variant="outline"
                      size="sm"
                      className="border-2 border-[#236F5D] text-[#236F5D] hover:bg-[#236F5D] hover:text-white font-semibold"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {transactions.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Receipt className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium mb-2">Nenhuma transação registrada</p>
                    <p className="text-gray-400 text-sm">Adicione sua primeira transação para começar</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {transactions.map((transaction, index) => (
                      <div key={transaction.id} className="relative">
                        <div 
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${index !== transactions.length - 1 ? 'border-b border-gray-100' : ''}`}
                          onMouseEnter={() => {
                            // Se for um pagamento de comanda, buscar detalhes
                            if (transaction.type === 'income' && transaction.description.includes('Pagamento') && transaction.command_id) {
                              handlePaymentHover(transaction.id, transaction.command_id);
                            }
                          }}
                          onMouseLeave={handlePaymentLeave}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                transaction.type === 'income' ? 'bg-green-100' :
                                transaction.type === 'expense' ? 'bg-red-100' : 'bg-orange-100'
                              }`}>
                                {getTransactionIcon(transaction.type)}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 mb-1">
                                  {translatePaymentMethod(transaction.category)}
                                </p>
                                <p className="text-sm text-gray-600 mb-1">
                                  {transaction.description}
                                  {transaction.command_id && (
                                    <span className="text-blue-600 ml-1">
                                      • Comanda #{transaction.command_id}
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-gray-400">
                                    {formatDate(transaction.created_at)}
                                  </p>
                                  <span className="text-gray-300">•</span>
                                  <p className="text-xs text-gray-400">
                                    {transaction.user?.name}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold text-lg mb-1 ${getTransactionColor(transaction.type)}`}>
                                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(transaction.amount))}
                              </p>
                              <Badge 
                                variant="outline" 
                                className={`text-xs font-medium ${
                                  transaction.type === 'income' ? 'border-green-200 text-green-700 bg-green-50' :
                                  transaction.type === 'expense' ? 'border-red-200 text-red-700 bg-red-50' :
                                  'border-orange-200 text-orange-700 bg-orange-50'
                                }`}
                              >
                                {transaction.type === 'income' ? 'Entrada' : 
                                 transaction.type === 'expense' ? 'Saída' : 'Sangria'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {/* Tooltip com detalhes da comanda (baseado no Link-Front) */}
                        {hoveredPayment === transaction.id && commandDetails && (
                          <div className="absolute z-50 left-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                            <div className="space-y-3">
                              <div className="border-b pb-2">
                                <h5 className="font-semibold text-sm flex items-center gap-2">
                                  <Receipt className="h-4 w-4" />
                                  Detalhes da Comanda #{commandDetails.id}
                                </h5>
                                <p className="text-xs text-gray-500 mt-1">
                                  Cliente: {commandDetails.client_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Data: {formatDate(commandDetails.created_at)}
                                </p>
                              </div>
                              
                              <div>
                                <h6 className="font-medium text-xs text-gray-700 mb-2">Itens:</h6>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {commandDetails.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center text-xs">
                                      <div className="flex-1">
                                        <span className="font-medium">{item.name}</span>
                                        <span className="text-gray-500 ml-1">x{item.quantity}</span>
                                      </div>
                                      <span className="font-medium">
                                        {formatCurrency(parseFloat(item.price) * item.quantity)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="border-t pt-2">
                                <div className="flex justify-between items-center font-semibold text-sm">
                                  <span>Total:</span>
                                  <span className="text-green-600">
                                    {formatCurrency(commandDetails.total)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Dialog - Abrir Gaveta */}
      <Dialog open={openDrawerDialog} onOpenChange={setOpenDrawerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#236F5D] to-[#2d8a6b] rounded-full flex items-center justify-center mx-auto mb-4">
              <LockOpen className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">Abrir Gaveta de Caixa</DialogTitle>
            <p className="text-sm text-gray-600 mt-2">Defina o valor inicial para começar o controle financeiro</p>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Valor Inicial</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={openValue}
                  onChange={(e) => setOpenValue(e.target.value)}
                  className="pl-10 py-3 text-lg font-semibold border-2 focus:border-[#236F5D] rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => setOpenDrawerDialog(false)}
                className="py-3 rounded-xl font-semibold border-2"
              >
                Cancelar
              </Button>
              <Button 
                onClick={openCashDrawer}
                disabled={loading || !openValue}
                className="py-3 rounded-xl font-semibold bg-gradient-to-r from-[#236F5D] to-[#2d8a6b] hover:from-[#1e5d4f] hover:to-[#236F5D] text-white shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Abrindo...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LockOpen className="h-4 w-4" />
                    Abrir Gaveta
                  </div>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - Fechar Gaveta */}
      <Dialog open={closeDrawerDialog} onOpenChange={setCloseDrawerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">Fechar Gaveta de Caixa</DialogTitle>
            <p className="text-sm text-gray-600 mt-2">Confirme o valor final para encerrar o controle</p>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#236F5D] to-[#2d8a6b] p-4 rounded-xl text-white">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-5 w-5" />
                <span className="text-white/80 text-sm font-medium">Saldo Calculado</span>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(balance.balance)}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Valor Final (contado)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={closeValue}
                  onChange={(e) => setCloseValue(e.target.value)}
                  className="pl-10 py-3 text-lg font-semibold border-2 focus:border-red-500 rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCloseDrawerDialog(false)}
                className="py-3 rounded-xl font-semibold border-2"
              >
                Cancelar
              </Button>
              <Button 
                onClick={closeCashDrawer}
                disabled={loading || !closeValue}
                className="py-3 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Fechando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Fechar Gaveta
                  </div>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - Nova Transação */}
      <Dialog open={transactionDialog} onOpenChange={setTransactionDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#236F5D] to-[#2d8a6b] rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">Nova Transação</DialogTitle>
            <p className="text-sm text-gray-600 mt-2">Registre uma nova movimentação financeira</p>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-2">
              {(['entrada', 'saida', 'sangria'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTransactionForm(prev => ({ ...prev, type, category: '' }))}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    transactionForm.type === type
                      ? type === 'entrada' 
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : type === 'saida'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    {type === 'entrada' ? (
                      <ArrowDownCircle className="h-5 w-5" />
                    ) : type === 'saida' ? (
                      <ArrowUpCircle className="h-5 w-5" />
                    ) : (
                      <Minus className="h-5 w-5" />
                    )}
                    <span className="text-xs font-medium capitalize">{type}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Categoria</label>
              <Select
                value={transactionForm.category}
                onValueChange={(value) => 
                  setTransactionForm(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className="py-3 border-2 rounded-xl">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_CATEGORIES[transactionForm.type].map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Valor</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={transactionForm.amount}
                  onChange={(e) => 
                    setTransactionForm(prev => ({ ...prev, amount: e.target.value }))
                  }
                  className="pl-10 py-3 text-lg font-semibold border-2 focus:border-[#236F5D] rounded-xl"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Descrição</label>
              <Textarea
                placeholder="Descrição da transação"
                value={transactionForm.description}
                onChange={(e) => 
                  setTransactionForm(prev => ({ ...prev, description: e.target.value }))
                }
                className="border-2 focus:border-[#236F5D] rounded-xl resize-none"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => setTransactionDialog(false)}
                className="py-3 rounded-xl font-semibold border-2"
              >
                Cancelar
              </Button>
              <Button 
                onClick={createTransaction}
                disabled={loading || !transactionForm.category || !transactionForm.amount}
                className="py-3 rounded-xl font-semibold bg-gradient-to-r from-[#236F5D] to-[#2d8a6b] hover:from-[#1e5d4f] hover:to-[#236F5D] text-white shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Salvar Transação
                  </div>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - Detalhes da Gaveta */}
      <Dialog open={drawerDetailsOpen} onOpenChange={setDrawerDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-white flex flex-col">
          <DialogHeader className="border-b pb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#236F5D] to-[#2d8a6b] rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Gaveta de {selectedDrawerForDetails?.date_open ? new Date(selectedDrawerForDetails.date_open).toLocaleDateString('pt-BR') : ''} às {selectedDrawerForDetails?.opened_at ? new Date(selectedDrawerForDetails.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </DialogTitle>
                  <p className="text-sm text-gray-600">
                    Visualização completa de todas as transações e pagamentos da gaveta.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4 min-h-0">
            {/* Informações Gerais */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Informações Gerais</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={selectedDrawerForDetails?.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {selectedDrawerForDetails?.status === 'open' ? 'Aberta' : 'Fechada'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aberta por:</span>
                    <span className="font-medium">{selectedDrawerForDetails?.opener_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data de abertura:</span>
                    <span className="font-medium">
                      {selectedDrawerForDetails?.opened_at ? new Date(selectedDrawerForDetails.opened_at).toLocaleDateString('pt-BR') + ' às ' + new Date(selectedDrawerForDetails.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Valores</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor inicial:</span>
                    <span className="font-medium text-green-600">
                      R$ {parseFloat(selectedDrawerForDetails?.value_inicial || '0').toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {selectedDrawerForDetails?.value_final && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor final:</span>
                      <span className="font-medium text-blue-600">
                        R$ {parseFloat(selectedDrawerForDetails.value_final).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Transações */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Transações ({selectedDrawerForDetails?.transactions?.length || 0})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedDrawerForDetails?.transactions?.map((transaction: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.type === 'income' ? 'bg-green-500' : 
                        transaction.type === 'expense' ? 'bg-red-500' : 'bg-orange-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-sm">{translatePaymentMethod(transaction.category)}</p>
                        <p className="text-xs text-gray-500">
                          {transaction.description} • {new Date(transaction.created_at).toLocaleDateString('pt-BR')} às {new Date(transaction.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}R$ {Math.abs(parseFloat(transaction.amount)).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtrar Pagamentos por Tipo */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtrar Pagamentos por Tipo
                </h3>
                {paymentTypeFilter !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPaymentTypeFilter('all')}
                    className="text-xs flex items-center gap-1"
                  >
                    <span>✕</span>
                    Limpar Filtro
                  </Button>
                )}
              </div>

              {/* Filtros de Tipo de Pagamento */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { key: 'cash', label: 'Dinheiro', icon: '💵', total: getPaymentTypeTotals().cash },
                  { key: 'pix', label: 'PIX', icon: '📱', total: getPaymentTypeTotals().pix },
                  { key: 'debit', label: 'Cartão Débito', icon: '💳', total: getPaymentTypeTotals().debit },
                  { key: 'credit', label: 'Cartão Crédito', icon: '💳', total: getPaymentTypeTotals().credit }
                ].map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setPaymentTypeFilter(paymentTypeFilter === type.key ? 'all' : type.key)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      paymentTypeFilter === type.key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{type.icon}</div>
                    <div className="text-xs font-medium text-gray-700">{type.label}</div>
                    <div className="text-xs font-bold text-gray-900">
                      R$ {(type.total || 0).toFixed(2).replace('.', ',')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pagamentos Filtrados */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Pagamentos ({getFilteredPayments().length}) - {paymentTypeFilter === 'all' ? 'Todos os tipos' : 
                  paymentTypeFilter === 'cash' ? 'Dinheiro' :
                  paymentTypeFilter === 'pix' ? 'PIX' :
                  paymentTypeFilter === 'debit' ? 'Cartão Débito' : 'Cartão Crédito'}
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {getFilteredPayments().map((payment: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{payment.client_name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.paid_at).toLocaleDateString('pt-BR')} às {new Date(payment.paid_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="font-bold text-green-600">
                        R$ {parseFloat(payment.total_amount).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {payment.payment_methods?.map((method: any, methodIndex: number) => (
                        <Badge
                          key={methodIndex}
                          variant="outline"
                          className="text-xs"
                        >
                          {method.method === 'cash' ? '💵 Dinheiro' :
                           method.method === 'pix' ? '📱 PIX' :
                           method.method === 'debit' ? '💳 Débito' :
                           method.method === 'credit' ? '💳 Crédito' : method.method}: R$ {Number(method.amount || 0).toFixed(2).replace('.', ',')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {getFilteredPayments().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum pagamento encontrado para este filtro</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
