"use client";

import { cn } from "@/lib/utils";

interface MemoraLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export function MemoraLogo({ size = "md", className }: MemoraLogoProps) {
  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 26,
    xl: 36,
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-lg",
          sizeClasses[size]
        )}
        style={{
          background: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 25%, #6366F1 50%, #4F46E5 75%, #4338CA 100%)",
          boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
        }}
      >
        {/* Decorative inner glow */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 0%, transparent 40%)",
          }}
        />
        
        {/* Bottom subtle gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 40%)",
          }}
        />
        
        {/* Memora Logo - Abstract M made of interconnected memory nodes */}
        <svg
          width={iconSizes[size]}
          height={iconSizes[size]}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Outer brain-like curve */}
          <path
            d="M8 24C8 24 6 20 6 16C6 10.477 10.477 6 16 6C21.523 6 26 10.477 26 16C26 20 24 24 24 24"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.6"
          />
          
          {/* The "M" shape formed by neural connections */}
          {/* Left vertical */}
          <path
            d="M10 22V12"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          
          {/* Left diagonal up */}
          <path
            d="M10 12L16 18"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          
          {/* Right diagonal up */}
          <path
            d="M16 18L22 12"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          
          {/* Right vertical */}
          <path
            d="M22 12V22"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          
          {/* Memory nodes - key connection points */}
          <circle cx="10" cy="12" r="2.5" fill="white" />
          <circle cx="22" cy="12" r="2.5" fill="white" />
          <circle cx="16" cy="18" r="3" fill="white" />
          <circle cx="10" cy="22" r="2" fill="white" fillOpacity="0.8" />
          <circle cx="22" cy="22" r="2" fill="white" fillOpacity="0.8" />
          
          {/* Small sparkle/thought nodes */}
          <circle cx="16" cy="8" r="1.5" fill="white" fillOpacity="0.7" />
          <circle cx="7" cy="16" r="1" fill="white" fillOpacity="0.5" />
          <circle cx="25" cy="16" r="1" fill="white" fillOpacity="0.5" />
        </svg>
      </div>
    </div>
  );
}

// Animated version for loading states or hero sections
export function MemoraLogoAnimated({ size = "lg", className }: Omit<MemoraLogoProps, "showText">) {
  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl flex items-center justify-center overflow-hidden",
        sizeClasses[size],
        className
      )}
      style={{
        background: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 25%, #6366F1 50%, #4F46E5 75%, #4338CA 100%)",
        boxShadow: "0 8px 32px rgba(139, 92, 246, 0.5)",
      }}
    >
      {/* Animated glow effect */}
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background: "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.4) 0%, transparent 40%)",
        }}
      />
      
      {/* Rotating ring effect */}
      <div
        className="absolute inset-0 animate-spin"
        style={{
          animationDuration: "8s",
          background: "conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.1) 10%, transparent 20%)",
        }}
      />
      
      <svg
        width="40"
        height="40"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Outer brain-like curve */}
        <path
          d="M8 24C8 24 6 20 6 16C6 10.477 10.477 6 16 6C21.523 6 26 10.477 26 16C26 20 24 24 24 24"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
        
        {/* The "M" shape */}
        <path d="M10 22V12" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 12L16 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 18L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M22 12V22" stroke="white" strokeWidth="2" strokeLinecap="round" />
        
        {/* Memory nodes */}
        <circle cx="10" cy="12" r="2.5" fill="white" />
        <circle cx="22" cy="12" r="2.5" fill="white" />
        <circle cx="16" cy="18" r="3" fill="white" />
        <circle cx="10" cy="22" r="2" fill="white" fillOpacity="0.8" />
        <circle cx="22" cy="22" r="2" fill="white" fillOpacity="0.8" />
        
        {/* Sparkle nodes */}
        <circle cx="16" cy="8" r="1.5" fill="white" fillOpacity="0.7" />
        <circle cx="7" cy="16" r="1" fill="white" fillOpacity="0.5" />
        <circle cx="25" cy="16" r="1" fill="white" fillOpacity="0.5" />
      </svg>
    </div>
  );
}

// Icon-only version for favicons and small displays  
export function MemoraIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="memora-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      
      <rect width="32" height="32" rx="8" fill="url(#memora-gradient)" />
      
      {/* M shape with nodes */}
      <path d="M8 22V11" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 11L16 17" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 17L24 11" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 11V22" stroke="white" strokeWidth="2" strokeLinecap="round" />
      
      <circle cx="8" cy="11" r="2" fill="white" />
      <circle cx="24" cy="11" r="2" fill="white" />
      <circle cx="16" cy="17" r="2.5" fill="white" />
    </svg>
  );
}
