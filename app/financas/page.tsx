"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { useToast } from "@/hooks/use-toast";

// Interfaces
interface CashDrawer {
  id: number;
  company_id: number;
  opened_by_id: number;
  closed_by_id?: number;
  value_inicial: string;
  value_final?: string;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  user?: {
    id: number;
    name: string;
  };
}

interface Transaction {
  id: number;
  cash_drawer_id: number;
  type: 'entrada' | 'saida' | 'sangria';
  category: string;
  amount: string;
  description: string;
  created_at: string;
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

// Categorias de transações
const TRANSACTION_CATEGORIES = {
  entrada: [
    'Venda de Serviços',
    'Produtos',
    'Gorjetas',
    'Outros Recebimentos'
  ],
  saida: [
    'Fornecedores',
    'Salários',
    'Aluguel',
    'Energia',
    'Internet',
    'Marketing',
    'Manutenção',
    'Outros Gastos'
  ],
  sangria: [
    'Retirada do Caixa',
    'Troco',
    'Despesas Urgentes'
  ]
};

export default function FinancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estados principais
  const [currentDrawer, setCurrentDrawer] = useState<CashDrawer | null>(null);
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
  
  // Estados de formulários
  const [openValue, setOpenValue] = useState('');
  const [closeValue, setCloseValue] = useState('');
  const [transactionForm, setTransactionForm] = useState({
    type: 'entrada' as 'entrada' | 'saida' | 'sangria',
    category: '',
    amount: '',
    description: ''
  });
  
