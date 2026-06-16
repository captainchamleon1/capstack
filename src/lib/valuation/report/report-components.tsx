import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { reportStyles } from "./brand";
import { fmtMoney, fmtPct, fmtShare, fmtShares } from "./report-data";
import type { GroupAllocation } from "../types";

const right = { textAlign: "right" as const };
const center = { textAlign: "center" as const };
const s = reportStyles;

export function KV({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={s.kvRow}>
      <Text style={s.kvLabel}>{label}</Text>
      <Text style={[s.kvValue, highlight ? { color: "#9a7b33", fontSize: 10 } : {}]}>{value}</Text>
    </View>
  );
}

export function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 4 }}>
      <Text style={{ width: 14, color: "#9a7b33" }}>•</Text>
      <Text style={{ flex: 1, textAlign: "justify" }}>{children}</Text>
    </View>
  );
}

export function Numbered({ i, children }: { i: number; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 6 }}>
      <Text style={{ width: 20, color: "#4a5568", fontSize: 9.5 }}>{i}.</Text>
      <Text style={{ flex: 1, textAlign: "justify", fontSize: 9.5 }}>{children}</Text>
    </View>
  );
}

export function CapRow({ label, shares, fd }: { label: string; shares: number; fd: number }) {
  return (
    <View style={s.tr}>
      <Text style={[s.td, { width: "54%" }]}>{label}</Text>
      <Text style={[s.td, { width: "23%" }, right]}>{fmtShares(shares)}</Text>
      <Text style={[s.td, { width: "23%" }, right]}>{fmtPct(fd > 0 ? shares / fd : 0, 2)}</Text>
    </View>
  );
}

export function ApproachRow({ approach, decision, rationale }: { approach: string; decision: string; rationale: string }) {
  return (
    <View style={s.tr}>
      <Text style={[s.td, { width: "28%" }]}>{approach}</Text>
      <Text style={[s.tdBold, { width: "18%" }]}>{decision}</Text>
      <Text style={[s.td, { width: "54%" }]}>{rationale}</Text>
    </View>
  );
}

export function EquityClassRow({ al, dlom, fmv }: { al?: GroupAllocation; dlom?: number; fmv?: number }) {
  if (!al) return null;
  const hasDlom = dlom != null && fmv != null;
  return (
    <View style={s.tr}>
      <Text style={[s.td, { width: "30%" }]}>{al.label}</Text>
      <Text style={[s.td, { width: "18%" }, right]}>{fmtMoney(al.value)}</Text>
      <Text style={[s.td, { width: "16%" }, right]}>{fmtShares(al.shares)}</Text>
      <Text style={[s.td, { width: "12%" }, right]}>{fmtShare(al.perShare)}</Text>
      <Text style={[s.td, { width: "12%" }, right]}>{hasDlom ? `(${fmtPct(dlom!)})` : "—"}</Text>
      <Text style={[s.td, { width: "12%" }, right]}>{hasDlom ? fmtShare(fmv!) : "—"}</Text>
    </View>
  );
}

