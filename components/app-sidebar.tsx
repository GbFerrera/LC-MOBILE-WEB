"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth";
import { useCompanyContext } from "@/contexts/CompanyContext";
import Image from "next/image";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  BarChart3Icon,
  CalendarIcon,
  UsersIcon,
  ShoppingBagIcon,
  WalletIcon,
  HandCoinsIcon,
  PackageIcon,
  TargetIcon,
  SettingsIcon,
  ActivityIcon,
  Building,
  Building2,
  ChevronRight,
  Check,
  CalendarCheck,
  UserPlus
} from "lucide-react";

export default function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { user } = useAuth();
  const { currentCompanyName } = useCompanyContext();
  const { signOut } = useAuth();
  const {
    availableCompanies,
    isLoading,
    switchToCompany,
    switchToBranch,
    isInBranchContext,
  } = useCompanyContext();
  const belongsToCompany = (company: any) => company.id === user?.company_id || (company.branches || []).some((b: any) => b.id === user?.company_id);

  const grupos = [
    {
      titulo: "Principais",
      itens: [
        { href: "/", label: "Início", icon: BarChart3Icon },
        { href: "/agenda", label: "Agenda", icon: CalendarIcon },
        { href: "/clientes", label: "Clientes", icon: UsersIcon },
        { href: "/comandas", label: "Comandas", icon: ShoppingBagIcon },
      ],
    },
    {
      titulo: "Financeiro",
      itens: [
        { href: "/financas", label: "Finanças", icon: WalletIcon },
        { href: "/commissions", label: "Comissões", icon: HandCoinsIcon },
        { href: "/remuneration", label: "Remunerações", icon: HandCoinsIcon },
        { href: "/transactions", label: "Despesas", icon: ActivityIcon },
      ],
    },
    {
      titulo: "Assinaturas",
      itens: [
        { href: "/assinaturas", label: "Assinaturas", icon: CalendarCheck },
        { href: "/assinaturas/planos", label: "Planos", icon: UserPlus },
      ],
    },
    {
      titulo: "Operações",
      itens: [
        { href: "/produtos", label: "Produtos", icon: PackageIcon },
      ],
    },
    {
      titulo: "Equipe",
      itens: [
        { href: "/equipe", label: "Equipe", icon: UsersIcon },
        { href: "/metas", label: "Metas", icon: TargetIcon },
      ],
    },
    {
      titulo: "Sistema",
      itens: [
        { href: "/ajustes", label: "Ajustes", icon: SettingsIcon },
      ],
    },
  ];

  return (
    <>
      <SidebarHeader>
        <div className="px-3 py-3 flex items-center gap-3 bg-[#3D583F] text-white rounded-md">
          <Image src="/icon.png" alt="Link Callendar" width={28} height={28} className="rounded-md" />
          <div>
            <div className="text-base font-semibold">{currentCompanyName || "Link Callendar"}</div>
            <div className="text-xs text-white/80">{user?.name}</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarGroup>
        <SidebarGroupLabel className="text-[#3D583F]">Unidades</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {isLoading ? (
              <SidebarMenuItem>
                <SidebarMenuButton disabled>Carregando...</SidebarMenuButton>
              </SidebarMenuItem>
            ) : (
              availableCompanies.map((company) => (
                <Collapsible key={company.id}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={belongsToCompany(company)}>
                      <Building2 className={belongsToCompany(company) ? "h-4 w-4 text-[#3D583F]" : "h-4 w-4"} />
                      <span>{company.name}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          onClick={() => {
                            switchToCompany(company.id);
                            if (isMobile) setOpenMobile(false);
                          }}
                          className={(!isInBranchContext && user?.company_id === company.id) ? "bg-[#3D583F]/10 text-[#3D583F] border-l-2 border-[#3D583F]" : ""}
                        >
                          <Building2 className={(!isInBranchContext && user?.company_id === company.id) ? "h-4 w-4 text-[#3D583F]" : "h-4 w-4"} />
                          <span>Matriz</span>
                          {(!isInBranchContext && user?.company_id === company.id) && <Check className="ml-auto h-4 w-4 text-[#3D583F]" />}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      {(company.branches || []).map((branch: any) => (
                        <SidebarMenuSubItem key={branch.id}>
                          <SidebarMenuSubButton
                            onClick={() => {
                              switchToBranch(branch.id);
                              if (isMobile) setOpenMobile(false);
                            }}
                            className={(isInBranchContext && user?.company_id === branch.id) ? "bg-[#3D583F]/10 text-[#3D583F] border-l-2 border-[#3D583F]" : ""}
                          >
                            <Building className={(isInBranchContext && user?.company_id === branch.id) ? "h-4 w-4 text-[#3D583F]" : "h-4 w-4"} />
                            <span>{branch.name}</span>
                            {(isInBranchContext && user?.company_id === branch.id) && <Check className="ml-auto h-4 w-4 text-[#3D583F]" />}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarContent className="flex flex-col gap-2">
        {grupos.map((grupo) => (
          <SidebarGroup key={grupo.titulo}>
            <SidebarGroupLabel className="text-[#3D583F]">{grupo.titulo}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.itens.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className={
                          isActive
                            ? "bg-[#3D583F]/10 text-[#3D583F] border-l-4 border-[#3D583F] pl-[calc(0.5rem-4px)]"
                            : "hover:bg-[#3D583F]/5"
                        }
                      >
                        <Link
                          href={item.href}
                          className="flex items-center gap-2"
                          onClick={() => {
                            if (isMobile) setOpenMobile(false);
                          }}
                        >
                          <Icon className={isActive ? "h-4 w-4 text-[#3D583F]" : "h-4 w-4"} />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="bg-[#3D583F] text-white"
              onClick={() => {
                if (isMobile) setOpenMobile(false);
                signOut();
              }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              <span >Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 text-xs text-muted-foreground">© {new Date().getFullYear()} Link Callendar</div>
      </SidebarFooter>

      {/* Rail para abrir/fechar no desktop */}
      <SidebarRail />
    </>
  );
}
