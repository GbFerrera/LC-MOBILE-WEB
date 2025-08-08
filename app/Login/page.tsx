"use client";

<<<<<<< HEAD
import { useState, useEffect } from "react";
=======
import { useEffect, useState } from "react";
>>>>>>> feature/redesigner
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
import {
  ScissorsIcon,
  LogInIcon,
  Eye,
  EyeOff,
  Sparkles,
  Mail,
  Lock,
  Target,
  Key,
} from "lucide-react";
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
<<<<<<< HEAD
  const { signIn, loading } = useAuth();
  const { user } = useAuth();
=======
  const { signIn, loading, user } = useAuth();
>>>>>>> feature/redesigner
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
<<<<<<< HEAD

=======
>>>>>>> feature/redesigner
      // O redirecionamento é feito automaticamente pelo hook de autenticação
    } catch (error: any) {
      console.error("Erro no login:", error);
      setError(
        error.message || "Ocorreu um erro ao fazer login. Tente novamente."
      );
    }
  };

<<<<<<< HEAD
  const verifyUser = () => {
    if (user) {
      router.push("/");
    }
  };

  useEffect(() => {
    verifyUser();
  }, [user]);

=======
  useEffect(() => {
    if(user) {
      router.push("/")
    }
  }, [])
>>>>>>> feature/redesigner
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-200/30 to-emerald-200/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-100/20 to-teal-100/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Floating particles */}
        <div
          className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400/40 rounded-full animate-bounce"
          style={{ animationDelay: "1s", animationDuration: "3s" }}
        ></div>
        <div
          className="absolute top-3/4 right-1/4 w-3 h-3 bg-teal-400/40 rounded-full animate-bounce"
          style={{ animationDelay: "2s", animationDuration: "4s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/3 w-1 h-1 bg-emerald-500/60 rounded-full animate-ping"
          style={{ animationDelay: "3s" }}
        ></div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo e Título com animação */}
        <div className="text-center transform transition-all duration-1000 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 mb-6 shadow-xl transform transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:rotate-12 group">
            <ScissorsIcon className="h-10 w-10 text-white transition-transform duration-300 group-hover:rotate-12" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 bg-clip-text text-transparent mb-3 animate-pulse">
            Barbearia Link
          </h1>
          <p className="text-emerald-600 font-semibold flex items-center justify-center gap-2 text-lg">
            <Sparkles
              className="h-5 w-5 animate-spin text-teal-500"
              style={{ animationDuration: "3s" }}
            />
            Sistema de Gerenciamento
            <Sparkles
              className="h-5 w-5 animate-spin text-emerald-500"
              style={{ animationDuration: "3s", animationDelay: "1.5s" }}
            />
          </p>
        </div>

        {/* Card de Login com animação */}
        <Card
          className="border-none shadow-2xl bg-white/90 backdrop-blur-md transform transition-all duration-700 hover:shadow-3xl animate-fade-in-up hover:scale-105 relative overflow-hidden"
          style={{ animationDelay: "0.3s" }}
        >
          {/* Gradient overlay */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 animate-pulse"></div>

          <CardHeader className="text-center pb-8 pt-8">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-2">
              Bem-vindo de volta! <Sparkles className="h-6 w-6 text-teal-500" />
            </CardTitle>
            <CardDescription className="text-gray-600 text-base font-medium">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6 px-2">
              {error && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 text-red-700 text-sm animate-shake shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

<<<<<<< HEAD
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
=======
              <div
                className="space-y-3 transform transition-all duration-500 animate-fade-in-up"
                style={{ animationDelay: "0.5s" }}
              >
                <Label
                  htmlFor="email"
                  className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2"
                >
                  <Mail className="h-4 w-4 text-emerald-600" /> Email
                </Label>
>>>>>>> feature/redesigner
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="h-12 text-base border-2 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-300 hover:border-emerald-400 bg-gradient-to-r from-white to-emerald-50/30 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md focus:shadow-lg"
                />
              </div>

<<<<<<< HEAD
              <div className="space-y-2">
=======
              <div
                className="space-y-3 transform transition-all duration-500 animate-fade-in-up"
                style={{ animationDelay: "0.7s" }}
              >
>>>>>>> feature/redesigner
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2"
                  >
                    <Lock className="h-4 w-4 text-emerald-600" /> Senha
                  </Label>
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
                    className="h-12 text-base pr-12 border-2 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-300 hover:border-emerald-400 bg-gradient-to-r from-white to-emerald-50/30 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md focus:shadow-lg"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-all duration-300 p-2 rounded-full hover:bg-emerald-50 hover:scale-110"
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

<<<<<<< HEAD
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
=======
              <div
                className="flex items-center justify-between transform transition-all duration-500 animate-fade-in-up"
                style={{ animationDelay: "0.9s" }}
>>>>>>> feature/redesigner
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked === true)
                    }
                    className="border-2 border-emerald-400 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 rounded-md transition-all duration-300 hover:scale-110"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-semibold text-gray-600 cursor-pointer hover:text-emerald-600 transition-colors duration-300 select-none"
                  >
                    Lembrar de mim
                  </label>
                </div>
                <Link
                  href="#"
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold transition-all duration-300 hover:underline hover:scale-105 flex items-center gap-1"
                >
                  <span>Esqueceu a senha?</span>
                  <Key className="h-3 w-3" />
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700 text-white transition-all duration-500 transform hover:scale-105 hover:shadow-xl animate-fade-in-up shadow-lg rounded-xl relative overflow-hidden group"
                disabled={loading}
                style={{ animationDelay: "1.1s" }}
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                {loading ? (
                  <>
                    <svg
<<<<<<< HEAD
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
=======
                      className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
>>>>>>> feature/redesigner
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
                    <span className="animate-pulse">
                      Entrando no sistema...
                    </span>
                  </>
                ) : (
                  <>
                    <LogInIcon className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                    <span>Entrar no Sistema</span>
                    <Sparkles className="ml-3 h-5 w-5 animate-pulse" />
                  </>
                )}
              </Button>

<<<<<<< HEAD
              {/* Dica para teste */}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700">
                <p className="font-medium">Credenciais para teste:</p>
                <p>Email: admin@barbearialink.com</p>
                <p>Senha: 123456</p>
=======
              {/* Dica para teste com animação */}
              <div
                className="mt-8 p-5 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-200 rounded-2xl text-sm text-amber-800 transform transition-all duration-500 animate-fade-in-up shadow-lg hover:shadow-xl hover:scale-105"
                style={{ animationDelay: "1.3s" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                  <p className="font-bold text-amber-900 text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-600" /> Credenciais
                    para teste:
                  </p>
                </div>
                <div className="space-y-2 ml-6">
                  <p className="flex items-center gap-3 font-mono">
                    <Mail className="h-4 w-4 text-amber-600" />
                    <span className="bg-white/70 px-3 py-2 rounded-lg text-xs font-bold border border-amber-200 hover:bg-white transition-colors duration-300">
                      admin@barbearialink.com
                    </span>
                  </p>
                  <p className="flex items-center gap-3 font-mono">
                    <Key className="h-4 w-4 text-amber-600" />
                    <span className="bg-white/70 px-3 py-2 rounded-lg text-xs font-bold border border-amber-200 hover:bg-white transition-colors duration-300">
                      123456
                    </span>
                  </p>
                </div>
>>>>>>> feature/redesigner
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
