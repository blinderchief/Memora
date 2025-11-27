"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Users,
  CreditCard,
  Key,
  Plug,
  Bell,
  Shield,
  Palette,
  Globe,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const settingsNavigation = [
  {
    title: "Account",
    items: [
      { name: "Profile", href: "/settings", icon: User, description: "Manage your personal information" },
      { name: "Notifications", href: "/settings/notifications", icon: Bell, description: "Configure notification preferences" },
      { name: "Appearance", href: "/settings/appearance", icon: Palette, description: "Customize the look and feel" },
    ],
  },
  {
    title: "Workspace",
    items: [
      { name: "Team Members", href: "/settings/team", icon: Users, description: "Manage team access and roles" },
      { name: "Billing", href: "/settings/billing", icon: CreditCard, description: "Manage subscription and payments" },
      { name: "Security", href: "/settings/security", icon: Shield, description: "Security settings and audit logs" },
    ],
  },
  {
    title: "Developer",
    items: [
      { name: "API Keys", href: "/settings/api-keys", icon: Key, description: "Manage API access tokens" },
      { name: "Integrations", href: "/settings/integrations", icon: Plug, description: "Connect external services" },
      { name: "Webhooks", href: "/settings/webhooks", icon: Globe, description: "Configure webhook endpoints" },
    ],
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Settings Sidebar */}
      <aside className="w-64 border-r border-border/50 bg-card/30">
        <div className="p-6">
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </div>

        <nav className="px-3 pb-6 space-y-6">
          {settingsNavigation.map((group) => (
            <div key={group.title}>
              <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive
                          ? "bg-violet-500/10 text-violet-500 font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", isActive && "text-violet-500")} />
                      <span className="flex-1">{item.name}</span>
                      {isActive && <ChevronRight className="h-4 w-4" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Settings Content */}
      <main className="flex-1 p-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-5xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
