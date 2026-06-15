"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { modelFundraise, modelNoteConversion, modelSafeConversion } from "@/lib/cap-table";
import type { CapTableSummary } from "@/lib/cap-table";
import { formatCurrency, formatNumber, formatPercent, formatDate } from "@/lib/utils";
import { CloseRoundDialog } from "./close-round-dialog";
import { ReadOnlyBanner } from "@/components/layout/read-only-banner";

interface FundraiseModelerProps {
  capTable: CapTableSummary;
  founderIds: string[];
  stakeholders: { id: string; name: string; type: string }[];
  safes: {
    id: string;
    status: string;
    investmentAmount: number;
    valuationCap: number | null;
    discountRate: number | null;
    type: string;
    stakeholder: { id: string; name: string };
  }[];
  notes: {
    id: string;
    status: string;
    principalAmount: number;
    interestRate: number;
    valuationCap: number | null;
    discountRate: number | null;
    issueDate: string;
    stakeholder: { id: string; name: string };
  }[];
  fundraiseRounds: {
    id: string;
    name: string;
    type: string;
    status: string;
    preMoneyValuation: number | null;
    investmentAmount: number | null;
    pricePerShare: number | null;
    closeDate: string | null;
  }[];
  canWrite?: boolean;
}

export function FundraiseModeler({
  capTable,
  founderIds,
  stakeholders,
  safes,
  notes,
  fundraiseRounds,
  canWrite = false,
}: FundraiseModelerProps) {
  const [preMoney, setPreMoney] = useState(50000000);
  const [investment, setInvestment] = useState(15000000);
  const [poolTarget, setPoolTarget] = useState(0.1);

  const scenario = useMemo(
    () => modelFundraise(capTable, preMoney, investment, poolTarget, founderIds),
    [capTable, preMoney, investment, poolTarget, founderIds]
  );

  const safeConversions = useMemo(
    () =>
      modelSafeConversion(
        safes.map((s) => ({
          id: s.id,
          status: s.status,
          investmentAmount: s.investmentAmount,
          valuationCap: s.valuationCap,
          discountRate: s.discountRate,
          type: s.type,
          stakeholder: s.stakeholder,
        })),
        scenario.postMoneyValuation,
        scenario.pricePerShare
      ),
    [safes, scenario.postMoneyValuation, scenario.pricePerShare]
  );

  const noteConversions = useMemo(
    () =>
      modelNoteConversion(
        notes.map((n) => ({
          id: n.id,
          status: n.status,
          principalAmount: n.principalAmount,
          interestRate: n.interestRate,
          valuationCap: n.valuationCap,
          discountRate: n.discountRate,
          issueDate: new Date(n.issueDate),
          stakeholder: n.stakeholder,
        })),
        scenario.postMoneyValuation,
        scenario.pricePerShare
      ),
    [notes, scenario.postMoneyValuation, scenario.pricePerShare]
  );

  const totalSafeShares = safeConversions.reduce((sum, s) => sum + s.shares, 0);
  const totalNoteShares = noteConversions.reduce((sum, s) => sum + s.shares, 0);
  const investors = stakeholders.filter((s) => s.type === "investor");
  const outstandingSafes = safes.filter((s) => s.status === "outstanding").length;
  const outstandingNotes = notes.filter((n) => n.status === "outstanding").length;

  return (
    <div className="space-y-6">
      {!canWrite && <ReadOnlyBanner />}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground max-w-xl">
          Adjust terms below, then close the round to record preferred issuance, SAFE/note conversions,
          and pool changes on your cap table.
        </p>
        {canWrite && (
        <CloseRoundDialog
          preMoney={preMoney}
          investment={investment}
          poolTarget={poolTarget}
          pricePerShare={scenario.pricePerShare}
          newShares={scenario.newShares}
          poolIncrease={scenario.optionPoolShares}
          safeConversions={safeConversions}
          noteConversions={noteConversions}
          investors={investors}
          outstandingSafes={outstandingSafes}
          outstandingNotes={outstandingNotes}
        />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <label className="text-xs text-subtle-foreground uppercase tracking-wider">
              Pre-Money Valuation
            </label>
            <Input
              type="number"
              value={preMoney}
              onChange={(e) => setPreMoney(Number(e.target.value))}
              className="mt-2 text-lg font-bold"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <label className="text-xs text-subtle-foreground uppercase tracking-wider">
              Investment Amount
            </label>
            <Input
              type="number"
              value={investment}
              onChange={(e) => setInvestment(Number(e.target.value))}
              className="mt-2 text-lg font-bold"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <label className="text-xs text-subtle-foreground uppercase tracking-wider">
              Option Pool Target (%)
            </label>
            <Input
              type="number"
              step="0.01"
              value={poolTarget}
              onChange={(e) => setPoolTarget(Number(e.target.value))}
              className="mt-2 text-lg font-bold"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Post-Money Valuation", value: formatCurrency(scenario.postMoneyValuation) },
          { label: "Price Per Share", value: formatCurrency(scenario.pricePerShare) },
          { label: "New Investor Shares", value: formatNumber(scenario.newShares) },
          { label: "Investor Ownership", value: formatPercent(scenario.investorOwnership, 1) },
          { label: "Founder Dilution", value: formatPercent(scenario.founderDilution, 1) },
          { label: "Pool Increase", value: formatNumber(scenario.optionPoolShares) },
          { label: "SAFE Conversion Shares", value: formatNumber(totalSafeShares) },
          { label: "Note Conversion Shares", value: formatNumber(totalNoteShares) },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-xs text-subtle-foreground">{stat.label}</p>
              <p className="mt-1 text-lg font-bold text-brand stat-value">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {fundraiseRounds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Round History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-muted-foreground">
                  <th className="text-left py-3 px-6 font-medium">Round</th>
                  <th className="text-left py-3 px-6 font-medium">Status</th>
                  <th className="text-right py-3 px-6 font-medium">Pre-Money</th>
                  <th className="text-right py-3 px-6 font-medium">Investment</th>
                  <th className="text-right py-3 px-6 font-medium">Price / Share</th>
                  <th className="text-left py-3 px-6 font-medium">Closed</th>
                </tr>
              </thead>
              <tbody>
                {fundraiseRounds.map((round) => (
                  <tr key={round.id} className="border-b border-border-default/50">
                    <td className="py-3 px-6 font-medium text-foreground">{round.name}</td>
                    <td className="py-3 px-6">
                      <Badge variant={round.status === "closed" ? "default" : "secondary"}>
                        {round.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-6 text-right stat-value">
                      {round.preMoneyValuation ? formatCurrency(round.preMoneyValuation) : "—"}
                    </td>
                    <td className="py-3 px-6 text-right stat-value">
                      {round.investmentAmount ? formatCurrency(round.investmentAmount) : "—"}
                    </td>
                    <td className="py-3 px-6 text-right stat-value">
                      {round.pricePerShare ? formatCurrency(round.pricePerShare) : "—"}
                    </td>
                    <td className="py-3 px-6 text-muted-foreground">
                      {round.closeDate ? formatDate(round.closeDate) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Post-Money Ownership</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-muted-foreground">
                <th className="text-left py-3 px-6 font-medium">Stakeholder</th>
                <th className="text-left py-3 px-6 font-medium">Type</th>
                <th className="text-right py-3 px-6 font-medium">Shares</th>
                <th className="text-right py-3 px-6 font-medium">Ownership</th>
              </tr>
            </thead>
            <tbody>
              {scenario.postMoneyOwnership
                .sort((a, b) => b.ownershipPercent - a.ownershipPercent)
                .map((entry, i) => (
                  <tr key={i} className="border-b border-border-default/50">
                    <td className="py-3 px-6 font-medium text-foreground">{entry.stakeholderName}</td>
                    <td className="py-3 px-6">
                      <Badge variant="outline">{entry.stakeholderType}</Badge>
                    </td>
                    <td className="py-3 px-6 text-right stat-value">
                      {formatNumber(entry.fullyDilutedShares)}
                    </td>
                    <td className="py-3 px-6 text-right stat-value text-brand">
                      {formatPercent(entry.ownershipPercent, 2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {safeConversions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>SAFE Conversions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-muted-foreground">
                  <th className="text-left py-3 px-6 font-medium">Investor</th>
                  <th className="text-right py-3 px-6 font-medium">Investment</th>
                  <th className="text-right py-3 px-6 font-medium">Shares</th>
                  <th className="text-left py-3 px-6 font-medium">Method</th>
                </tr>
              </thead>
              <tbody>
                {safeConversions.map((conv, i) => (
                  <tr key={i} className="border-b border-border-default/50">
                    <td className="py-3 px-6 font-medium text-foreground">{conv.stakeholderName}</td>
                    <td className="py-3 px-6 text-right stat-value">
                      {formatCurrency(conv.investmentAmount)}
                    </td>
                    <td className="py-3 px-6 text-right stat-value">{formatNumber(conv.shares)}</td>
                    <td className="py-3 px-6">
                      <Badge variant="info">{conv.conversionMethod.replace(/_/g, " ")}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {noteConversions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Note Conversions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-muted-foreground">
                  <th className="text-left py-3 px-6 font-medium">Investor</th>
                  <th className="text-right py-3 px-6 font-medium">Amount</th>
                  <th className="text-right py-3 px-6 font-medium">Shares</th>
                  <th className="text-left py-3 px-6 font-medium">Method</th>
                </tr>
              </thead>
              <tbody>
                {noteConversions.map((conv, i) => (
                  <tr key={i} className="border-b border-border-default/50">
                    <td className="py-3 px-6 font-medium text-foreground">{conv.stakeholderName}</td>
                    <td className="py-3 px-6 text-right stat-value">
                      {formatCurrency(conv.investmentAmount)}
                    </td>
                    <td className="py-3 px-6 text-right stat-value">{formatNumber(conv.shares)}</td>
                    <td className="py-3 px-6">
                      <Badge variant="info">{conv.conversionMethod.replace(/_/g, " ")}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
