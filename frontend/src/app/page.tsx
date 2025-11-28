"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  Search,
  Upload,
  Sparkles,
  ArrowRight,
  Check,
  Users,
  Shield,
  Zap,
  FileText,
  Building2,
  ChevronRight,
  Star,
  Play,
  Globe,
  Clock,
  BarChart3,
} from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MemoraLogo } from "@/components/brand/memora-logo";

const features = [
  {
    icon: Search,
    title: "Hybrid AI Search",
    description:
      "Combine semantic understanding with keyword precision. Find anything instantly with context-aware results.",
  },
  {
    icon: Brain,
    title: "Intelligent Memory",
    description:
      "AI-powered knowledge graph that connects ideas across documents, conversations, and time.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Share knowledge seamlessly. Role-based access ensures the right people see the right information.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "SOC 2 compliant. End-to-end encryption. Your data stays yours with granular access controls.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Sub-second search across millions of documents. Powered by vector databases and edge computing.",
  },
  {
    icon: Globe,
    title: "Universal Integrations",
    description:
      "Connect Slack, Notion, Google Drive, GitHub, and 50+ more tools you already use.",
  },
];

const useCases = [
  {
    title: "Product Teams",
    description: "Connect customer feedback, specs, and roadmaps in one searchable brain.",
    icon: "🚀",
  },
  {
    title: "Engineering",
    description: "Never lose an architecture decision or debugging insight again.",
    icon: "⚙️",
  },
  {
    title: "Sales & Success",
    description: "Instant access to competitive intel, playbooks, and customer context.",
    icon: "📈",
  },
  {
    title: "Research Teams",
    description: "Connect papers, notes, and findings into actionable knowledge.",
    icon: "🔬",
  },
];

