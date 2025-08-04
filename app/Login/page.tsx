"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScissorsIcon, LogInIcon, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const { signIn, loading } = useAuth();
  const { user } = useAuth();
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
      setError(
        error.message || "Ocorreu um erro ao fazer login. Tente novamente."
      );
    }
  };

  const verifyUser = () => {
    if (user) {
      router.push("/");
    }
  };

  useEffect(() => {
    verifyUser();
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-emerald-100 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo e Título */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#236F5D] mb-4">
            <ScissorsIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Barbearia Link</h1>
          <p className="text-[#236F5D] mt-1">Sistema de Gerenciamento</p>
        </div>

        {/* Card de Login */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none"
                >
                  Lembrar de mim
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#236F5D] hover:bg-[#1a5346]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogInIcon className="mr-2 h-4 w-4" /> Entrar
                  </>
                )}
              </Button>

              {/* Dica para teste */}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700">
                <p className="font-medium">Credenciais para teste:</p>
                <p>Email: admin@barbearialink.com</p>
                <p>Senha: 123456</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
