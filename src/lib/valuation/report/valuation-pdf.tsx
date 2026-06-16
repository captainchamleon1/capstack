import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ValuationReportData } from "./report-data";
import { fmtMoney, fmtShare, fmtShares, fmtPct, fmtDate } from "./report-data";
import type { GroupAllocation } from "../types";

const C = {
  ink: "#0b0d12",
  text: "#1f2430",
  muted: "#5b6472",
  faint: "#8a93a3",
  line: "#d8dce4",
  lineSoft: "#e8ebf0",
  brand: "#9a7b33",
  brandSoft: "#f3eddd",
  headerBg: "#f5f6f8",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: { paddingTop: 56, paddingBottom: 60, paddingHorizontal: 50, fontSize: 9.5, fontFamily: "Helvetica", color: C.text, lineHeight: 1.5 },
  runningHeader: { position: "absolute", top: 24, left: 50, right: 50, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.faint, borderBottomWidth: 0.5, borderBottomColor: C.lineSoft, paddingBottom: 4 },
  footer: { position: "absolute", bottom: 26, left: 50, right: 50, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.faint, borderTopWidth: 0.5, borderTopColor: C.lineSoft, paddingTop: 6 },

  cover: { flex: 1, justifyContent: "center", paddingHorizontal: 36 },
  coverEyebrow: { fontSize: 8.5, letterSpacing: 2, color: C.brand, fontFamily: "Helvetica-Bold", marginBottom: 14 },
  coverTitle: { fontSize: 13, color: C.muted, marginBottom: 4 },
  coverCompany: { fontSize: 30, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 18 },
  coverRule: { borderBottomWidth: 2, borderBottomColor: C.brand, width: 64, marginBottom: 24 },
  coverMetaRow: { flexDirection: "row", marginBottom: 5 },
  coverMetaLabel: { width: 150, color: C.muted, fontSize: 10 },
  coverMetaValue: { color: C.ink, fontSize: 10, fontFamily: "Helvetica-Bold" },
  statusPill: { marginTop: 24, alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 3, fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  conclusionBox: { marginTop: 26, borderWidth: 1, borderColor: C.brand, backgroundColor: C.brandSoft, borderRadius: 4, padding: 18 },
  conclusionLabel: { fontSize: 8.5, letterSpacing: 1.5, color: C.brand, fontFamily: "Helvetica-Bold" },
  conclusionValue: { fontSize: 32, fontFamily: "Helvetica-Bold", color: C.ink, marginTop: 6 },
  conclusionSub: { fontSize: 9, color: C.muted, marginTop: 4 },

  h1: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.ink, marginTop: 6, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  h1Rule: { borderBottomWidth: 1.5, borderBottomColor: C.brand, width: 36, marginBottom: 10 },
  h2: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink, marginTop: 14, marginBottom: 5 },
  h3: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.brand, marginTop: 10, marginBottom: 3 },
  p: { marginBottom: 7, textAlign: "justify" },
  exhibitCap: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.muted, marginTop: 8, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 },
  bullet: { flexDirection: "row", marginBottom: 3, paddingLeft: 2 },
  bulletDot: { width: 12, color: C.brand },
  bulletText: { flex: 1 },
  numbered: { flexDirection: "row", marginBottom: 5 },
  numberedIdx: { width: 18, color: C.muted },
  numberedText: { flex: 1, textAlign: "justify" },

  table: { borderWidth: 0.5, borderColor: C.line, marginTop: 4, marginBottom: 8 },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.lineSoft },
  trHead: { flexDirection: "row", backgroundColor: C.headerBg, borderBottomWidth: 0.5, borderBottomColor: C.line },
  trTotal: { flexDirection: "row", backgroundColor: C.headerBg, borderTopWidth: 0.5, borderTopColor: C.line },
  th: { paddingVertical: 4, paddingHorizontal: 5, fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.muted },
  td: { paddingVertical: 4, paddingHorizontal: 5, fontSize: 8, color: C.text },
  tdBold: { paddingVertical: 4, paddingHorizontal: 5, fontSize: 8, fontFamily: "Helvetica-Bold", color: C.ink },

  kvRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.lineSoft, paddingVertical: 3 },
  kvLabel: { width: "58%", color: C.muted, fontSize: 9 },
  kvValue: { width: "42%", color: C.ink, fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "right" },

  note: { fontSize: 7.5, color: C.muted, fontStyle: "italic", marginTop: 3, marginBottom: 6 },
  warn: { fontSize: 8.5, color: "#8a5a00", backgroundColor: "#fbf3e0", borderWidth: 0.5, borderColor: "#e8d39a", borderRadius: 3, padding: 6, marginBottom: 6 },

  tocRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5, borderBottomWidth: 0.5, borderBottomColor: C.lineSoft },
  tocText: { fontSize: 9.5, color: C.text },
  tocSub: { fontSize: 9, color: C.muted, paddingLeft: 14 },
});

const right = { textAlign: "right" as const };
const center = { textAlign: "center" as const };

