"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  Mail,
  MoreVertical,
  Shield,
  Crown,
  User,
  Trash2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const teamMembers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@company.com",
    role: "owner",
    status: "active",
    joinedAt: "2024-01-15",
    avatar: null,
  },
  {
    id: "2",
    name: "Sarah Chen",
    email: "sarah@company.com",
    role: "admin",
    status: "active",
    joinedAt: "2024-02-20",
    avatar: null,
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@company.com",
    role: "member",
    status: "active",
    joinedAt: "2024-03-10",
    avatar: null,
  },
  {
    id: "4",
    name: "Emily Brown",
    email: "emily@company.com",
    role: "member",
    status: "pending",
    joinedAt: "2024-06-01",
    avatar: null,
  },
];

const roleConfig = {
  owner: {
    label: "Owner",
    icon: Crown,
    color: "text-yellow-500",
    badge: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "text-violet-500",
    badge: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  },
  member: {
    label: "Member",
    icon: User,
    color: "text-slate-500",
    badge: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  },
};

export default function TeamSettingsPage() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const handleInvite = () => {
    // TODO: Implement invite logic
    console.log("Inviting:", inviteEmail, "as", inviteRole);
    setInviteEmail("");
    setIsInviteOpen(false);
  };

  const getRoleConfig = (role: string) => {
    return roleConfig[role as keyof typeof roleConfig] || roleConfig.member;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Team Members
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your team members and their permissions
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your workspace. They&apos;ll receive an
                email with instructions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Role
                </label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-violet-500" />
                        <span>Admin</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-500" />
                        <span>Member</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Admins can manage team members and workspace settings. Members
                  can access and contribute to the knowledge base.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={!inviteEmail}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {teamMembers.filter((m) => m.status === "active").length}
                </p>
                <p className="text-xs text-slate-500">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {teamMembers.filter((m) => m.status === "pending").length}
                </p>
                <p className="text-xs text-slate-500">Pending Invites</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {teamMembers.filter((m) => m.role === "admin").length}
                </p>
                <p className="text-xs text-slate-500">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  10
                </p>
                <p className="text-xs text-slate-500">Seats Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Members
          </CardTitle>
          <CardDescription>
            {teamMembers.length} members in your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {teamMembers.map((member) => {
              const role = getRoleConfig(member.role);
              const RoleIcon = role.icon;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {member.name}
                        </h4>
                        {member.status === "pending" && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                          >
                            Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className={role.badge}>
                      <RoleIcon className={`h-3 w-3 mr-1 ${role.color}`} />
                      {role.label}
                    </Badge>
                    <span className="text-sm text-slate-500">
                      Joined{" "}
                      {new Date(member.joinedAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    {member.role !== "owner" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Shield className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          {member.status === "pending" && (
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Resend Invitation
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            {member.status === "pending"
                              ? "Cancel Invitation"
                              : "Remove from Team"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions
          </CardTitle>
          <CardDescription>
            Understanding what each role can do in your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-5 w-5 text-yellow-500" />
                <h4 className="font-medium text-slate-900 dark:text-white">
                  Owner
                </h4>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• Full workspace control</li>
                <li>• Manage billing & subscription</li>
                <li>• Delete workspace</li>
                <li>• Transfer ownership</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border border-violet-500/20 bg-violet-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-violet-500" />
                <h4 className="font-medium text-slate-900 dark:text-white">
                  Admin
                </h4>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• Manage team members</li>
                <li>• Configure integrations</li>
                <li>• Access all content</li>
                <li>• Manage API keys</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border border-slate-500/20 bg-slate-500/5">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-slate-500" />
                <h4 className="font-medium text-slate-900 dark:text-white">
                  Member
                </h4>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• Search knowledge base</li>
                <li>• Upload documents</li>
                <li>• Create memories</li>
                <li>• View shared content</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
