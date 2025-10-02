"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
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
import { CirclePlus } from "lucide-react"; // Ícone padrão

type ButtonVariant =
  | "default"
  | "link"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "custom"
  | null
  | undefined;

type DrawerSize = "sm" | "md" | "lg" | "xl"; // Definindo os possíveis tamanhos

interface DrawerComponentProps {
  buttonTitle?: string;
  buttonIcon?: React.ReactNode;
  drawerTitle?: React.ReactNode;
  drawerDescription?: string;
  footerActionsTitle: string;
  buttonVariant?: ButtonVariant;
  children: React.ReactNode;
  onOpen?: () => Promise<void> | void;
  size?: DrawerSize;
  onFooterActionClick?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
}

export function DrawerComponent({
  buttonTitle,
  buttonIcon,
  drawerTitle = "Título padrão",
  drawerDescription = "Descrição padrão",
  footerActionsTitle,
  buttonVariant = "default",
  children,
  onOpen,
  size = "md",
  onFooterActionClick,
  open,
  onOpenChange,
  loading = false,
}: DrawerComponentProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {buttonTitle && (
        <DrawerTrigger asChild>
          <Button className="bg-[#236F5D] text-white hover:bg-[#1a5446]" onClick={onOpen}>
            {buttonTitle}
            {buttonIcon || <CirclePlus className="h-4 w-4 mr-2" />}
          </Button>
        </DrawerTrigger>
      )}
      <DrawerContent>
        <div className={`mx-auto w-full ${size === 'sm' ? 'max-w-sm' : size === 'md' ? 'max-w-md' : size === 'lg' ? 'max-w-lg' : 'max-w-xl'}`}>
          <DrawerHeader>
            <DrawerTitle>{drawerTitle}</DrawerTitle>
            <DrawerDescription>{drawerDescription}</DrawerDescription>
          </DrawerHeader>

          {children}

          <DrawerFooter>
            <div className="px-4 space-y-2">
              <Button 
                className="bg-[#236F5D] hover:bg-[#1a5446] disabled:opacity-50 w-full" 
                disabled={loading} 
                onClick={loading ? undefined : onFooterActionClick}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Carregando...</span>
                  </div>
                ) : (
                  footerActionsTitle
                )}
              </Button>
              {loading ? (
                <Button variant="outline" className="w-full" disabled>
                  Cancelar
                </Button>
              ) : (
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">Cancelar</Button>
                </DrawerClose>
              )}
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
