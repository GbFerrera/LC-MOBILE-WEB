"use client";

import * as React from "react";
import { api, setupAPIInterceptors } from "@/services/api";
import { useAuth } from "@/hooks/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  UsersIcon, 
  SearchIcon, 
  PlusIcon, 
  UserIcon, 
  PhoneIcon, 
  MailIcon, 
  CalendarIcon,
  EditIcon,
  TrashIcon,
  CameraIcon,
  AlertCircleIcon,
  ChevronLeftIcon,
  UserSquare2Icon,
  Users2Icon,
  BriefcaseIcon,
  UploadIcon,
  XIcon
} from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";
import Link from "next/link";

// Interfaces
interface TeamSummary {
  owner: number;
  admin: number;
  manager: number;
  employee: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  password: string;
  position: string;
  can_schedule: boolean;
  photo_url?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  services: string[];
}

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  phone_number: string;
  position: string;
  can_schedule: boolean;
}

// Cronograma padrão para novos usuários
const defaultSchedules = [
  { day_of_week: 'Monday', start_time: "09:00", end_time: "18:00", lunch_start_time: "12:00", lunch_end_time: "13:00", is_day_off: false },
  { day_of_week: 'Tuesday', start_time: "09:00", end_time: "18:00", lunch_start_time: "12:00", lunch_end_time: "13:00", is_day_off: false },
  { day_of_week: 'Wednesday', start_time: "09:00", end_time: "18:00", lunch_start_time: "12:00", lunch_end_time: "13:00", is_day_off: false },
  { day_of_week: 'Thursday', start_time: "09:00", end_time: "18:00", lunch_start_time: "12:00", lunch_end_time: "13:00", is_day_off: false },
  { day_of_week: 'Friday', start_time: "09:00", end_time: "18:00", lunch_start_time: "12:00", lunch_end_time: "13:00", is_day_off: false },
  { day_of_week: 'Saturday', start_time: "09:00", end_time: "18:00", lunch_start_time: "12:00", lunch_end_time: "13:00", is_day_off: false },
  { day_of_week: 'Sunday', start_time: "09:00", end_time: "18:00", lunch_start_time: "12:00", lunch_end_time: "13:00", is_day_off: true }
];

// Traduções para os cargos
const positionTranslations: { [key: string]: string } = {
  'admin': 'Administrador',
  'manager': 'Gerente',
  'employee': 'Funcionário',
  'professional': 'Profissional'
};

