"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Search,
  Upload,
  Clock,
  Settings,
  Users,
  FolderKanban,
  BarChart3,
  Key,
  Plug,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Home,
  Zap,
  BookOpen,
  MessageSquare,
  Lightbulb,
  Heart,
  Target,
  Network,
  TrendingUp,
} from "lucide-react";
import { Check, Crown } from "lucide-react";
import {
  SignedIn,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CommandMenu } from "@/components/command-menu";
import { NotificationsPopover } from "@/components/notifications-popover";
import { MemoraLogo } from "@/components/brand/memora-logo";
import { cn } from "@/lib/utils";
import { useCommandPalette } from "@/lib/hooks";

const navigation = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Search", href: "/search", icon: Search },
      { name: "Timeline", href: "/timeline", icon: Clock },
      { name: "Upload", href: "/upload", icon: Upload },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { name: "AI Chat", href: "/chat", icon: MessageSquare },
      { name: "Insights", href: "/insights", icon: Lightbulb },
      { name: "Memory Health", href: "/health", icon: Heart },
      { name: "Focus Mode", href: "/focus", icon: Target },
      { name: "Knowledge Graph", href: "/graph", icon: Network },
      { name: "Evolution", href: "/evolution", icon: TrendingUp },
    ],
  },
  {
    title: "Workspace",
    items: [
      { name: "Projects", href: "/projects", icon: FolderKanban },
      { name: "Team", href: "/team", icon: Users },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Developer",
    items: [
      { name: "API Keys", href: "/settings/api-keys", icon: Key },
      { name: "Integrations", href: "/settings/integrations", icon: Plug },
      { name: "Documentation", href: "/docs", icon: BookOpen },
    ],
  },
];

const bottomNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help & Support", href: "/help", icon: HelpCircle },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { isOpen, setIsOpen } = useCommandPalette();

  // Prevent hydration mismatch by only rendering dialogs after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "For individuals getting started",
      features: [
        "100 memories",
        "Basic search",
        "5 AI queries/day",
        "1 user",
      ],
      current: true,
    },
    {
      name: "Pro",
      price: "$12",
      period: "/month",
      description: "For power users and small teams",
      features: [
        "Unlimited memories",
        "Advanced hybrid search",
        "Unlimited AI queries",
        "Up to 5 team members",
        "Priority support",
        "API access",
        "Custom integrations",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations",
      features: [
        "Everything in Pro",
        "Unlimited team members",
        "SSO & SAML",
        "Dedicated support",
        "Custom deployment",
        "SLA guarantee",
        "Advanced analytics",
      ],
    },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background flex">
        {/* Command Menu - only render after mount to prevent hydration mismatch */}
        {mounted && <CommandMenu open={isOpen} onOpenChange={setIsOpen} />}

        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 70 : 260 }}
          className="fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/50 bg-card/50 backdrop-blur-xl"
        >
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border/50 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-3">
              <MemoraLogo size="md" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden"
                  >
                    <span className="font-bold text-lg bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">Memora</span>
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      Beta
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Quick Search */}
          {!collapsed && (
            <div className="p-3 shrink-0">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground h-9"
                onClick={() => setIsOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left text-sm">Quick search...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
          )}

          {/* Navigation - Scrollable Area */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-3 py-4 space-y-6">
                {navigation.map((group) => (
                  <div key={group.title}>
                    {!collapsed && (
                      <h4 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.title}
                      </h4>
                    )}
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                        const Icon = item.icon;

                        const linkContent = (
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                              "hover:bg-accent hover:text-accent-foreground",
                              isActive
                                ? "bg-violet-500/10 text-violet-500 font-medium"
                                : "text-muted-foreground",
                              collapsed && "justify-center px-2"
                            )}
                          >
                            <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-violet-500")} />
                            {!collapsed && <span>{item.name}</span>}
                          </Link>
                        );

                        if (collapsed) {
                          return (
                            <Tooltip key={item.name}>
                              <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                              <TooltipContent side="right">
                                <p>{item.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        return <div key={item.name}>{linkContent}</div>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Bottom Navigation - Fixed at bottom */}
          <div className="border-t border-border/50 p-3 space-y-1 shrink-0 mt-auto">
            {bottomNavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-violet-500/10 text-violet-500 font-medium"
                      : "text-muted-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.name}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.name}>{linkContent}</div>;
            })}

            <Separator className="my-2" />

            {/* User Profile */}
            <SignedIn>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2",
                  collapsed && "justify-center px-2"
                )}
              >
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                  afterSignOutUrl="/"
                />
                {!collapsed && user && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                )}
              </div>
            </SignedIn>
          </div>
        </motion.aside>

        {/* Main Content */}
        <div
          className={cn(
            "flex-1 transition-all duration-300",
            collapsed ? "ml-[70px]" : "ml-[260px]"
          )}
        >
          {/* Top Header */}
          <header className="sticky top-0 z-40 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="flex h-full items-center justify-between px-6">
              <div className="flex items-center gap-4">
                {/* Breadcrumb can go here */}
              </div>

              <div className="flex items-center gap-3">
                {/* Upgrade Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-violet-500/50 text-violet-500 hover:bg-violet-500/10"
                  onClick={() => setUpgradeOpen(true)}
                >
                  <Zap className="h-4 w-4" />
                  Upgrade to Pro
                </Button>

                {/* Notifications */}
                <NotificationsPopover />

                {/* Quick Actions */}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsOpen(true)}
                >
                  <Sparkles className="h-4 w-4" />
                  Ask AI
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6">{children}</main>
        </div>

        {/* Upgrade Dialog */}
        <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Crown className="h-6 w-6 text-amber-500" />
                Upgrade Your Plan
              </DialogTitle>
              <DialogDescription>
                Choose the perfect plan to supercharge your memory and productivity
              </DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "relative rounded-xl border p-6 transition-all hover:border-violet-500/50",
                    plan.popular && "border-violet-500 bg-violet-500/5",
                    plan.current && "border-muted"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-violet-500 text-white">Most Popular</Badge>
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn(
                      "w-full",
                      plan.popular && "bg-violet-500 hover:bg-violet-600",
                      plan.current && "opacity-50 cursor-not-allowed"
                    )}
                    variant={plan.popular ? "default" : "outline"}
                    disabled={plan.current}
                    onClick={() => {
                      if (plan.name === "Enterprise") {
                        window.open("mailto:sales@memora.ai?subject=Enterprise%20Plan%20Inquiry", "_blank");
                      } else if (!plan.current) {
                        router.push("/settings/billing");
                        setUpgradeOpen(false);
                      }
                    }}
                  >
                    {plan.current ? "Current Plan" : plan.name === "Enterprise" ? "Contact Sales" : "Upgrade Now"}
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              All plans include a 14-day money-back guarantee. No questions asked.
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
