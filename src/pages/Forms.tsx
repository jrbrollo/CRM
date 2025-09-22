import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CrmLayout } from "@/components/CrmLayout";
import { Plus, ExternalLink, Copy, Eye, Settings } from "lucide-react";

// Dados mockados para demonstração
const mockForms = [
  {
    id: 1,
    name: "Consultoria Empresarial",
    description: "Formulário para captação de leads interessados em consultoria",
    status: "active",
    submissions: 23,
    conversionRate: 34.8,
    createdAt: "2024-01-10",
    fields: ["Nome", "Email", "Empresa", "Telefone", "Necessidade"]
  },
  {
    id: 2,
    name: "Transformação Digital",
    description: "Captação para projetos de transformação digital",
    status: "active",
    submissions: 15,
    conversionRate: 26.7,
    createdAt: "2024-01-08",
    fields: ["Nome", "Email", "Cargo", "Setor", "Orçamento"]
  },
  {
    id: 3,
    name: "Automação de Processos",
    description: "Leads interessados em automação",
    status: "draft",
    submissions: 0,
    conversionRate: 0,
    createdAt: "2024-01-15",
    fields: ["Nome", "Email", "Empresa", "Processo Atual"]
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "active": return "bg-lead-qualified text-white";
    case "draft": return "bg-warning text-white";
    case "paused": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "active": return "Ativo";
    case "draft": return "Rascunho";
    case "paused": return "Pausado";
    default: return status;
  }
};

export default function Forms() {
  return (
    <CrmLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Formulários</h1>
            <p className="text-muted-foreground">Crie formulários para captação de leads via Meta Ads</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Formulário
          </Button>
        </div>

        {/* Forms Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockForms.map((form) => (
            <Card key={form.id} className="shadow-soft hover:shadow-medium transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{form.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
                  </div>
                  <Badge className={getStatusColor(form.status)}>
                    {getStatusLabel(form.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-lead-new">{form.submissions}</div>
                    <p className="text-xs text-muted-foreground">Envios</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{form.conversionRate}%</div>
                    <p className="text-xs text-muted-foreground">Conversão</p>
                  </div>
                </div>

                {/* Fields */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Campos:</p>
                  <div className="flex flex-wrap gap-1">
                    {form.fields.map((field, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button size="sm" variant="outline" className="flex-1 gap-1">
                    <Eye className="h-3 w-3" />
                    Ver
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1">
                    <Settings className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Criado em {new Date(form.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Form Builder Preview */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Criar Novo Formulário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome do Formulário</label>
                  <Input placeholder="Ex: Consultoria Empresarial" />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea placeholder="Descreva o objetivo deste formulário..." />
                </div>

                <div>
                  <label className="text-sm font-medium">Integração</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a integração" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meta-ads">Meta Ads</SelectItem>
                      <SelectItem value="google-ads">Google Ads</SelectItem>
                      <SelectItem value="direct">Link Direto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Preview do Formulário</label>
                  <div className="border border-border rounded-lg p-4 bg-muted/30">
                    <div className="space-y-3">
                      <Input placeholder="Nome completo" size={undefined} />
                      <Input placeholder="Email" type="email" size={undefined} />
                      <Input placeholder="Telefone" size={undefined} />
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Área de interesse" />
                        </SelectTrigger>
                      </Select>
                      <Textarea placeholder="Conte-nos sobre sua necessidade..." />
                      <Button className="w-full">Enviar</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button>Criar Formulário</Button>
              <Button variant="outline">Salvar Rascunho</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CrmLayout>
  );
}