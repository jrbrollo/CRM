import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  ClipboardList,
  Settings,
  BarChart3,
  Target
} from "lucide-react";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Contatos",
    href: "/contacts",
    icon: UserPlus,
  },
  {
    title: "Negociações",
    href: "/deals",
    icon: Target,
  },
  {
    title: "Clientes",
    href: "/clients",
    icon: Users,
  },
  {
    title: "Formulários",
    href: "/forms",
    icon: ClipboardList,
  },
  {
    title: "Relatórios",
    href: "/reports",
    icon: BarChart3,
  },
  {
    title: "Configurações",
    href: "/settings",
    icon: Settings,
  },
];

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card shadow-medium">
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground">C</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">CRM Pro</h1>
        </div>
      </div>
      
      <div className="space-y-1 p-4">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent/50",
                isActive
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-foreground/70 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </div>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">
            Conecte com Supabase e Stripe para funcionalidades completas
          </p>
        </div>
      </div>
    </nav>
  );
}