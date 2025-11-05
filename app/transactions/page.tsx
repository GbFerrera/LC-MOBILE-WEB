"use client"

import * as React from "react"
import { useAuth } from "@/hooks/auth"
import { api } from "@/services/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    ChevronLeftIcon,
    AlertCircle,
    Calendar,
    TrendingDown,
    TrendingUp,
    Clock,
    Plus,
    Edit,
    Trash2,
    Eye,
    X,
    Bell,
    BellOff
} from "lucide-react"
import Link from "next/link"

// Interface para despesas fixas
interface FixedExpense {
    id: number;
    name: string;
    description: string | null;
    amount: number;
    due_date: string;
    is_active: boolean;
    receive_notifications: boolean;
    notification_days_before: number;
    recurrence: 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual';
    category: 'rent' | 'utilities' | 'salaries' | 'taxes' | 'insurance' | 'subscriptions' | 'maintenance' | 'other';
    company_id: number;
    created_at: string;
    updated_at: string;
}

export default function Transactions() {
    const { user } = useAuth()
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [isLoadingFixedExpenses, setIsLoadingFixedExpenses] = React.useState(false)
    const [editingExpenseId, setEditingExpenseId] = React.useState<number | null>(null)
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false)
    const [selectedExpenseForDetails, setSelectedExpenseForDetails] = React.useState<FixedExpense | null>(null)
    const [selectedFilter, setSelectedFilter] = React.useState<string>('all')
    const [fixedExpenses, setFixedExpenses] = React.useState<FixedExpense[]>([])
    const [reloadKeyword, setReloadKeyword] = React.useState(0)

    // Estados do formulário
    const [name, setName] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [amount, setAmount] = React.useState("")
    const [dueDate, setDueDate] = React.useState("")
    const [isActive, setIsActive] = React.useState(true)
    const [receiveNotifications, setReceiveNotifications] = React.useState(true)
    const [notificationDaysBefore, setNotificationDaysBefore] = React.useState("3")
    const [recurrence, setRecurrence] = React.useState<string>("monthly")
    const [category, setCategory] = React.useState<string>("other")

    // Funções auxiliares
    const getCategoryLabel = (category: string): string => {
        const categories: Record<string, string> = {
            rent: 'Aluguel',
            utilities: 'Utilidades',
            salaries: 'Salários',
            taxes: 'Impostos',
            insurance: 'Seguros',
            subscriptions: 'Assinaturas',
            maintenance: 'Manutenção',
            other: 'Outros'
        };
        return categories[category] || 'Outros';
    };

    const getRecurrenceLabel = (recurrence: string): string => {
        const recurrences: Record<string, string> = {
            monthly: 'Mensal',
            bimonthly: 'Bimestral',
            quarterly: 'Trimestral',
            semiannual: 'Semestral',
            annual: 'Anual'
        };
        return recurrences[recurrence] || 'Mensal';
    };

    // Fetch de despesas fixas
    React.useEffect(() => {
        const fetchFixedExpenses = async () => {
            try {
                setIsLoadingFixedExpenses(true);
                const response = await api.get('/fixed-expenses', {
                    headers: { 'company_id': user?.company_id }
                });
                setFixedExpenses(response.data);
            } catch (error) {
                console.error('Erro ao buscar despesas fixas:', error);
                toast.error("Não foi possível carregar as despesas fixas");
            } finally {
                setIsLoadingFixedExpenses(false);
            }
        };

        if (user?.company_id) {
            fetchFixedExpenses();
        }
    }, [reloadKeyword, user?.company_id]);

    // Função para criar ou atualizar despesa fixa
    const handleCreateFixedExpense = async () => {
        try {
            setIsLoading(true);

            // Validação básica
            if (!name || !amount || !dueDate) {
                toast.error("Preencha todos os campos obrigatórios");
                return;
            }

            const expenseData = {
                name,
                description,
                amount,
                due_date: dueDate,
                is_active: isActive,
                receive_notifications: receiveNotifications,
                notification_days_before: notificationDaysBefore,
                recurrence,
                category
            };

            let response;

            // Se tiver um ID, é uma edição
            if (editingExpenseId) {
                response = await api.put(`/fixed-expenses/${editingExpenseId}`, expenseData, {
                    headers: { 'company_id': user?.company_id }
                });

                if (response.status === 200) {
                    toast.success("Despesa fixa atualizada com sucesso");
                }
            } else {
                // Caso contrário, é uma criação
                response = await api.post('/fixed-expenses', expenseData, {
                    headers: { 'company_id': user?.company_id }
                });

                if (response.status === 201) {
                    toast.success("Despesa fixa criada com sucesso");
                }
            }

            // Limpar formulário
            setName('');
            setDescription('');
            setAmount('');
            setDueDate('');
            setIsActive(true);
            setReceiveNotifications(true);
            setNotificationDaysBefore('3');
            setRecurrence('monthly');
            setCategory('other');
            setEditingExpenseId(null);

            // Fechar drawer e recarregar dados
            setIsDialogOpen(false);
            setReloadKeyword(prev => prev + 1);
        } catch (error) {
            console.error(error);
            toast.error("Ocorreu um erro ao processar a despesa fixa");
        } finally {
            setIsLoading(false);
        }
    };

    // Função para ativar/desativar despesa fixa
    const handleToggleFixedExpenseStatus = async (id: number, newStatus: boolean) => {
        try {
            setIsLoading(true);
            await api.patch(`/fixed-expenses/${id}/toggle-status`, {
                is_active: newStatus
            }, {
                headers: { 'company_id': user?.company_id }
            });

            toast.success(`Despesa ${newStatus ? 'ativada' : 'desativada'} com sucesso`);

            // Recarregar dados
            setReloadKeyword(prev => prev + 1);
        } catch (error) {
            console.error(error);
            toast.error("Ocorreu um erro ao alterar o status da despesa");
        } finally {
            setIsLoading(false);
        }
    };

    // Função para excluir despesa fixa
    const handleDeleteFixedExpense = async (id: number) => {
        try {
            setIsLoading(true);
            await api.delete(`/fixed-expenses/${id}`, {
                headers: { 'company_id': user?.company_id }
            });

            toast.success("Despesa excluída com sucesso");

            // Recarregar dados
            setReloadKeyword(prev => prev + 1);
        } catch (error) {
            console.error(error);
            toast.error("Ocorreu um erro ao excluir a despesa");
        } finally {
            setIsLoading(false);
        }
    };

    // Função para editar despesa fixa
    const handleEditFixedExpense = (expense: FixedExpense) => {
        // Preencher formulário com dados da despesa
        setName(expense.name);
        setDescription(expense.description || '');
        setAmount(expense.amount.toString());
        setDueDate(expense.due_date);
        setIsActive(expense.is_active);
        setReceiveNotifications(expense.receive_notifications);
        setNotificationDaysBefore(expense.notification_days_before.toString());
        setRecurrence(expense.recurrence);
        setCategory(expense.category);

        // Definir ID da despesa que está sendo editada
        setEditingExpenseId(expense.id);

        // Abrir drawer
        setIsDialogOpen(true);
    };

    // Função para abrir detalhes da despesa
    const handleViewExpenseDetails = (expense: FixedExpense) => {
        setSelectedExpenseForDetails(expense);
        setIsDetailsDialogOpen(true);
    };

    // Função para calcular estatísticas das despesas
    const getExpenseStats = () => {
        const totalExpenses = fixedExpenses.length;
        const activeExpenses = fixedExpenses.filter(expense => expense.is_active).length;
        const inactiveExpenses = fixedExpenses.filter(expense => !expense.is_active).length;
        const totalAmount = fixedExpenses
            .filter(expense => expense.is_active)
            .reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);

        const today = new Date();
        const upcomingExpenses = fixedExpenses.filter(expense => {
            if (!expense.is_active) return false;
            const dueDate = new Date(expense.due_date);
            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilDue >= 0 && daysUntilDue <= 7;
        }).length;

        const overdueExpenses = fixedExpenses.filter(expense => {
            if (!expense.is_active) return false;
            const dueDate = new Date(expense.due_date);
            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilDue < 0;
        }).length;

        return {
            totalExpenses,
            activeExpenses,
            inactiveExpenses,
            totalAmount,
            upcomingExpenses,
            overdueExpenses
        };
    };

    const stats = getExpenseStats();

    // Função para filtrar despesas
    const getFilteredExpenses = () => {
        const today = new Date();

        switch (selectedFilter) {
            case 'active':
                return fixedExpenses.filter(expense => expense.is_active);
            case 'inactive':
                return fixedExpenses.filter(expense => !expense.is_active);
            case 'upcoming':
                return fixedExpenses.filter(expense => {
                    if (!expense.is_active) return false;
                    const dueDate = new Date(expense.due_date);
                    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return daysUntilDue >= 0 && daysUntilDue <= 7;
                });
            case 'overdue':
                return fixedExpenses.filter(expense => {
                    if (!expense.is_active) return false;
                    const dueDate = new Date(expense.due_date);
                    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return daysUntilDue < 0;
                });
            default:
                return fixedExpenses;
        }
    };

    const filteredExpenses = getFilteredExpenses();

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <div className="px-4 py-6 sm:px-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                                <ChevronLeftIcon className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold">Despesas Fixas</h1>
                            <p className="text-emerald-100 text-sm">Gerencie suas despesas recorrentes</p>
                        </div>
                    </div>

                    <Button
                        onClick={() => {
                            setEditingExpenseId(null);
                            setName('');
                            setDescription('');
                            setAmount('');
                            setDueDate('');
                            setIsActive(true);
                            setReceiveNotifications(true);
                            setNotificationDaysBefore('3');
                            setRecurrence('monthly');
                            setCategory('other');
                            setIsDialogOpen(true);
                        }}
                        className="w-full sm:w-auto bg-white text-emerald-600 hover:bg-emerald-50"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Despesa
                    </Button>
                </div>
            </div>

            <div className="px-4 py-6 sm:px-6 space-y-6">
                {/* Cards de Estatísticas */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Resumo de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <TrendingDown className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Total Mensal</p>
                                        <p className="text-base sm:text-lg font-bold text-gray-900">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalAmount)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Ativas</p>
                                        <p className="text-base sm:text-lg font-bold text-gray-900">{stats.activeExpenses}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-100 rounded-lg">
                                        <Clock className="h-5 w-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Vencimentos</p>
                                        <p className="text-base sm:text-lg font-bold text-gray-900">{stats.upcomingExpenses}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Em Atraso</p>
                                        <p className="text-base sm:text-lg font-bold text-gray-900">{stats.overdueExpenses}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Alertas */}
                {(stats.overdueExpenses > 0 || stats.upcomingExpenses > 0) && (
                    <Card className="bg-white shadow-sm border-l-4 border-yellow-500">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                <div className="space-y-1">
                                    {stats.overdueExpenses > 0 && (
                                        <p className="text-sm text-red-600 font-medium">
                                            {stats.overdueExpenses} despesa{stats.overdueExpenses > 1 ? 's' : ''} em atraso
                                        </p>
                                    )}
                                    {stats.upcomingExpenses > 0 && (
                                        <p className="text-sm text-yellow-600 font-medium">
                                            {stats.upcomingExpenses} vencimento{stats.upcomingExpenses > 1 ? 's' : ''} próximo{stats.upcomingExpenses > 1 ? 's' : ''} (7 dias)
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}



                {/* Próximos Vencimentos */}
                <Card className="bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-emerald-600" />
                            Próximos Vencimentos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-2">
                            {fixedExpenses
                                .filter(expense => {
                                    if (!expense.is_active) return false;
                                    const dueDate = new Date(expense.due_date);
                                    const today = new Date();
                                    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                    return daysUntilDue >= -7 && daysUntilDue <= 30;
                                })
                                .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                                .slice(0, 6)
                                .map((expense) => {
                                    const dueDate = new Date(expense.due_date);
                                    const today = new Date();
                                    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                    const isOverdue = daysUntilDue < 0;
                                    const isDueToday = daysUntilDue === 0;
                                    const isDueSoon = daysUntilDue > 0 && daysUntilDue <= 7;

                                    return (
                                        <div key={expense.id} className={`p-3 rounded-lg border ${isOverdue ? 'bg-red-50 border-red-200' : isDueSoon ? 'bg-yellow-50 border-yellow-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{expense.name}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(expense.amount.toString()))}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-emerald-600'}`}>
                                                        {isOverdue ? `${Math.abs(daysUntilDue)} dias atrás` :
                                                            isDueToday ? 'Hoje' :
                                                                `${daysUntilDue} dias`}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            {fixedExpenses.filter(expense => {
                                if (!expense.is_active) return false;
                                const dueDate = new Date(expense.due_date);
                                const today = new Date();
                                const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                return daysUntilDue >= -7 && daysUntilDue <= 30;
                            }).length === 0 && (
                                    <p className="text-center text-gray-500 py-4">Nenhum vencimento próximo</p>
                                )}
                        </div>
                    </CardContent>
                </Card>

                {/* Filtros */}
                <Card className="bg-white shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={selectedFilter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedFilter('all')}
                                className={selectedFilter === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                            >
                                Todas ({stats.totalExpenses})
                            </Button>
                            <Button
                                variant={selectedFilter === 'active' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedFilter('active')}
                                className={selectedFilter === 'active' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                            >
                                Ativas ({stats.activeExpenses})
                            </Button>
                            <Button
                                variant={selectedFilter === 'upcoming' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedFilter('upcoming')}
                                className={selectedFilter === 'upcoming' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                            >
                                Vencimentos ({stats.upcomingExpenses})
                            </Button>
                            <Button
                                variant={selectedFilter === 'overdue' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedFilter('overdue')}
                                className={selectedFilter === 'overdue' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                            >
                                Em Atraso ({stats.overdueExpenses})
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Despesas Filtradas */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {selectedFilter === 'all' && 'Todas as Despesas'}
                        {selectedFilter === 'active' && 'Despesas Ativas'}
                        {selectedFilter === 'upcoming' && 'Próximos Vencimentos'}
                        {selectedFilter === 'overdue' && 'Despesas em Atraso'}
                    </h2>
                    {isLoadingFixedExpenses ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                            <p className="text-gray-500 mt-4">Carregando despesas...</p>
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <Card className="bg-white shadow-sm">
                            <CardContent className="p-8 text-center">
                                <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">
                                    {selectedFilter === 'all' && 'Nenhuma despesa fixa cadastrada'}
                                    {selectedFilter === 'active' && 'Nenhuma despesa ativa encontrada'}
                                    {selectedFilter === 'upcoming' && 'Nenhum vencimento próximo'}
                                    {selectedFilter === 'overdue' && 'Nenhuma despesa em atraso'}
                                </p>
                                <Button onClick={() => setIsDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar Primeira Despesa
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {filteredExpenses.map((expense) => {
                                const dueDate = new Date(expense.due_date);
                                const today = new Date();
                                const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                const isOverdue = daysUntilDue < 0;
                                const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;

                                return (
                                    <Card key={expense.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-semibold text-gray-900">{expense.name}</h3>
                                                        <Badge variant={expense.is_active ? 'default' : 'secondary'} className={expense.is_active ? 'bg-emerald-100 text-emerald-700' : ''}>
                                                            {expense.is_active ? 'Ativa' : 'Inativa'}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {getCategoryLabel(expense.category)}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{getRecurrenceLabel(expense.recurrence)}</span>
                                                        {expense.receive_notifications && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Bell className="h-3 w-3" />
                                                                    {expense.notification_days_before}d antes
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(expense.amount.toString()))}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Vencimento: {dueDate.toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                                {(isOverdue || isDueSoon) && (
                                                    <div className="text-right">
                                                        {isOverdue && (
                                                            <Badge variant="destructive" className="mb-1">
                                                                {Math.abs(daysUntilDue)} dias atrás
                                                            </Badge>
                                                        )}
                                                        {isDueSoon && !isOverdue && (
                                                            <Badge className="bg-yellow-100 text-yellow-700 mb-1">
                                                                {daysUntilDue === 0 ? 'Vence hoje' : `${daysUntilDue} dias`}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {expense.description && (
                                                <p className="text-sm text-gray-600 mb-3">{expense.description}</p>
                                            )}

                                            <div className="flex flex-wrap gap-2 pt-3 border-t">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleViewExpenseDetails(expense)}
                                                    className="flex-1 sm:flex-none"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    Detalhes
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEditFixedExpense(expense)}
                                                    className="flex-1 sm:flex-none"
                                                >
                                                    <Edit className="h-3 w-3 mr-1" />
                                                    Editar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeleteFixedExpense(expense.id)}
                                                    className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-3 w-3 mr-1" />
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
            </div>

            {/* Modal de Criação/Edição */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingExpenseId ? 'Editar' : 'Nova'} Despesa Fixa</DialogTitle>
                        <DialogDescription>
                            Preencha as informações da despesa recorrente
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da despesa *</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Aluguel do escritório"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição (opcional)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Detalhes adicionais"
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Valor *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0,00"
                                    step="0.01"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Vencimento *</Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="recurrence">Periodicidade</Label>
                                <Select value={recurrence} onValueChange={setRecurrence}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a periodicidade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                        <SelectItem value="bimonthly">Bimestral</SelectItem>
                                        <SelectItem value="quarterly">Trimestral</SelectItem>
                                        <SelectItem value="semiannual">Semestral</SelectItem>
                                        <SelectItem value="annual">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Categoria</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="rent">🏠 Aluguel</SelectItem>
                                        <SelectItem value="utilities">💧 Utilidades</SelectItem>
                                        <SelectItem value="salaries">💼 Salários</SelectItem>
                                        <SelectItem value="taxes">💰 Impostos</SelectItem>
                                        <SelectItem value="insurance">🔐 Seguros</SelectItem>
                                        <SelectItem value="subscriptions">📰 Assinaturas</SelectItem>
                                        <SelectItem value="maintenance">🔧 Manutenção</SelectItem>
                                        <SelectItem value="other">📌 Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <Switch
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                            <Label htmlFor="isActive" className="cursor-pointer">Despesa ativa</Label>
                        </div>

                        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="receiveNotifications"
                                    checked={receiveNotifications}
                                    onCheckedChange={setReceiveNotifications}
                                />
                                <Label htmlFor="receiveNotifications" className="cursor-pointer">Receber notificações</Label>
                            </div>

                            {receiveNotifications && (
                                <div className="space-y-2 pl-8">
                                    <Label className="text-sm">Dias de antecedência: {notificationDaysBefore}</Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                const current = parseInt(notificationDaysBefore) || 0;
                                                if (current > 1) setNotificationDaysBefore((current - 1).toString());
                                            }}
                                        >
                                            -
                                        </Button>
                                        <Input
                                            type="number"
                                            value={notificationDaysBefore}
                                            onChange={(e) => setNotificationDaysBefore(e.target.value)}
                                            min="1"
                                            max="30"
                                            className="w-20 text-center"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                const current = parseInt(notificationDaysBefore) || 0;
                                                if (current < 30) setNotificationDaysBefore((current + 1).toString());
                                            }}
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDialogOpen(false);
                                setEditingExpenseId(null);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateFixedExpense}
                            disabled={isLoading}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isLoading ? 'Processando...' : 'Salvar Despesa'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Detalhes */}
            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    {selectedExpenseForDetails && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {selectedExpenseForDetails.name}
                                    <Badge variant={selectedExpenseForDetails.is_active ? 'default' : 'secondary'} className={selectedExpenseForDetails.is_active ? 'bg-emerald-100 text-emerald-700' : ''}>
                                        {selectedExpenseForDetails.is_active ? 'Ativa' : 'Inativa'}
                                    </Badge>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <TrendingDown className="h-4 w-4" />
                                        Informações Básicas
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Valor:</span>
                                            <span className="font-semibold text-gray-900">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(selectedExpenseForDetails.amount.toString()))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Vencimento:</span>
                                            <span className="font-semibold text-gray-900">
                                                {new Date(selectedExpenseForDetails.due_date).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Categoria:</span>
                                            <span className="font-semibold text-gray-900">
                                                {getCategoryLabel(selectedExpenseForDetails.category)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Recorrência:</span>
                                            <span className="font-semibold text-gray-900">
                                                {getRecurrenceLabel(selectedExpenseForDetails.recurrence)}
                                            </span>
                                        </div>
                                        {selectedExpenseForDetails.description && (
                                            <div className="pt-2 border-t">
                                                <span className="text-gray-600">Descrição:</span>
                                                <p className="text-gray-900 mt-1">{selectedExpenseForDetails.description}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Bell className="h-4 w-4" />
                                        Notificações
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Receber notificações:</span>
                                            <span className="font-semibold text-gray-900">
                                                {selectedExpenseForDetails.receive_notifications ? 'Sim' : 'Não'}
                                            </span>
                                        </div>
                                        {selectedExpenseForDetails.receive_notifications && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Dias de antecedência:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {selectedExpenseForDetails.notification_days_before} dias
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Sistema
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Criado em:</span>
                                            <span className="font-semibold text-gray-900">
                                                {new Date(selectedExpenseForDetails.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Última atualização:</span>
                                            <span className="font-semibold text-gray-900">
                                                {new Date(selectedExpenseForDetails.updated_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDetailsDialogOpen(false)}
                                >
                                    Fechar
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsDetailsDialogOpen(false);
                                        handleEditFixedExpense(selectedExpenseForDetails);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar Despesa
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}