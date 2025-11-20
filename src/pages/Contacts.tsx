import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CrmLayout } from "@/components/CrmLayout";
import { CreateContactDialog } from "@/components/contacts/CreateContactDialog";
import { useContacts, useContactStats } from "@/lib/hooks/useContacts";
import { Plus, Search, Mail, Phone, MapPin, UserPlus, Users, TrendingUp, Target } from "lucide-react";
import type { ContactStatus } from "@/lib/types/contact.types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const getStatusColor = (status: ContactStatus) => {
  switch (status) {
    case "new":
      return "bg-blue-600 text-white";
    case "contacted":
      return "bg-yellow-600 text-white";
    case "qualified":
      return "bg-green-600 text-white";
    case "unqualified":
      return "bg-gray-600 text-white";
    case "customer":
      return "bg-purple-600 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusLabel = (status: ContactStatus) => {
  const labels: Record<ContactStatus, string> = {
    new: "Novo",
    contacted: "Contatado",
    qualified: "Qualificado",
    unqualified: "Não Qualificado",
    customer: "Cliente",
  };
  return labels[status] || status;
};

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "all">("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: contacts, isLoading } = useContacts();
  const { data: stats } = useContactStats();

  const filteredContacts = contacts?.filter((contact) => {
    const matchesSearch =
      contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: any) => {
    if (!date) return "";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <CrmLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contatos</h1>
            <p className="text-muted-foreground">Gerencie seus contatos e oportunidades</p>
          </div>
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Contato
          </Button>
        </div>

        {/* Create Contact Dialog */}
        <CreateContactDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos (Este Mês)</CardTitle>
              <UserPlus className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.newThisMonth || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qualificados</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.qualified || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lead Score Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageLeadScore || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contatos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  Todos
                </Button>
                <Button
                  variant={statusFilter === "new" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("new")}
                >
                  Novos
                </Button>
                <Button
                  variant={statusFilter === "contacted" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("contacted")}
                >
                  Contatados
                </Button>
                <Button
                  variant={statusFilter === "qualified" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("qualified")}
                >
                  Qualificados
                </Button>
                <Button
                  variant={statusFilter === "customer" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("customer")}
                >
                  Clientes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacts Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando contatos...</p>
          </div>
        ) : filteredContacts && filteredContacts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact) => (
              <Card
                key={contact.id}
                className="shadow-soft hover:shadow-medium transition-all cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {contact.firstName} {contact.lastName}
                      </CardTitle>
                      {contact.company && (
                        <p className="text-sm text-muted-foreground truncate">
                          {contact.position && `${contact.position} • `}
                          {contact.company}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(contact.status)}>
                      {getStatusLabel(contact.status)}
                    </Badge>
                  </div>

                  {/* Lead Score */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Lead Score</span>
                      <span className="font-semibold">{contact.leadScore}/100</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${contact.leadScore}%` }}
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground truncate">{contact.email}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground">{contact.phone}</span>
                    </div>

                    {contact.address?.city && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-foreground truncate">
                          {contact.address.city}
                          {contact.address.state && `, ${contact.address.state}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Origem: {contact.source}</span>
                      <span>{formatDate(contact.createdAt)}</span>
                    </div>
                  </div>

                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {contact.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {contact.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{contact.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-soft">
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum contato encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Tente ajustar seus filtros"
                  : "Crie seu primeiro contato para começar"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Contato
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </CrmLayout>
  );
}