function Running({ data }: { data: ValuationReportData }) {
  return (
    <View style={styles.runningHeader} fixed>
      <Text>Valuation of {data.company.legalName || data.company.name}</Text>
      <Text>{fmtDate(data.meta.valuationDate)}</Text>
    </View>
  );
}
function Footer({ data }: { data: ValuationReportData }) {
  const isFinal = data.meta.status === "final";
  return (
    <View style={styles.footer} fixed>
      <Text>
        Confidential · Prepared by {data.meta.preparedByName || "Equitr Valuations"}
        {!isFinal ? " · DRAFT — subject to analyst review" : ""}
      </Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`} />
    </View>
  );
}
function H1({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <View wrap={false}>
      <Text style={styles.h1} id={id}>{children}</Text>
      <View style={styles.h1Rule} />
    </View>
  );
}
function KV({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={[styles.kvValue, highlight ? { color: C.brand, fontSize: 10.5 } : {}]}>{value}</Text>
    </View>
  );
}
function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}
function Numbered({ i, children }: { i: number; children: React.ReactNode }) {
  return (
    <View style={styles.numbered}>
      <Text style={styles.numberedIdx}>{i}.</Text>
      <Text style={styles.numberedText}>{children}</Text>
    </View>
  );
}

export function ValuationPdfDocument({ data }: { data: ValuationReportData }) {
  const r = data.result;
  const a = r.assumptions;
  const isFinal = data.meta.status === "final";
  const company = data.company.legalName || data.company.name;
  const statusColor = isFinal ? { backgroundColor: "#1f7a4d", color: C.white } : { backgroundColor: "#8a5a00", color: C.white };

  const commonAlloc = r.opm.allocations.find((al) => al.kind === "common");
  const prefAlloc = r.opm.allocations.filter((al) => al.kind === "preferred");
  const optAlloc = r.opm.allocations.filter((al) => al.kind === "option");
  const valueBasis = r.method === "opm_backsolve" ? "Market Approach — Recent Securities Transaction (Backsolve)" : "Direct equity value input";

  return (
    <Document title={`${data.company.name} — 409A Valuation`} author="Equitr Valuations">
      {/* ===== COVER ===== */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.coverEyebrow}>INDEPENDENT APPRAISAL — IRC §409A</Text>
          <Text style={styles.coverTitle}>Independent appraisal valuation of the common stock of</Text>
          <Text style={styles.coverCompany}>{data.company.name}</Text>
          <View style={styles.coverRule} />
          <View style={styles.coverMetaRow}><Text style={styles.coverMetaLabel}>Valuation date</Text><Text style={styles.coverMetaValue}>{fmtDate(data.meta.valuationDate)}</Text></View>
          <View style={styles.coverMetaRow}><Text style={styles.coverMetaLabel}>Expiration date</Text><Text style={styles.coverMetaValue}>{fmtDate(data.meta.expirationDate)}</Text></View>
          <View style={styles.coverMetaRow}><Text style={styles.coverMetaLabel}>Report date</Text><Text style={styles.coverMetaValue}>{fmtDate(data.meta.reportDate)}</Text></View>
          <View style={styles.coverMetaRow}><Text style={styles.coverMetaLabel}>Subject security</Text><Text style={styles.coverMetaValue}>Common Stock</Text></View>
          <View style={styles.coverMetaRow}><Text style={styles.coverMetaLabel}>Prepared by</Text><Text style={styles.coverMetaValue}>{data.meta.preparedByName || "Equitr Valuations"}</Text></View>
          <Text style={[styles.statusPill, statusColor]}>{isFinal ? "FINAL" : "DRAFT — PENDING ANALYST REVIEW"}</Text>
          <View style={styles.conclusionBox}>
            <Text style={styles.conclusionLabel}>CONCLUDED FAIR MARKET VALUE — COMMON STOCK</Text>
            <Text style={styles.conclusionValue}>{fmtShare(r.concludedFmv)}</Text>
            <Text style={styles.conclusionSub}>per share, on a non-marketable, non-controlling basis, as of {fmtDate(data.meta.valuationDate)}</Text>
          </View>
        </View>
        <Footer data={data} />
      </Page>

      {/* ===== TABLE OF CONTENTS ===== */}
      <Page size="LETTER" style={styles.page}>
        <Running data={data} />
        <H1>Table of Contents</H1>
        {[
          ["1.", "Summary of Findings"],
          ["", "Purpose and Scope · Summary of Findings"],
          ["2.", "Introduction"],
          ["", "Standard of Value · Level of Value · Premise of Value · Source of Information"],
          ["3.", "IRC Section §409A"],
          ["4.", "Overview of Valuation"],
          ["5.", "Corporate Profile"],
          ["", "Company Overview · Capital Structure"],
          ["6.", "Valuation Methodology and Approach"],
          ["", "Methodology Overview · Valuation Approaches · Selection of Approach"],
          ["7.", "Determination of Total Equity Value"],
          ["8.", "Allocation of Equity Value"],
          ["", "Allocation Methods · Option Pricing Method"],
          ["9.", "Conclusion of Value"],
          ["10.", "Premiums and Discounts"],
          ["", "Discount for Lack of Marketability"],
          ["11.", "Sensitivity Analysis"],
          ["12.", "Assumptions and Limiting Conditions"],
          ["13.", "Valuation Analyst's Representation"],
          ["A.", "Appendix — Option Pricing Model"],
          ["", "Capitalization · Breakpoint Analysis · Option Values · Distribution of Value · Valuation of Each Class"],
        ].map(([num, label], i) => (
          <View key={i} style={styles.tocRow}>
            <Text style={num ? styles.tocText : styles.tocSub}>
              {num ? `${num}  ${label}` : label}
            </Text>
          </View>
        ))}
        <Footer data={data} />
      </Page>

      {/* ===== 1. SUMMARY OF FINDINGS ===== */}
      <Page size="LETTER" style={styles.page}>
        <Running data={data} />
        <H1 id="summary">1. Summary of Findings</H1>
        <Text style={styles.h2}>Purpose and Scope</Text>
        <Text style={styles.p}>
          Equitr Valuations has performed a valuation engagement of a non-controlling, non-marketable common equity
          interest in {company} (the &quot;Company&quot;), as of {fmtDate(data.meta.valuationDate)} (the &quot;Valuation
          Date&quot;). This valuation was performed to estimate the fair market value (&quot;FMV&quot;) of the
          Company&apos;s common stock for purposes of Internal Revenue Code (&quot;IRC&quot;) Section 409A and the pricing
          of equity compensation. The resulting conclusion of value should not be used for any other purpose or by any
          other party.
        </Text>
        <Text style={styles.p}>
          This engagement was conducted consistent with the AICPA Accounting and Valuation Guide, &quot;Valuation of
          Privately-Held-Company Equity Securities Issued as Compensation,&quot; and the Uniform Standards of Professional
          Appraisal Practice. The estimate of value that results from a valuation engagement is expressed as a conclusion
          of value.
        </Text>
        {!isFinal && (
          <Text style={styles.warn}>
            This report is a draft produced by Equitr&apos;s automated valuation engine and is subject to final review and
            sign-off by a qualified valuation analyst. It should not be relied upon for grant pricing until finalized.
          </Text>
        )}
        <Text style={styles.h2}>Summary of Findings</Text>
        <Text style={styles.p}>
          This conclusion is subject to the Statement of Assumptions and Limiting Conditions and to the Valuation
          Analyst&apos;s Representation contained herein. We have no obligation to update this report or our conclusion of
          value for information that comes to our attention after the date of this report.
        </Text>
        <View style={styles.table}>
          <KV label="Subject company" value={company} />
          <KV label="Subject security" value="Common Stock (non-marketable, non-controlling)" />
          <KV label="Valuation date" value={fmtDate(data.meta.valuationDate)} />
          <KV label="Concluded fair market value" value={`${fmtShare(r.concludedFmv)} per share`} highlight />
        </View>
        <Footer data={data} />
      </Page>

      {/* ===== 2. INTRODUCTION ===== */}
      <Page size="LETTER" style={styles.page}>
        <Running data={data} />
        <H1 id="intro">2. Introduction</H1>
        <Text style={styles.h3}>Standard of Value — Revenue Ruling 59-60</Text>
        <Text style={styles.p}>
          We have valued the Company on a fair market value standard consistent with IRS Revenue Ruling 59-60. &quot;Fair
          market value&quot; is the price at which property would change hands between a willing buyer and a willing seller,
          neither being under any compulsion to buy or sell and both having reasonable knowledge of the relevant facts.
        </Text>
        <Text style={styles.h3}>Level of Value</Text>
        <Text style={styles.p}>
          Non-marketability: As the Company is privately held, the transfer of its shares is subject to constraints,
          indicating a lack of marketability addressed in the &quot;Discount for Lack of Marketability&quot; section.
          Non-control: the awards being granted are on a non-controlling basis. This valuation is therefore conducted on a
          non-marketable and non-controlling basis.
        </Text>
        <Text style={styles.h3}>Premise of Value</Text>
        <Text style={styles.p}>
          A company may be valued either as a going concern or as if in liquidation. This report is based on the
          going-concern premise of value.
        </Text>
        <Text style={styles.h3}>Source of Information</Text>
        <Text style={styles.p}>The key information relied upon in this valuation includes:</Text>
        <Bullet>The Company&apos;s capitalization table and share class terms as maintained in Equitr as of the Valuation Date.</Bullet>
        <Bullet>The Company&apos;s financing history, including the terms and pricing of its most recent preferred financing.</Bullet>
        <Bullet>The Company&apos;s certificate of incorporation and related governing documents.</Bullet>
        <Bullet>Representations from the Company&apos;s management regarding expected time to a liquidity event.</Bullet>
        <Bullet>Prevailing market data for risk-free rates and comparable-company equity volatility.</Bullet>
        <Text style={styles.note}>
          Information provided by the Company and management has been accepted without independent verification or audit.
        </Text>

        <H1 id="s409a">3. IRC Section §409A</H1>
        <Text style={styles.p}>
          Section 409A of the Internal Revenue Code governs nonqualified deferred compensation, including stock options.
          For private companies whose stock is not readily tradable, the exercise price of options must be at or above the
          fair market value of the underlying common stock on the grant date. The regulations provide presumptions of
          reasonableness (&quot;safe harbors&quot;) for determining fair market value:
        </Text>
        <Text style={styles.h3}>i. Independent Appraisal</Text>
        <Text style={styles.p}>
          A valuation by a qualified independent appraiser using acceptable methods, as of a date no more than 12 months
          before the transaction and with no intervening material change, is presumed reasonable. The burden then shifts to
          the IRS to show the valuation was grossly unreasonable. This report is intended to support the independent
          appraisal presumption.
        </Text>
        <Text style={styles.h3}>ii. Binding Formula Presumption</Text>
        <Text style={styles.p}>
          A value determined by the consistent application of a formula used for all transfers of the relevant class of
          stock may be presumed reasonable.
        </Text>
        <Text style={styles.h3}>iii. Illiquid Start-Up Presumption</Text>
        <Text style={styles.p}>
          A reasonable, good-faith valuation of an illiquid start-up corporation (generally less than 10 years old, with no
          anticipated liquidity event within 12 months) prepared by a person with significant relevant knowledge and
          experience may be presumed reasonable.
        </Text>
        <Footer data={data} />
      </Page>

      {/* ===== 4. OVERVIEW OF VALUATION ===== */}
      <Page size="LETTER" style={styles.page}>
        <Running data={data} />
        <H1 id="overview">4. Overview of Valuation</H1>
        <Text style={styles.p}>
          We estimated the total equity value of the Company and allocated that value to its outstanding securities using
          the Option Pricing Method, then applied a discount for lack of marketability to arrive at the fair market value
          of the common stock.
        </Text>

        <Text style={styles.exhibitCap}>Exhibit 1 — Valuation Result Overview</Text>
        <View style={styles.table}>
          <KV label={`Indicated total equity value (${r.method === "opm_backsolve" ? "backsolve" : "input"})`} value={fmtMoney(r.equityValue)} />
          <KV label="Allocated to common stock (marketable)" value={fmtMoney(commonAlloc?.value ?? 0)} />
          <KV label="Marketable common value per share" value={fmtShare(r.marketableCommonPerShare)} />
          <KV label={`Less: discount for lack of marketability (${fmtPct(r.dlom.value)})`} value={`(${fmtShare(r.marketableCommonPerShare - r.concludedFmv)})`} />
          <KV label="Concluded common FMV per share" value={fmtShare(r.concludedFmv)} highlight />
        </View>

        <Text style={styles.exhibitCap}>Exhibit 2 — Value of Each Equity Class</Text>
        <View style={styles.table}>
          <View style={styles.trHead}>
            <Text style={[styles.th, { width: "30%" }]}>Class</Text>
            <Text style={[styles.th, { width: "18%" }, right]}>Total value</Text>
            <Text style={[styles.th, { width: "16%" }, right]}>Shares</Text>
            <Text style={[styles.th, { width: "12%" }, right]}>Price/sh</Text>
            <Text style={[styles.th, { width: "12%" }, right]}>DLOM</Text>
            <Text style={[styles.th, { width: "12%" }, right]}>FMV/sh</Text>
          </View>
          <EquityClassRow al={commonAlloc} dlom={r.dlom.value} fmv={r.concludedFmv} />
          {prefAlloc.map((al) => <EquityClassRow key={al.key} al={al} />)}
          {optAlloc.map((al) => <EquityClassRow key={al.key} al={al} />)}
          <View style={styles.trTotal}>
            <Text style={[styles.tdBold, { width: "30%" }]}>Total</Text>
            <Text style={[styles.tdBold, { width: "18%" }, right]}>{fmtMoney(r.equityValue)}</Text>
            <Text style={[styles.tdBold, { width: "16%" }, right]}>{fmtShares(r.capStructure.fullyDilutedShares)}</Text>
            <Text style={[styles.tdBold, { width: "36%" }, right]}></Text>
          </View>
        </View>
        <Text style={styles.note}>The discount for lack of marketability is applied to the common stock, the subject of this valuation.</Text>
        <Footer data={data} />
      </Page>

      {/* ===== 5. CORPORATE PROFILE ===== */}
      <Page size="LETTER" style={styles.page}>
        <Running data={data} />
        <H1 id="profile">5. Corporate Profile</H1>
        <Text style={styles.h2}>Company Overview</Text>
        <View style={styles.table}>
          <KV label="Legal name" value={company} />
          <KV label="State of incorporation" value={data.company.state || "—"} />
          <KV label="Date of incorporation" value={data.company.incorporationDate ? fmtDate(data.company.incorporationDate) : "—"} />
          <KV label="Authorized shares" value={fmtShares(data.company.authorizedShares)} />
          <KV label="Fully diluted shares outstanding" value={fmtShares(r.capStructure.fullyDilutedShares)} />
        </View>

        <Text style={styles.h2}>Capital Structure</Text>
        <Text style={styles.p}>
          The Company&apos;s equity on a fully diluted basis as of the Valuation Date is summarized below. The rights and
          preferences of each class drive the allocation of equity value in the Option Pricing Method (see Appendix).
        </Text>
        <Text style={styles.exhibitCap}>Exhibit 3 — Capital Structure (Fully Diluted)</Text>
        <View style={styles.table}>
          <View style={styles.trHead}>
            <Text style={[styles.th, { width: "54%" }]}>Class</Text>
            <Text style={[styles.th, { width: "23%" }, right]}>Units</Text>
            <Text style={[styles.th, { width: "23%" }, right]}>% Fully diluted</Text>
          </View>
          <CapRow label="Common stock &amp; equivalents" shares={r.capStructure.commonShares} fd={r.capStructure.fullyDilutedShares} />
          {r.capStructure.preferred.map((p) => (
            <CapRow key={p.id} label={`${p.name} (${p.liquidationMultiple}x ${p.participating ? "participating" : "non-participating"})`} shares={p.shares} fd={r.capStructure.fullyDilutedShares} />
          ))}
          {r.capStructure.options.map((o) => (
            <CapRow key={o.strike} label={`Options / warrants @ ${fmtShare(o.strike)}`} shares={o.shares} fd={r.capStructure.fullyDilutedShares} />
          ))}
          <View style={styles.trTotal}>
            <Text style={[styles.tdBold, { width: "54%" }]}>Total fully diluted</Text>
            <Text style={[styles.tdBold, { width: "23%" }, right]}>{fmtShares(r.capStructure.fullyDilutedShares)}</Text>
            <Text style={[styles.tdBold, { width: "23%" }, right]}>100.00%</Text>
          </View>
        </View>
        <Footer data={data} />
      </Page>

      {/* ===== 6. METHODOLOGY ===== */}
      <Page size="LETTER" style={styles.page}>
        <Running data={data} />
        <H1 id="method">6. Valuation Methodology and Approach</H1>
        <Text style={styles.h2}>Methodology Overview</Text>
        <Text style={styles.p}>
          Consistent with Revenue Ruling 59-60, we considered the nature and history of the business; the economic and
          industry outlook; the book value and financial condition of the Company; its earning and dividend-paying
          capacity; the existence of goodwill or other intangible value; prior sales of stock and the size of the block to
          be valued; and the market prices of comparable publicly traded companies.
        </Text>
        <Text style={styles.h2}>Valuation Approaches</Text>
        <Text style={styles.h3}>Market Approach</Text>
        <Text style={styles.p}>
          The Market Approach indicates value by reference to comparable transactions or companies. For venture-backed
          companies, the most reliable indication of value is frequently the price negotiated in a recent arm&apos;s-length
          financing; the OPM backsolve method derives total equity value from that transaction.
        </Text>
        <Text style={styles.h3}>Income Approach</Text>
        <Text style={styles.p}>
          The Income Approach (typically a discounted cash flow analysis) indicates value as the present value of expected
          future economic benefits. It relies heavily on subjective long-range projections.
        </Text>
        <Text style={styles.h3}>Asset-Based Approach</Text>
        <Text style={styles.p}>
          The Asset-Based Approach indicates value by reference to the cost to reproduce or replace the Company&apos;s
          assets, net of liabilities. It tends to understate the value of going-concern enterprises with significant
          intangible or growth value.
        </Text>

        <Text style={styles.h2}>Selection of Valuation Approach</Text>
        <Text style={styles.exhibitCap}>Exhibit 4 — Approach Selection</Text>
        <View style={styles.table}>
          <View style={styles.trHead}>
            <Text style={[styles.th, { width: "30%" }]}>Approach</Text>
            <Text style={[styles.th, { width: "22%" }]}>Decision</Text>
            <Text style={[styles.th, { width: "48%" }]}>Rationale</Text>
          </View>
          {r.method === "opm_backsolve" ? (
            <ApproachRow approach="Market Approach" decision="Adopted" rationale="Recent arm's-length financing provides an objective, market-based indication of equity value." />
          ) : (
            <ApproachRow approach="Market Approach" decision="Considered" rationale="Equity value supplied directly; allocation performed via the OPM." />
          )}
          <ApproachRow approach="Income Approach" decision="Rejected" rationale="Relies on subjective long-range projections not appropriate for an early-stage company." />
          <ApproachRow approach="Asset-Based Approach" decision="Rejected" rationale="Fails to capture going-concern and intangible value." />
        </View>
        <Footer data={data} />
      </Page>

      {/* ===== 7. EQUITY VALUE ===== */}
      <Page size="LETTER" style={styles.page}>
        <Running data={data} />
        <H1 id="equity">7. Determination of Total Equity Value</H1>
        <Text style={styles.p}>Basis of value: {valueBasis}.</Text>
        {r.method === "opm_backsolve" ? (
          <>
            <Text style={styles.p}>
              We applied the OPM backsolve method, solving for the total equity value at which the Option Pricing Method
              allocates a per-share value to the {r.backsolve?.seriesName} equal to its most recent issuance price of{" "}
              {fmtShare(r.backsolve?.targetPricePerShare ?? 0)} per share
              {r.backsolve?.roundName ? ` (${r.backsolve.roundName})` : ""}. This anchors the valuation to an objective,
              arm&apos;s-length transaction.
            </Text>
            <Text style={styles.exhibitCap}>Exhibit 5 — Backsolve to Recent Transaction</Text>
            <View style={styles.table}>
              <KV label="Reference security" value={r.backsolve?.seriesName ?? "—"} />
              <KV label="Issuance price per share" value={fmtShare(r.backsolve?.targetPricePerShare ?? 0)} />
              <KV label="OPM-solved price per share (check)" value={fmtShare(r.backsolve?.solvedPricePerShare ?? 0)} />
              <KV label="Implied total equity value" value={fmtMoney(r.equityValue)} highlight />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.p}>
              The total equity value of {fmtMoney(r.equityValue)} was determined by an independent assessment supplied for
              this analysis and allocated to the Company&apos;s securities using the Option Pricing Method.
            </Text>
            <View style={styles.table}>
              <KV label="Total equity value" value={fmtMoney(r.equityValue)} highlight />
            </View>
          </>
        )}

        <H1 id="alloc">8. Allocation of Equity Value</H1>
        <Text style={styles.h2}>Allocation Methods</Text>
        <Text style={styles.p}>
          The AICPA guidelines describe three methods for allocating equity value among security classes: the Current Value
          Method (&quot;CVM&quot;), the Probability-Weighted Expected Return Method (&quot;PWERM&quot;), and the Option
          Pricing Method (&quot;OPM&quot;). Given the Company&apos;s complex capital structure with differing liquidation
          preferences and conversion rights, an uncertain exit horizon, and a range of possible future outcomes, the OPM was
          considered the most appropriate method.
        </Text>
        <Text style={styles.h2}>Option Pricing Method</Text>
        <Text style={styles.p}>
          The OPM treats each class of equity as a call option on the Company&apos;s total equity value, with exercise
          prices (&quot;breakpoints&quot;) reflecting the liquidation preferences, participation and conversion rights, and
          option exercise prices in the capital structure. The value within each tranche between consecutive breakpoints is
          estimated using the Black-Scholes-Merton option model and allocated to the securities participating in that
          tranche. The detailed breakpoint analysis, option values, and distribution of value are presented in the
          Appendix.
        </Text>
        <Text style={styles.exhibitCap}>Exhibit 6 — OPM Inputs</Text>
        <View style={styles.table}>
          <KV label="Time to liquidity event" value={`${a.timeToLiquidity.toFixed(2)} years`} />
          <KV label="Equity volatility" value={fmtPct(a.volatility)} />
          <KV label="Risk-free rate" value={fmtPct(a.riskFreeRate, 2)} />
          <KV label="Dividend yield" value={fmtPct(a.dividendYield, 2)} />
        </View>

        <H1 id="conclusion">9. Conclusion of Value</H1>
        <Text style={styles.p}>
          Based on the breakpoint analysis and capital structure detailed in the Appendix, and after applying the discount
          for lack of marketability described below, the fair market value of the Company&apos;s common stock is estimated
          at {fmtShare(r.concludedFmv)} per share on a non-marketable, non-controlling basis as of {fmtDate(data.meta.valuationDate)}.
        </Text>
        <View style={styles.table}>
          <KV label="Marketable common value per share" value={fmtShare(r.marketableCommonPerShare)} />
          <KV label={`Less: DLOM (${fmtPct(r.dlom.value)})`} value={`(${fmtShare(r.marketableCommonPerShare - r.concludedFmv)})`} />
          <KV label="Concluded fair market value per share" value={fmtShare(r.concludedFmv)} highlight />
        </View>
        <Footer data={data} />
      </Page>

      {/* ===== 10. PREMIUMS & DISCOUNTS + 11. SENSITIVITY ===== */}
      <Page size="LETTER" style={styles.page}>
        <Running data={data} />
        <H1 id="dlom">10. Premiums and Discounts</H1>
        <Text style={styles.p}>
          The final value of a closely-held interest may differ from the value indicated by the valuation methods after
          applying premiums or discounts, which depend on the standard of value and the rights of the interest being
          valued.
        </Text>
        <Text style={styles.h2}>Discount for Lack of Marketability</Text>
        <Text style={styles.p}>
          A discount for lack of marketability (&quot;DLOM&quot;) compensates for the difficulty of selling shares that are
          not traded on a public exchange. Shares in privately held companies lack the liquidity of publicly traded shares
          and are therefore worth less than an otherwise comparable marketable share. We estimated the DLOM using an
          option-based model, applying the {r.dlom.method === "finnerty" ? "Finnerty (2012) average-strike put option model" : "Chaffee (1993) protective put model"} as the
          concluded method, with the alternative model presented for reference.
        </Text>
        <Text style={styles.exhibitCap}>Exhibit 7 — DLOM Analysis</Text>
        <View style={styles.table}>
          <KV label="Holding period to liquidity (years)" value={r.dlom.holdingPeriod.toFixed(2)} />
          <KV label="Volatility" value={fmtPct(r.dlom.volatility)} />
          <KV label="Finnerty (2012) average-strike put" value={fmtPct(r.dlom.finnerty)} />
          <KV label="Chaffee (1993) protective put" value={fmtPct(r.dlom.chaffee)} />
          <KV label="Concluded DLOM" value={fmtPct(r.dlom.value)} highlight />
        </View>

        <H1 id="sensitivity">11. Sensitivity Analysis</H1>
        <Text style={styles.p}>
          The following tables present the sensitivity of the concluded common stock fair market value to changes in key
          assumptions, holding all else constant.
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <SensTable title="Volatility" rows={r.sensitivity.volatility} fmtInput={(v) => fmtPct(v)} base={a.volatility} />
          </View>
          <View style={{ flex: 1 }}>
            <SensTable title="Years to liquidity" rows={r.sensitivity.timeToLiquidity} fmtInput={(v) => `${v.toFixed(2)}`} base={a.timeToLiquidity} />
          </View>
          <View style={{ flex: 1 }}>
            <SensTable title="DLOM holding period" rows={r.sensitivity.dlom} fmtInput={(v) => `${v.toFixed(2)}`} base={r.dlom.holdingPeriod} />
          </View>
        </View>
        <Footer data={data} />
      </Page>

      {/* ===== 12. ASSUMPTIONS & LIMITING CONDITIONS ===== */}
      <Page size="LETTER" style={styles.page}>
        <Running data={data} />
        <H1 id="assumptions">12. Assumptions and Limiting Conditions</H1>
        {[
          "The conclusion of value arrived at herein is valid only for the stated purpose and only as of the Valuation Date. Subsequent events, including new financings or material changes in operations or market conditions, may materially affect the conclusion and would generally require an updated valuation.",
          "Financial and capitalization information provided by the Company or its representatives has been accepted without verification as fully and correctly reflecting the enterprise's conditions and operating results. We have not audited, reviewed, or compiled this information and express no assurance on it.",
          "Public, industry, and statistical information has been obtained from sources believed to be reliable, but we make no representation as to its accuracy or completeness and have performed no procedures to corroborate it.",
          "We do not provide assurance on the achievability of any results forecasted by or for the Company; actual results may differ materially from expectations.",
          "The conclusion of value assumes that the current level of management expertise and effectiveness will be maintained and that the character and integrity of the enterprise will not be materially changed.",
          "The Option Pricing Method assumes a single liquidity event at the expected time to liquidity, with equity value distributed according to the rights and preferences in the capital structure as of the Valuation Date.",
          "Volatility, time to liquidity, and the risk-free rate are estimates based on guideline public companies and prevailing market data; reasonable alternative inputs would produce different results, as illustrated in the sensitivity analysis.",
          "Outstanding convertible instruments (e.g., SAFEs or convertible notes) that have not yet converted are not separately modeled unless reflected in the capitalization table provided; the reviewing analyst should confirm their treatment.",
          "This report and the conclusion of value are for the exclusive use of the Company for the specific purposes noted herein and may not be used for any other purpose or by any other party. They do not constitute investment, legal, or tax advice.",
          "No part of this report may be disseminated to the public through any means of communication without prior written consent.",
          "We have no obligation to update this report for information or events arising after the report date, and no responsibility for any unauthorized change to this report.",
          "An actual transaction in the subject interest may occur at a higher or lower value depending on the circumstances and the motivations and knowledge of the parties at that time.",
          "No opinion is intended to be expressed on matters that require legal or other specialized expertise beyond that customarily employed by valuation analysts.",
        ].map((t, i) => (
          <Numbered key={i} i={i + 1}>{t}</Numbered>
        ))}

        <H1 id="rep">13. Valuation Analyst&apos;s Representation</H1>
        <Bullet>The statements of fact contained in this report are true and correct to the best of our knowledge and belief.</Bullet>
        <Bullet>The reported analyses, opinions, and conclusions are limited only by the reported assumptions and limiting conditions and are our impartial, unbiased professional analyses, opinions, and conclusions.</Bullet>
        <Bullet>We have no present or prospective interest in the Company or the property that is the subject of this report and no personal interest with respect to the parties involved.</Bullet>
        <Bullet>We have no bias with respect to the subject of this report or to the parties involved.</Bullet>
        <Bullet>Our engagement was not contingent upon developing or reporting predetermined results, and our compensation is not contingent on the conclusion of value.</Bullet>
        <Bullet>The economic and financial analyses were prepared by, and the conclusion of value reached under the supervision of, the qualified valuation analyst identified below.</Bullet>

        <View style={{ flexDirection: "row", marginTop: 24, justifyContent: "space-between" }}>
          <View style={{ width: "45%" }}>
            <View style={{ borderTopWidth: 0.5, borderTopColor: C.text, paddingTop: 4 }}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>{data.meta.preparedByName || "Equitr Valuations"}</Text>
              <Text style={{ fontSize: 8, color: C.muted }}>Prepared by</Text>
            </View>
          </View>
          <View style={{ width: "45%" }}>
            <View style={{ borderTopWidth: 0.5, borderTopColor: C.text, paddingTop: 4 }}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>{data.meta.reviewedByName || (isFinal ? "—" : "Pending review")}</Text>
              <Text style={{ fontSize: 8, color: C.muted }}>Reviewed by{data.meta.reviewedAt ? ` · ${fmtDate(data.meta.reviewedAt)}` : ""}</Text>
            </View>
          </View>
        </View>
        <Footer data={data} />
      </Page>

      {/* ===== APPENDIX: OPM ===== */}
      <Page size="LETTER" style={styles.page}>
        <Running data={data} />
        <H1 id="appendix">Appendix — Option Pricing Model to Allocate Value</H1>

        <Text style={styles.h3}>A.1 Capitalization Detail</Text>
        <Text style={styles.note}>LP = liquidation preference. Seniority ranked with 1 most senior. OIP = original issue price.</Text>
        <View style={styles.table}>
          <View style={styles.trHead}>
            <Text style={[styles.th, { width: "30%" }]}>Class</Text>
            <Text style={[styles.th, { width: "12%" }, center]}>LP</Text>
            <Text style={[styles.th, { width: "12%" }, center]}>Mult.</Text>
            <Text style={[styles.th, { width: "13%" }, center]}>Particip.</Text>
            <Text style={[styles.th, { width: "16%" }, right]}>OIP</Text>
            <Text style={[styles.th, { width: "17%" }, right]}>Shares</Text>
          </View>
          <View style={styles.tr}>
            <Text style={[styles.td, { width: "30%" }]}>Common stock</Text>
            <Text style={[styles.td, { width: "12%" }, center]}>—</Text>
            <Text style={[styles.td, { width: "12%" }, center]}>—</Text>
            <Text style={[styles.td, { width: "13%" }, center]}>—</Text>
            <Text style={[styles.td, { width: "16%" }, right]}>$0.0000</Text>
            <Text style={[styles.td, { width: "17%" }, right]}>{fmtShares(r.capStructure.commonShares)}</Text>
          </View>
          {r.capStructure.preferred.map((p) => (
            <View style={styles.tr} key={p.id}>
              <Text style={[styles.td, { width: "30%" }]}>{p.name}</Text>
              <Text style={[styles.td, { width: "12%" }, center]}>Y ({p.seniority})</Text>
              <Text style={[styles.td, { width: "12%" }, center]}>{p.liquidationMultiple}x</Text>
              <Text style={[styles.td, { width: "13%" }, center]}>{p.participating ? "Yes" : "No"}</Text>
              <Text style={[styles.td, { width: "16%" }, right]}>{fmtShare(p.originalIssuePrice)}</Text>
              <Text style={[styles.td, { width: "17%" }, right]}>{fmtShares(p.shares)}</Text>
            </View>
          ))}
          {r.capStructure.options.map((o) => (
            <View style={styles.tr} key={o.strike}>
              <Text style={[styles.td, { width: "30%" }]}>Options @ {fmtShare(o.strike)}</Text>
              <Text style={[styles.td, { width: "12%" }, center]}>—</Text>
              <Text style={[styles.td, { width: "12%" }, center]}>—</Text>
              <Text style={[styles.td, { width: "13%" }, center]}>—</Text>
              <Text style={[styles.td, { width: "16%" }, right]}>{fmtShare(o.strike)}</Text>
              <Text style={[styles.td, { width: "17%" }, right]}>{fmtShares(o.shares)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.h3}>A.2 Breakpoint Analysis</Text>
        <Text style={styles.p}>
          The breakpoints are the equity-value thresholds at which the allocation of proceeds among classes changes, based
          on liquidation preferences, participation and conversion rights, and option exercise prices.
        </Text>
        <View style={styles.table}>
          <View style={styles.trHead}>
            <Text style={[styles.th, { width: "8%" }]}>#</Text>
            <Text style={[styles.th, { width: "42%" }]}>Event</Text>
            <Text style={[styles.th, { width: "22%" }, right]}>From</Text>
            <Text style={[styles.th, { width: "28%" }, right]}>To</Text>
          </View>
          {r.opm.tranches.map((t, i) => {
            const info = i > 0 ? r.opm.breakpointInfo[i - 1] : null;
            const event = i === 0 ? "Liquidation preferences paid (most senior first)" : info?.event ?? "Allocation changes";
            return (
              <View style={styles.tr} key={i}>
                <Text style={[styles.td, { width: "8%" }]}>{i + 1}</Text>
                <Text style={[styles.td, { width: "42%" }]}>{event}</Text>
                <Text style={[styles.td, { width: "22%" }, right]}>{fmtMoney(t.from)}</Text>
                <Text style={[styles.td, { width: "28%" }, right]}>{t.to == null ? "Infinity" : fmtMoney(t.to)}</Text>
              </View>
            );
          })}
        </View>
        <Footer data={data} />
      </Page>

      {/* ===== APPENDIX cont: option values + distribution ===== */}
      <Page size="LETTER" style={styles.page}>
        <Running data={data} />
        <Text style={styles.h3}>A.3 Option Values and Incremental Value</Text>
        <Text style={styles.note}>
          Incremental value of tranche n = call option value at breakpoint n − call option value at breakpoint n+1, valued
          with the Black-Scholes-Merton model (equity value {fmtMoney(r.equityValue)}, {a.timeToLiquidity.toFixed(2)}-year
          term, {fmtPct(a.volatility)} volatility, {fmtPct(a.riskFreeRate, 2)} risk-free).
        </Text>
        <View style={styles.table}>
          <View style={styles.trHead}>
            <Text style={[styles.th, { width: "10%" }]}>Tranche</Text>
            <Text style={[styles.th, { width: "30%" }, right]}>Exercise price (breakpoint)</Text>
            <Text style={[styles.th, { width: "30%" }, right]}>Call option value</Text>
            <Text style={[styles.th, { width: "30%" }, right]}>Incremental value</Text>
          </View>
          {r.opm.tranches.map((t, i) => (
            <View style={styles.tr} key={i}>
              <Text style={[styles.td, { width: "10%" }]}>{i + 1}</Text>
              <Text style={[styles.td, { width: "30%" }, right]}>{fmtMoney(t.from)}</Text>
              <Text style={[styles.td, { width: "30%" }, right]}>{fmtMoney(t.callValueLow)}</Text>
              <Text style={[styles.td, { width: "30%" }, right]}>{fmtMoney(t.trancheValue)}</Text>
            </View>
          ))}
          <View style={styles.trTotal}>
            <Text style={[styles.tdBold, { width: "70%" }]}>Total equity value</Text>
            <Text style={[styles.tdBold, { width: "30%" }, right]}>{fmtMoney(r.equityValue)}</Text>
          </View>
        </View>

        <Text style={styles.h3}>A.4 Distribution of Value by Class</Text>
        <Text style={styles.note}>Percentage of each tranche allocated to each class (marginal participation).</Text>
        <DistributionTable allocations={r.opm.allocations} tranches={r.opm.tranches} mode="pct" />
        <Text style={styles.note}>Dollar value allocated to each class within each tranche.</Text>
        <DistributionTable allocations={r.opm.allocations} tranches={r.opm.tranches} mode="usd" equityValue={r.equityValue} />
        <Footer data={data} />
      </Page>

      {/* ===== APPENDIX cont: valuation of each class ===== */}
      <Page size="LETTER" style={styles.page}>
        <Running data={data} />
        <Text style={styles.h3}>A.5 Valuation of Each Equity Class</Text>
        <View style={styles.table}>
          <View style={styles.trHead}>
            <Text style={[styles.th, { width: "30%" }]}>Class</Text>
            <Text style={[styles.th, { width: "18%" }, right]}>Total value</Text>
            <Text style={[styles.th, { width: "16%" }, right]}>Shares</Text>
            <Text style={[styles.th, { width: "12%" }, right]}>Price/sh</Text>
            <Text style={[styles.th, { width: "12%" }, right]}>DLOM</Text>
            <Text style={[styles.th, { width: "12%" }, right]}>FMV/sh</Text>
          </View>
          <EquityClassRow al={commonAlloc} dlom={r.dlom.value} fmv={r.concludedFmv} />
          {prefAlloc.map((al) => <EquityClassRow key={al.key} al={al} />)}
          {optAlloc.map((al) => <EquityClassRow key={al.key} al={al} />)}
          <View style={styles.trTotal}>
            <Text style={[styles.tdBold, { width: "30%" }]}>Total</Text>
            <Text style={[styles.tdBold, { width: "18%" }, right]}>{fmtMoney(r.equityValue)}</Text>
            <Text style={[styles.tdBold, { width: "16%" }, right]}>{fmtShares(r.capStructure.fullyDilutedShares)}</Text>
            <Text style={[styles.tdBold, { width: "36%" }, right]}></Text>
          </View>
        </View>
        <Text style={styles.p}>
          As shown, the fair market value of the common stock of the Company is {fmtShare(r.concludedFmv)} per share.
        </Text>
        <Footer data={data} />
      </Page>
    </Document>
  );
}

function CapRow({ label, shares, fd }: { label: string; shares: number; fd: number }) {
  return (
    <View style={styles.tr}>
      <Text style={[styles.td, { width: "54%" }]}>{label}</Text>
      <Text style={[styles.td, { width: "23%" }, right]}>{fmtShares(shares)}</Text>
      <Text style={[styles.td, { width: "23%" }, right]}>{fmtPct(fd > 0 ? shares / fd : 0, 2)}</Text>
    </View>
  );
}

function ApproachRow({ approach, decision, rationale }: { approach: string; decision: string; rationale: string }) {
  return (
    <View style={styles.tr}>
      <Text style={[styles.td, { width: "30%" }]}>{approach}</Text>
      <Text style={[styles.tdBold, { width: "22%" }]}>{decision}</Text>
      <Text style={[styles.td, { width: "48%" }]}>{rationale}</Text>
    </View>
  );
}

function EquityClassRow({ al, dlom, fmv }: { al?: GroupAllocation; dlom?: number; fmv?: number }) {
  if (!al) return null;
  const hasDlom = dlom != null && fmv != null;
  return (
    <View style={styles.tr}>
      <Text style={[styles.td, { width: "30%" }]}>{al.label}</Text>
      <Text style={[styles.td, { width: "18%" }, right]}>{fmtMoney(al.value)}</Text>
      <Text style={[styles.td, { width: "16%" }, right]}>{fmtShares(al.shares)}</Text>
      <Text style={[styles.td, { width: "12%" }, right]}>{fmtShare(al.perShare)}</Text>
      <Text style={[styles.td, { width: "12%" }, right]}>{hasDlom ? `(${fmtPct(dlom!)})` : "—"}</Text>
      <Text style={[styles.td, { width: "12%" }, right]}>{hasDlom ? fmtShare(fmv!) : "—"}</Text>
    </View>
  );
}

function SensTable({
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
    <View style={styles.table}>
      <View style={styles.trHead}>
        <Text style={[styles.th, { width: "55%" }]}>{title}</Text>
        <Text style={[styles.th, { width: "45%" }, right]}>FMV</Text>
      </View>
      {rows.map((row, i) => {
        const isBase = Math.abs(row.input - base) < 1e-9;
        return (
          <View style={styles.tr} key={i}>
            <Text style={[isBase ? styles.tdBold : styles.td, { width: "55%" }]}>{fmtInput(row.input)}{isBase ? " *" : ""}</Text>
            <Text style={[isBase ? styles.tdBold : styles.td, { width: "45%" }, right]}>{fmtShare(row.fmv)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function DistributionTable({
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
    <View style={styles.table}>
      <View style={styles.trHead}>
        <Text style={[styles.th, { width: `${classW}%` }]}>Class</Text>
        {tranches.map((_, i) => (
          <Text key={i} style={[styles.th, { width: `${colW}%` }, right]}>{i + 1}</Text>
        ))}
      </View>
      {allocations.map((al) => (
        <View style={styles.tr} key={al.key}>
          <Text style={[styles.td, { width: `${classW}%` }]}>{al.label}</Text>
          {tranches.map((t, i) => {
            const frac = t.marginalFractions[al.key] ?? 0;
            const v = mode === "pct" ? fmtPct(frac, 1) : fmtMoney(frac * t.trancheValue);
            return <Text key={i} style={[styles.td, { width: `${colW}%` }, right]}>{v}</Text>;
          })}
        </View>
      ))}
      <View style={styles.trTotal}>
        <Text style={[styles.tdBold, { width: `${classW}%` }]}>Total</Text>
        {tranches.map((t, i) => (
          <Text key={i} style={[styles.tdBold, { width: `${colW}%` }, right]}>
            {mode === "pct" ? "100%" : fmtMoney(t.trancheValue)}
          </Text>
        ))}
      </View>
      {mode === "usd" && equityValue != null && (
        <View style={styles.trTotal}>
          <Text style={[styles.tdBold, { width: `${classW}%` }]}>Equity value</Text>
          <Text style={[styles.tdBold, { width: `${100 - classW}%` }, right]}>{fmtMoney(equityValue)}</Text>
        </View>
      )}
    </View>
  );
}
