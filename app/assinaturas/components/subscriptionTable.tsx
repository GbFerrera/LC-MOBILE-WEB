"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, ArrowUpDown, Search, Calendar, CreditCard, CheckCircle2, XCircle, Edit, Save, X, Clock, AlertTriangle, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { subscriptionsService } from "@/api/subscriptions"

interface Subscription {
  id: number
  client_id: number
  plan_id: number
  status: "active" | "inactive" | "pending" | "canceled"
  payment_status: boolean
  start_date: string
  end_date?: string
  next_billing_date?: string
  price: number
  cancellation_reason?: string
  remaining_sessions?: number
  company_id?: number
  created_at: string
  updated_at: string
  client?: {
    id: number
    name: string
    email: string
    phone_number: string
    document?: string
  }
  plan?: {
    id: number
    name: string
    description: string
    price: number
    is_recurring: boolean
    sessions_per_week: number
    services?: Array<{
      id: number
      name: string
      description: string
      price: number
      duration: number
    }>
  }
}

interface SubscriptionTableProps {
  data: Subscription[]
  onUpdate?: () => void
  onViewDetails?: (subscription: Subscription) => void
}

export function SubscriptionTable({ data, onUpdate, onViewDetails }: SubscriptionTableProps) {
  const [filteredData, setFilteredData] = React.useState(data)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof Subscription | null
    direction: "asc" | "desc" | null
  }>({ key: null, direction: null })
  const [currentPage, setCurrentPage] = React.useState(1)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [editData, setEditData] = React.useState<any>({})
  const [loading, setLoading] = React.useState(false)
  const itemsPerPage = 10

  React.useEffect(() => {
    const filtered = data.filter(subscription =>
      subscription.status.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchTerm, data])

  const handleSort = (key: keyof Subscription) => {
    let direction: "asc" | "desc" | null = "asc"
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") direction = "desc"
      else if (sortConfig.direction === "desc") direction = null
    }

    setSortConfig({ key, direction })
    
    if (direction === null) {
      setFilteredData([...data])
      return
    }

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[key] ?? ''
      const bValue = b[key] ?? ''
      
      if (aValue < bValue) return direction === "asc" ? -1 : 1
      if (aValue > bValue) return direction === "asc" ? 1 : -1
      return 0
    })
    setFilteredData(sorted)
  }

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      return dateStr
    }
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
      case 'canceled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatPhone = (phone: string) => {
    return phone.replace(/\D/g, '').replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  }

  const handleEdit = (subscription: Subscription) => {
    setEditingId(subscription.id)
    setEditData({
      status: subscription.status,
      payment_status: subscription.payment_status,
      price: subscription.price,
      remaining_sessions: subscription.remaining_sessions
    })
  }

  const handleSave = async (subscriptionId: number) => {
    try {
      setLoading(true)
      await subscriptionsService.updateSubscription(subscriptionId, editData)
      toast.success("Assinatura atualizada com sucesso!")
      setEditingId(null)
      setEditData({})
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Erro ao atualizar assinatura:", error)
      toast.error("Erro ao atualizar assinatura")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditData({})
  }

  const getPaymentStatusColor = (paymentStatus: boolean) => {
    return paymentStatus 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800'
  }

  return (
    <div className="w-full space-y-6">
      <Card className="p-6 bg-gradient-to-br from-[#3D573F]/5 to-transparent">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#3D573F]" />
            </div>
            <Input
              placeholder="Buscar assinaturas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-[#3D573F]/20 bg-white/50 backdrop-blur-sm focus:border-[#3D573F] focus:ring-[#3D573F]/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setSearchTerm("")}
              className="text-[#3D573F] hover:text-[#3D573F]/80"
            >
              Limpar filtro
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        <div className="rounded-lg border border-[#3D573F]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#3D573F]/5">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Plano
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Pagamento
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Preço
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Sessões Restantes
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Válida até
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3D573F]/10">
                {getCurrentPageItems().map((subscription) => {
                  const isEditing = editingId === subscription.id
                  return (
                    <tr key={subscription.id} className="hover:bg-[#3D573F]/5">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{subscription.client?.name}</p>
                          <p className="text-xs text-gray-500">{subscription.client?.phone_number ? formatPhone(subscription.client.phone_number) : '-'}</p>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{subscription.plan?.name}</p>
                          <p className="text-xs text-gray-500">{subscription.plan?.price ? formatCurrency(subscription.plan.price) : '-'}</p>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Select 
                            value={editData.status} 
                            onValueChange={(value) => setEditData({...editData, status: value})}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Ativa</SelectItem>
                              <SelectItem value="inactive">Inativa</SelectItem>
                              <SelectItem value="canceled">Cancelada</SelectItem>
                              <SelectItem value="pending">Pendente</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={getStatusColor(subscription.status)}>
                            {subscription.status === 'active' && 'Ativa'}
                            {subscription.status === 'inactive' && 'Inativa'}
                            {subscription.status === 'canceled' && 'Cancelada'}
                            {subscription.status === 'pending' && 'Pendente'}
                          </Badge>
                        )}
                      </td>
                      
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Select 
                            value={editData.payment_status?.toString()} 
                            onValueChange={(value) => setEditData({...editData, payment_status: value === 'true'})}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Pago</SelectItem>
                              <SelectItem value="false">Pendente</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={getPaymentStatusColor(subscription.payment_status)}>
                            {subscription.payment_status ? (
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
                        )}
                      </td>
                      
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editData.price || ''}
                            onChange={(e) => setEditData({...editData, price: parseFloat(e.target.value)})}
                            className="w-24"
                          />
                        ) : (
                          <span className="font-medium">{formatCurrency(subscription.price)}</span>
                        )}
                      </td>
                      
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editData.remaining_sessions || ''}
                            onChange={(e) => setEditData({...editData, remaining_sessions: parseInt(e.target.value)})}
                            className="w-20"
                          />
                        ) : (
                          <span>{subscription.remaining_sessions || '-'}</span>
                        )}
                      </td>
                      
                      <td className="px-4 py-3">
                        {subscription.end_date ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{formatDate(subscription.end_date)}</span>
                                    <div className={`flex items-center gap-1 text-xs ${
                                      new Date(subscription.end_date) < new Date() 
                                        ? 'text-red-600' 
                                        : new Date(subscription.end_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                        ? 'text-yellow-600'
                                        : 'text-green-600'
                                    }`}>
                                      {new Date(subscription.end_date) < new Date() ? (
                                        <>
                                          <XCircle className="h-3 w-3" />
                                          Vencida
                                        </>
                                      ) : new Date(subscription.end_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? (
                                        <>
                                          <AlertTriangle className="h-3 w-3" />
                                          Vence em breve
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="h-3 w-3" />
                                          Ativa
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {new Date(subscription.end_date) < new Date() 
                                    ? `Venceu em ${formatDate(subscription.end_date)}` 
                                    : `Válida até ${formatDate(subscription.end_date)}`
                                  }
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span>Sem prazo</span>
                          </div>
                        )}
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleSave(subscription.id)}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={loading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => onViewDetails?.(subscription)}
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ver detalhes e agendamentos</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(subscription)}
                                className="text-[#3D573F] hover:text-[#3D573F]/80"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="text-[#3D573F] hover:text-[#3D573F]/80"
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-700">
            Página {currentPage} de {Math.ceil(filteredData.length / itemsPerPage)}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === Math.ceil(filteredData.length / itemsPerPage)}
            className="text-[#3D573F] hover:text-[#3D573F]/80"
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}
