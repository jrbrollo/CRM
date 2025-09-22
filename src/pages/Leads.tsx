import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CrmLayout } from "@/components/CrmLayout";
import { Plus, Search, Filter, Mail, Phone, MapPin } from "lucide-react";

// Dados mockados para demonstração
const mockLeads = [
  {
    id: 1,
    name: "Maria Silva",
    email: "maria@email.com",
    phone: "(11) 99999-9999",
    company: "Silva & Co",
    position: "CEO",
    status: "new",
    source: "Meta Ads",
    city: "São Paulo",
    createdAt: "2024-01-15",
    notes: "Interesse em consultoria empresarial"
  },
  {
    id: 2,
    name: "João Santos",
    email: "joao@email.com",
    phone: "(21) 88888-8888",
    company: "Santos Tech",
    position: "CTO",
    status: "contacted",
    source: "Site",
    city: "Rio de Janeiro",
    createdAt: "2024-01-14",
    notes: "Retornar contato na próxima semana"
  },
  {
    id: 3,
    name: "Ana Costa",
    email: "ana@email.com",
    phone: "(31) 77777-7777",
    company: "Costa Consultoria",
    position: "Diretora",
    status: "qualified",
    source: "Meta Ads",
    city: "Belo Horizonte",
    createdAt: "2024-01-13",
    notes: "Orçamento enviado, aguardando resposta"
  },
  {
    id: 4,
    name: "Pedro Lima",
    email: "pedro@email.com",
    phone: "(85) 66666-6666",
    company: "Lima Solutions",
    position: "Founder",
    status: "converted",
    source: "Indicação",
    city: "Fortaleza",
    createdAt: "2024-01-12",
    notes: "Cliente convertido - projeto iniciado"
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "new": return "bg-lead-new text-white";
    case "contacted": return "bg-lead-contacted text-white";
    case "qualified": return "bg-lead-qualified text-white";
    case "converted": return "bg-lead-converted text-white";
    default: return "bg-muted text-muted-foreground";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "new": return "Novo";
    case "contacted": return "Contatado";
    case "qualified": return "Qualificado";
    case "converted": return "Convertido";
    default: return status;
  }
};

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredLeads = mockLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <CrmLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Leads</h1>
            <p className="text-muted-foreground">Gerencie seus leads e oportunidades</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        </div>

        {/* Filters */}
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="shadow-soft hover:shadow-medium transition-all cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{lead.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{lead.position} • {lead.company}</p>
                  </div>
                  <Badge className={getStatusColor(lead.status)}>
                    {getStatusLabel(lead.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{lead.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{lead.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{lead.city}</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Origem: {lead.source}</span>
                    <span>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                
                {lead.notes && (
                  <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    {lead.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <Card className="shadow-soft">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Nenhum lead encontrado com os filtros aplicados.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </CrmLayout>
  );
}