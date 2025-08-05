"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeftIcon,
  BellIcon,
  ClockIcon,
  CreditCardIcon,
  UserIcon,
  PaletteIcon,
  ShieldIcon,
  HelpCircleIcon,
  LogOutIcon,
  ScissorsIcon,
  StoreIcon,
  UploadIcon,
  PencilIcon,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function AjustesPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone_number: "",
    position: "",
    password: ""
  });
  const [currentUserData, setCurrentUserData] = useState({
    name: user?.name || "Samuel",
    email: user?.email || "samuel@barbearialink.com.br",
    phone_number: "",
    position: ""
  });

  // Dados do barbeiro - agora usando estado local que pode ser atualizado
  const barberInfo = {
    name: currentUserData.name,
    businessName: "Barbearia Link",
    email: currentUserData.email,
    phone: currentUserData.phone_number || "(11) 99876-5432",
    avatarUrl: profilePhoto || "/barber-avatar.png",
  };

  // Buscar foto do perfil
  const fetchProfilePhoto = async () => {
    if (!user?.id) return;
    
    try {
      const response = await api.get(`/team-photos/${user.id}`);
      if (response.data?.photo_url) {
        setProfilePhoto(response.data.photo_url);
      }
    } catch (error) {
      console.log('Foto de perfil não encontrada ou erro:', error);
    }
  };

  // Buscar dados completos do usuário
  const fetchUserData = async () => {
    if (!user?.id) return;
    
    try {
      const response = await api.get(`/teams/${user.id}`);
      const userData = response.data;
      const userInfo = {
        name: userData.name || "",
        email: userData.email || "",
        phone_number: userData.phone_number || "",
        position: userData.position || ""
      };
      
      setEditForm({ ...userInfo, password: "" });
      setCurrentUserData(userInfo);
      
      if (userData.photo_url) {
        setProfilePhoto(userData.photo_url);
      }
    } catch (error: any) {
      console.log('Não foi possível buscar dados detalhados do usuário, usando dados do contexto de autenticação:', error.response?.status);
      // Usar dados do contexto de autenticação se a API falhar
      const fallbackData = {
        name: user.name || "",
        email: user.email || "",
        phone_number: "", // Não disponível no contexto
        position: "" // Não disponível no contexto
      };
      setEditForm({ ...fallbackData, password: "" });
      setCurrentUserData(fallbackData);
    }
  };

  // Effect para inicializar dados quando componente monta
  useEffect(() => {
    if (user?.id) {
      // Primeiro, inicializa com dados do contexto de autenticação
      const initialData = {
        name: user.name || "",
        email: user.email || "",
        phone_number: "",
        position: ""
      };
      setEditForm({ ...initialData, password: "" });
      setCurrentUserData(initialData);
      
      // Então tenta buscar dados mais detalhados da API
      fetchUserData();
      fetchProfilePhoto();
    }
  }, [user]);

  // Atualizar perfil
  const handleUpdateProfile = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const updateData: any = {
        name: editForm.name,
        email: editForm.email,
        phone_number: editForm.phone_number,
        position: editForm.position
      };
      
      // Só inclui senha se foi preenchida
      if (editForm.password.trim()) {
        updateData.password = editForm.password;
      }
      
      // Adicionar headers necessários (company_id pode ser requerido)
      const config = {
        headers: {
          'company_id': user.company_id || '1' // Usa company_id do usuário ou fallback
        }
      };
      
      console.log('Tentando atualizar perfil:', { userId: user.id, updateData, headers: config.headers });
      
      const response = await api.put(`/teams/${user.id}`, updateData, config);
      
      toast.success("Perfil atualizado com sucesso!");
      setIsEditDialogOpen(false);
      
      // Atualizar dados localmente imediatamente
      const updatedData = {
        name: editForm.name,
        email: editForm.email,
        phone_number: editForm.phone_number,
        position: editForm.position
      };
      setCurrentUserData(updatedData);
      
      // Atualizar foto se vier na resposta
      if (response.data?.user?.photo_url) {
        setProfilePhoto(response.data.user.photo_url);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      
      // Melhor tratamento de erros
      if (error.response?.status === 404) {
        toast.error("Usuário não encontrado. Verifique se você tem permissão para editar este perfil.");
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || "Dados inválidos. Verifique os campos preenchidos.");
      } else {
        toast.error(error.response?.data?.message || "Erro ao atualizar perfil. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Configurações filtradas - removido "Informações Pessoais" (já está no Profile Card)
  const settingButtons = [
    {
      id: "services",
      title: "Serviços e Preços",
      description: "Gerencie sua tabela de serviços",
      icon: ScissorsIcon,
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-50 to-orange-50",
    },
    {
      id: "schedule",
      title: "Horário de Funcionamento",
      description: "Defina seus horários de trabalho",
      icon: ClockIcon,
      gradient: "from-indigo-500 to-blue-600",
      bgGradient: "from-indigo-50 to-blue-50",
    },
    {
      id: "business",
      title: "Dados da Barbearia",
      description: "Configure informações do negócio",
      icon: StoreIcon,
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50",
    },
  ];

  const handleLogout = () => {
    signOut();
    router.push("/Login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">
              <ChevronLeftIcon className="h-7 w-7" />
            </Link>
            <h1 className="font-bold text-2xl tracking-wide">Ajustes</h1>
            <div className="w-7"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Profile Card Redesigned - Tamanho Ajustado */}
        <Card className="border-none shadow-2xl overflow-hidden mb-8 bg-gradient-to-r from-white to-emerald-50/30 max-w-4xl mx-auto">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 relative">
              {/* Header Profile Info */}
              <div className="flex items-center mb-8">
                <Avatar className="h-28 w-28 border-4 border-white/30 shadow-2xl mr-8">
                  <AvatarImage
                    src={barberInfo.avatarUrl}
                    alt={barberInfo.name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-3xl font-bold">
                    {barberInfo.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white flex-1">
                  <h2 className="font-bold text-4xl tracking-wide mb-3">{barberInfo.name}</h2>
                  <p className="text-emerald-100 text-2xl font-medium mb-2">
                    {barberInfo.businessName}
                  </p>
                  <p className="text-emerald-200 text-lg">
                    {barberInfo.email}
                  </p>
                  {barberInfo.phone && (
                    <p className="text-emerald-300 text-base mt-1">
                      {barberInfo.phone}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Action Buttons Row */}
              <div className="flex gap-4 items-center justify-end">
                {/* Edit Profile Icon Button */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      className="bg-gradient-to-br from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 h-14 w-14 rounded-2xl border-2 border-white/30"
                    >
                      <PencilIcon className="h-6 w-6" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Editar Perfil</DialogTitle>
                      <DialogDescription>
                        Atualize suas informações pessoais.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Nome
                        </Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          value={editForm.phone_number}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone_number: e.target.value }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="position" className="text-right">
                          Cargo
                        </Label>
                        <Input
                          id="position"
                          value={editForm.position}
                          onChange={(e) => setEditForm(prev => ({ ...prev, position: e.target.value }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          Nova Senha
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={editForm.password}
                          onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                          className="col-span-3"
                          placeholder="Deixe vazio para manter atual"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        onClick={handleUpdateProfile}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                      >
                        {isLoading ? "Salvando..." : "Salvar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                {/* Logout Button */}
                <Button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-700 hover:to-red-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold flex items-center gap-3 px-8 py-4 rounded-2xl border-none text-lg"
                >
                  <LogOutIcon className="h-6 w-6" />
                  <span>Sair</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Buttons - Vertical Stack */}
        <div className="flex flex-col gap-4 w-full max-w-lg mx-auto mt-6 px-4 sm:px-0">
          {settingButtons.map((setting, index) => (
            <Card 
              key={setting.id} 
              className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer overflow-hidden hover:shadow-emerald-200"
            >
              <CardContent className="p-0">
                <div className={`bg-gradient-to-br ${setting.bgGradient} p-4 sm:p-6 h-full`}>
                  <div className="flex items-center gap-4">
                    <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${setting.gradient} shadow-lg flex-shrink-0`}>
                      <setting.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg sm:text-xl mb-1 text-gray-800">
                        {setting.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                        {setting.description}
                      </p>
                    </div>
                    <Button 
                      size="sm"
                      className={`bg-gradient-to-r ${setting.gradient} hover:shadow-lg transition-all duration-300 text-white font-semibold px-4 py-2 rounded-xl text-sm flex-shrink-0`}
                    >
                      Configurar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* App Version */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 999,
          background: '#fff',
          textAlign: 'center',
          padding: '8px 0',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.03)'
        }}>
          <p className="text-sm text-gray-500 font-medium">Barbearia Link v1.0.0</p>
          <p className="text-sm text-gray-400 mt-2">
            © 2025 Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