export default function Equipe() {
  const { user } = useAuth();

  // Verificação de acesso - apenas admin e manager
  const allowedPositions = ['admin', 'manager'];
  const hasAccess = user && user.position && allowedPositions.includes(user.position.toLowerCase());

  if (user && !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <AlertCircleIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">
              Você não tem permissão para acessar a gestão de equipe.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Seu perfil:</strong> {user.position === 'employee' ? 'Funcionário' : user.position}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Acesso permitido para:</strong> Administradores e Gerentes
              </p>
            </div>
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                <ChevronLeftIcon className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Estados para formulário de criação
  const [name, setName] = React.useState<string>("");
  const [phoneNumber, setPhoneNumber] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [position, setPosition] = React.useState<string>("");
  const [canSchedule, setCanSchedule] = React.useState(false);
  
  // Estados para upload de imagem
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [avatar, setAvatar] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Estados gerais
  const [teamSummary, setTeamSummary] = React.useState<TeamSummary>({
    owner: 1,
    admin: 0,
    manager: 0,
    employee: 0
  });
  const [data, setData] = React.useState<TeamMember[]>([]);
  const [filteredData, setFilteredData] = React.useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [reloadKeyword, setReloadKeyword] = React.useState(0);
  
  // Estados para modais/drawers
  const [open, setOpen] = React.useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<TeamMember | null>(null);
  const [editLoading, setEditLoading] = React.useState(false);
  const [photoDrawerOpen, setPhotoDrawerOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<TeamMember | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoLoading, setPhotoLoading] = React.useState(false);

  // Função para criar usuário
  const CreateUser = async (companyId: number, payload: CreateUserPayload) => {
    try {
      const response = await api.post("/teams", payload, {
        headers: {
          "Content-Type": "application/json",
          "company_id": companyId.toString(),
        },
      });
      return response.data;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      throw error;
    }
  };

  // Carregar resumo da equipe
  const loadTeamSummary = React.useCallback(async () => {
    try {
      const response = await api.get("/teams", {
        headers: {
          company_id: user?.company_id
        }
      });
      
      const summary = {
        owner: 1,
        admin: 0,
        manager: 0,
        employee: 0
      };

      response.data.forEach((member: any) => {
        if (member.position === 'admin') summary.admin++;
        if (member.position === 'manager') summary.manager++;
        if (member.position === 'employee') summary.employee++;
      });

      setTeamSummary(summary);
    } catch (error) {
      console.error("Erro ao carregar resumo da equipe:", error);
    }
  }, [user?.company_id]);

  // Carregar membros da equipe
  const loadTeamMembers = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/teams", {
        headers: {
          company_id: user?.company_id?.toString()
        }
      });
      setData(response.data);
      setFilteredData(response.data);
    } catch (error) {
      console.error("Erro ao carregar membros da equipe:", error);
      toast.error("Erro ao carregar equipe");
    } finally {
      setLoading(false);
    }
  }, [user?.company_id]);

  // Filtrar dados
  React.useEffect(() => {
    const filtered = data.filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchTerm, data]);

  // Carregar dados iniciais
  React.useEffect(() => {
    if (user?.company_id) {
      loadTeamSummary();
      loadTeamMembers();
    }
  }, [loadTeamSummary, loadTeamMembers, reloadKeyword, user?.company_id]);

  // Funções para gerenciar imagem
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatar(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearImagePreview = () => {
    setImagePreview(null);
    setAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Função para submeter novo usuário
  const handleSubmit = async () => {
    try {
      setUploading(true);
      
      if (!name || !email || !password || !position) {
        toast.error("Preencha todos os campos obrigatórios");
        setUploading(false);
        return;
      }

      const payload = {
        name,
        email,
        password,
        phone_number: phoneNumber,
        position,
        can_schedule: canSchedule
      };

      const companyId = user?.company_id ?? 0;
      const createdUser = await CreateUser(companyId, payload);

      if (!createdUser || !createdUser.id) {
        toast.error("ID não retornado");
        setUploading(false);
        return;
      }

      // Upload da imagem se existir
      if (avatar && imagePreview) {
        try {
          const reader = new FileReader();
          reader.readAsDataURL(avatar);
          
          reader.onload = async () => {
            const base64Image = reader.result as string;
            
            try {
              await api.post(`/team-photos/${createdUser.id}`, 
                { base64Image },
                { 
                  headers: { 
                    company_id: user?.company_id ?? 0
                  } 
                }
              );
            } catch (error: any) {
              console.error("Erro ao fazer upload da foto:", error);
              toast.error("Usuário criado, mas houve um erro ao fazer upload da foto");
            }
          };
        } catch (error) {
          console.error("Erro ao processar a imagem:", error);
        }
      }

      // Criar cronograma padrão se pode agendar
      if (canSchedule) {
        try {
          await api.post("/schedules", {
            professional_id: createdUser.id,
            schedules: defaultSchedules
          }, {
            headers: {
              company_id: user?.company_id ?? 0
            }
          });
        } catch (error: any) {
          console.error("Erro ao criar cronograma padrão:", error);
          toast.error("Usuário criado, mas houve um erro ao criar o cronograma padrão");
        }
      }

      toast.success("Usuário criado com sucesso");

      // Limpar formulário
      setName("");
      setEmail("");
      setPassword("");
      setPhoneNumber("");
      setPosition("");
      setCanSchedule(false);
      clearImagePreview();
      setOpen(false);
      setReloadKeyword(prev => prev + 1);
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      toast.error(error.response?.data?.message || error.message || "Erro desconhecido");
    } finally {
      setUploading(false);
    }
  };

  // Função para editar membro
  const handleEditMember = async () => {
    if (!editingMember) return;

    try {
      setEditLoading(true);
      const response = await api.put(`/teams/${editingMember.id}`, {
        name: editingMember.name,
        email: editingMember.email,
        phone_number: editingMember.phone_number,
        password: editingMember.password,
        position: editingMember.position
      }, {
        headers: {
          company_id: user?.company_id?.toString()
        }
      });

      if (response.status === 200) {
        toast.success("Integrante atualizado com sucesso!");
        loadTeamMembers();
        setEditDrawerOpen(false);
      }
    } catch (error: any) {
      console.error("Erro ao atualizar integrante:", error);
      toast.error("Erro ao atualizar integrante");
    } finally {
      setEditLoading(false);
    }
  };

  // Função para deletar membro
  const handleDeleteMember = async (memberId: string) => {
    try {
      const response = await api.delete(`/teams/${memberId}`, {
        headers: {
          company_id: user?.company_id?.toString()
        }
      });

      toast.success("Usuário removido com sucesso!");
      loadTeamMembers();
    } catch (error: any) {
      console.error("Erro ao remover usuário:", error);
      let errorMessage = "Erro ao remover usuário";

      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = "Você não tem permissão para remover este usuário";
        } else if (error.response.status === 404) {
          errorMessage = "Usuário não encontrado";
        } else if (error.response.status === 500) {
          errorMessage = "Erro interno do servidor. Por favor, tente novamente mais tarde";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }

      toast.error(errorMessage);
    }
  };

  // Funções para gerenciar fotos
  const handleOpenPhotoDrawer = (member: TeamMember) => {
    setSelectedMember(member);
    setPhotoPreview(member.photo_url || null);
    setPhotoDrawerOpen(true);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedMember || !photoFile) return;

    try {
      setPhotoLoading(true);

      const reader = new FileReader();
      reader.readAsDataURL(photoFile);

      reader.onload = async () => {
        const base64Image = reader.result as string;

        try {
          const response = await api.post(`/team-photos/${selectedMember.id}`,
            { base64Image },
            {
              headers: {
                company_id: user?.company_id?.toString()
              }
            }
          );

          if (response.status === 201) {
            toast.success("Foto de perfil atualizada com sucesso!");
            loadTeamMembers();
            setPhotoDrawerOpen(false);
          }
        } catch (error: any) {
          console.error("Erro ao fazer upload da foto:", error);
          toast.error("Erro ao atualizar foto de perfil");
        } finally {
          setPhotoLoading(false);
        }
      };
    } catch (error: any) {
      console.error("Erro ao processar a imagem:", error);
      toast.error("Erro ao processar a imagem");
      setPhotoLoading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedMember) return;

    try {
      setPhotoLoading(true);
      const response = await api.delete(`/team-photos/${selectedMember.id}`, {
        headers: {
          company_id: user?.company_id?.toString()
        }
      });

      if (response.status === 200) {
        toast.success("Foto de perfil removida com sucesso!");
        setPhotoPreview(null);
        loadTeamMembers();
      }
    } catch (error: any) {
      console.error("Erro ao remover foto:", error);
      toast.error("Erro ao remover foto de perfil");
    } finally {
      setPhotoLoading(false);
    }
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data não disponível';
    return date.toLocaleDateString('pt-BR');
  };

  // Função para obter label da posição
  const getPositionLabel = (position: string) => {
    return positionTranslations[position as keyof typeof positionTranslations] || position;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando equipe...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Gestão de Equipe</h1>
          <div className="w-8" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <UserSquare2Icon className="h-6 w-6 mx-auto mb-1" />
            <p className="text-xs opacity-90">Admins</p>
            <p className="text-lg font-bold">{teamSummary.admin}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <Users2Icon className="h-6 w-6 mx-auto mb-1" />
            <p className="text-xs opacity-90">Gerentes</p>
            <p className="text-lg font-bold">{teamSummary.manager}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <UserIcon className="h-6 w-6 mx-auto mb-1" />
            <p className="text-xs opacity-90">Funcionários</p>
            <p className="text-lg font-bold">{teamSummary.employee}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar membros da equipe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/90 border-0 text-gray-800 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Add Member Button */}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg">
              <PlusIcon className="h-5 w-5 mr-2" />
              Novo Integrante
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader>
                <DrawerTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Novo Integrante
                </DrawerTitle>
                <DrawerDescription>
                  Adicione um novo membro à sua equipe
                </DrawerDescription>
              </DrawerHeader>

              <div className="p-4 space-y-4">
                {/* Photo Upload */}
                <div className="flex flex-col items-center space-y-3">
                  <div 
                    className="relative cursor-pointer group"
                    onClick={triggerFileInput}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-20 h-20 rounded-full object-cover border-2 border-emerald-200"
                          style={{ objectFit: 'cover' }}
                        />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            clearImagePreview();
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                          type="button"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <CameraIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 text-center">Toque para adicionar foto</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">Nome *</Label>
                    <Input
                      id="name"
                      placeholder="Nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm font-medium">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="******"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="position" className="text-sm font-medium">Cargo *</Label>
                    <Select value={position} onValueChange={setPosition}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="employee">Funcionário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can-schedule"
                      checked={canSchedule}
                      onCheckedChange={setCanSchedule}
                    />
                    <Label htmlFor="can-schedule" className="text-sm">
                      Realiza agendamentos?
                    </Label>
                  </div>
                </div>
              </div>

              <DrawerFooter>
                <Button 
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Criando...
                    </div>
                  ) : (
                    'Criar Integrante'
                  )}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Team Members List */}
        {filteredData.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum membro encontrado</h3>
              <p className="text-gray-600 text-sm">
                {searchTerm ? 'Tente ajustar sua busca' : 'Adicione o primeiro membro da equipe'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredData.map((member) => (
              <Card key={member.id} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-12 w-12">
                      {member.photo_url ? (
                        <AvatarImage src={member.photo_url} alt={member.name} className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-emerald-100 text-emerald-600">
                          {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-800 truncate">{member.name}</h3>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingMember(member);
                              setEditDrawerOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPhotoDrawer(member)}
                            className="h-8 w-8 p-0"
                          >
                            <CameraIcon className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover {member.name}? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteMember(member.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                          {getPositionLabel(member.position)}
                        </Badge>
                        {member.can_schedule && (
                          <Badge variant="outline" className="border-emerald-200 text-emerald-600">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            Agenda
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MailIcon className="h-3 w-3 mr-2 text-emerald-500" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        {member.phone_number && (
                          <div className="flex items-center">
                            <PhoneIcon className="h-3 w-3 mr-2 text-emerald-500" />
                            <span>{member.phone_number}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-2 text-emerald-500" />
                          <span>Desde {formatDate(member.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Counter */}
        {searchTerm && (
          <div className="text-center py-2">
            <p className="text-sm text-gray-600">
              {filteredData.length} de {data.length} membros encontrados
            </p>
          </div>
        )}
      </div>

      {/* Edit Member Drawer */}
      <Drawer open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Editar Integrante</DrawerTitle>
              <DrawerDescription>
                Atualize as informações do membro da equipe
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-4 space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editingMember?.name || ""}
                  onChange={(e) => setEditingMember(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>

              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingMember?.email || ""}
                  onChange={(e) => setEditingMember(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>

              <div>
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={editingMember?.phone_number || ""}
                  onChange={(e) => setEditingMember(prev => prev ? { ...prev, phone_number: e.target.value } : null)}
                />
              </div>

              <div>
                <Label htmlFor="edit-password">Senha</Label>
                <Input
                  id="edit-password"
                  value={editingMember?.password || ""}
                  onChange={(e) => setEditingMember(prev => prev ? { ...prev, password: e.target.value } : null)}
                />
              </div>

              <div>
                <Label htmlFor="edit-position">Cargo</Label>
                <Select 
                  value={editingMember?.position || ""} 
                  onValueChange={(value) => setEditingMember(prev => prev ? { ...prev, position: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="employee">Funcionário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DrawerFooter>
              <Button 
                onClick={handleEditMember}
                disabled={editLoading}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {editLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Salvando...
                  </div>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Photo Management Drawer */}
      <Drawer open={photoDrawerOpen} onOpenChange={setPhotoDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Gerenciar Foto</DrawerTitle>
              <DrawerDescription>
                Atualize a foto de perfil de {selectedMember?.name}
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-4 space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-emerald-200"
                        style={{ objectFit: 'cover' }}
                      />
                      <button
                        onClick={() => setPhotoPreview(null)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                      <CameraIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon className="h-4 w-4 mr-2" />
                    {photoPreview ? "Trocar" : "Selecionar"}
                  </Button>

                  {photoPreview && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeletePhoto}
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <DrawerFooter>
              <Button 
                onClick={handlePhotoUpload}
                disabled={photoLoading || !photoFile}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {photoLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Salvando...
                  </div>
                ) : (
                  'Salvar Foto'
                )}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}