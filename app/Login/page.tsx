"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useAuth } from "@/hooks/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const { signIn, signInLoading } = useAuth();

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!email) {
      newErrors.email = "O email é obrigatório";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Por favor, insira um email válido";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "A senha é obrigatória";
      isValid = false;
    } else if (password.length < 4) {
      newErrors.password = "A senha deve ter pelo menos 4 caracteres";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await signIn({ email, password });
    } catch {
      // Toast de erro já é exibido pelo AuthProvider
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-white">
      {/* Pontilhado decorativo — só no header */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-5 top-8 z-30 h-20 w-20 opacity-20"
        style={{
          backgroundImage: "radial-gradient(#9ca3af 1.5px, transparent 1.5px)",
          backgroundSize: "9px 9px",
        }}
      />

      {/* Header com foto + curva */}
      <div className="relative min-h-[300px] h-[44vh] max-h-[360px] shrink-0 overflow-hidden border-0 sm:min-h-[280px] sm:h-[42vh] sm:max-h-[380px]">
        <img
          src="/image-login.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/35 to-black/55" />

        <div className="relative z-30 max-w-[90%] px-8 pb-14 pt-[max(2.75rem,env(safe-area-inset-top))] text-left sm:max-w-none sm:pb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
            Plataforma Link Callendar
          </p>
          <h1 className="mt-3 text-[1.75rem] font-bold leading-tight tracking-tight text-white sm:text-[2rem] md:text-[2.15rem]">
            Bem-vindo <br />
            de volta
          </h1>
          <p className="mt-2.5 max-w-[280px] text-sm leading-relaxed text-white/75 sm:text-[15px]">
            Organize horários, clientes e equipe com praticidade — tudo pensado para o seu dia a dia.
          </p>
        </div>

        {/* Curva branca sobre a foto */}
        <svg
          className="pointer-events-none absolute bottom-12 left-0 z-20 block h-12 w-full leading-[0] sm:bottom-14"
          viewBox="0 0 400 56"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0,56 L0,50 Q200,64 400,10 L400,56 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* Corpo branco */}
      <div className="relative z-10 -mt-[calc(3rem+2px)] shrink-0 border-0 bg-white sm:-mt-[calc(3.5rem+2px)]">
        <div className="flex w-full flex-col px-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 sm:pt-10">
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-1.5">
              <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-[#f8f9f8] transition-colors focus-within:border-primary/35 focus-within:bg-white">
                <div className="border-b border-gray-200/80 px-4 py-3.5">
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs font-medium text-gray-500"
                  >
                    Email
                  </label>
                  <div className="flex items-center gap-3">
                    <Mail className="h-[18px] w-[18px] shrink-0 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-auto min-h-0 flex-1 border-0 bg-transparent p-0 text-base font-medium text-gray-900 shadow-none placeholder:font-normal placeholder:text-gray-400 focus-visible:ring-0"
                    />
                  </div>
                </div>

                <div className="px-4 py-3.5">
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-xs font-medium text-gray-500"
                  >
                    Senha
                  </label>
                  <div className="flex items-center gap-3">
                    <Lock className="h-[18px] w-[18px] shrink-0 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-auto min-h-0 flex-1 border-0 bg-transparent p-0 pr-2 text-base font-medium text-gray-900 shadow-none placeholder:font-normal placeholder:text-gray-400 focus-visible:ring-0"
                    />
                    <button
                      type="button"
                      className="shrink-0 text-gray-400 transition-colors hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-[18px] w-[18px]" />
                      ) : (
                        <Eye className="h-[18px] w-[18px]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {(errors.email || errors.password) && (
                <div className="space-y-1 px-1">
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email}</p>
                  )}
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password}</p>
                  )}
                </div>
              )}
            </div>

            <p className="pt-1 text-center text-sm text-gray-400">
              Esqueceu a senha?
            </p>

            <button
              type="submit"
              disabled={signInLoading}
              className="flex h-[3.25rem] w-full items-center justify-center rounded-full bg-gradient-to-r from-primary/90 via-primary to-primary/80 text-base font-semibold text-white shadow-none transition-opacity active:opacity-90 disabled:opacity-60"
            >
              {signInLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="pt-10 text-center text-sm text-gray-400">
            Desenvolvido por{" "}
            <span className="font-semibold text-primary">Link System</span>
          </p>
        </div>
      </div>
    </div>
  );
}