const testimonials = [
  {
    quote: "Memora transformed how our team shares knowledge. What used to take hours of searching now takes seconds.",
    author: "Sarah Chen",
    role: "VP of Product",
    company: "TechCorp",
    avatar: "SC",
  },
  {
    quote: "Finally, a knowledge management tool that actually works. The AI search is incredibly accurate.",
    author: "Mike Johnson",
    role: "CTO",
    company: "StartupXYZ",
    avatar: "MJ",
  },
  {
    quote: "Our onboarding time dropped 50% because new hires can find answers without asking.",
    author: "Emily Brown",
    role: "Head of People",
    company: "ScaleUp Inc",
    avatar: "EB",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For individuals and small teams getting started",
    features: ["Up to 5 users", "1,000 memories", "Basic search", "Community support"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/user/month",
    description: "For growing teams that need more power",
    features: [
      "Unlimited users",
      "Unlimited memories",
      "AI-powered search",
      "Team analytics",
      "Priority support",
      "Integrations",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with advanced needs",
    features: [
      "Everything in Pro",
      "SSO & SCIM",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "On-premise option",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const stats = [
  { value: "10M+", label: "Memories Stored" },
  { value: "500+", label: "Teams Using Memora" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "<0.3s", label: "Avg Search Time" },
];

export default function Home() {
  const [isYearly] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <header className="border-b border-slate-200 dark:border-slate-800 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3">
                <MemoraLogo size="md" />
                <div>
                  <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                    Memora
                  </h1>
                </div>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Features
                </a>
                <a href="#use-cases" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Use Cases
                </a>
                <a href="#pricing" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Pricing
                </a>
                <a href="#" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Docs
                </a>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {mounted ? (
                <>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button variant="ghost" size="sm">
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                        Get Started Free
                      </Button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/dashboard">
                      <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                        Go to Dashboard
                      </Button>
                    </Link>
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "h-9 w-9",
                        },
                      }}
                      afterSignOutUrl="/"
                    />
                  </SignedIn>
                </>
              ) : (
                // Placeholder to prevent layout shift during hydration
                <div className="flex items-center gap-4">
                  <div className="h-9 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-9 w-28 bg-violet-600/50 rounded animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-6 bg-violet-500/10 text-violet-600 border-violet-500/20 hover:bg-violet-500/20">
              <Sparkles className="w-3 h-3 mr-1" />
              Now with Gemini-3 Pro Integration
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
              Your Team&apos;s{" "}
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Second Brain
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              The AI-powered knowledge platform that helps teams remember everything,
              find anything instantly, and never lose an insight again.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-lg px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignUpButton>
              <Button size="lg" variant="outline" className="text-lg px-8">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>

          {/* Hero Image/Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="relative mx-auto max-w-5xl rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-900 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-slate-800 text-sm text-slate-400">
                    memora.ai/dashboard
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="flex gap-4">
                  <div className="w-48 space-y-2">
                    <div className="h-8 bg-slate-700/50 rounded" />
                    <div className="h-6 bg-slate-700/30 rounded w-3/4" />
                    <div className="h-6 bg-slate-700/30 rounded w-1/2" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <Search className="h-5 w-5 text-violet-400" />
                      <span className="text-slate-300">
                        Search anything across your knowledge base...
                      </span>
                    </div>
                    <div className="grid gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                          <div className="h-4 bg-slate-700/50 rounded w-1/3 mb-2" />
                          <div className="h-3 bg-slate-700/30 rounded w-full mb-1" />
                          <div className="h-3 bg-slate-700/30 rounded w-2/3" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full max-w-3xl h-20 bg-gradient-to-t from-white dark:from-slate-950 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-violet-600">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-500/10 text-violet-600 border-violet-500/20">
              Features
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Everything you need to remember everything
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Powerful features designed for teams who can&apos;t afford to forget.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-slate-200 dark:border-slate-800">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-violet-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-20 md:py-32 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-500/10 text-violet-600 border-violet-500/20">
              Use Cases
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Built for every team
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              From startups to enterprises, teams use Memora to work smarter.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow text-center border-slate-200 dark:border-slate-800">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-4">{useCase.icon}</div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {useCase.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-500/10 text-violet-600 border-violet-500/20">
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Loved by teams worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-slate-200 dark:border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-yellow-500 fill-yellow-500"
                        />
                      ))}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      &quot;{testimonial.quote}&quot;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {testimonial.author}
                        </p>
                        <p className="text-sm text-slate-500">
                          {testimonial.role}, {testimonial.company}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-32 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-500/10 text-violet-600 border-violet-500/20">
              Pricing
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Start free. Scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`h-full relative ${
                    plan.popular
                      ? "border-violet-500 shadow-lg shadow-violet-500/10"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-violet-600 text-white">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-slate-900 dark:text-white">
                        {plan.price}
                      </span>
                      <span className="text-slate-500">{plan.period}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                      {plan.description}
                    </p>
                    <Button
                      className={`w-full mb-6 ${
                        plan.popular
                          ? "bg-violet-600 hover:bg-violet-700"
                          : ""
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                        >
                          <Check className="w-4 h-4 text-violet-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl bg-gradient-to-r from-violet-600 to-purple-600 p-12 md:p-20 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Ready to supercharge your team?
              </h2>
              <p className="text-lg text-violet-100 mb-8 max-w-2xl mx-auto">
                Join thousands of teams using Memora to never forget an insight
                again.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <SignUpButton mode="modal">
                  <Button
                    size="lg"
                    className="bg-white text-violet-600 hover:bg-violet-50 text-lg px-8"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </SignUpButton>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 border-white/30 text-white hover:bg-white/10"
                >
                  Talk to Sales
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  Memora
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-xs">
                The AI-powered knowledge platform for teams who can&apos;t afford to
                forget.
              </p>
              <div className="flex gap-4">
                <Button variant="ghost" size="icon">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </Button>
                <Button variant="ghost" size="icon">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </Button>
                <Button variant="ghost" size="icon">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                Product
              </h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-violet-600">Features</a></li>
                <li><a href="#" className="hover:text-violet-600">Integrations</a></li>
                <li><a href="#" className="hover:text-violet-600">Pricing</a></li>
                <li><a href="#" className="hover:text-violet-600">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                Resources
              </h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-violet-600">Documentation</a></li>
                <li><a href="#" className="hover:text-violet-600">API Reference</a></li>
                <li><a href="#" className="hover:text-violet-600">Blog</a></li>
                <li><a href="#" className="hover:text-violet-600">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                Company
              </h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-violet-600">About</a></li>
                <li><a href="#" className="hover:text-violet-600">Careers</a></li>
                <li><a href="#" className="hover:text-violet-600">Privacy</a></li>
                <li><a href="#" className="hover:text-violet-600">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 text-center">
              © {new Date().getFullYear()} Memora. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
