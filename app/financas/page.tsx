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
  Settings
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Finanças</h1>
              <p className="text-sm text-gray-500">
                {currentDrawer 
                  ? `Gaveta #${currentDrawer.id} - ${currentDrawer.status === 'open' ? 'Aberta' : 'Fechada'}` 
                  : 'Nenhuma gaveta ativa'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchCurrentDrawer();
                if (currentDrawer) {
                  fetchTransactions();
                }
              }}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Status da Gaveta */}
        {!currentDrawer ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma gaveta de caixa aberta
              </h3>
              <p className="text-gray-500 mb-4">
                Abra uma gaveta de caixa para começar a registrar transações
              </p>
              <Button onClick={() => setOpenDrawerDialog(true)}>
                <LockOpen className="h-4 w-4 mr-2" />
                Abrir Gaveta
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Saldo Atual</p>
                      <p className="text-2xl font-bold text-[#236F5D]">
                        {formatCurrency(balance.balance)}
                      </p>
                    </div>
                    <Wallet className="h-8 w-8 text-[#236F5D]" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Entradas</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(balance.total_income)}
                      </p>
                    </div>
                    <ArrowDownCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Saídas</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(balance.total_expense)}
                      </p>
                    </div>
                    <ArrowUpCircle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Sangrias</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(balance.total_cash_out)}
                      </p>
                    </div>
                    <Minus className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <Button 
                onClick={() => setTransactionDialog(true)}
                className="flex-1 bg-[#236F5D] hover:bg-[#1e5d4f]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCloseDrawerDialog(true)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Fechar Gaveta
              </Button>
            </div>

            {/* Lista de Transações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Transações Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {transactions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Nenhuma transação registrada
                  </div>
                ) : (
                  <div className="divide-y">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="font-medium text-gray-900">
                              {transaction.category}
                            </p>
                            <p className="text-sm text-gray-500">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(transaction.created_at)} • {transaction.user?.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'entrada' ? '+' : '-'}{formatCurrency(parseFloat(transaction.amount))}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </Badge>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Gaveta de Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Valor Inicial</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={openValue}
                onChange={(e) => setOpenValue(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setOpenDrawerDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={openCashDrawer}
                disabled={loading || !openValue}
                className="flex-1 bg-[#236F5D] hover:bg-[#1e5d4f]"
              >
                {loading ? 'Abrindo...' : 'Abrir Gaveta'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - Fechar Gaveta */}
      <Dialog open={closeDrawerDialog} onOpenChange={setCloseDrawerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Gaveta de Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Saldo calculado:</p>
              <p className="text-xl font-bold text-[#236F5D]">
                {formatCurrency(balance.balance)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Valor Final (contado)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={closeValue}
                onChange={(e) => setCloseValue(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCloseDrawerDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={closeCashDrawer}
                disabled={loading || !closeValue}
                variant="destructive"
                className="flex-1"
              >
                {loading ? 'Fechando...' : 'Fechar Gaveta'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - Nova Transação */}
      <Dialog open={transactionDialog} onOpenChange={setTransactionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={transactionForm.type}
                onValueChange={(value: 'entrada' | 'saida' | 'sangria') => 
                  setTransactionForm(prev => ({ ...prev, type: value, category: '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="sangria">Sangria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Categoria</label>
              <Select
                value={transactionForm.category}
                onValueChange={(value) => 
                  setTransactionForm(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
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
              <label className="text-sm font-medium">Valor</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={transactionForm.amount}
                onChange={(e) => 
                  setTransactionForm(prev => ({ ...prev, amount: e.target.value }))
                }
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Descrição da transação"
                value={transactionForm.description}
                onChange={(e) => 
                  setTransactionForm(prev => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setTransactionDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={createTransaction}
                disabled={loading || !transactionForm.category || !transactionForm.amount}
                className="flex-1 bg-[#236F5D] hover:bg-[#1e5d4f]"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
