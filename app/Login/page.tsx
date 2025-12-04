"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ScissorsIcon,
  LogInIcon,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { toast } from "sonner";
import Image from "next/image";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const { signIn, loading, user } = useAuth();
  const router = useRouter();

  // Função para atualizar os dados do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Função para validar o formulário
  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("Preencha todos os campos");
      return false;
    }

    if (formData.password.length < 4) {
      setError("A senha deve ter pelo menos 4 caracteres");
      return false;
    }

    return true;
  };

  // Função para fazer login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      // Usar o hook de autenticação para fazer login
      await signIn({
        email: formData.email,
        password: formData.password,
      });
      // O redirecionamento é feito automaticamente pelo hook de autenticação
    } catch (error: any) {
      console.error("Erro no login:", error);
      
      let errorMessage = "Ocorreu um erro ao fazer login. Tente novamente.";
      
      // Tratar diferentes tipos de erro
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Exibir erro tanto no estado local quanto no toast
      setError(errorMessage);
      toast.error("Erro no login", {
        description: errorMessage,
      });
    }
  };

  useEffect(() => {
    if(user) {
      router.push("/")
    }
  }, [])

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4" style={{ backgroundColor: "#3D583F" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Image src="/favicon.png" alt="" width={160} height={160} className="absolute top-6 left-8 opacity-20 rotate-12" aria-hidden />
        <Image src="/favicon.png" alt="" width={96} height={96} className="absolute top-14 right-16 opacity-15 -rotate-6" aria-hidden />
        <Image src="/favicon.png" alt="" width={200} height={200} className="absolute bottom-16 right-10 opacity-25 rotate-3" aria-hidden />
        <Image src="/favicon.png" alt="" width={120} height={120} className="absolute bottom-8 left-1/4 opacity-20 -rotate-3" aria-hidden />
        <Image src="/favicon.png" alt="" width={80} height={80} className="absolute top-1/2 left-10 -translate-y-1/2 opacity-10 rotate-6" aria-hidden />
        <Image src="/favicon.png" alt="" width={140} height={140} className="absolute top-24 right-1/4 opacity-20 rotate-12" aria-hidden />
        <Image src="/favicon.png" alt="" width={64} height={64} className="absolute bottom-6 right-1/3 opacity-15 -rotate-12" aria-hidden />
      </div>
      <div className="w-full max-w-md -mt-1 sm:-mt-2 md:-mt-12">
        <div className="flex items-center justify-center mb-6">
          <Image src="/favicon.png" alt="Link Callendar" width={120} height={120} className="rounded-lg" />
          <h1 className="text-3xl font-bold text-white">Link Callendar</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#3D583F]/20">
          <div className="text-center mb-6"></div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-[#3D583F] flex items-center gap-2"
              >
                <Mail className="h-4 w-4" /> Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="h-12 border-2 border-[#3D583F]/30 focus:border-[#3D583F] focus:ring-[#3D583F] rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-semibold text-[#3D583F] flex items-center gap-2"
              >
                <Lock className="h-4 w-4" /> Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="h-12 pr-12 border-2 border-[#3D583F]/30 focus:border-[#3D583F] focus:ring-[#3D583F] rounded-lg"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#3D583F]"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-[#3D583F] hover:bg-[#365137] text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Entrando no sistema...
                </>
              ) : (
                <>
                  <LogInIcon className="mr-2 h-5 w-5" />
                  Entrar no Sistema
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
