import { MarketingNav } from "./marketing-nav";
import { MarketingFooter } from "./marketing-footer";

export function MarketingSubpage({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-site min-h-screen">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
