"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Plus, Sparkles, Pencil, Trash2, X, Calendar, CreditCard, Users, Zap, DollarSign, Clock, FileSpreadsheet } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { CreatePlan, DeletePlan, UpdatePlan } from "@/api/createPlans"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { getServices, Service } from "@/api/services"
import { getClients, searchClients } from "@/api/clients"
import { api } from "@/services/api"
import { useAuth } from "@/hooks/auth"

interface Plan {
  id: number
  name: string
  description: string
  price: number
  is_recurring: boolean
  sessions_limit: number | null
  sessions_per_week: number
  company_id: number
  created_at: string
  updated_at: string
  services: Service[]
}

interface ServiceSelectProps {
  selectedServices: string[]
  setSelectedServices: (services: string[]) => void
}

interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPlan?: Plan | null
  onSuccess: () => void
}

const ServiceSelect = ({ selectedServices, setSelectedServices }: ServiceSelectProps) => {
  const { toast } = useToast()
  const [services, setServices] = React.useState<Service[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const { user } = useAuth()

  React.useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true)
      try {
        const data = await getServices()
        setServices(data || [])
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar serviços",
          description: "Não foi possível carregar a lista de serviços."
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchServices()
  }, [toast, user])

  return (
    <div className="space-y-2">
      <Label>Serviços</Label>
      <div className="border border-[#3D583F]/20 rounded-xl bg-white p-4 min-h-[120px]">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#3D583F] border-t-transparent" />
            <span className="ml-2 text-sm text-gray-600">Carregando serviços...</span>
          </div>
        ) : services.length > 0 ? (
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id || service.service_id} className="flex items-center space-x-3">
                <Checkbox
                  id={`service-${service.id || service.service_id}`}
                  checked={selectedServices.includes((service.id || service.service_id)?.toString() || '')}
                  onCheckedChange={(checked) => {
                    const serviceId = (service.id || service.service_id)?.toString();
                    if (!serviceId) return;

                    if (checked) {
                      setSelectedServices([...selectedServices, serviceId])
                    } else {
                      setSelectedServices(selectedServices.filter(id => id !== serviceId))
                    }
                  }}
                />
                <label
                  htmlFor={`service-${service.id || service.service_id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  <div>
                    <div className="font-medium text-gray-800">
                      {service.name || service.service_name}
                    </div>
                    {(service.description || service.service_description) && (
                      <div className="text-xs text-gray-500 mt-1">
                        {service.description || service.service_description}
                      </div>
                    )}
                    <div className="text-xs text-[#3D583F] mt-1">
                      R$ {service.price || service.service_price} • {service.duration || service.service_duration}min
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center p-4 text-center">
            <div className="text-gray-500">
              <div className="text-sm font-medium">Nenhum serviço encontrado</div>
              <div className="text-xs mt-1">Cadastre serviços para poder selecioná-los</div>
            </div>
          </div>
        )}
      </div>
      {selectedServices.length > 0 && (
        <div className="text-xs text-gray-600">
          {selectedServices.length} serviço{selectedServices.length > 1 ? 's' : ''} selecionado{selectedServices.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

const DialogCreatePlan = ({ open, onOpenChange, editingPlan, onSuccess }: DrawerProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [name, setName] = React.useState(editingPlan?.name || "")
  const [description, setDescription] = React.useState(editingPlan?.description || "")
  const [price, setPrice] = React.useState(editingPlan?.price?.toString() || "")
  const [isRecurring, setIsRecurring] = React.useState(editingPlan?.is_recurring || false)
  const [sessionsPerWeek, setSessionsPerWeek] = React.useState(editingPlan?.sessions_per_week?.toString() || "")
  const [selectedServices, setSelectedServices] = React.useState<string[]>([])
  const { user } = useAuth()

  React.useEffect(() => {
    if (editingPlan) {
      setName(editingPlan.name)
      setDescription(editingPlan.description)
      setPrice(editingPlan.price.toString())
      setIsRecurring(editingPlan.is_recurring)
      setSessionsPerWeek(editingPlan.sessions_per_week?.toString() || "")
      const validServices = (editingPlan.services || [])
        .filter((service): service is { id: number } & typeof service => Boolean(service?.id));

      setSelectedServices(
        validServices.map(service => service.id.toString())
      );
    } else {
      setName("")
      setDescription("")
      setPrice("")
      setIsRecurring(false)
      setSessionsPerWeek("")
      setSelectedServices([])
    }
  }, [editingPlan])

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const planData = {
        name,
        description,
        price: Number(price),
        is_recurring: isRecurring,
        sessions_per_week: sessionsPerWeek ? Number(sessionsPerWeek) : undefined,
        service_ids: selectedServices.map(id => Number(id)),
      }

      if (editingPlan) {
        await UpdatePlan(editingPlan.id, planData, user?.company_id)
        toast({
          title: "Plano atualizado",
          description: "O plano foi atualizado com sucesso!"
        })
      } else {
        await CreatePlan(planData)
        toast({
          title: "Plano criado",
          description: "O plano foi criado com sucesso!"
        })
      }

      onOpenChange(false)
      onSuccess()
      setName("")
      setDescription("")
      setPrice("")
      setIsRecurring(false)
      setSessionsPerWeek("")
      setSelectedServices([])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar plano",
        description: error.response?.data?.message || "Erro ao processar solicitação"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#F1F1E7]">
        <DialogHeader>
          <DialogTitle>{editingPlan ? "Editar Plano" : "Criar Plano"}</DialogTitle>
          <DialogDescription>{editingPlan ? "Edite as informações do plano" : "Preencha as informações do plano"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Plano</Label>
                <Input
                  placeholder="Ex: Plano Premium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-[#3D583F]/20 h-12 rounded-xl bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Preço</Label>
                <Input
                  type="number"
                  placeholder="R$ 0,00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="border-[#3D583F]/20 h-12 rounded-xl bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Recorrência</Label>
                <Select onValueChange={(value) => setIsRecurring(value === 'true')} value={isRecurring.toString()} >
                  <SelectTrigger className="border-[#3D583F]/20 h-12 rounded-xl bg-white">
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sessões por semana</Label>
                <Input
                  type="number"
                  placeholder="Número de sessões por semana"
                  value={sessionsPerWeek}
                  onChange={(e) => setSessionsPerWeek(e.target.value)}
                  className="border-[#3D583F]/20 h-12 rounded-xl bg-white"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Descrição</Label>
                <Input
                  placeholder="Descreva os benefícios do plano"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border-[#3D583F]/20 h-12 rounded-xl bg-white"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <ServiceSelect
                  selectedServices={selectedServices}
                  setSelectedServices={setSelectedServices}
                />
              </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-[#3D583F]/20 text-[#3D583F] hover:bg-[#3D583F]/5 hover:border-[#3D583F]/50 transition-all duration-200"
          >
            Cancelar
          </Button>
          <Button 
            disabled={loading} 
            onClick={handleSubmit} 
            className="bg-[#3D583F] hover:bg-[#3D583F]/90 text-base font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Carregando...</span>
              </div>
            ) : (
              editingPlan ? "Atualizar Plano" : "Criar Plano"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const PlanCard = ({ plan, onDelete, onEdit, onCreateSubscription }: { plan: Plan, onDelete: (id: number) => Promise<void>, onEdit: (plan: Plan) => void, onCreateSubscription: (plan: Plan) => void }) => {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      className="relative h-[440px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="relative h-full flex flex-col bg-white/95 backdrop-blur-sm border border-gray-100/50 rounded-2xl overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:shadow-[#3D583F]/10 hover:-translate-y-1 animate-in slide-in-from-bottom-4 fade-in duration-700">

        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#3D583F] to-transparent" />

        <CardHeader className="relative p-4 pb-3 bg-gradient-to-br from-[#3D583F]/[0.02] via-transparent to-[#3D583F]/[0.04]">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-1">
              <CardTitle className="text-lg font-bold text-gray-900">
                {plan.name}
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 leading-relaxed">
                {plan.description || "Sem descrição"}
              </CardDescription>
            </div>

            <div className="relative ml-3">
              <div className="absolute inset-0 bg-gradient-to-br from-[#3D583F] to-[#204749] rounded-xl blur-sm" />
              <div className="relative border-[#3D583F] bg-gradient-to-br from-[#F1F1E7] to-[#9EEA6C]/50 text-black px-3 py-2 rounded-xl shadow-lg">
                <div className="text-[10px] font-medium opacity-90">Preço</div>
                <div className="text-xl font-bold">
                  R$ {plan.price}
                </div>
                <div className="text-[10px] opacity-80">
                  {plan.is_recurring ? "mensal" : "único"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-1.5">
            <div className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-gradient-to-r from-[#3D583F]/10 to-[#3D583F]/20 text-[#3D583F] border border-[#3D583F]/20">
              <div className="w-1.5 h-1.5 bg-[#3D583F] rounded-full mr-1.5" />
              {plan.is_recurring ? "Mensal" : "Avulso"}
            </div>
            {plan.sessions_per_week > 0 && (
              <div className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200">
                <Clock className="w-2.5 h-2.5 mr-1" />
                {plan.sessions_per_week} sessões/sem
              </div>
            )}
          </div>
        </CardHeader>

        <div className="px-4 relative">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        <CardContent className="flex-grow p-4 pt-3 overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-1 h-4 bg-gradient-to-b from-[#3D583F] to-[#3D583F]/60 rounded-full" />
            <h4 className="text-xs font-semibold text-gray-800">Serviços incluídos</h4>
          </div>

          {plan.services && plan.services.length > 0 ? (
            <div className="space-y-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#3D583F]/20 scrollbar-track-gray-100 hover:scrollbar-thumb-[#3D583F]/40">
              {plan.services.map((service, index) => (
                <div
                  key={service.id}
                  className="flex items-center py-1.5 px-2 rounded-lg hover:bg-[#3D583F]/5"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-gradient-to-br from-[#3D583F] to-[#204749] flex items-center justify-center mr-2 shadow-sm">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-xs text-gray-700 font-medium">
                    {service.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-gray-400" />
              </div>
              <span className="text-sm text-gray-400 text-center">Nenhum serviço incluído</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="relative p-4 pt-3 mt-auto bg-gradient-to-r from-gray-50/50 via-white to-[#3D583F]/[0.02] border-t border-gray-100/50">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => onCreateSubscription(plan)}
                className="bg-[#3D583F] hover:bg-[#3D583F]/90 text-white px-3 py-1.5 h-auto text-xs font-medium rounded-lg shadow-sm"
              >
                <Users className="w-3 h-3 mr-1.5" />
                Nova Assinatura
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(plan)}
                className="text-gray-600 hover:text-[#3D583F] hover:bg-[#3D583F]/10 px-3 py-1.5 h-auto text-xs font-medium rounded-lg border border-transparent hover:border-[#3D583F]/20"
              >
                <Pencil className="w-3 h-3 mr-1.5" />
                Editar
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 h-auto text-xs font-medium rounded-lg border border-transparent hover:border-red-200"
                  >
                    <Trash2 className="w-3 h-3 mr-1.5" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-gray-200 rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-gray-800">Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600">
                      Esta ação não pode ser desfeita. O plano será permanentemente removido.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="border-gray-200 hover:bg-gray-50 rounded-lg">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(plan.id)}
                      className="bg-gradient-to-r from-[#3D583F] to-[#204749] hover:from-[#204749] hover:to-[#3D583F] rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Confirmar exclusão
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

interface Client {
  id: number;
  name: string;
  email: string;
  phone_number: string;
}

interface ClientSuggestion {
  id: number;
  display: string;
  name: string;
  email: string;
  phone: string;
}

export default function Page() {
  const { user } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [editingPlan, setEditingPlan] = React.useState<Plan | null>(null)
  const [plans, setPlans] = React.useState<Plan[]>([])
  const [reloadKey, setReloadKey] = React.useState(0)
  const { toast } = useToast()

  const [selectedPlan, setSelectedPlan] = React.useState<Plan | null>(null)
  const [totalAmount, setTotalAmount] = React.useState(0)
  const [clientName, setClientName] = React.useState('')
  const [clientEmail, setClientEmail] = React.useState('')
  const [clientPhone, setClientPhone] = React.useState('')
  const [clientCpf, setClientCpf] = React.useState('')

  const [paymentMethod, setPaymentMethod] = React.useState('')
  const [clients, setClients] = React.useState<Client[]>([])
  const [suggestions, setSuggestions] = React.useState<ClientSuggestion[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [planDuration, setPlanDuration] = React.useState('1')
  const [paymentConfirmed, setPaymentConfirmed] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [sendToAsaas, setSendToAsaas] = React.useState(false)
  const searchTimeout = React.useRef<NodeJS.Timeout | undefined>(undefined)

  const [isCreateClientOpen, setIsCreateClientOpen] = React.useState(false)
  const [isCreatingClient, setIsCreatingClient] = React.useState(false)
  const [newClientName, setNewClientName] = React.useState('')
  const [newClientEmail, setNewClientEmail] = React.useState('')
  const [newClientPhone, setNewClientPhone] = React.useState('')
  const [newClientDocument, setNewClientDocument] = React.useState('')
  const [newClientBirthday, setNewClientBirthday] = React.useState('')

  const [isCreateSubscriptionOpen, setIsCreateSubscriptionOpen] = React.useState(false)
  const [selectedPlanForSubscription, setSelectedPlanForSubscription] = React.useState<Plan | null>(null)
  const [selectedClientId, setSelectedClientId] = React.useState<string>('')
  const [subscriptionStartDate, setSubscriptionStartDate] = React.useState('')
  const [subscriptionEndDate, setSubscriptionEndDate] = React.useState('')
  const [subscriptionPaymentStatus, setSubscriptionPaymentStatus] = React.useState(false)
  const [isCreatingSubscription, setIsCreatingSubscription] = React.useState(false)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('client-dropdown')
      const trigger = event.target as Element
      
      if (dropdown && !dropdown.contains(trigger) && !trigger.closest('[data-client-select]')) {
        dropdown.classList.add('hidden')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  React.useEffect(() => {
    if (selectedPlan) {
      const duration = parseInt(planDuration) || 1;
      setTotalAmount((Number(selectedPlan.price) || 0) * duration);
    } else {
      setTotalAmount(0);
    }
  }, [selectedPlan, planDuration]);

  const fetchPlans = React.useCallback(async () => {
    try {
      const response = await api.get("/plans", {
        headers: {
          company_id: user?.company_id
        }
      });
      const data = await response.data;
      setPlans(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar planos",
        description: error.response?.data?.message || "Não foi possível carregar a lista de planos."
      });
    }
  }, [toast]);

  const fetchClients = React.useCallback(async () => {
    try {
      const data = await getClients()
      const clientsArray = Array.isArray(data) ? data : (data?.clients || [])
      setClients(clientsArray)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar clientes',
        description: error.response?.data?.message || 'Não foi possível carregar a lista de clientes.'
      })
      setClients([])
    }
  }, [toast])

  React.useEffect(() => {
    fetchPlans()
    fetchClients()
  }, [fetchPlans, fetchClients, reloadKey])

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setOpen(true)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setEditingPlan(null)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await DeletePlan(id, user?.company_id ?? 0)
      setPlans(plans.filter(plan => plan.id !== id))
      setReloadKey(prev => prev + 1)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir plano",
        description: error.response?.data?.message || "Erro ao excluir plano"
      })
      throw error
    }
  }

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatCpf = (value: string): string => {
    const numbers = value.replace(/\D/g, '');

    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return numbers.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    } else if (numbers.length <= 9) {
      return numbers.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    }

    return numbers.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setClientCpf(formatted);
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Por favor, digite o nome do cliente."
      });
      return;
    }

    if (!newClientEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Email obrigatório",
        description: "Por favor, digite o email do cliente."
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClientEmail.trim())) {
      toast({
        variant: "destructive",
        title: "Email inválido",
        description: "Por favor, digite um email válido."
      });
      return;
    }

    if (!newClientPhone.trim()) {
      toast({
        variant: "destructive",
        title: "Telefone obrigatório",
        description: "Por favor, digite o telefone do cliente."
      });
      return;
    }

    if (!newClientDocument.trim()) {
      toast({
        variant: "destructive",
        title: "CPF/CNPJ obrigatório",
        description: "Por favor, digite o CPF ou CNPJ do cliente."
      });
      return;
    }

    setIsCreatingClient(true);
    try {
      const clientData = {
        name: newClientName.trim(),
        email: newClientEmail.trim(),
        phone_number: newClientPhone.trim(),
        document: newClientDocument.trim(),
        birthday: newClientBirthday || undefined,
        password: "12345"
      };

      const response = await api.post("/clients", clientData, {
        headers: {
          company_id: user?.company_id ?? 0
        }
      });

      const newClient = response.data;
      
      setClientName(newClient.name);
      setClientEmail(newClient.email || '');
      setClientPhone(newClient.phone_number || '');
      
      setNewClientName('');
      setNewClientEmail('');
      setNewClientPhone('');
      setNewClientDocument('');
      setNewClientBirthday('');
      setIsCreateClientOpen(false);
      
      document.getElementById('client-dropdown')?.classList.add('hidden');
      
      fetchClients();
      
      toast({
        title: "Cliente criado",
        description: "O cliente foi criado e selecionado com sucesso!"
      });
    } catch (error: any) {
      console.error("Erro ao criar cliente:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar cliente",
        description: error.response?.data?.message || "Não foi possível criar o cliente."
      });
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleOpenCreateSubscription = (plan: Plan) => {
    setSelectedPlanForSubscription(plan);
    setIsCreateSubscriptionOpen(true);
    const today = new Date().toISOString().split('T')[0];
    setSubscriptionStartDate(today);
  };

  const handleCreateSubscription = async () => {
    if (!selectedClientId) {
      toast({
        variant: "destructive",
        title: "Cliente obrigatório",
        description: "Por favor, selecione um cliente."
      });
      return;
    }

    if (!subscriptionStartDate) {
      toast({
        variant: "destructive",
        title: "Data de início obrigatória",
        description: "Por favor, selecione a data de início."
      });
      return;
    }

    setIsCreatingSubscription(true);
    try {
      const subscriptionData = {
        client_id: parseInt(selectedClientId),
        plan_id: selectedPlanForSubscription?.id,
        status: 'active',
        payment_status: subscriptionPaymentStatus,
        start_date: subscriptionStartDate,
        end_date: subscriptionEndDate || undefined,
        price: selectedPlanForSubscription?.price,
        company_id: user?.company_id
      };

      await api.post("/subscriptions", subscriptionData, {
        headers: {
          company_id: user?.company_id ?? 0
        }
      });

      toast({
        title: "Assinatura criada",
        description: "A assinatura foi criada com sucesso!"
      });

      setIsCreateSubscriptionOpen(false);
      setSelectedPlanForSubscription(null);
      setSelectedClientId('');
      setSubscriptionStartDate('');
      setSubscriptionEndDate('');
      setSubscriptionPaymentStatus(false);
    } catch (error: any) {
      console.error("Erro ao criar assinatura:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar assinatura",
        description: error.response?.data?.message || "Não foi possível criar a assinatura."
      });
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Planos de Assinatura</h1>
            <p className="text-gray-600 mt-1">Gerencie os planos de assinatura do seu negócio</p>
            <div className="flex mt-4 space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 rounded-full bg-[#3D573F] mr-2"></div>
                <span>Total de planos: {plans.length}</span>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setOpen(true)}
            className="bg-[#3D573F] hover:bg-[#3D573F]/90 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Plano
          </Button>
        </div>

        <div className="relative">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-[#3D573F]/10 to-[#3D573F]/5 rounded-full blur-2xl"></div>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {plans.length > 0 ? plans.map((plan) => (
                <CarouselItem key={plan.id} className="md:basis-1/2 lg:basis-1/3 p-4">
                  <PlanCard
                    plan={plan}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onCreateSubscription={handleOpenCreateSubscription}
                  />
                </CarouselItem>
              )) : (
                <div className="w-full flex items-center justify-center min-h-[300px]">
                  <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto">
                    <div className="mx-auto w-16 h-16 bg-[#3D573F]/10 flex items-center justify-center rounded-full mb-4">
                      <Sparkles className="h-8 w-8 text-[#3D573F]" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2 text-center">Nenhum plano cadastrado</h3>
                    <p className="text-gray-600 mb-4 text-center">Crie seu primeiro plano para começar a oferecer assinaturas.</p>
                    <Button
                      onClick={() => setOpen(true)}
                      className="bg-[#3D573F] hover:bg-[#3D573F]/90"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Criar Plano
                    </Button>
                  </div>
                </div>
              )}
            </CarouselContent>
            {plans.length > 0 && (
              <div className="absolute top-1/2 -translate-y-1/2 flex justify-between w-full px-4">
                <CarouselPrevious className="bg-white border-[#3D583F]/20 hover:bg-[#3D583F]/5 text-[#3D583F]" />
                <CarouselNext className="bg-white border-[#3D583F]/20 hover:bg-[#3D583F]/5 text-[#3D583F]" />
              </div>
            )}
          </Carousel>
        </div>

        <DialogCreatePlan
          open={open}
          onOpenChange={handleOpenChange}
          editingPlan={editingPlan}
          onSuccess={() => setReloadKey(prev => prev + 1)}
        />

        <Dialog open={isCreateSubscriptionOpen} onOpenChange={setIsCreateSubscriptionOpen}>
          <DialogContent className="max-w-md bg-[#F1F1E7]">
            <DialogHeader>
              <DialogTitle>Criar Nova Assinatura</DialogTitle>
              <DialogDescription>
                Crie uma assinatura para o plano: {selectedPlanForSubscription?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="border-[#3D583F]/20 h-12 rounded-xl bg-white">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(clients) && clients.length > 0 ? (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name} - {client.phone_number}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-clients" disabled>
                        Nenhum cliente cadastrado
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={subscriptionStartDate}
                  onChange={(e) => setSubscriptionStartDate(e.target.value)}
                  className="border-[#3D583F]/20 h-12 rounded-xl bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Data de Término (Opcional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={subscriptionEndDate}
                  onChange={(e) => setSubscriptionEndDate(e.target.value)}
                  className="border-[#3D583F]/20 h-12 rounded-xl bg-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="payment_status"
                  checked={subscriptionPaymentStatus}
                  onCheckedChange={setSubscriptionPaymentStatus}
                />
                <Label htmlFor="payment_status" className="cursor-pointer">
                  Pagamento confirmado
                </Label>
              </div>

              <div className="bg-[#3D583F]/5 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Valor do plano:</span>
                  <span className="text-lg font-bold text-[#3D583F]">
                    R$ {selectedPlanForSubscription?.price ? Number(selectedPlanForSubscription.price).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateSubscriptionOpen(false)}
                className="border-[#3D583F]/20 text-[#3D583F] hover:bg-[#3D583F]/5"
              >
                Cancelar
              </Button>
              <Button
                disabled={isCreatingSubscription}
                onClick={handleCreateSubscription}
                className="bg-[#3D583F] hover:bg-[#3D583F]/90"
              >
                {isCreatingSubscription ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Criando...</span>
                  </div>
                ) : (
                  "Criar Assinatura"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
