"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chart } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeftIcon, ChevronRightIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon, CalendarIcon, DownloadIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function FinancasPage() {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("week");
  
  // Mock data - in a real app this would come from a database
  const financialData = {
    summary: {
      revenue: 5250.0,
      expenses: 1200.0,
      profit: 4050.0,
      growth: 12.5,
    },
    transactions: [
      {
        id: 1,
        type: "income",
        description: "João Silva - Corte + Barba",
        date: "26/05/2025",
        amount: 70.0,
        paymentMethod: "Pix",
      },
      {
        id: 2,
        type: "income",
        description: "Carlos Mendes - Corte Degradê",
        date: "26/05/2025",
        amount: 45.0,
        paymentMethod: "Cartão",
      },
      {
        id: 3,
        type: "income",
        description: "Pedro Alves - Barba",
        date: "26/05/2025",
        amount: 35.0,
        paymentMethod: "Dinheiro",
      },
      
      
    ],
    chartData: {
      labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
      datasets: [
        {
          label: "Receita",
          data: [650, 750, 820, 900, 950, 1100, 80],
          borderColor: "rgb(16, 185, 129)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "Despesas",
          data: [150, 120, 180, 90, 200, 300, 160],
          borderColor: "rgb(239, 68, 68)",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-emerald-800 text-white p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-emerald-100">
            <ChevronLeftIcon className="h-6 w-6" />
          </Link>
          <h1 className="font-bold text-xl">Finanças</h1>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-emerald-700 hover:bg-emerald-600"
          >
            <DownloadIcon className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Period Selection */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="sm" className="text-gray-600">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Anterior
          </Button>
          <h2 className="font-medium text-emerald-800">Maio 2025</h2>
          <Button variant="ghost" size="sm" className="text-gray-600">
            Próximo
            <ChevronRightIcon className="h-5 w-5 ml-1" />
          </Button>
        </div>

        <Tabs
          defaultValue="week"
          className="w-full"
          onValueChange={(v) => setPeriod(v as any)}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="day">Dia</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="year">Ano</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Financial Summary */}
      <div className="p-4">
        <h3 className="font-medium text-gray-700 mb-3">Resumo Financeiro</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Receita</p>
                  <h4 className="text-lg font-bold text-emerald-700">
                    R$ {financialData.summary.revenue.toFixed(2).replace(".", ",")}
                  </h4>
                </div>
                <div className="bg-emerald-100 p-2 rounded-full">
                  <TrendingUpIcon className="h-5 w-5 text-emerald-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Despesas</p>
                  <h4 className="text-lg font-bold text-red-500">
                    R$ {financialData.summary.expenses.toFixed(2).replace(".", ",")}
                  </h4>
                </div>
                <div className="bg-red-100 p-2 rounded-full">
                  <TrendingDownIcon className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm mb-6">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-gray-500">Lucro</p>
                <h4 className="text-xl font-bold text-emerald-700">
                  R$ {financialData.summary.profit.toFixed(2).replace(".", ",")}
                </h4>
              </div>
              <div className="bg-emerald-100 px-2 py-1 rounded-full text-xs text-emerald-700 font-medium flex items-center">
                <TrendingUpIcon className="h-3 w-3 mr-1" />
                {financialData.summary.growth}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="border-none shadow-sm mb-6">
          <CardContent className="p-3">
            <h4 className="font-medium text-gray-700 mb-2">Análise de Receitas</h4>
            <div className="h-64">
              <Chart
                config={{
                  receita: { color: "rgb(16, 185, 129)" },
                  despesas: { color: "rgb(239, 68, 68)" }
                }}
              >
                <div className="flex justify-center items-center h-full text-gray-500">
                  <p>Gráfico de receitas e despesas</p>
                </div>
              </Chart>
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <h3 className="font-medium text-gray-700 mb-3">Transações Recentes</h3>
        <div className="space-y-3">
          {financialData.transactions.map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-auto p-4 grid grid-cols-2 gap-3">
        <Button className="bg-emerald-700 hover:bg-emerald-800 text-white py-5 rounded-xl shadow-md">
          + Nova Receita
        </Button>
        <Button className="bg-gray-700 hover:bg-gray-800 text-white py-5 rounded-xl shadow-md">
          + Nova Despesa
        </Button>
      </div>
    </div>
  );
}

function TransactionCard({ transaction }: { transaction: any }) {
  return (
    <Card className="overflow-hidden border-none shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center p-3">
          <div
            className={`p-2 rounded-full mr-3 ${
              transaction.type === "income"
                ? "bg-emerald-100"
                : "bg-red-100"
            }`}
          >
            {transaction.type === "income" ? (
              <DollarSignIcon
                className="h-5 w-5 text-emerald-700"
              />
            ) : (
              <TrendingDownIcon className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{transaction.description}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {transaction.date}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`font-medium ${
                    transaction.type === "income"
                      ? "text-emerald-700"
                      : "text-red-500"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"} R${" "}
                  {transaction.amount.toFixed(2).replace(".", ",")}
                </span>
                <p className="text-xs text-gray-500">
                  {transaction.paymentMethod}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
