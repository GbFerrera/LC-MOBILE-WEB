"use client";

import { AuthProvider } from "@/hooks/auth";
import { Toaster } from "sonner";
import AppSidebar from "@/components/app-sidebar";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { useEffect } from "react";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { useCompanyContext } from "@/contexts/CompanyContext";


function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === "/Login" || pathname === "/login";

  function HeaderCompanyName() {
    const { currentCompanyName } = useCompanyContext();
    return <span className="text-lg font-bold">{currentCompanyName || "Link Callendar"}</span>;
  }

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !isLoginRoute) {
      router.push("/Login");
    } else if (isAuthenticated && isLoginRoute) {
      router.push("/");
    }
  }, [isAuthenticated, loading, isLoginRoute, router]);

  if (!isAuthenticated && !isLoginRoute) {
    return null;
  }

  if (isLoginRoute) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <CompanyProvider>
      <SidebarProvider defaultOpen>
        <div className="flex min-h-screen w-full">
          <Sidebar variant="inset">
            <AppSidebar />
          </Sidebar>
          <SidebarInset>
            <div className="sticky top-0 z-10 border-b text-white" style={{ backgroundColor: "#3D583F" }}>
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="text-white">
                  <SidebarTrigger />
                </div>
                <HeaderCompanyName />
              </div>
            </div>
            <div className="">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </CompanyProvider>
  );
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
      <Toaster 
        position="top-center"
        richColors={true}
        expand={true}
        closeButton={true}
        theme="light"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'white',
            color: 'black',
            border: '1px solid #ccc',
          },
        }}
      />
    </AuthProvider>
  );
}
