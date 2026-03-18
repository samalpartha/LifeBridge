"use client";

import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  variant?: "light" | "dark";
  className?: string;
  iconSize?: number;
  showSubtitle?: boolean;
};

export function BrandLogo({
  href = "/",
  variant = "dark",
  className = "",
  iconSize = 40,
  showSubtitle = true,
}: BrandLogoProps) {
  const titleClass = variant === "light" ? "text-white" : "text-slate-900";
  const subtitleClass =
    variant === "light" ? "text-slate-200" : "text-slate-600";
  const iconSurfaceClass = variant === "light" ? "bg-white/95" : "bg-white";

  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 ${className}`}
      aria-label="Go to LifeBridge home"
    >
      <div
        className={`overflow-hidden rounded-xl border border-slate-200/60 ${iconSurfaceClass} flex items-center justify-center shadow-sm transition-shadow duration-200 group-hover:shadow-md`}
        style={{ width: iconSize, height: iconSize }}
      >
        <Image
          src="/icon.png"
          alt="LifeBridge Logo"
          width={iconSize}
          height={iconSize}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority
        />
      </div>
      <div>
        <h1 className={`text-2xl font-bold leading-tight ${titleClass}`}>
          LifeBridge
        </h1>
        {showSubtitle && (
          <p className={`text-sm leading-tight ${subtitleClass}`}>
            Crisis + Mobility Copilot
          </p>
        )}
      </div>
    </Link>
  );
}
