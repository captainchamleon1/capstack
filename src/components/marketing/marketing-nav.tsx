import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/#product", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/409a", label: "409A" },
  { href: "/#compare", label: "Compare" },
  { href: "/security", label: "Trust center" },
];

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-default/80 bg-ink/95 backdrop-blur-sm">
      <div className="marketing-container flex h-16 items-center justify-between gap-6 lg:h-[4.25rem]">
        <Link href="/" className="shrink-0">
          <Logo size="sm" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex lg:gap-9 lg:text-[0.9375rem]">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
