"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChevronLeftIcon,
  TrophyIcon,
  SparklesIcon,
  GiftIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  AwardIcon,
  RotateCwIcon,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

// Dados mockados de prêmios
const MOCK_AWARDS = [
  {
    id: 1,
    name: "Vale Compras R$ 50",
    description: "Vale compras de R$ 50 em produtos do salão",
    color: "#FF6B6B",
    image_url: "🛍️",
  },
  {
    id: 2,
    name: "Hidratação Grátis",
    description: "Uma sessão de hidratação capilar gratuita",
    color: "#4ECDC4",
    image_url: "💆",
  },
  {
    id: 3,
    name: "Desconto 30%",
    description: "30% de desconto no próximo serviço",
    color: "#FFE66D",
    image_url: "🎁",
  },
  {
    id: 4,
    name: "Manicure + Pedicure",
    description: "Combo completo de manicure e pedicure",
    color: "#A8E6CF",
    image_url: "💅",
  },
  {
    id: 5,
    name: "Vale Brinde",
    description: "Um brinde especial da casa",
    color: "#FFD3B6",
    image_url: "🎉",
  },
  {
    id: 6,
    name: "Sobrancelha Design",
    description: "Design de sobrancelha completo",
    color: "#DCEDC1",
    image_url: "✨",
  },
  {
    id: 7,
    name: "Corte Grátis",
    description: "Um corte de cabelo gratuito",
    color: "#FF8B94",
    image_url: "✂️",
  },
  {
    id: 8,
    name: "Massagem Relax",
    description: "15 minutos de massagem relaxante",
    color: "#C7CEEA",
    image_url: "🧘",
  },
];

// Histórico mockado de resgates
const MOCK_CLAIMS = [
  {
    id: 1,
    award_name: "Hidratação Grátis",
    award_color: "#4ECDC4",
    award_image: "💆",
    claimed_at: "2024-11-25T14:30:00",
    team_name: "Maria Silva",
    notes: "Cliente adorou o prêmio!",
  },
  {
    id: 2,
    award_name: "Desconto 30%",
    award_color: "#FFE66D",
    award_image: "🎁",
    claimed_at: "2024-11-24T10:15:00",
    team_name: "João Santos",
    notes: null,
  },
  {
    id: 3,
    award_name: "Corte Grátis",
    award_color: "#FF8B94",
    award_image: "✂️",
    claimed_at: "2024-11-23T16:45:00",
    team_name: "Ana Costa",
    notes: "Agendado para semana que vem",
  },
];

