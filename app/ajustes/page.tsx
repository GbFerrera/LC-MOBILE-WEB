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

export default function AjustesPage() {
  // Mock data - in a real app this would come from a database
  const barberInfo = {
    name: "Samuel",
    businessName: "Barbearia Link",
    email: "samuel@barbearialink.com.br",
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
          toggleValue: true,
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
          title: "Aparência",
          icon: PaletteIcon,
          color: "text-pink-500",
          bgColor: "bg-pink-100",
        },
      ],
    },
    {
      title: "Dados e Privacidade",
      items: [
        {
          id: "backup",
          title: "Backup de Dados",
          icon: UploadIcon,
          color: "text-cyan-500",
          bgColor: "bg-cyan-100",
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-emerald-800 text-white p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-emerald-100">
            <ChevronLeftIcon className="h-6 w-6" />
          </Link>
          <h1 className="font-bold text-xl">Ajustes</h1>
          <div className="w-6"></div> {/* Empty div for spacing */}
        </div>
      </header>

      {/* Profile Card */}
      <div className="p-4">
        <Card className="border-none shadow-sm overflow-hidden mb-6">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 p-4">
              <div className="flex items-center">
                <Avatar className="h-16 w-16 border-2 border-white mr-4">
                  <AvatarImage
                    src={barberInfo.avatarUrl}
                    alt={barberInfo.name}
                  />
                  <AvatarFallback className="bg-emerald-600 text-white">
                    {barberInfo.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <h2 className="font-bold text-lg">{barberInfo.name}</h2>
                  <p className="text-emerald-100 text-sm">
                    {barberInfo.businessName}
                  </p>
                  <p className="text-emerald-200 text-xs mt-1">
                    {barberInfo.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full text-white border-emerald-100 hover:bg-emerald-800"
              >
                Editar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Groups */}
        <div className="space-y-6">
          {settingsGroups.map((group) => (
            <div key={group.title}>
              <h3 className="font-medium text-gray-700 mb-3">{group.title}</h3>
              <Card className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {group.items.map((item, index) => (
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
                          <Switch defaultChecked={item.toggleValue} />
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
