"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star, Users, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";
import { validateInviteCode } from "@/lib/utils";
import SignUpForm from "@/components/forms/signup-form";

export default function WelcomeScreen() {
  const [showSignUp, setShowSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Credenciais inválidas");
      } else {
        toast.success("Login realizado com sucesso!");
      }
    } catch (error) {
      toast.error("Erro no login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteCode = () => {
    if (!inviteCode.trim()) {
      toast.error("Digite um código de convite");
      return;
    }

    if (!validateInviteCode(inviteCode)) {
      toast.error("Código de convite inválido");
      return;
    }

    // Mock validation - now includes SHALOM2025
    const validCodes = [
      "SHALOM2025",
      "SHABBAT2024",
      "COMMUNITY2024",
      "WELCOME2024",
      "TECH2024",
    ];
    if (validCodes.includes(inviteCode.toUpperCase())) {
      setShowSignUp(true);
    } else {
      toast.error("Código de convite não encontrado");
    }
  };

  if (showSignUp) {
    return (
      <SignUpForm inviteCode={inviteCode} onBack={() => setShowSignUp(false)} />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="container-mobile space-y-8 max-w-md w-full">
          {/* Logo and Title */}
          <div className="text-center space-y-4 animate-fade-in-up">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Star className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Aquitemshabes
              </h1>
              <p className="text-muted-foreground mt-2">
                Conectando comunidades através do Shabat
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid gap-4 animate-slide-in-left">
            <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm">Encontre anfitriões próximos</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
              <span className="text-sm">Reserve sua vaga no Shabat</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
              <MapPin className="h-5 w-5 text-pink-600" />
              <span className="text-sm">Compartilhe experiências</span>
            </div>
          </div>

          {/* Auth Cards */}
          <div className="space-y-4">
            {/* Login Card */}
            <Card className="shadow-lg animate-fade-in-up">
              <CardHeader>
                <CardTitle className="text-lg">Já tem conta?</CardTitle>
                <CardDescription>Entre com suas credenciais</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    variant="shabbat"
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Invite Code Card */}
            <Card className="shadow-lg animate-fade-in-up">
              <CardHeader>
                <CardTitle className="text-lg">Novo usuário?</CardTitle>
                <CardDescription>
                  Digite seu código de convite para se cadastrar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="inviteCode">Código de Convite</Label>
                    <Input
                      id="inviteCode"
                      value={inviteCode}
                      onChange={(e) =>
                        setInviteCode(e.target.value.toUpperCase())
                      }
                      placeholder="SHALOM2025"
                      maxLength={12}
                    />
                  </div>
                  <Button
                    onClick={handleInviteCode}
                    className="w-full"
                    variant="host"
                  >
                    Continuar Cadastro
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Demo Account Info */}
          <Card className="bg-blue-50 border-blue-200 animate-fade-in-up">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-blue-900">Demo</p>
                <p className="text-xs text-blue-700">
                  Email: john@doe.com | Senha: johndoe123
                </p>
                <p className="text-xs text-blue-700">
                  Email: guilherme@aquitemshabes.com | Senha: guilherme123
                </p>
                <p className="text-xs text-blue-700">Código: SHALOM2025</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
