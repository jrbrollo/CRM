import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CrmLayout } from "@/components/CrmLayout";
import { Settings as SettingsIcon, Database, CreditCard, Zap, User, Bell, Shield } from "lucide-react";

export default function Settings() {
  return (
    <CrmLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground">Gerencie as configurações do seu CRM</p>
          </div>
        </div>

        {/* Integration Status */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supabase</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Não Conectado</Badge>
                <Button size="sm" variant="outline">Conectar</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Necessário para autenticação e armazenamento
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stripe</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Não Conectado</Badge>
                <Button size="sm" variant="outline">Conectar</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Para pagamentos e assinaturas
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meta Ads</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Não Conectado</Badge>
                <Button size="sm" variant="outline">Conectar</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Para integração com formulários
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Settings Sections */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Settings */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Perfil do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input placeholder="Seu nome completo" />
              </div>
              
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" placeholder="seu@email.com" />
              </div>
              
              <div>
                <label className="text-sm font-medium">Empresa</label>
                <Input placeholder="Nome da sua empresa" />
              </div>
              
              <Button>Salvar Alterações</Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Novos Leads</p>
                  <p className="text-sm text-muted-foreground">Receber notificação de novos leads</p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Resumo</p>
                  <p className="text-sm text-muted-foreground">Resumo semanal por email</p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Metas Atingidas</p>
                  <p className="text-sm text-muted-foreground">Notificar quando metas forem atingidas</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Senha Atual</label>
                <Input type="password" placeholder="Senha atual" />
              </div>
              
              <div>
                <label className="text-sm font-medium">Nova Senha</label>
                <Input type="password" placeholder="Nova senha" />
              </div>
              
              <div>
                <label className="text-sm font-medium">Confirmar Senha</label>
                <Input type="password" placeholder="Confirme a nova senha" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Autenticação 2FA</p>
                  <p className="text-sm text-muted-foreground">Adicionar camada extra de segurança</p>
                </div>
                <Switch />
              </div>
              
              <Button>Atualizar Senha</Button>
            </CardContent>
          </Card>

          {/* CRM Settings */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Configurações do CRM
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Meta de Conversão (%)</label>
                <Input type="number" placeholder="20" />
              </div>
              
              <div>
                <label className="text-sm font-medium">Meta Mensal de Leads</label>
                <Input type="number" placeholder="50" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-resposta</p>
                  <p className="text-sm text-muted-foreground">Responder automaticamente novos leads</p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Modo Escuro</p>
                  <p className="text-sm text-muted-foreground">Alternar tema da interface</p>
                </div>
                <Switch />
              </div>
              
              <Button>Salvar Configurações</Button>
            </CardContent>
          </Card>
        </div>

        {/* API Keys Section */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Chaves de API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Para funcionalidades completas, conecte seu projeto ao Supabase e configure as integrações necessárias.
                </p>
                <div className="flex gap-2">
                  <Button size="sm">Conectar Supabase</Button>
                  <Button size="sm" variant="outline">Configurar Stripe</Button>
                  <Button size="sm" variant="outline">Integrar Meta Ads</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CrmLayout>
  );
}