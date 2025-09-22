import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CrmLayout } from "@/components/CrmLayout";
import { Plus, Search, Mail, Phone, MapPin, Building, Calendar } from "lucide-react";

// Dados mockados para demonstração
const mockClients = [
  {
    id: 1,
    name: "Pedro Lima",
    email: "pedro@lima-solutions.com",
    phone: "(85) 66666-6666",
    company: "Lima Solutions",
    position: "Founder",
    city: "Fortaleza",
    contractValue: "R$ 15.000",
    startDate: "2024-01-10",
    status: "active",
    project: "Consultoria Estratégica"
  },
  {
    id: 2,
    name: "Carla Mendes",
    email: "carla@mendes-corp.com",
    phone: "(41) 77777-7777",
    company: "Mendes Corp",
    position: "Diretora Comercial",
    city: "Curitiba",
    contractValue: "R$ 25.000",
    startDate: "2024-01-05",
    status: "active",
    project: "Transformação Digital"
  },
  {
    id: 3,
    name: "Roberto Silva",
    email: "roberto@silva-tech.com",
    phone: "(47) 88888-8888",
    company: "Silva Tech",
    position: "CEO",
    city: "Florianópolis",
    contractValue: "R$ 8.000",
    startDate: "2023-12-15",
    status: "completed",
    project: "Automação de Processos"
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "active": return "bg-lead-qualified text-white";
    case "completed": return "bg-lead-converted text-white";
    case "paused": return "bg-warning text-white";
    default: return "bg-muted text-muted-foreground";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "active": return "Ativo";
    case "completed": return "Concluído";
    case "paused": return "Pausado";
    default: return status;
  }
};

export default function Clients() {
  return (
    <CrmLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">Gerencie sua carteira de clientes</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Search */}
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Building className="h-4 w-4 text-lead-qualified" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-lead-qualified">2</div>
              <p className="text-xs text-muted-foreground">
                Projetos em andamento
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <Building className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">R$ 48.000</div>
              <p className="text-xs text-muted-foreground">
                Valor total dos contratos
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Concluídos</CardTitle>
              <Building className="h-4 w-4 text-lead-converted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-lead-converted">1</div>
              <p className="text-xs text-muted-foreground">
                Entregas realizadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Clients Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockClients.map((client) => (
            <Card key={client.id} className="shadow-soft hover:shadow-medium transition-all cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{client.position} • {client.company}</p>
                  </div>
                  <Badge className={getStatusColor(client.status)}>
                    {getStatusLabel(client.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{client.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{client.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{client.city}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">Início: {new Date(client.startDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <p className="text-sm font-medium text-foreground">{client.project}</p>
                  <p className="text-lg font-bold text-success">{client.contractValue}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </CrmLayout>
  );
}