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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Cabeçalho do Card */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-emerald-600 mb-2 flex items-center justify-center gap-2">
              Bem-vindo de volta! 
            </h2>
            <p className="text-gray-600">
              Entre com suas credenciais para ver seus agendamentos
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Mensagem de erro */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Campo Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-emerald-600 flex items-center gap-2"
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
                className="h-12 border-2 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg"
              />
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-semibold text-emerald-600 flex items-center gap-2"
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
                  className="h-12 pr-12 border-2 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-600"
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

           

            {/* Botão de Login */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
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
                  <Sparkles className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
