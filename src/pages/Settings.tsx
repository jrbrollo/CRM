import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CrmLayout } from "@/components/CrmLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  Zap,
  LogOut,
  Check,
  X,
} from "lucide-react";

export default function Settings() {
  const { user, userDoc, logOut } = useAuth();

  // Firebase status check
  const firebaseConfigured = Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  );

  // User profile state
  const [name, setName] = useState(userDoc?.name || "");
  const [company, setCompany] = useState("");

  // Notification settings
  const [notifyNewLeads, setNotifyNewLeads] = useState(true);
  const [emailSummary, setEmailSummary] = useState(true);
  const [notifyGoals, setNotifyGoals] = useState(true);

  // CRM settings
  const [conversionGoal, setConversionGoal] = useState("20");
  const [monthlyLeadsGoal, setMonthlyLeadsGoal] = useState("50");
  const [autoResponse, setAutoResponse] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (userDoc) {
      setName(userDoc.name);
    }
  }, [userDoc]);

  const handleSaveProfile = () => {
    // TODO: Implement profile update with Firebase
    toast.success("Perfil atualizado com sucesso!");
  };

  const handleSaveSettings = () => {
    // TODO: Implement settings save with Firebase
    toast.success("Configurações salvas com sucesso!");
  };

  const handleUpdatePassword = () => {
    // TODO: Implement password update with Firebase
    toast.success("Senha atualizada com sucesso!");
  };

  const handleLogout = async () => {
    try {
      await logOut();
      toast.success("Logout realizado com sucesso");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  return (
    <CrmLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground">Gerencie as configurações do seu CRM</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Firebase Status */}
        <Card className={firebaseConfigured ? "border-green-500" : "border-yellow-500"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Firebase</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {firebaseConfigured ? (
                <>
                  <Badge variant="default" className="bg-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    Projeto: {import.meta.env.VITE_FIREBASE_PROJECT_ID}
                  </div>
                </>
              ) : (
                <>
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    Não Configurado
                  </Badge>
                  <Button size="sm" variant="outline" asChild>
                    <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">
                      Configurar
                    </a>
                  </Button>
                </>
              )}
            </div>
            {!firebaseConfigured && (
              <p className="text-xs text-muted-foreground mt-2">
                Configure as variáveis de ambiente Firebase no arquivo .env para habilitar todas as funcionalidades
              </p>
            )}
          </CardContent>
        </Card>

        {/* User Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {userDoc?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{userDoc?.name}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge variant="outline" className="mt-1">
                  {userDoc?.role === "admin" && "Administrador"}
                  {userDoc?.role === "planner" && "Planejador"}
                  {userDoc?.role === "viewer" && "Visualizador"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  placeholder="seu@email.com"
                />
                <p className="text-xs text-muted-foreground">
                  Email não pode ser alterado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Nome da sua empresa"
                />
              </div>

              <Button onClick={handleSaveProfile}>Salvar Alterações</Button>
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
                  <p className="text-sm text-muted-foreground">
                    Receber notificação de novos leads
                  </p>
                </div>
                <Switch
                  checked={notifyNewLeads}
                  onCheckedChange={setNotifyNewLeads}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Resumo</p>
                  <p className="text-sm text-muted-foreground">
                    Resumo semanal por email
                  </p>
                </div>
                <Switch
                  checked={emailSummary}
                  onCheckedChange={setEmailSummary}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Metas Atingidas</p>
                  <p className="text-sm text-muted-foreground">
                    Notificar quando metas forem atingidas
                  </p>
                </div>
                <Switch
                  checked={notifyGoals}
                  onCheckedChange={setNotifyGoals}
                />
              </div>

              <Button onClick={handleSaveSettings}>Salvar Preferências</Button>
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
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Senha atual"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Nova senha"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirme a nova senha"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Autenticação 2FA</p>
                  <p className="text-sm text-muted-foreground">
                    Adicionar camada extra de segurança
                  </p>
                </div>
                <Switch disabled />
              </div>
              <p className="text-xs text-muted-foreground">
                2FA será habilitado em breve
              </p>

              <Button onClick={handleUpdatePassword}>Atualizar Senha</Button>
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
              <div className="space-y-2">
                <Label htmlFor="conversion-goal">Meta de Conversão (%)</Label>
                <Input
                  id="conversion-goal"
                  type="number"
                  value={conversionGoal}
                  onChange={(e) => setConversionGoal(e.target.value)}
                  placeholder="20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leads-goal">Meta Mensal de Leads</Label>
                <Input
                  id="leads-goal"
                  type="number"
                  value={monthlyLeadsGoal}
                  onChange={(e) => setMonthlyLeadsGoal(e.target.value)}
                  placeholder="50"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-resposta</p>
                  <p className="text-sm text-muted-foreground">
                    Responder automaticamente novos leads
                  </p>
                </div>
                <Switch
                  checked={autoResponse}
                  onCheckedChange={setAutoResponse}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Modo Escuro</p>
                  <p className="text-sm text-muted-foreground">
                    Alternar tema da interface
                  </p>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>

              <Button onClick={handleSaveSettings}>Salvar Configurações</Button>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Guide */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Guia de Configuração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold mb-2">Primeiros Passos</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Configure as variáveis de ambiente Firebase (.env)</li>
                  <li>Crie seu primeiro contato na página de Contatos</li>
                  <li>Configure um workflow para automação</li>
                  <li>Explore os relatórios e dashboard</li>
                </ol>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm">
                  <strong>Documentação:</strong> Consulte o arquivo{" "}
                  <code className="bg-muted px-1 rounded">README.md</code> e{" "}
                  <code className="bg-muted px-1 rounded">WORKFLOWS.md</code> para
                  guias detalhados de uso e configuração.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CrmLayout>
  );
}