export default function Awards() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedAward, setSelectedAward] = useState<typeof MOCK_AWARDS[0] | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Função para girar a roleta
  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setSelectedAward(null);

    // Selecionar prêmio aleatório
    const randomIndex = Math.floor(Math.random() * MOCK_AWARDS.length);
    const award = MOCK_AWARDS[randomIndex];

    // Calcular rotação
    const segmentAngle = 360 / MOCK_AWARDS.length;
    const targetAngle = randomIndex * segmentAngle;
    const spins = 5; // Número de voltas completas
    const finalRotation = spins * 360 + (360 - targetAngle) + segmentAngle / 2;

    setRotation(finalRotation);

    // Após animação, mostrar resultado
    setTimeout(() => {
      setIsSpinning(false);
      setSelectedAward(award);
      setShowResultDialog(true);
      toast.success(`Você ganhou: ${award.name}!`);
    }, 4000);
  };

  // Função para confirmar resgate
  const handleClaimAward = () => {
    if (!selectedAward) return;

    toast.success("Prêmio resgatado com sucesso!");
    setShowResultDialog(false);
    setSelectedAward(null);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <TrophyIcon className="h-6 w-6" />
              <h1 className="text-xl font-bold">Roleta de Prêmios</h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => setShowHistoryDialog(true)}
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            Histórico
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="bg-purple-500 text-white p-3 rounded-full mb-2">
                  <GiftIcon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-purple-700">{MOCK_AWARDS.length}</p>
                <p className="text-xs text-purple-600">Prêmios Ativos</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="bg-emerald-500 text-white p-3 rounded-full mb-2">
                  <AwardIcon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-emerald-700">{MOCK_CLAIMS.length}</p>
                <p className="text-xs text-emerald-600">Resgatados</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="bg-amber-500 text-white p-3 rounded-full mb-2">
                  <SparklesIcon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-amber-700">15</p>
                <p className="text-xs text-amber-600">Este Mês</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roleta */}
        <Card className="overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-6">
              {/* Container da Roleta */}
              <div className="relative w-full max-w-md aspect-square">
                {/* Indicador (Seta) */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-20">
                  <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-red-500 drop-shadow-lg"></div>
                </div>

                {/* Círculo central decorativo */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-2xl flex items-center justify-center border-4 border-white">
                  <TrophyIcon className="h-8 w-8 text-white" />
                </div>

                {/* Roleta girável */}
                <div
                  ref={wheelRef}
                  className="relative w-full h-full transition-transform duration-[4000ms] ease-out"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transitionTimingFunction: "cubic-bezier(0.17, 0.67, 0.12, 0.99)",
                  }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                    {MOCK_AWARDS.map((award, index) => {
                      const segmentAngle = 360 / MOCK_AWARDS.length;
                      const startAngle = index * segmentAngle - 90;
                      const endAngle = startAngle + segmentAngle;

                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;

                      const x1 = 50 + 50 * Math.cos(startRad);
                      const y1 = 50 + 50 * Math.sin(startRad);
                      const x2 = 50 + 50 * Math.cos(endRad);
                      const y2 = 50 + 50 * Math.sin(endRad);

                      const largeArcFlag = segmentAngle > 180 ? 1 : 0;

                      const path = [
                        `M 50 50`,
                        `L ${x1} ${y1}`,
                        `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        `Z`,
                      ].join(" ");

                      // Posição do texto
                      const textAngle = startAngle + segmentAngle / 2;
                      const textRad = (textAngle * Math.PI) / 180;
                      const textX = 50 + 30 * Math.cos(textRad);
                      const textY = 50 + 30 * Math.sin(textRad);

                      return (
                        <g key={award.id}>
                          <path
                            d={path}
                            fill={award.color}
                            stroke="white"
                            strokeWidth="0.5"
                            className="hover:opacity-90 transition-opacity"
                          />
                          <text
                            x={textX}
                            y={textY}
                            fontSize="6"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontWeight="bold"
                            className="pointer-events-none select-none"
                            style={{
                              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                            }}
                          >
                            {award.image_url}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Botão Girar */}
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-12 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                onClick={spinWheel}
                disabled={isSpinning}
              >
                {isSpinning ? (
                  <>
                    <RotateCwIcon className="h-6 w-6 mr-2 animate-spin" />
                    Girando...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-6 w-6 mr-2" />
                    GIRAR ROLETA
                  </>
                )}
              </Button>

              {/* Instruções */}
              <p className="text-sm text-gray-500 text-center max-w-md">
                Clique no botão acima para girar a roleta e ganhar prêmios incríveis! 🎉
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Prêmios Disponíveis */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <GiftIcon className="h-6 w-6 mr-2 text-emerald-600" />
            Prêmios Disponíveis
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {MOCK_AWARDS.map((award) => (
              <Card
                key={award.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
                style={{ borderTop: `4px solid ${award.color}` }}
              >
                <CardContent className="p-4">
                  <div className="text-center">
                    <div
                      className="text-5xl mb-2 flex items-center justify-center h-16"
                      style={{ color: award.color }}
                    >
                      {award.image_url}
                    </div>
                    <h3 className="font-bold text-sm mb-1">{award.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {award.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Dialog de Resultado */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-6 rounded-full">
                <TrophyIcon className="h-12 w-12 text-white" />
              </div>
              <DialogTitle className="text-2xl text-center">
                🎉 Parabéns! 🎉
              </DialogTitle>
              <DialogDescription className="text-center text-lg">
                Você ganhou:
              </DialogDescription>
            </div>
          </DialogHeader>

          {selectedAward && (
            <div className="py-6">
              <Card
                className="overflow-hidden"
                style={{
                  borderTop: `6px solid ${selectedAward.color}`,
                  background: `linear-gradient(to bottom, ${selectedAward.color}15, white)`,
                }}
              >
                <CardContent className="p-6 text-center">
                  <div
                    className="text-7xl mb-4"
                    style={{ color: selectedAward.color }}
                  >
                    {selectedAward.image_url}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    {selectedAward.name}
                  </h3>
                  <p className="text-gray-600">{selectedAward.description}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowResultDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleClaimAward}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              Resgatar Prêmio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <ClockIcon className="h-6 w-6 mr-2 text-emerald-600" />
              Histórico de Resgates
            </DialogTitle>
            <DialogDescription>
              Últimos prêmios resgatados pelos profissionais
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {MOCK_CLAIMS.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AwardIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Nenhum prêmio resgatado ainda</p>
              </div>
            ) : (
              MOCK_CLAIMS.map((claim) => (
                <Card key={claim.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div
                        className="flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
                        style={{ backgroundColor: `${claim.award_color}20` }}
                      >
                        {claim.award_image}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-gray-900">
                              {claim.award_name}
                            </h4>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <UserIcon className="h-3 w-3 mr-1" />
                              {claim.team_name}
                            </div>
                          </div>
                          <div
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${claim.award_color}20`,
                              color: claim.award_color,
                            }}
                          >
                            Resgatado
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-400 mt-2">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {formatDate(claim.claimed_at)}
                        </div>
                        {claim.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">
                            "{claim.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowHistoryDialog(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}