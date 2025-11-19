import { useState } from "react";
import { CrmLayout } from "@/components/CrmLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActivities, useActivityStats } from "@/lib/hooks/useActivities";
import {
  Activity as ActivityIcon,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ActivityType } from "@/lib/types/activity.types";

const activityIcons: Record<ActivityType, any> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  task: CheckCircle2,
  whatsapp: MessageSquare,
};

const activityColors: Record<ActivityType, string> = {
  call: "text-blue-600",
  email: "text-purple-600",
  meeting: "text-green-600",
  note: "text-gray-600",
  task: "text-orange-600",
  whatsapp: "text-emerald-600",
};

export default function Activities() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<ActivityType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("all");

  const { data: activities, isLoading } = useActivities();
  const { data: stats } = useActivityStats();

  const filteredActivities = activities?.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || activity.type === filterType;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "completed" && activity.completed) ||
      (filterStatus === "pending" && !activity.completed);

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (completed: boolean, dueDate?: Date) => {
    if (completed) {
      return <Badge variant="default" className="bg-green-600">Concluída</Badge>;
    }

    if (dueDate && new Date(dueDate) < new Date()) {
      return <Badge variant="destructive">Atrasada</Badge>;
    }

    return <Badge variant="secondary">Pendente</Badge>;
  };

  const formatDate = (date: any) => {
    if (!date) return "Sem data";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return format(dateObj, "dd MMM yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <CrmLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <ActivityIcon className="h-8 w-8 text-primary" />
              Atividades
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas tarefas, chamadas, reuniões e mais
            </p>
          </div>
          <Button size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Nova Atividade
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.overdue || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar atividades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="call">Ligações</SelectItem>
              <SelectItem value="email">Emails</SelectItem>
              <SelectItem value="meeting">Reuniões</SelectItem>
              <SelectItem value="task">Tarefas</SelectItem>
              <SelectItem value="note">Notas</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="completed">Concluídas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activities List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando atividades...</p>
          </div>
        ) : filteredActivities && filteredActivities.length > 0 ? (
          <div className="space-y-3">
            {filteredActivities.map((activity) => {
              const Icon = activityIcons[activity.type];
              const iconColor = activityColors[activity.type];

              return (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg bg-muted ${iconColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">
                              {activity.title}
                            </h3>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {activity.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {getStatusBadge(activity.completed, activity.dueDate)}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(activity.createdAt)}
                          </div>

                          {activity.dueDate && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Prazo: {formatDate(activity.dueDate)}
                            </div>
                          )}

                          {activity.contactId && (
                            <Badge variant="outline" className="text-xs">
                              Contato vinculado
                            </Badge>
                          )}

                          {activity.dealId && (
                            <Badge variant="outline" className="text-xs">
                              Deal vinculado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <ActivityIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma atividade encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterType !== "all" || filterStatus !== "all"
                  ? "Tente ajustar seus filtros"
                  : "Crie sua primeira atividade para começar"}
              </p>
              {!searchQuery && filterType === "all" && filterStatus === "all" && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Atividade
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </CrmLayout>
  );
}
