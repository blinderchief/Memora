"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";

export function UserMenu() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:block text-right">
        <p className="text-sm font-medium">{user.fullName || user.username}</p>
        <p className="text-xs text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
      </div>
      <UserButton
        appearance={{
          elements: {
            avatarBox: "h-9 w-9",
            userButtonPopoverCard: "bg-card border border-border",
            userButtonPopoverActionButton: "hover:bg-muted",
            userButtonPopoverActionButtonText: "text-foreground",
            userButtonPopoverFooter: "hidden",
          },
        }}
        afterSignOutUrl="/"
      />
    </div>
  );
}