export function SensTable({
  title,
  rows,
  fmtInput,
  base,
}: {
  title: string;
  rows: { input: number; fmv: number }[];
  fmtInput: (v: number) => string;
  base: number;
}) {
  return (
    <View style={s.table}>
      <View style={s.trHead}>
        <Text style={[s.th, { width: "55%" }]}>{title}</Text>
        <Text style={[s.th, { width: "45%" }, right]}>FMV / sh</Text>
      </View>
      {rows.map((row, i) => {
        const isBase = Math.abs(row.input - base) < 1e-9;
        return (
          <View style={s.tr} key={i}>
            <Text style={[isBase ? s.tdBold : s.td, { width: "55%" }]}>
              {fmtInput(row.input)}
              {isBase ? "  (base)" : ""}
            </Text>
            <Text style={[isBase ? s.tdBold : s.td, { width: "45%" }, right]}>{fmtShare(row.fmv)}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function DistributionTable({
  allocations,
  tranches,
  mode,
  equityValue,
}: {
  allocations: GroupAllocation[];
  tranches: { marginalFractions: Record<string, number>; trancheValue: number }[];
  mode: "pct" | "usd";
  equityValue?: number;
}) {
  const classW = 28;
  const colW = (100 - classW) / tranches.length;
  return (
    <View style={s.table}>
      <View style={s.trHead}>
        <Text style={[s.th, { width: `${classW}%` }]}>Class</Text>
        {tranches.map((_, i) => (
          <Text key={i} style={[s.th, { width: `${colW}%` }, right]}>
            T{i + 1}
          </Text>
        ))}
      </View>
      {allocations.map((al) => (
        <View style={s.tr} key={al.key}>
          <Text style={[s.td, { width: `${classW}%` }]}>{al.label}</Text>
          {tranches.map((t, i) => {
            const frac = t.marginalFractions[al.key] ?? 0;
            const v = mode === "pct" ? fmtPct(frac, 1) : fmtMoney(frac * t.trancheValue);
            return (
              <Text key={i} style={[s.td, { width: `${colW}%` }, right]}>
                {v}
              </Text>
            );
          })}
        </View>
      ))}
      <View style={s.trTotal}>
        <Text style={[s.tdBold, { width: `${classW}%` }]}>Total</Text>
        {tranches.map((t, i) => (
          <Text key={i} style={[s.tdBold, { width: `${colW}%` }, right]}>
            {mode === "pct" ? "100%" : fmtMoney(t.trancheValue)}
          </Text>
        ))}
      </View>
      {mode === "usd" && equityValue != null && (
        <View style={s.trTotal}>
          <Text style={[s.tdBold, { width: `${classW}%` }]}>Equity value</Text>
          <Text style={[s.tdBold, { width: `${100 - classW}%` }, right]}>{fmtMoney(equityValue)}</Text>
        </View>
      )}
    </View>
  );
}

export function SensitivityMatrixTable({
  cells,
  baseVol,
  baseTime,
}: {
  cells: { volatility: number; timeToLiquidity: number; fmv: number }[];
  baseVol: number;
  baseTime: number;
}) {
  const vols = [...new Set(cells.map((c) => c.volatility))].sort((a, b) => a - b);
  const times = [...new Set(cells.map((c) => c.timeToLiquidity))].sort((a, b) => a - b);
  const lookup = new Map(cells.map((c) => [`${c.volatility}|${c.timeToLiquidity}`, c.fmv]));

  return (
    <View style={s.table}>
      <View style={s.trHead}>
        <Text style={[s.th, { width: "18%" }]}>σ \\ T</Text>
        {times.map((t) => (
          <Text key={t} style={[s.th, { width: `${82 / times.length}%` }, center]}>
            {t.toFixed(1)} yr
          </Text>
        ))}
      </View>
      {vols.map((v) => (
        <View style={s.tr} key={v}>
          <Text style={[s.tdBold, { width: "18%" }]}>{fmtPct(v)}</Text>
          {times.map((t) => {
            const fmv = lookup.get(`${v}|${t}`) ?? 0;
            const isBase = Math.abs(v - baseVol) < 1e-9 && Math.abs(t - baseTime) < 1e-9;
            return (
              <Text key={t} style={[isBase ? s.tdBold : s.td, { width: `${82 / times.length}%` }, center]}>
                {fmtShare(fmv)}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function ClassHeaderRow() {
  return (
    <View style={s.trHead}>
      <Text style={[s.th, { width: "30%" }]}>Class</Text>
      <Text style={[s.th, { width: "18%" }, right]}>Total value</Text>
      <Text style={[s.th, { width: "16%" }, right]}>Shares</Text>
      <Text style={[s.th, { width: "12%" }, right]}>Price/sh</Text>
      <Text style={[s.th, { width: "12%" }, right]}>DLOM</Text>
      <Text style={[s.th, { width: "12%" }, right]}>FMV/sh</Text>
    </View>
  );
}
