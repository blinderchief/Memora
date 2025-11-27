"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  Zap,
  Brain,
  FileText,
  Search,
  Download,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";


const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for personal use and getting started",
    features: [
      "500 memories",
      "5 GB storage",
      "Basic search",
      "1 team member",
      "Community support",
    ],
    current: false,
  },
  {
    name: "Pro",
    price: "$15",
    period: "/month",
    description: "For professionals who need more power",
    features: [
      "Unlimited memories",
      "50 GB storage",
      "Hybrid search + AI",
      "Up to 5 team members",
      "Priority support",
      "API access",
      "Advanced analytics",
    ],
    current: true,
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large teams with advanced needs",
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "Unlimited team members",
      "SSO & SAML",
      "Dedicated support",
      "Custom integrations",
      "On-premise option",
      "SLA guarantee",
    ],
    current: false,
  },
];

const invoices = [
  { id: "INV-001", date: "Nov 1, 2024", amount: "$15.00", status: "Paid" },
  { id: "INV-002", date: "Oct 1, 2024", amount: "$15.00", status: "Paid" },
  { id: "INV-003", date: "Sep 1, 2024", amount: "$15.00", status: "Paid" },
];

export default function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan */}
      <Card className="border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-500/20">
                <Zap className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">Pro Plan</h3>
                  <Badge className="bg-violet-500">Current</Badge>
                </div>
                <p className="text-muted-foreground">
                  $15/month • Next billing on Dec 1, 2024
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Change Plan</Button>
              <Button variant="outline" className="text-red-500 hover:text-red-500">
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage This Period</CardTitle>
          <CardDescription>Nov 1 - Nov 30, 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-violet-500" />
                  Memories
                </span>
                <span className="text-muted-foreground">1,284 / Unlimited</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Storage
                </span>
                <span className="text-muted-foreground">4.2 GB / 50 GB</span>
              </div>
              <Progress value={8.4} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-green-500" />
                  API Requests
                </span>
                <span className="text-muted-foreground">45K / 100K</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Available Plans</h3>
          <div className="flex items-center gap-2 p-1 rounded-lg bg-muted">
            <Button
              variant={billingCycle === "monthly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setBillingCycle("monthly")}
              className={billingCycle === "monthly" ? "bg-violet-600" : ""}
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === "yearly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setBillingCycle("yearly")}
              className={billingCycle === "yearly" ? "bg-violet-600" : ""}
            >
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs">
                Save 20%
              </Badge>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className={`relative h-full ${
                  plan.current
                    ? "border-violet-500/50 bg-violet-500/5"
                    : "hover:border-violet-500/30"
                } transition-colors`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-violet-500">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {plan.current && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {billingCycle === "yearly" && plan.price !== "Custom"
                        ? `$${parseInt(plan.price.replace("$", "")) * 10}`
                        : plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-muted-foreground">
                        {billingCycle === "yearly" && plan.price !== "Custom"
                          ? "/year"
                          : plan.period}
                      </span>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-violet-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.current
                        ? ""
                        : plan.popular
                        ? "bg-violet-600 hover:bg-violet-700"
                        : ""
                    }`}
                    variant={plan.current ? "outline" : "default"}
                    disabled={plan.current}
                  >
                    {plan.current
                      ? "Current Plan"
                      : plan.name === "Enterprise"
                      ? "Contact Sales"
                      : "Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Method</CardTitle>
          <CardDescription>Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-muted">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/2025</p>
              </div>
            </div>
            <Button variant="outline">Update</Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing History</CardTitle>
          <CardDescription>Download your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{invoice.id}</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant="secondary"
                    className="bg-green-500/10 text-green-500"
                  >
                    {invoice.status}
                  </Badge>
                  <span className="font-medium">{invoice.amount}</span>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
