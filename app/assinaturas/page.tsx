"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Users, UserCheck, Coffee, UserX, Crown, MessageSquare, Send, X, Edit, Trash2, Eye, Search, TrendingUp, CheckCircle2, XCircle } from "lucide-react"
import { useAuth } from "@/hooks/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { subscriptionsService, Subscription, UpdateSubscriptionData } from "@/api/subscriptions"
import { plansService, Plan } from "@/api/subscriptions"
import { api } from "@/services/api"
import { SubscriptionTable } from "./components/subscriptionTable"

export default function Page() {
    const { user } = useAuth()
    
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [appointments, setAppointments] = useState<any[]>([])
    
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        pending: 0,
        canceled: 0
    })
    
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
    
    const [editFormData, setEditFormData] = useState<UpdateSubscriptionData>({})
    
    const [powerSubscribers, setPowerSubscribers] = useState<any[]>([])
    const [potentialClients, setPotentialClients] = useState<any[]>([])
    const [isPowerSubscribersCampaignDialogOpen, setIsPowerSubscribersCampaignDialogOpen] = useState(false)
    const [campaignContent, setCampaignContent] = useState({
        text: "",
        image: null as File | null,
        imagePreview: null as string | null,
    })
    const [isSendingCampaign, setIsSendingCampaign] = useState(false)
    
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
    const [subscriptionAppointments, setSubscriptionAppointments] = useState<any[]>([])
    const [loadingAppointments, setLoadingAppointments] = useState(false)

    const loadData = async () => {
        try {
            setLoading(true)
            const [subscriptionsData, clientsResponse, plansData, appointmentsData] = await Promise.all([
                subscriptionsService.getSubscriptions(),
                api.get('/clients', {
                    headers: { 'company_id': user?.company_id ? String(user.company_id) : '' }
                }).then(res => res.data),
                api.get('/plans', {
                    headers: { 'company_id': user?.company_id ? String(user.company_id) : '' }
                }).then(res => res.data),
                api.get('/appointments', {
                    headers: { 'company_id': user?.company_id ? String(user.company_id) : '' }
                }).then(res => res.data),
                api.get('/subscriptions', {
                    headers: { 'company_id': user?.company_id ? String(user.company_id) : '' }
                }).then(res => res.data)
            ])
            
            const clientsData = clientsResponse.clients || []
            
            setSubscriptions(subscriptionsData)
            setClients(clientsData)
            setPlans(plansData)
            setAppointments(appointmentsData)
            
            const newStats = subscriptionsData.reduce((acc: any, sub: Subscription) => {
                acc.total++
                if (sub.status === 'active') acc.active++
                else if (sub.status === 'inactive') acc.inactive++
                else if (sub.status === 'canceled') acc.canceled++
                if (!sub.payment_status) acc.pending++
                return acc
            }, { total: 0, active: 0, inactive: 0, pending: 0, canceled: 0 })
            
            setStats(newStats)
            
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            
            const clientAppointmentCounts = clientsData.map((client: any) => {
                const clientAppointments = appointmentsData.filter((appointment: any) => {
                    const appointmentDate = new Date(appointment.appointment_date || appointment.created_at)
                    return appointment.client_id === client.id && appointmentDate >= thirtyDaysAgo
                })
                
                return {
                    ...client,
                    appointmentCount: clientAppointments.length
                }
            })
            
            const powerSubscribersList = clientAppointmentCounts.filter((client: any) => client.appointmentCount > 1)
            setPowerSubscribers(powerSubscribersList)
            
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
            toast.error("Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user?.company_id) {
            loadData()
        }
    }, [user?.company_id, selectedSubscription])

    const handleViewSubscriptionDetails = async (subscription: Subscription) => {
        try {
            setSelectedSubscription(subscription)
            setLoadingAppointments(true)
            setIsDetailsDialogOpen(true)
            
            const appointmentsResponse = await api.get(`/appointments?subscription_id=${subscription.id}&client_id=${subscription.client_id}`, {
                headers: { 'company_id': user?.company_id ? String(user.company_id) : '' }
            })
            
            const filteredAppointments = (appointmentsResponse.data || []).filter((appointment: any) => 
                appointment.subscription_id === subscription.id && 
                appointment.client_id === subscription.client_id
            )
            
            setSubscriptionAppointments(filteredAppointments)
            
        } catch (error) {
            console.error("Erro ao buscar detalhes da assinatura:", error)
            toast.error("Erro ao carregar detalhes da assinatura")
            setSubscriptionAppointments([])
        } finally {
            setLoadingAppointments(false)
        }
    }

    const handleUpdateSubscription = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedSubscription) return
        try {
            await subscriptionsService.updateSubscription(selectedSubscription.id, editFormData)
            toast.success("Assinatura atualizada com sucesso!")
            setIsEditDialogOpen(false)
            setSelectedSubscription(null)
            setEditFormData({})
            loadData()
        } catch (error) {
            console.error("Erro ao atualizar assinatura:", error)
            toast.error("Erro ao atualizar assinatura")
        }
    }

    const handleDeleteSubscription = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir esta assinatura?")) return
        
        try {
            await subscriptionsService.deleteSubscription(id)
            toast.success("Assinatura excluída com sucesso!")
            loadData()
        } catch (error) {
            console.error("Erro ao excluir assinatura:", error)
            toast.error("Erro ao excluir assinatura")
        }
    }

    const handleViewSubscription = (subscription: Subscription) => {
        setSelectedSubscription(subscription)
        setIsViewDialogOpen(true)
    }

    const handleEditSubscription = (subscription: Subscription) => {
        setSelectedSubscription(subscription)
        setEditFormData({
            status: subscription.status,
            payment_status: subscription.payment_status,
            end_date: subscription.end_date,
            price: subscription.price,
            remaining_sessions: subscription.remaining_sessions
        })
        setIsEditDialogOpen(true)
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setCampaignContent({
                ...campaignContent,
                image: file,
                imagePreview: URL.createObjectURL(file),
            })
        }
    }

    const sendCampaignToPowerSubscribers = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!campaignContent.text.trim()) {
            toast.error("Por favor, insira uma mensagem para a campanha")
            return
        }

        if (powerSubscribers.length === 0) {
            toast.error("Não há potências assinantes para enviar a campanha")
            return
        }

        try {
            setIsSendingCampaign(true)

            const recipients = powerSubscribers.map((client) => ({
                phoneNumber: client.phone_number,
                name: client.name,
            }))

            const payload = {
                recipients: recipients,
                message: campaignContent.text,
            }

            const response = await api.post("/campaigns/send", payload, {
                headers: { 'company_id': user?.company_id ? String(user.company_id) : '' }
            })

            toast.success(
                `Campanha enviada com sucesso para ${recipients.length} potências assinantes!`
            )
            setIsPowerSubscribersCampaignDialogOpen(false)
            setCampaignContent({
                text: "",
                image: null,
                imagePreview: null,
            })
        } catch (error: any) {
            console.error("Erro ao enviar campanha:", error)
            toast.error(
                error.response?.data?.message ||
                    "Erro ao enviar campanha. Tente novamente."
            )
        } finally {
            setIsSendingCampaign(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR')
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-800'
            case 'inactive':
                return 'bg-gray-100 text-gray-800'
            case 'cancelled':
            case 'canceled':
                return 'bg-red-100 text-red-800'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getPaymentStatusColor = (paymentStatus: boolean) => {
        return paymentStatus 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Assinaturas</h1>
                    <p className="text-gray-600 mt-1">Controle completo das assinaturas de planos</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 bg-[#3D573F]/10 rounded-full">
                            <Users className="h-6 w-6 text-[#3D573F]" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-full">
                            <UserCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Ativas</p>
                            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 bg-gray-100 rounded-full">
                            <UserX className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Inativas</p>
                            <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <Coffee className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pendentes</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 bg-red-100 rounded-full">
                            <X className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Canceladas</p>
                            <p className="text-2xl font-bold text-red-600">{stats.canceled}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card className="bg-gradient-to-br from-[#3D573F]/5 via-[#3D573F]/8 to-[#3D573F]/10 border-[#3D573F]/20 hover:border-[#3D573F]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#3D573F]/10">
                    <div className="p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#3D573F]/5 to-transparent rounded-full blur-xl transform translate-x-16 -translate-y-16"></div>
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="p-3 bg-gradient-to-br from-[#3D573F]/20 to-[#3D573F]/30 rounded-full hover:scale-105 transition-transform duration-200">
                                <Crown className="h-6 w-6 text-[#3D573F]" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-[#3D573F]">Potências Assinantes</h3>
                                <p className="text-sm text-gray-600">Clientes com mais de 1 agendamento nos últimos 30 dias</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {powerSubscribers.length > 0 && (
                                    <Dialog
                                        open={isPowerSubscribersCampaignDialogOpen}
                                        onOpenChange={setIsPowerSubscribersCampaignDialogOpen}
                                    >
                                        <DialogTrigger asChild>
                                            <Button 
                                                size="sm" 
                                                className="bg-gradient-to-r from-[#3D573F] to-[#3D573F]/90 hover:from-[#3D573F]/90 hover:to-[#3D573F]/80 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                                            >
                                                <Send className="h-4 w-4 mr-2" />
                                                Campanha
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[600px]">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2">
                                                    <MessageSquare className="h-5 w-5 text-[#3D573F]" />
                                                    Nova Campanha para Potências Assinantes
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Crie uma mensagem personalizada para seus melhores clientes.
                                                    A campanha será enviada para {powerSubscribers.length} clientes.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={sendCampaignToPowerSubscribers} className="space-y-4">
                                                <div>
                                                    <Label htmlFor="message">Mensagem da Campanha</Label>
                                                    <Textarea
                                                        id="message"
                                                        value={campaignContent.text}
                                                        onChange={(e) => setCampaignContent({
                                                            ...campaignContent,
                                                            text: e.target.value,
                                                        })}
                                                        placeholder="Digite sua mensagem aqui..."
                                                        className="min-h-[120px]"
                                                        required
                                                    />
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setIsPowerSubscribersCampaignDialogOpen(false)}
                                                        className="flex-1"
                                                    >
                                                        Cancelar
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        disabled={isSendingCampaign}
                                                        className="flex-1 bg-[#3D573F] hover:bg-[#3D573F]/90"
                                                    >
                                                        {isSendingCampaign ? 'Enviando...' : 'Enviar Campanha'}
                                                    </Button>
                                                </div>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                )}
                                <Badge variant="secondary" className="bg-gradient-to-r from-[#3D573F]/10 to-[#3D573F]/15 text-[#3D573F]">
                                    {powerSubscribers.length}
                                </Badge>
                            </div>
                        </div>
                        
                        {powerSubscribers.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">
                                Nenhum cliente com múltiplos agendamentos este mês
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {powerSubscribers.slice(0, 3).map((client: any) => (
                                    <div key={client.id} className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-[#3D573F]/10">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">{client.name}</p>
                                                <p className="text-sm text-gray-600">{client.phone_number}</p>
                                            </div>
                                            <Badge variant="outline" className="bg-gradient-to-r from-[#3D573F]/10 to-[#3D573F]/15 text-[#3D573F]">
                                                {client.appointmentCount} agend.
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <SubscriptionTable 
                data={subscriptions} 
                onUpdate={loadData} 
                onViewDetails={handleViewSubscriptionDetails}
            />

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Assinatura</DialogTitle>
                        <DialogDescription>
                            Atualize as informações da assinatura
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateSubscription} className="space-y-4">
                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select value={editFormData.status} onValueChange={(value) => setEditFormData({...editFormData, status: value as any})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Ativa</SelectItem>
                                    <SelectItem value="inactive">Inativa</SelectItem>
                                    <SelectItem value="canceled">Cancelada</SelectItem>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="payment_status">Status do Pagamento</Label>
                            <Select value={editFormData.payment_status?.toString()} onValueChange={(value) => setEditFormData({...editFormData, payment_status: value === 'true'})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status do pagamento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Pago</SelectItem>
                                    <SelectItem value="false">Pendente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="price">Preço</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={editFormData.price || ''}
                                onChange={(e) => setEditFormData({...editFormData, price: parseFloat(e.target.value)})}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                                Cancelar
                            </Button>
                            <Button type="submit" className="flex-1 bg-[#3D573F] hover:bg-[#3D573F]/90">
                                Atualizar
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalhes da Assinatura</DialogTitle>
                    </DialogHeader>
                    {selectedSubscription && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Cliente</Label>
                                    <p className="text-sm">{selectedSubscription.client?.name}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Plano</Label>
                                    <p className="text-sm">{selectedSubscription.plan?.name}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                                    <Badge className={getStatusColor(selectedSubscription.status)}>
                                        {selectedSubscription.status}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Pagamento</Label>
                                    <Badge variant={selectedSubscription.payment_status ? 'default' : 'destructive'}>
                                        {selectedSubscription.payment_status ? 'Pago' : 'Pendente'}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Valor</Label>
                                    <p className="text-sm font-medium">{formatCurrency(selectedSubscription.price)}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Data de Início</Label>
                                    <p className="text-sm">{formatDate(selectedSubscription.start_date)}</p>
                                </div>
                            </div>
                            {selectedSubscription.plan?.services && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Serviços Inclusos</Label>
                                    <div className="mt-2 space-y-2">
                                        {selectedSubscription.plan.services.map((service) => (
                                            <div key={service.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                <span className="text-sm">{service.name}</span>
                                                <span className="text-sm text-gray-500">{service.duration}min</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#3D573F]/10 rounded-full">
                                    <Eye className="h-5 w-5 text-[#3D573F]" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl">Detalhes da Assinatura</DialogTitle>
                                    <DialogDescription>
                                        Visualização completa de todas as informações e agendamentos
                                    </DialogDescription>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.print()}
                                className="text-[#3D573F] hover:bg-[#3D573F]/10"
                            >
                                <Search className="h-4 w-4 mr-2" />
                                Exportar PDF
                            </Button>
                        </div>
                    </DialogHeader>

                    {selectedSubscription && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold mb-4 text-[#3D573F]">Informações Gerais</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <Badge className={getStatusColor(selectedSubscription.status)}>
                                                {selectedSubscription.status === 'active' && 'Ativa'}
                                                {selectedSubscription.status === 'inactive' && 'Inativa'}
                                                {selectedSubscription.status === 'canceled' && 'Cancelada'}
                                                {selectedSubscription.status === 'pending' && 'Pendente'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Cliente:</span>
                                            <span className="font-medium">{selectedSubscription.client?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Plano:</span>
                                            <span className="font-medium">{selectedSubscription.plan?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Data de início:</span>
                                            <span>{formatDate(selectedSubscription.start_date)}</span>
                                        </div>
                                        {selectedSubscription.end_date && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Válida até:</span>
                                                <span>{formatDate(selectedSubscription.end_date)}</span>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold mb-4 text-[#3D573F]">Valores</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Valor da assinatura:</span>
                                            <span className="font-bold text-lg text-[#3D573F]">{formatCurrency(selectedSubscription.price)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status do pagamento:</span>
                                            <Badge className={getPaymentStatusColor(selectedSubscription.payment_status)}>
                                                {selectedSubscription.payment_status ? (
                                                    <>
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Pago
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Pendente
                                                    </>
                                                )}
                                            </Badge>
                                        </div>
                                        {selectedSubscription.remaining_sessions && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Sessões restantes:</span>
                                                <span className="font-medium">{selectedSubscription.remaining_sessions}</span>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>

                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-[#3D573F]">
                                        Agendamentos ({subscriptionAppointments.length})
                                    </h3>
                                    {loadingAppointments && (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#3D573F]"></div>
                                    )}
                                </div>

                                {loadingAppointments ? (
                                    <div className="text-center py-8 text-gray-500">
                                        Carregando agendamentos...
                                    </div>
                                ) : subscriptionAppointments.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        Nenhum agendamento encontrado para esta assinatura
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {subscriptionAppointments.map((appointment) => (
                                            <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-3 h-3 rounded-full mt-1 ${
                                                            appointment.status === 'completed' ? 'bg-green-500' :
                                                            appointment.status === 'confirmed' ? 'bg-blue-500' :
                                                            appointment.status === 'pending' ? 'bg-yellow-500' :
                                                            'bg-red-500'
                                                        }`}></div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="font-medium">
                                                                    Agendamento #{appointment.id}
                                                                </p>
                                                                <Badge className="text-xs" variant="outline">
                                                                    ID: {appointment.subscription_id}
                                                                </Badge>
                                                            </div>
                                                            <div className="space-y-1 text-sm text-gray-600">
                                                                <p>
                                                                    <span className="font-medium">Profissional:</span> {appointment.professional?.name || appointment.professional_name}
                                                                </p>
                                                                <p>
                                                                    <span className="font-medium">Data:</span> {formatDate(appointment.appointment_date)} às {appointment.start_time}
                                                                    {appointment.end_time && ` - ${appointment.end_time}`}
                                                                </p>
                                                                <p>
                                                                    <span className="font-medium">Cliente:</span> {appointment.client?.name || appointment.client_name}
                                                                </p>
                                                                {appointment.notes && (
                                                                    <p>
                                                                        <span className="font-medium">Observações:</span> {appointment.notes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge className={`mb-2 ${
                                                            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {appointment.status === 'completed' && 'Concluído'}
                                                            {appointment.status === 'confirmed' && 'Confirmado'}
                                                            {appointment.status === 'pending' && 'Pendente'}
                                                            {appointment.status === 'cancelled' && 'Cancelado'}
                                                        </Badge>
                                                        {appointment.services && appointment.services.length > 0 && (
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-medium text-gray-700">Serviços:</p>
                                                                {appointment.services.map((service: any, index: number) => (
                                                                    <div key={index} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                                                                        <p className="font-medium">{service.service_name}</p>
                                                                        <p>R$ {parseFloat(service.service_price).toFixed(2)} • {service.service_duration}min</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
