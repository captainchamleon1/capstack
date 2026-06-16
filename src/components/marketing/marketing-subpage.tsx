import { MarketingNav } from "./marketing-nav";
import { MarketingFooter } from "./marketing-footer";
import { MarketingAmbient } from "./marketing-ambient";

export function MarketingSubpage({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-site relative isolate min-h-screen overflow-x-hidden">
      <MarketingAmbient />
      <MarketingNav />
      <main className="relative z-10">{children}</main>
      <MarketingFooter />
    </div>
  );
}
