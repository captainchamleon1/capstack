export function MarketingAmbient() {
  return (
    <div className="marketing-ambient pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Left — vertical rail + ticks */}
      <div className="marketing-ambient-left hidden lg:block">
        <span className="marketing-ambient-rail" />
        <span className="marketing-ambient-tick marketing-ambient-tick-1" />
        <span className="marketing-ambient-tick marketing-ambient-tick-2" />
        <span className="marketing-ambient-tick marketing-ambient-tick-3" />
      </div>

      {/* Left lower — ownership stack motif */}
      <div className="marketing-ambient-stack hidden xl:block">
        <span style={{ width: "72%" }} />
        <span style={{ width: "48%" }} />
        <span style={{ width: "61%" }} />
        <span style={{ width: "34%" }} />
      </div>

      {/* Right — arc + diagonals */}
      <div className="marketing-ambient-right hidden lg:block">
        <svg viewBox="0 0 200 200" className="marketing-ambient-arc" fill="none">
          <circle cx="160" cy="40" r="120" stroke="currentColor" strokeWidth="1" />
          <circle cx="160" cy="40" r="88" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>
        <span className="marketing-ambient-diagonal marketing-ambient-diagonal-1" />
        <span className="marketing-ambient-diagonal marketing-ambient-diagonal-2" />
        <span className="marketing-ambient-diagonal marketing-ambient-diagonal-3" />
      </div>

      {/* Right lower — faint watermark */}
      <p className="marketing-ambient-watermark hidden 2xl:block">FD</p>

      {/* Asymmetric corner washes */}
      <div className="marketing-ambient-wash marketing-ambient-wash-left" />
      <div className="marketing-ambient-wash marketing-ambient-wash-right" />
    </div>
  );
}
