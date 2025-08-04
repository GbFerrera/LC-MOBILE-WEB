"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
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
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function AjustesPage() {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // Estados para os switches
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  
  // Função para lidar com mudanças nos switches
  const handleToggle = (setting: string, value: boolean) => {
    switch (setting) {
      case 'notifications':
        setNotifications(value);
        break;
      case 'appearance':
        setDarkMode(value);
        break;
      case 'backup':
        setAutoBackup(value);
        break;
    }
    
    toast({
      title: "Configuração atualizada",
      description: `${setting === 'notifications' ? 'Notificações' : setting === 'appearance' ? 'Modo escuro' : 'Backup automático'} ${value ? 'ativado' : 'desativado'}.`,
    });
  };
  
  // Função para logout
  const handleLogout = () => {
    signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  // Dados do usuário atual ou mock data
  const userInfo = {
    name: user?.name || "Usuário",
    businessName: "Barbearia Link",
    email: user?.email || "usuario@barbearialink.com.br",
    phone: "(11) 99876-5432",
    avatarUrl: "/barber-avatar.png",
  };

  // Definindo tipos para os itens de configuração
  type SettingItem = {
    id: string;
    title: string;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
    toggle?: boolean;
    toggleValue?: boolean;
    danger?: boolean;
  };

  type SettingGroup = {
    title: string;
    items: SettingItem[];
  };

  const settingsGroups: SettingGroup[] = [
    {
      title: "Perfil e Negócio",
      items: [
        {
          id: "profile",
          title: "Informações Pessoais",
          icon: UserIcon,
          color: "text-blue-500",
          bgColor: "bg-blue-100",
        },
        {
          id: "business",
          title: "Dados da Barbearia",
          icon: StoreIcon,
          color: "text-emerald-500",
          bgColor: "bg-emerald-100",
        },
        {
          id: "services",
          title: "Serviços e Preços",
          icon: ScissorsIcon,
          color: "text-amber-500",
          bgColor: "bg-amber-100",
        },
      ],
    },
    {
      title: "Preferências",
      items: [
        {
          id: "notifications",
          title: "Notificações",
          icon: BellIcon,
          color: "text-purple-500",
          bgColor: "bg-purple-100",
          toggle: true,
          toggleValue: notifications,
        },
        {
          id: "schedule",
          title: "Horário de Funcionamento",
          icon: ClockIcon,
          color: "text-indigo-500",
          bgColor: "bg-indigo-100",
        },
        {
          id: "payment",
          title: "Métodos de Pagamento",
          icon: CreditCardIcon,
          color: "text-green-500",
          bgColor: "bg-green-100",
        },
        {
          id: "appearance",
          title: "Modo Escuro",
          icon: PaletteIcon,
          color: "text-pink-500",
          bgColor: "bg-pink-100",
          toggle: true,
          toggleValue: darkMode,
        },
      ],
    },
    {
      title: "Dados e Privacidade",
      items: [
        {
          id: "backup",
          title: "Backup Automático",
          icon: UploadIcon,
          color: "text-cyan-500",
          bgColor: "bg-cyan-100",
          toggle: true,
          toggleValue: autoBackup,
        },
        {
          id: "privacy",
          title: "Privacidade e Segurança",
          icon: ShieldIcon,
          color: "text-red-500",
          bgColor: "bg-red-100",
        },
      ],
    },
    {
      title: "Suporte",
      items: [
        {
          id: "help",
          title: "Ajuda e Suporte",
          icon: HelpCircleIcon,
          color: "text-teal-500",
          bgColor: "bg-teal-100",
        },
        {
          id: "logout",
          title: "Sair",
          icon: LogOutIcon,
          color: "text-gray-500",
          bgColor: "bg-gray-100",
          danger: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-white`}>Ajustes</h1>
          <div className="w-10" />
        </div>

        {/* Profile Card */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 p-4">
              <div className="flex items-center">
                <Avatar className={`${isMobile ? 'h-12 w-12' : 'h-16 w-16'} border-2 border-white mr-4`}>
                  <AvatarImage
                    src={userInfo.avatarUrl}
                    alt={userInfo.name}
                  />
                  <AvatarFallback className="bg-emerald-600 text-white">
                    {userInfo.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <h2 className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>{userInfo.name}</h2>
                  <p className={`text-emerald-100 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {userInfo.businessName}
                  </p>
                  <p className={`text-emerald-200 ${isMobile ? 'text-xs' : 'text-xs'} mt-1`}>
                    {userInfo.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                className="mt-3 w-full text-white border-emerald-100 hover:bg-emerald-800"
              >
                Editar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className={`${isMobile ? 'px-2 py-4' : 'px-4 py-6'}`}>
        {/* Settings Groups */}
        <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
          {settingsGroups.map((group) => (
            <div key={group.title}>
              <h3 className="font-medium text-gray-700 mb-3">{group.title}</h3>
              <Card className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 ${
                          item.danger ? "text-red-500" : ""
                        }`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`${item.bgColor} p-2 rounded-full mr-3`}
                          >
                            <item.icon className={`h-5 w-5 ${item.color}`} />
                          </div>
                          <span
                            className={`${
                              item.danger ? "text-red-500" : "text-gray-700"
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>
                        {item.toggle ? (
                          <Switch 
                            checked={item.toggleValue} 
                            onCheckedChange={(checked) => handleToggle(item.id, checked)}
                          />
                        ) : item.id === 'logout' ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleLogout}
                            className="text-red-500 hover:text-red-600"
                          >
                            Sair
                          </Button>
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* App Version */}
      <div className="mt-auto p-4 text-center">
        <p className="text-xs text-gray-500">Barbearia Link v1.0.0</p>
        <p className="text-xs text-gray-400 mt-1">
          © 2025 Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