  // Funções da API (simuladas)
  const fetchCurrentDrawer = async () => {
    try {
      setLoading(true);
      // Simular API call
      // const response = await api.get('/cash-drawers/current');
      // setCurrentDrawer(response.data);
      
      // Dados simulados
      const mockDrawer: CashDrawer = {
        id: 1,
        company_id: 1,
        opened_by_id: user?.id || 1,
        value_inicial: '100.00',
        status: 'open',
        opened_at: new Date().toISOString(),
        user: {
          id: user?.id || 1,
          name: user?.name || 'Usuário'
        }
      };
      setCurrentDrawer(mockDrawer);
    } catch (error) {
      console.error('Erro ao buscar gaveta atual:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar gaveta de caixa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTransactions = async () => {
    if (!currentDrawer) return;
    
    try {
      setLoading(true);
      // Simular API call
      // const response = await api.get(`/transactions?cash_drawer_id=${currentDrawer.id}`);
      // setTransactions(response.data);
      
      // Dados simulados
      const mockTransactions: Transaction[] = [
        {
          id: 1,
          cash_drawer_id: currentDrawer.id,
          type: 'entrada',
          category: 'Venda de Serviços',
          amount: '50.00',
          description: 'Corte de cabelo',
          created_at: new Date().toISOString(),
          user: { id: 1, name: 'João' }
        },
        {
          id: 2,
          cash_drawer_id: currentDrawer.id,
          type: 'saida',
          category: 'Fornecedores',
          amount: '20.00',
          description: 'Compra de produtos',
          created_at: new Date().toISOString(),
          user: { id: 1, name: 'João' }
        }
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateBalance = () => {
    if (!currentDrawer || !transactions.length) return;
    
    const income = transactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const expense = transactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const cashOut = transactions
      .filter(t => t.type === 'sangria')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const initialValue = parseFloat(currentDrawer.value_inicial);
    const finalBalance = initialValue + income - expense - cashOut;
    
    setBalance({
      balance: finalBalance,
      total_income: income,
      total_expense: expense,
      total_cash_out: cashOut,
      date_open: currentDrawer.opened_at,
      date_close: currentDrawer.closed_at,
      opener_name: currentDrawer.user?.name || '',
      closer_name: ''
    });
  };
  
  const openCashDrawer = async () => {
    try {
      setLoading(true);
      // Simular API call
      // await api.post('/cash-drawers', { value_inicial: openValue });
      
      toast({
        title: "Sucesso",
        description: "Gaveta de caixa aberta com sucesso!"
      });
      
      setOpenDrawerDialog(false);
      setOpenValue('');
      await fetchCurrentDrawer();
    } catch (error) {
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
  
  const closeCashDrawer = async () => {
    if (!currentDrawer) return;
    
    try {
      setLoading(true);
      // Simular API call
      // await api.put(`/cash-drawers/${currentDrawer.id}/close`, { value_final: closeValue });
      
      toast({
        title: "Sucesso",
        description: "Gaveta de caixa fechada com sucesso!"
      });
      
      setCloseDrawerDialog(false);
      setCloseValue('');
      setCurrentDrawer(null);
      setTransactions([]);
    } catch (error) {
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
  
  const createTransaction = async () => {
    if (!currentDrawer) return;
    
    try {
      setLoading(true);
      // Simular API call
      // await api.post('/transactions', {
      //   cash_drawer_id: currentDrawer.id,
      //   ...transactionForm
      // });
      
      const newTransaction: Transaction = {
        id: Date.now(),
        cash_drawer_id: currentDrawer.id,
        ...transactionForm,
        created_at: new Date().toISOString(),
        user: { id: user?.id || 1, name: user?.name || 'Usuário' }
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      
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
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar transação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Effects
  useEffect(() => {
    fetchCurrentDrawer();
  }, []);
  
  useEffect(() => {
    if (currentDrawer) {
      fetchTransactions();
    }
  }, [currentDrawer]);
  
  useEffect(() => {
    calculateBalance();
  }, [transactions, currentDrawer]);
  
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
      minute: '2-digit'
    });
  };
  
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'entrada':
        return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case 'saida':
        return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case 'sangria':
        return <Minus className="h-4 w-4 text-orange-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };
  
  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'entrada':
        return 'text-green-600';
      case 'saida':
        return 'text-red-600';
      case 'sangria':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com Gradiente */}
      <div className="relative">
        <div className="bg-gradient-to-br from-[#236F5D] to-[#2d8a6b] px-4 pt-12 pb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-white" />
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                fetchCurrentDrawer();
                if (currentDrawer) {
                  fetchTransactions();
                }
              }}
              disabled={loading}
              className="text-white hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {/* Profile Section */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">Finanças</h1>
              <p className="text-white/80 text-sm">
                {new Date().toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
              <p className="text-white/70 text-xs mt-1">
                {currentDrawer 
                  ? `Gaveta #${currentDrawer.id} - ${currentDrawer.status === 'open' ? '🟢 Aberta' : '🔴 Fechada'}` 
                  : '⚪ Nenhuma gaveta ativa'
                }
              </p>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 opacity-10">
          <Wallet className="h-24 w-24 text-white" />
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-6">
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
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#236F5D] to-[#2d8a6b] rounded-lg flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-white" />
                  </div>
                  Transações Recentes
                </CardTitle>
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
                      <div key={transaction.id} className={`p-4 hover:bg-gray-50 transition-colors ${index !== transactions.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              transaction.type === 'entrada' ? 'bg-green-100' :
                              transaction.type === 'saida' ? 'bg-red-100' : 'bg-orange-100'
                            }`}>
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 mb-1">
                                {transaction.category}
                              </p>
                              <p className="text-sm text-gray-600 mb-1">
                                {transaction.description}
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
                              {transaction.type === 'entrada' ? '+' : '-'}{formatCurrency(parseFloat(transaction.amount))}
                            </p>
                            <Badge 
                              variant="outline" 
                              className={`text-xs font-medium ${
                                transaction.type === 'entrada' ? 'border-green-200 text-green-700 bg-green-50' :
                                transaction.type === 'saida' ? 'border-red-200 text-red-700 bg-red-50' :
                                'border-orange-200 text-orange-700 bg-orange-50'
                              }`}
                            >
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            </Badge>
                          </div>
                        </div>
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
    </div>
  );
}
