import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import {
  BRAND,
  EquitrMark,
  H1,
  ReportFooter,
  ReportHeader,
  reportStyles as s,
} from "./brand";
import {
  ALLOCATION_METHODS,
  ANALYST_REPRESENTATION,
  APPRAISER_QUALIFICATIONS,
  ASSUMPTIONS_EXTENDED,
  BIBLIOGRAPHY,
  BSM_APPENDIX,
  DLOM_NARRATIVE,
  DLOM_STUDIES,
  GLOSSARY,
  GPC_COMPANIES,
  GPC_VOLATILITY_NARRATIVE,
  RR59_60_FACTORS,
  transmittalLetter,
} from "./narrative";
import {
  ApproachRow,
  Bullet,
  CapRow,
  ClassHeaderRow,
  DistributionTable,
  EquityClassRow,
  KV,
  Numbered,
  SensTable,
  SensitivityMatrixTable,
} from "./report-components";
import type { ValuationReportData } from "./report-data";
import { fmtDate, fmtMoney, fmtPct, fmtShare, fmtShares } from "./report-data";

const TOC: { num: string; label: string; sub?: boolean }[] = [
  { num: "", label: "Transmittal Letter" },
  { num: "", label: "Executive Summary" },
  { num: "1.", label: "Summary of Findings" },
  { num: "2.", label: "Introduction" },
  { num: "3.", label: "IRC Section 409A" },
  { num: "4.", label: "Overview of Valuation" },
  { num: "5.", label: "Corporate Profile" },
  { num: "6.", label: "Valuation Methodology and Approach" },
  { num: "", label: "Revenue Ruling 59-60 Factors", sub: true },
  { num: "", label: "Valuation Approaches and Selection", sub: true },
  { num: "7.", label: "Determination of Total Equity Value" },
  { num: "8.", label: "Allocation of Equity Value" },
  { num: "9.", label: "Conclusion of Value" },
  { num: "10.", label: "Premiums and Discounts" },
  { num: "11.", label: "Sensitivity Analysis" },
  { num: "12.", label: "Assumptions and Limiting Conditions" },
  { num: "13.", label: "Valuation Analyst's Representation" },
  { num: "A.", label: "Appendix — Option Pricing Model" },
  { num: "", label: "Capitalization · Breakpoints · Option Values · Distribution", sub: true },
  { num: "B.", label: "Appendix — Guideline Public Company Volatility" },
  { num: "C.", label: "Appendix — Marketability Discount Literature" },
  { num: "D.", label: "Appendix — Securities Terms and Financing History" },
  { num: "E.", label: "Appendix — Black-Scholes-Merton Model" },
  { num: "", label: "Glossary of Terms" },
  { num: "", label: "Bibliography and Appraiser Qualifications" },
];

function BodyPage({
  data,
  section,
  children,
}: {
  data: ValuationReportData;
  section?: string;
  children: React.ReactNode;
}) {
  const isDraft = data.meta.status !== "final";
  return (
    <Page size="LETTER" style={s.page}>
      <ReportHeader company={data.company.legalName || data.company.name} section={section} />
      {children}
      <ReportFooter reportId={data.meta.reportId} isDraft={isDraft} />
    </Page>
  );
}

export function ValuationPdfDocument({ data }: { data: ValuationReportData }) {
  const r = data.result;
  const a = r.assumptions;
  const isFinal = data.meta.status === "final";
  const company = data.company.legalName || data.company.name;
  const reportId = data.meta.reportId;
  const valueBasis =
    r.method === "opm_backsolve"
      ? "Market Approach — Recent Securities Transaction (Backsolve)"
      : "Direct equity value input";

  const commonAlloc = r.opm.allocations.find((al) => al.kind === "common");
  const prefAlloc = r.opm.allocations.filter((al) => al.kind === "preferred");
  const optAlloc = r.opm.allocations.filter((al) => al.kind === "option");

  const letter = transmittalLetter(company, fmtDate(data.meta.valuationDate), fmtDate(data.meta.reportDate));
  const gpcMedian = GPC_COMPANIES.reduce((sum, g) => sum + g.vol, 0) / GPC_COMPANIES.length;
  const assumptionsMid = Math.ceil(ASSUMPTIONS_EXTENDED.length / 2);

  return (
    <Document
      title={`${data.company.name} — 409A Valuation Report`}
      author="Equitr Valuations"
      subject={`Report ${reportId}`}
    >
      {/* Cover */}
      <Page size="LETTER" style={s.coverPage}>
        <View style={s.coverInner}>
          <View style={s.coverTop}>
            <View style={s.coverMarkRow}>
              <EquitrMark size={32} />
              <View>
                <Text style={s.coverMarkLabel}>EQUITR</Text>
                <Text style={s.coverMarkSub}>VALUATIONS</Text>
              </View>
            </View>
            <Text style={s.coverEyebrow}>INDEPENDENT APPRAISAL</Text>
            <Text style={s.coverCompany}>{data.company.name}</Text>
            <Text style={s.coverSubtitle}>
              Appraisal of the Fair Market Value of Common Stock{"\n"}
              for IRC Section 409A Purposes
            </Text>
            <View style={s.coverRule} />
            <View style={s.coverMetaRow}>
              <Text style={s.coverMetaLabel}>Report reference</Text>
              <Text style={s.coverMetaValue}>{reportId}</Text>
            </View>
            <View style={s.coverMetaRow}>
              <Text style={s.coverMetaLabel}>Valuation date</Text>
              <Text style={s.coverMetaValue}>{fmtDate(data.meta.valuationDate)}</Text>
            </View>
            <View style={s.coverMetaRow}>
              <Text style={s.coverMetaLabel}>Expiration date</Text>
              <Text style={s.coverMetaValue}>{fmtDate(data.meta.expirationDate)}</Text>
            </View>
            <View style={s.coverMetaRow}>
              <Text style={s.coverMetaLabel}>Report date</Text>
              <Text style={s.coverMetaValue}>{fmtDate(data.meta.reportDate)}</Text>
            </View>
            <View style={s.coverMetaRow}>
              <Text style={s.coverMetaLabel}>Subject security</Text>
              <Text style={s.coverMetaValue}>Common Stock</Text>
            </View>
            <View style={s.coverMetaRow}>
              <Text style={s.coverMetaLabel}>Standard of value</Text>
              <Text style={s.coverMetaValue}>Fair Market Value (non-marketable, non-controlling)</Text>
            </View>
          </View>
          <View style={s.coverConclusion}>
            <Text style={s.coverConclusionLabel}>CONCLUDED FAIR MARKET VALUE</Text>
            <Text style={s.coverConclusionValue}>{fmtShare(r.concludedFmv)}</Text>
            <Text style={s.coverConclusionSub}>
              per share of common stock · as of {fmtDate(data.meta.valuationDate)}
            </Text>
          </View>
        </View>
        {!isFinal ? (
          <Text style={s.coverDraft}>
            Preliminary report — subject to review and sign-off by a qualified valuation analyst
          </Text>
        ) : null}
      </Page>

      {/* Transmittal */}
      <BodyPage data={data} section="Transmittal Letter">
        <H1>Transmittal Letter</H1>
        <Text style={s.letterDate}>{fmtDate(data.meta.reportDate)}</Text>
        <View style={s.letterBlock}>
          <Text style={s.p}>Board of Directors</Text>
          <Text style={s.p}>{company}</Text>
        </View>
        {letter.map((para, i) => (
          <Text key={i} style={i < 5 ? s.p : s.pTight}>
            {para}
          </Text>
        ))}
        <View style={s.sigLine}>
          <Text style={{ fontSize: 10, fontFamily: "Times-Bold" }}>
            {data.meta.preparedByName || "Equitr Valuations"}
          </Text>
          <Text style={{ fontSize: 8.5, color: BRAND.muted, marginTop: 2 }}>Valuation Analyst</Text>
        </View>
      </BodyPage>

      {/* TOC 1 */}
      <BodyPage data={data} section="Table of Contents">
        <H1>Table of Contents</H1>
        {TOC.slice(0, 14).map((row, i) => (
          <View key={i} style={s.tocRow}>
            {row.sub ? (
              <Text style={s.tocSub}>{row.label}</Text>
            ) : (
              <>
                <Text style={s.tocNum}>{row.num}</Text>
                <Text style={s.tocLabel}>{row.label}</Text>
              </>
            )}
          </View>
        ))}
      </BodyPage>

      {/* TOC 2 */}
      <BodyPage data={data} section="Table of Contents">
        <H1>Table of Contents (continued)</H1>
        {TOC.slice(14).map((row, i) => (
          <View key={i} style={s.tocRow}>
            {row.sub ? (
              <Text style={s.tocSub}>{row.label}</Text>
            ) : (
              <>
                <Text style={s.tocNum}>{row.num}</Text>
                <Text style={s.tocLabel}>{row.label}</Text>
              </>
            )}
          </View>
        ))}
      </BodyPage>

      {/* Executive Summary */}
      <BodyPage data={data} section="Executive Summary">
        <H1>Executive Summary</H1>
        <Text style={s.p}>
          Equitr Valuations has estimated the fair market value of the common stock of {company} as of{" "}
          {fmtDate(data.meta.valuationDate)} for purposes of IRC Section 409A and equity compensation grant pricing.
          The engagement applied the Market Approach (backsolve to a recent arm&apos;s-length financing, where
          applicable), allocated total equity value among outstanding security classes using the Option Pricing Method
          ("OPM"), and applied a discount for lack of marketability ("DLOM") to the common stock.
        </Text>
        <Text style={s.exhibit}>Summary Conclusion</Text>
        <View style={s.table}>
          <KV label="Subject company" value={company} />
          <KV label="Valuation date" value={fmtDate(data.meta.valuationDate)} />
          <KV label="Report expiration" value={fmtDate(data.meta.expirationDate)} />
          <KV label="Indicated total equity value" value={fmtMoney(r.equityValue)} />
          <KV label="Marketable common value per share" value={fmtShare(r.marketableCommonPerShare)} />
          <KV label={`DLOM (${r.dlom.method})`} value={fmtPct(r.dlom.value)} />
          <KV label="Concluded common FMV per share" value={fmtShare(r.concludedFmv)} highlight />
        </View>
        <Text style={s.h2}>Key Assumptions</Text>
        <View style={s.table}>
          <KV label="Time to liquidity" value={`${a.timeToLiquidity.toFixed(2)} years`} />
          <KV label="Equity volatility" value={fmtPct(a.volatility)} />
          <KV label="Risk-free rate" value={fmtPct(a.riskFreeRate, 2)} />
          <KV label="DLOM holding period" value={`${r.dlom.holdingPeriod.toFixed(2)} years`} />
          <KV label="Allocation method" value="Option Pricing Method (OPM)" />
          <KV label="Value basis" value={valueBasis} />
        </View>
        {!isFinal ? (
          <Text style={s.warn}>
            This preliminary report was generated by Equitr&apos;s valuation engine and requires review by a qualified
            valuation analyst before adoption for grant pricing.
          </Text>
        ) : null}
      </BodyPage>

      {/* 1. Summary of Findings */}
      <BodyPage data={data} section="§1 Summary of Findings">
        <H1>1. Summary of Findings</H1>
        <Text style={s.h2}>Purpose and Scope</Text>
        <Text style={s.p}>
          This valuation engagement estimates the fair market value of a non-controlling, non-marketable common equity
          interest in {company} (the &quot;Company&quot;) as of {fmtDate(data.meta.valuationDate)} (the &quot;Valuation
          Date&quot;). The conclusion is intended solely for IRC Section 409A compliance and the pricing of stock options
          and other equity awards. It should not be used for any other purpose or relied upon by any other party.
        </Text>
        <Text style={s.p}>
          The engagement was conducted in accordance with the AICPA Accounting and Valuation Guide, &quot;Valuation of
          Privately-Held-Company Equity Securities Issued as Compensation,&quot; and the Uniform Standards of Professional
          Appraisal Practice. The estimate of value is expressed as a conclusion of value subject to the assumptions and
          limiting conditions in Section 12.
        </Text>
        <Text style={s.h2}>Summary of Findings</Text>
        <Text style={s.p}>
          Based on the analyses described in this report, the fair market value of the Company&apos;s common stock is
          estimated at {fmtShare(r.concludedFmv)} per share on a non-marketable, non-controlling basis as of the
          Valuation Date. We have no obligation to update this conclusion for events occurring after the report date.
        </Text>
        <View style={s.table}>
          <KV label="Subject security" value="Common Stock" />
          <KV label="Level of value" value="Non-marketable, non-controlling" />
          <KV label="Premise of value" value="Going concern" />
          <KV label="Concluded FMV" value={`${fmtShare(r.concludedFmv)} per share`} highlight />
        </View>
      </BodyPage>

      {/* 2. Introduction */}
      <BodyPage data={data} section="§2 Introduction">
        <H1>2. Introduction</H1>
        <Text style={s.h3}>Standard of Value</Text>
        <Text style={s.p}>
          Fair market value is defined under IRS Revenue Ruling 59-60 as the price at which property would change hands
          between a willing buyer and a willing seller, neither under compulsion and both having reasonable knowledge of
          relevant facts. This standard governs IRC Section 409A exercise pricing for private company stock.
        </Text>
        <Text style={s.h3}>Level of Value</Text>
        <Text style={s.p}>
          The subject interest is a minority, non-controlling position in a privately held company. Shares are not traded
          on a public exchange and cannot be readily converted to cash; accordingly, a discount for lack of marketability
          is applied. Control premiums and synergistic value are not reflected in this conclusion.
        </Text>
        <Text style={s.h3}>Premise of Value</Text>
        <Text style={s.p}>
          The Company is valued as a going concern. A liquidation premise would not appropriately reflect the enterprise&apos;s
          operating assets, intangible value, and expected future returns.
        </Text>
        <Text style={s.h3}>Scope of Analysis</Text>
        <Text style={s.p}>Our procedures included, among others:</Text>
        <Bullet>Review of the capitalization table, share class rights, and option/warrant overhang as of the Valuation Date.</Bullet>
        <Bullet>Analysis of the Company&apos;s financing history and most recent arm&apos;s-length transaction pricing.</Bullet>
        <Bullet>Estimation of total equity value and allocation among security classes via the OPM.</Bullet>
        <Bullet>Estimation of equity volatility from guideline public companies in comparable industries.</Bullet>
        <Bullet>Application of an option-based DLOM to the allocated common stock value.</Bullet>
        <Bullet>Preparation of sensitivity analyses illustrating the impact of key assumptions.</Bullet>
      </BodyPage>

      {/* 2 cont — Sources */}
      <BodyPage data={data} section="§2 Introduction">
        <Text style={s.h2}>Source of Information</Text>
        <Text style={s.p}>Information relied upon includes, without limitation:</Text>
        <Bullet>Capitalization data and share class terms maintained in the Company&apos;s Equitr cap table.</Bullet>
        <Bullet>Certificate of incorporation, investors&apos; rights agreement, and related governing documents (as represented).</Bullet>
        <Bullet>Fundraising records, term sheets, and closing documentation for priced equity rounds.</Bullet>
        <Bullet>Representations from management regarding business operations, competitive position, and expected time to liquidity.</Bullet>
        <Bullet>Market data for U.S. Treasury yields and guideline public company equity returns.</Bullet>
        <Text style={s.note}>
          Unless otherwise noted, information provided by the Company has been accepted without independent audit or
          verification.
        </Text>
        <Text style={s.h2}>Report Organization</Text>
        <Text style={s.p}>
          Sections 3 through 5 address regulatory context, a summary of the valuation result, and the Company&apos;s
          corporate and capital profile. Sections 6 through 9 describe methodology, total equity value, allocation, and
          the conclusion of value. Sections 10 and 11 address marketability and sensitivity. Sections 12 and 13 set forth
          assumptions, limiting conditions, and the valuation analyst&apos;s representation. Technical exhibits are provided
          in the appendices.
        </Text>
        {data.company.businessDescription ? (
          <>
            <Text style={s.h2}>Business Description</Text>
            <Text style={s.p}>{data.company.businessDescription}</Text>
          </>
        ) : (
          <>
            <Text style={s.h2}>Business Description</Text>
            <Text style={s.p}>
              {data.company.name} is a privately held {data.company.state}-corporation engaged in the development and
              commercialization of technology products and services in its target market. Management has represented that
              the Company continues to invest in product development, customer acquisition, and scaling operations in
              anticipation of a future liquidity event. No independent verification of operating results was performed.
            </Text>
          </>
        )}
      </BodyPage>

      {/* 3. 409A */}
      <BodyPage data={data} section="§3 IRC Section 409A">
        <H1>3. IRC Section 409A</H1>
        <Text style={s.p}>
          Section 409A of the Internal Revenue Code regulates nonqualified deferred compensation, including stock options
          granted by private companies. The exercise price of an option must be at least equal to the fair market value
          of the underlying stock on the grant date. For stock that is not readily tradable, fair market value must be
          determined using a reasonable valuation method.
        </Text>
        <Text style={s.h3}>Independent Appraisal Presumption</Text>
        <Text style={s.p}>
          A valuation performed by a qualified independent appraiser, using consistently applied methods, as of a date no
          more than 12 months before the option grant and absent a material change, is presumed reasonable. The burden of
          proof shifts to the IRS to demonstrate that the valuation is grossly unreasonable. This report is prepared to
          support the independent appraisal safe harbor, subject to analyst review and finalization.
        </Text>
        <Text style={s.h3}>Binding Formula Presumption</Text>
        <Text style={s.p}>
          A value determined by the consistent application of a formula used for all transfers of the subject class of
          stock may also be presumed reasonable. The Company has not adopted a binding formula for common stock transfers;
          accordingly, this presumption is not relied upon.
        </Text>
        <Text style={s.h3}>Illiquid Start-Up Presumption</Text>
        <Text style={s.p}>
          An illiquid start-up corporation (generally less than 10 years old with no anticipated liquidity within 12
          months) may rely on a reasonable good-faith valuation by a person with significant knowledge and experience.
          While this presumption may be available, the independent appraisal approach provides a higher degree of
          defensibility for companies with priced preferred financings and complex capital structures.
        </Text>
        <Text style={s.h3}>Validity Period</Text>
        <Text style={s.p}>
          Absent a material event, this valuation remains valid through {fmtDate(data.meta.expirationDate)} (12 months
          from the Valuation Date). A new valuation should be obtained upon a qualified financing, significant change in
          operations, or other event that may materially affect common stock value.
        </Text>
      </BodyPage>

      {/* 4. Overview */}
      <BodyPage data={data} section="§4 Overview">
        <H1>4. Overview of Valuation</H1>
        <Text style={s.p}>
          Total equity value was estimated and allocated to the Company&apos;s outstanding securities. A marketability
          discount was then applied to the common stock to arrive at the concluded fair market value per share.
        </Text>
        <Text style={s.exhibit}>Exhibit 4-1 — Valuation Bridge</Text>
        <View style={s.table}>
          <KV label={`Total equity value (${r.method === "opm_backsolve" ? "backsolve" : "input"})`} value={fmtMoney(r.equityValue)} />
          <KV label="Allocated to common (marketable basis)" value={fmtMoney(commonAlloc?.value ?? 0)} />
          <KV label="Marketable common per share" value={fmtShare(r.marketableCommonPerShare)} />
          <KV label={`Less: DLOM (${fmtPct(r.dlom.value)})`} value={`(${fmtShare(r.marketableCommonPerShare - r.concludedFmv)})`} />
          <KV label="Concluded common FMV per share" value={fmtShare(r.concludedFmv)} highlight />
        </View>
        <Text style={s.exhibit}>Exhibit 4-2 — Value by Equity Class</Text>
        <View style={s.table}>
          <ClassHeaderRow />
          <EquityClassRow al={commonAlloc} dlom={r.dlom.value} fmv={r.concludedFmv} />
          {prefAlloc.map((al) => (
            <EquityClassRow key={al.key} al={al} />
          ))}
          {optAlloc.map((al) => (
            <EquityClassRow key={al.key} al={al} />
          ))}
          <View style={s.trTotal}>
            <Text style={[s.tdBold, { width: "30%" }]}>Total</Text>
            <Text style={[s.tdBold, { width: "18%" }, { textAlign: "right" }]}>{fmtMoney(r.equityValue)}</Text>
            <Text style={[s.tdBold, { width: "52%" }]}></Text>
          </View>
        </View>
        <Text style={s.note}>DLOM is applied to common stock only — the subject security of this engagement.</Text>
      </BodyPage>

      {/* 5. Corporate Profile */}
      <BodyPage data={data} section="§5 Corporate Profile">
        <H1>5. Corporate Profile</H1>
        <Text style={s.h2}>Company Overview</Text>
        <View style={s.table}>
          <KV label="Legal name" value={company} />
          <KV label="State of incorporation" value={data.company.state || "Delaware"} />
          <KV label="Date of incorporation" value={data.company.incorporationDate ? fmtDate(data.company.incorporationDate) : "—"} />
          <KV label="Authorized shares" value={fmtShares(data.company.authorizedShares)} />
          <KV label="Fully diluted shares" value={fmtShares(r.capStructure.fullyDilutedShares)} />
        </View>
        <Text style={s.h2}>Capital Structure</Text>
        <Text style={s.p}>
          The following table summarizes the Company&apos;s fully diluted capitalization as of the Valuation Date. Rights
          and preferences of each class determine breakpoint levels in the OPM allocation (Appendix A).
        </Text>
        <Text style={s.exhibit}>Exhibit 5-1 — Fully Diluted Capitalization</Text>
        <View style={s.table}>
          <View style={s.trHead}>
            <Text style={[s.th, { width: "54%" }]}>Class</Text>
            <Text style={[s.th, { width: "23%" }, { textAlign: "right" }]}>Shares</Text>
            <Text style={[s.th, { width: "23%" }, { textAlign: "right" }]}>% FD</Text>
          </View>
          <CapRow label="Common stock" shares={r.capStructure.commonShares} fd={r.capStructure.fullyDilutedShares} />
          {r.capStructure.preferred.map((p) => (
            <CapRow
              key={p.id}
              label={`${p.name} (${p.liquidationMultiple}x ${p.participating ? "part." : "non-part."})`}
              shares={p.shares}
              fd={r.capStructure.fullyDilutedShares}
            />
          ))}
          {r.capStructure.options.map((o) => (
            <CapRow key={o.strike} label={`Options @ ${fmtShare(o.strike)}`} shares={o.shares} fd={r.capStructure.fullyDilutedShares} />
          ))}
          <View style={s.trTotal}>
            <Text style={[s.tdBold, { width: "54%" }]}>Total fully diluted</Text>
            <Text style={[s.tdBold, { width: "23%" }, { textAlign: "right" }]}>{fmtShares(r.capStructure.fullyDilutedShares)}</Text>
            <Text style={[s.tdBold, { width: "23%" }, { textAlign: "right" }]}>100.00%</Text>
          </View>
        </View>
      </BodyPage>

      {/* 5 cont — Financing */}
      <BodyPage data={data} section="§5 Corporate Profile">
        <Text style={s.h2}>Financing History</Text>
        <Text style={s.p}>
          The table below summarizes priced equity financings relevant to the valuation. The most recent arm&apos;s-length
          transaction provides the primary market-based anchor when the backsolve method is employed.
        </Text>
        <Text style={s.exhibit}>Exhibit 5-2 — Equity Financing Summary</Text>
        <View style={s.table}>
          <View style={s.trHead}>
            <Text style={[s.th, { width: "22%" }]}>Round</Text>
            <Text style={[s.th, { width: "14%" }]}>Status</Text>
            <Text style={[s.th, { width: "16%" }, { textAlign: "right" }]}>Close</Text>
            <Text style={[s.th, { width: "16%" }, { textAlign: "right" }]}>Pre-money</Text>
            <Text style={[s.th, { width: "16%" }, { textAlign: "right" }]}>Investment</Text>
            <Text style={[s.th, { width: "16%" }, { textAlign: "right" }]}>Price/sh</Text>
          </View>
          {(data.fundraiseRounds?.length ? data.fundraiseRounds : defaultFinancingRows(r)).map((row, i) => (
            <View style={s.tr} key={i}>
              <Text style={[s.td, { width: "22%" }]}>{row.name}</Text>
              <Text style={[s.td, { width: "14%" }]}>{row.status}</Text>
              <Text style={[s.td, { width: "16%" }, { textAlign: "right" }]}>
                {row.closeDate ? fmtDate(row.closeDate) : "—"}
              </Text>
              <Text style={[s.td, { width: "16%" }, { textAlign: "right" }]}>
                {row.preMoneyValuation != null ? fmtMoney(row.preMoneyValuation) : "—"}
              </Text>
              <Text style={[s.td, { width: "16%" }, { textAlign: "right" }]}>
                {row.investmentAmount != null ? fmtMoney(row.investmentAmount) : "—"}
              </Text>
              <Text style={[s.td, { width: "16%" }, { textAlign: "right" }]}>
                {row.pricePerShare != null ? fmtShare(row.pricePerShare) : "—"}
              </Text>
            </View>
          ))}
        </View>
      </BodyPage>

      {/* 6. Methodology — intro */}
      <BodyPage data={data} section="§6 Methodology">
        <H1>6. Valuation Methodology and Approach</H1>
        <Text style={s.h2}>Methodology Overview</Text>
        <Text style={s.p}>
          Consistent with Revenue Ruling 59-60, we considered the nature and history of the business; economic and
          industry conditions; financial condition; earning and dividend capacity; intangible value; prior stock sales;
          and prices of comparable publicly traded securities. The following subsections address the eight standard
          factors in detail.
        </Text>
        <Text style={s.h2}>Valuation Approaches — Overview</Text>
        <Text style={s.h3}>Market Approach</Text>
        <Text style={s.p}>
          The Market Approach derives value from comparable transactions or companies. For venture-backed enterprises, a
          recent arm&apos;s-length preferred financing frequently provides the most objective indication of total equity
          value; the OPM backsolve calibrates equity value to that transaction price.
        </Text>
        <Text style={s.h3}>Income Approach</Text>
        <Text style={s.p}>
          The Income Approach values the enterprise as the present value of projected future cash flows. It was not
          selected because reliable long-range forecasts are not available and historical earnings are not indicative of
          value for the Company at its current stage.
        </Text>
        <Text style={s.h3}>Asset-Based Approach</Text>
        <Text style={s.p}>
          The Asset-Based Approach values net tangible assets. It was not selected because it does not capture going-concern
          value, growth optionality, or intangible assets central to the Company&apos;s value proposition.
        </Text>
      </BodyPage>

      {/* 6 — RR 59-60 part 1 */}
      <BodyPage data={data} section="§6 Methodology">
        <Text style={s.h2}>Revenue Ruling 59-60 Factors</Text>
        {RR59_60_FACTORS.slice(0, 4).map((f, i) => (
          <View key={i} wrap={false}>
            <Text style={s.h3}>{i + 1}. {f.title}</Text>
            <Text style={s.p}>{f.body}</Text>
          </View>
        ))}
      </BodyPage>

      {/* 6 — RR 59-60 part 2 */}
      <BodyPage data={data} section="§6 Methodology">
        <Text style={s.h2}>Revenue Ruling 59-60 Factors (continued)</Text>
        {RR59_60_FACTORS.slice(4).map((f, i) => (
          <View key={i} wrap={false}>
            <Text style={s.h3}>{i + 5}. {f.title}</Text>
            <Text style={s.p}>{f.body}</Text>
          </View>
        ))}
        <Text style={s.exhibit}>Exhibit 6-1 — Approach Selection</Text>
        <View style={s.table}>
          <View style={s.trHead}>
            <Text style={[s.th, { width: "28%" }]}>Approach</Text>
            <Text style={[s.th, { width: "18%" }]}>Conclusion</Text>
            <Text style={[s.th, { width: "54%" }]}>Rationale</Text>
          </View>
          <ApproachRow
            approach="Market Approach"
            decision={r.method === "opm_backsolve" ? "Adopted" : "Considered"}
            rationale={
              r.method === "opm_backsolve"
                ? "Recent arm's-length financing provides objective market-based evidence of equity value."
                : "Equity value supplied directly; backsolve not employed."
            }
          />
          <ApproachRow approach="Income Approach" decision="Not selected" rationale="Subjective long-range projections not appropriate at current stage." />
          <ApproachRow approach="Asset-Based Approach" decision="Not selected" rationale="Does not reflect going-concern and intangible value." />
        </View>
      </BodyPage>

      {/* 7. Equity Value */}
      <BodyPage data={data} section="§7 Equity Value">
        <H1>7. Determination of Total Equity Value</H1>
        <Text style={s.p}>Basis of value: {valueBasis}.</Text>
        {r.method === "opm_backsolve" ? (
          <>
            <Text style={s.p}>
              We applied the OPM backsolve technique, solving for total equity value such that the OPM allocates a
              per-share value to {r.backsolve?.seriesName} equal to its issuance price of{" "}
              {fmtShare(r.backsolve?.targetPricePerShare ?? 0)}
              {r.backsolve?.roundName ? ` (${r.backsolve.roundName})` : ""}. This anchors the analysis to an objective,
              arm&apos;s-length transaction negotiated between sophisticated parties.
            </Text>
            <Text style={s.exhibit}>Exhibit 7-1 — Backsolve Calibration</Text>
            <View style={s.table}>
              <KV label="Reference security" value={r.backsolve?.seriesName ?? "—"} />
              <KV label="Transaction price per share" value={fmtShare(r.backsolve?.targetPricePerShare ?? 0)} />
              <KV label="OPM-implied price (verification)" value={fmtShare(r.backsolve?.solvedPricePerShare ?? 0)} />
              <KV label="Implied total equity value" value={fmtMoney(r.equityValue)} highlight />
            </View>
          </>
        ) : (
          <>
            <Text style={s.p}>
              Total equity value of {fmtMoney(r.equityValue)} was determined based on an independent assessment and
              allocated using the OPM.
            </Text>
            <View style={s.table}>
              <KV label="Total equity value" value={fmtMoney(r.equityValue)} highlight />
            </View>
          </>
        )}
        <Text style={s.p}>
          The backsolve procedure iterates on total equity value until the OPM-derived per-share value for the reference
          preferred series matches the observed transaction price, holding OPM assumptions (volatility, time to liquidity,
          risk-free rate) constant. See Appendix A for breakpoint and allocation detail.
        </Text>
      </BodyPage>

      {/* 8. Allocation */}
      <BodyPage data={data} section="§8 Allocation">
        <H1>8. Allocation of Equity Value</H1>
        <Text style={s.h2}>Selection of Allocation Method</Text>
        <Text style={s.p}>
          The AICPA guide describes three primary methods for allocating enterprise value among security classes: the
          Current Value Method (CVM), Probability-Weighted Expected Return Method (PWERM), and Option Pricing Method (OPM).
          The following table summarizes each method and our selection rationale.
        </Text>
        <Text style={s.exhibit}>Exhibit 8-1 — Allocation Method Comparison</Text>
        <View style={s.table}>
          <View style={s.trHead}>
            <Text style={[s.th, { width: "18%" }]}>Method</Text>
            <Text style={[s.th, { width: "10%" }]}>Selected</Text>
            <Text style={[s.th, { width: "32%" }]}>Description</Text>
            <Text style={[s.th, { width: "40%" }]}>Rationale</Text>
          </View>
          {ALLOCATION_METHODS.map((m) => (
            <View style={s.tr} key={m.method}>
              <Text style={[s.tdBold, { width: "18%" }]}>{m.method}</Text>
              <Text style={[s.td, { width: "10%" }]}>{m.selected ? "Yes" : "No"}</Text>
              <Text style={[s.td, { width: "32%" }]}>{m.description}</Text>
              <Text style={[s.td, { width: "40%" }]}>{m.rationale}</Text>
            </View>
          ))}
        </View>
      </BodyPage>

      {/* 8 cont — OPM */}
      <BodyPage data={data} section="§8 Allocation">
        <Text style={s.h2}>Option Pricing Method</Text>
        <Text style={s.p}>
          Under the OPM, each equity class is modeled as a call option on total equity value with exercise prices at
          cumulative breakpoints derived from liquidation preferences, participation rights, conversion provisions, and
          option strikes. Incremental value in each tranche is estimated via the Black-Scholes-Merton model and allocated
          to participating classes based on marginal economic interest. Technical detail is presented in Appendices A and E.
        </Text>
        <Text style={s.exhibit}>Exhibit 8-2 — OPM Assumptions</Text>
        <View style={s.table}>
          <KV label="Expected time to liquidity" value={`${a.timeToLiquidity.toFixed(2)} years`} />
          <KV label="Equity volatility (σ)" value={fmtPct(a.volatility)} />
          <KV label="Risk-free rate (r)" value={fmtPct(a.riskFreeRate, 2)} />
          <KV label="Dividend yield (q)" value={fmtPct(a.dividendYield, 2)} />
          <KV label="Total equity value (S₀)" value={fmtMoney(r.equityValue)} />
        </View>
        <Text style={s.p}>
          At the concluded assumptions, the OPM allocates {fmtShare(r.marketableCommonPerShare)} per share to common stock
          on a marketable basis before application of the DLOM.
        </Text>
      </BodyPage>

      {/* 9. Conclusion */}
      <BodyPage data={data} section="§9 Conclusion">
        <H1>9. Conclusion of Value</H1>
        <Text style={s.p}>
          After allocating total equity value among the Company&apos;s securities using the OPM and applying the discount
          for lack of marketability described in Section 10, the fair market value of the Company&apos;s common stock is
          estimated as follows:
        </Text>
        <View style={s.table}>
          <KV label="Marketable common value per share" value={fmtShare(r.marketableCommonPerShare)} />
          <KV label={`Less: DLOM — ${r.dlom.method} (${fmtPct(r.dlom.value)})`} value={`(${fmtShare(r.marketableCommonPerShare - r.concludedFmv)})`} />
          <KV label="Concluded fair market value per share" value={fmtShare(r.concludedFmv)} highlight />
        </View>
        <Text style={s.p}>
          This conclusion is expressed on a non-marketable, non-controlling basis as of {fmtDate(data.meta.valuationDate)}.
          It is subject to the assumptions and limiting conditions herein and to analyst review where the report status is
          preliminary.
        </Text>
        <Text style={s.h2}>Value Reconciliation</Text>
        <Text style={s.exhibit}>Exhibit 9-1 — Common Stock Value Reconciliation</Text>
        <View style={s.table}>
          <KV label="Total equity value" value={fmtMoney(r.equityValue)} />
          <KV label="Common aggregate value (OPM)" value={fmtMoney(commonAlloc?.value ?? 0)} />
          <KV label="Common shares (fully diluted)" value={fmtShares(commonAlloc?.shares ?? r.capStructure.commonShares)} />
          <KV label="Marketable value per common share" value={fmtShare(r.marketableCommonPerShare)} />
          <KV label="DLOM" value={fmtPct(r.dlom.value)} />
          <KV label="Concluded FMV per common share" value={fmtShare(r.concludedFmv)} highlight />
        </View>
      </BodyPage>

      {/* 10. DLOM narrative */}
      <BodyPage data={data} section="§10 DLOM">
        <H1>10. Premiums and Discounts</H1>
        <Text style={s.p}>
          The value of a closely held equity interest may differ from a pro-rata share of enterprise value after
          application of premiums or discounts reflecting control, marketability, and other factors relevant to the
          standard and level of value.
        </Text>
        <Text style={s.h2}>Discount for Lack of Marketability</Text>
        {DLOM_NARRATIVE.map((para, i) => (
          <Text key={i} style={s.p}>
            {para}
          </Text>
        ))}
        <Text style={s.p}>
          We applied the{" "}
          {r.dlom.method === "finnerty"
            ? "Finnerty (2012) average-strike put option model"
            : "Chaffee (1993) protective put model"}{" "}
          as the concluded DLOM methodology, with the alternative model shown for reference. The DLOM is applied to the
          marketable common stock value allocated by the OPM.
        </Text>
      </BodyPage>

      {/* 10 cont — DLOM exhibit */}
      <BodyPage data={data} section="§10 DLOM">
        <Text style={s.exhibit}>Exhibit 10-1 — DLOM Computation</Text>
        <View style={s.table}>
          <KV label="Concluded method" value={r.dlom.method === "finnerty" ? "Finnerty (2012)" : "Chaffee (1993)"} />
          <KV label="Holding period (years)" value={r.dlom.holdingPeriod.toFixed(2)} />
          <KV label="Volatility input" value={fmtPct(r.dlom.volatility)} />
          <KV label="Risk-free rate" value={fmtPct(a.riskFreeRate, 2)} />
          <KV label="Finnerty implied discount" value={fmtPct(r.dlom.finnerty)} />
          <KV label="Chaffee implied discount" value={fmtPct(r.dlom.chaffee)} />
          <KV label="Concluded DLOM" value={fmtPct(r.dlom.value)} highlight />
        </View>
        <Text style={s.exhibit}>Exhibit 10-2 — Selected Empirical Studies (Reference)</Text>
        <View style={s.table}>
          <View style={s.trHead}>
            <Text style={[s.th, { width: "40%" }]}>Source</Text>
            <Text style={[s.th, { width: "25%" }]}>Period</Text>
            <Text style={[s.th, { width: "35%" }]}>Indicative range</Text>
          </View>
          {DLOM_STUDIES.map((row) => (
            <View style={s.tr} key={row.source}>
              <Text style={[s.td, { width: "40%" }]}>{row.source}</Text>
              <Text style={[s.td, { width: "25%" }]}>{row.period}</Text>
              <Text style={[s.td, { width: "35%" }]}>{row.median}</Text>
            </View>
          ))}
        </View>
        <Text style={s.note}>
          Empirical study ranges are provided for context only; the concluded DLOM is based on the option-based model
          using company-specific inputs.
        </Text>
      </BodyPage>

      {/* 11. Sensitivity */}
      <BodyPage data={data} section="§11 Sensitivity">
        <H1>11. Sensitivity Analysis</H1>
        <Text style={s.p}>
          The concluded fair market value depends on assumptions that are inherently uncertain. The following one-way
          sensitivity tables illustrate the impact of changes in volatility, time to liquidity, and DLOM holding period,
          holding other variables constant.
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <SensTable title="Volatility (σ)" rows={r.sensitivity.volatility} fmtInput={(v) => fmtPct(v)} base={a.volatility} />
          </View>
          <View style={{ flex: 1 }}>
            <SensTable title="Time to liquidity" rows={r.sensitivity.timeToLiquidity} fmtInput={(v) => `${v.toFixed(2)} yr`} base={a.timeToLiquidity} />
          </View>
        </View>
        <View style={{ marginTop: 8 }}>
          <SensTable title="DLOM holding period" rows={r.sensitivity.dlom} fmtInput={(v) => `${v.toFixed(2)} yr`} base={r.dlom.holdingPeriod} />
        </View>
      </BodyPage>

      {/* 11 cont — matrix */}
      <BodyPage data={data} section="§11 Sensitivity">
        <Text style={s.h2}>Two-Way Sensitivity Matrix</Text>
        <Text style={s.p}>
          The matrix below presents concluded common stock FMV across combinations of equity volatility and time to
          liquidity. The cell corresponding to base case assumptions is shown in bold.
        </Text>
        <Text style={s.exhibit}>Exhibit 11-1 — FMV Sensitivity (Volatility × Time to Liquidity)</Text>
        {data.sensitivityMatrix?.length ? (
          <SensitivityMatrixTable cells={data.sensitivityMatrix} baseVol={a.volatility} baseTime={a.timeToLiquidity} />
        ) : (
          <Text style={s.note}>Matrix not computed for this report revision.</Text>
        )}
        <Text style={s.p}>
          Reasonable alternative assumptions within the ranges shown could produce FMV outcomes materially different from
          the base case. The reviewing analyst should confirm that selected assumptions are supportable given the
          Company&apos;s risk profile and expected path to liquidity.
        </Text>
      </BodyPage>

      {/* 12. Assumptions part 1 */}
      <BodyPage data={data} section="§12 Assumptions">
        <H1>12. Assumptions and Limiting Conditions</H1>
        {ASSUMPTIONS_EXTENDED.slice(0, assumptionsMid).map((t, i) => (
          <Numbered key={i} i={i + 1}>
            {t}
          </Numbered>
        ))}
      </BodyPage>

      {/* 12 cont */}
      <BodyPage data={data} section="§12 Assumptions">
        <Text style={s.h2}>Assumptions and Limiting Conditions (continued)</Text>
        {ASSUMPTIONS_EXTENDED.slice(assumptionsMid).map((t, i) => (
          <Numbered key={i} i={assumptionsMid + i + 1}>
            {t}
          </Numbered>
        ))}
      </BodyPage>

      {/* 13. Representation */}
      <BodyPage data={data} section="§13 Representation">
        <H1>13. Valuation Analyst&apos;s Representation</H1>
        <Text style={s.p}>
          To the best of our knowledge and belief, the following statements are true and correct:
        </Text>
        {ANALYST_REPRESENTATION.map((t, i) => (
          <Bullet key={i}>{t}</Bullet>
        ))}
        <View style={{ flexDirection: "row", marginTop: 32, justifyContent: "space-between" }}>
          <View style={{ width: "44%" }}>
            <View style={s.sigLine}>
              <Text style={{ fontSize: 10, fontFamily: "Times-Bold" }}>{data.meta.preparedByName || "Equitr Valuations"}</Text>
              <Text style={{ fontSize: 8, color: BRAND.muted }}>Prepared by</Text>
            </View>
          </View>
          <View style={{ width: "44%" }}>
            <View style={s.sigLine}>
              <Text style={{ fontSize: 10, fontFamily: "Times-Bold" }}>
                {data.meta.reviewedByName || (isFinal ? "—" : "Pending review")}
              </Text>
              <Text style={{ fontSize: 8, color: BRAND.muted }}>
                Reviewed by{data.meta.reviewedAt ? ` · ${fmtDate(data.meta.reviewedAt)}` : ""}
              </Text>
            </View>
          </View>
        </View>
      </BodyPage>

      {/* Appendix A.1 */}
      <BodyPage data={data} section="Appendix A">
        <H1>Appendix A — Option Pricing Model</H1>
        <Text style={s.h2}>A.1 Capitalization Detail</Text>
        <Text style={s.note}>LP = liquidation preference. Seniority: 1 = most senior. OIP = original issue price.</Text>
        <View style={s.table}>
          <View style={s.trHead}>
            <Text style={[s.th, { width: "30%" }]}>Class</Text>
            <Text style={[s.th, { width: "12%" }, { textAlign: "center" }]}>LP</Text>
            <Text style={[s.th, { width: "12%" }, { textAlign: "center" }]}>Mult.</Text>
            <Text style={[s.th, { width: "13%" }, { textAlign: "center" }]}>Part.</Text>
            <Text style={[s.th, { width: "16%" }, { textAlign: "right" }]}>OIP</Text>
            <Text style={[s.th, { width: "17%" }, { textAlign: "right" }]}>Shares</Text>
          </View>
          <View style={s.tr}>
            <Text style={[s.td, { width: "30%" }]}>Common stock</Text>
            <Text style={[s.td, { width: "12%" }, { textAlign: "center" }]}>—</Text>
            <Text style={[s.td, { width: "12%" }, { textAlign: "center" }]}>—</Text>
            <Text style={[s.td, { width: "13%" }, { textAlign: "center" }]}>—</Text>
            <Text style={[s.td, { width: "16%" }, { textAlign: "right" }]}>$0.0000</Text>
            <Text style={[s.td, { width: "17%" }, { textAlign: "right" }]}>{fmtShares(r.capStructure.commonShares)}</Text>
          </View>
          {r.capStructure.preferred.map((p) => (
            <View style={s.tr} key={p.id}>
              <Text style={[s.td, { width: "30%" }]}>{p.name}</Text>
              <Text style={[s.td, { width: "12%" }, { textAlign: "center" }]}>Y ({p.seniority})</Text>
              <Text style={[s.td, { width: "12%" }, { textAlign: "center" }]}>{p.liquidationMultiple}x</Text>
              <Text style={[s.td, { width: "13%" }, { textAlign: "center" }]}>{p.participating ? "Yes" : "No"}</Text>
              <Text style={[s.td, { width: "16%" }, { textAlign: "right" }]}>{fmtShare(p.originalIssuePrice)}</Text>
              <Text style={[s.td, { width: "17%" }, { textAlign: "right" }]}>{fmtShares(p.shares)}</Text>
            </View>
          ))}
          {r.capStructure.options.map((o) => (
            <View style={s.tr} key={o.strike}>
              <Text style={[s.td, { width: "30%" }]}>Options @ {fmtShare(o.strike)}</Text>
              <Text style={[s.td, { width: "12%" }, { textAlign: "center" }]}>—</Text>
              <Text style={[s.td, { width: "12%" }, { textAlign: "center" }]}>—</Text>
              <Text style={[s.td, { width: "13%" }, { textAlign: "center" }]}>—</Text>
              <Text style={[s.td, { width: "16%" }, { textAlign: "right" }]}>{fmtShare(o.strike)}</Text>
              <Text style={[s.td, { width: "17%" }, { textAlign: "right" }]}>{fmtShares(o.shares)}</Text>
            </View>
          ))}
        </View>
      </BodyPage>

      {/* Appendix A.2 */}
      <BodyPage data={data} section="Appendix A">
        <Text style={s.h2}>A.2 Breakpoint Analysis</Text>
        <Text style={s.p}>
          Breakpoints are equity-value thresholds at which the marginal distribution of proceeds among classes changes.
        </Text>
        <View style={s.table}>
          <View style={s.trHead}>
            <Text style={[s.th, { width: "8%" }]}>#</Text>
            <Text style={[s.th, { width: "42%" }]}>Event / breakpoint</Text>
            <Text style={[s.th, { width: "22%" }, { textAlign: "right" }]}>From ($)</Text>
            <Text style={[s.th, { width: "28%" }, { textAlign: "right" }]}>To ($)</Text>
          </View>
          {r.opm.tranches.map((t, i) => {
            const info = i > 0 ? r.opm.breakpointInfo[i - 1] : null;
            const event = i === 0 ? "Senior liquidation preferences satisfied" : info?.event ?? "Allocation regime change";
            return (
              <View style={s.tr} key={i}>
                <Text style={[s.td, { width: "8%" }]}>{i + 1}</Text>
                <Text style={[s.td, { width: "42%" }]}>{event}</Text>
                <Text style={[s.td, { width: "22%" }, { textAlign: "right" }]}>{fmtMoney(t.from)}</Text>
                <Text style={[s.td, { width: "28%" }, { textAlign: "right" }]}>{t.to == null ? "∞" : fmtMoney(t.to)}</Text>
              </View>
            );
          })}
        </View>
      </BodyPage>

      {/* Appendix A.3 */}
      <BodyPage data={data} section="Appendix A">
        <Text style={s.h2}>A.3 Option Values and Incremental Tranche Value</Text>
        <Text style={s.note}>
          Incremental tranche value = call(Kₙ) − call(Kₙ₊₁) using BSM with S₀ = {fmtMoney(r.equityValue)}, T ={" "}
          {a.timeToLiquidity.toFixed(2)} years, σ = {fmtPct(a.volatility)}, r = {fmtPct(a.riskFreeRate, 2)}.
        </Text>
        <View style={s.table}>
          <View style={s.trHead}>
            <Text style={[s.th, { width: "10%" }]}>Tranche</Text>
            <Text style={[s.th, { width: "30%" }, { textAlign: "right" }]}>Breakpoint K</Text>
            <Text style={[s.th, { width: "30%" }, { textAlign: "right" }]}>Call value</Text>
            <Text style={[s.th, { width: "30%" }, { textAlign: "right" }]}>Incremental</Text>
          </View>
          {r.opm.tranches.map((t, i) => (
            <View style={s.tr} key={i}>
              <Text style={[s.td, { width: "10%" }]}>{i + 1}</Text>
              <Text style={[s.td, { width: "30%" }, { textAlign: "right" }]}>{fmtMoney(t.from)}</Text>
              <Text style={[s.td, { width: "30%" }, { textAlign: "right" }]}>{fmtMoney(t.callValueLow)}</Text>
              <Text style={[s.td, { width: "30%" }, { textAlign: "right" }]}>{fmtMoney(t.trancheValue)}</Text>
            </View>
          ))}
          <View style={s.trTotal}>
            <Text style={[s.tdBold, { width: "70%" }]}>Total equity value</Text>
            <Text style={[s.tdBold, { width: "30%" }, { textAlign: "right" }]}>{fmtMoney(r.equityValue)}</Text>
          </View>
        </View>
      </BodyPage>

      {/* Appendix A.4 pct */}
      <BodyPage data={data} section="Appendix A">
        <Text style={s.h2}>A.4 Distribution of Value — Percentage by Tranche</Text>
        <DistributionTable allocations={r.opm.allocations} tranches={r.opm.tranches} mode="pct" />
      </BodyPage>

      {/* Appendix A.4 usd */}
      <BodyPage data={data} section="Appendix A">
        <Text style={s.h2}>A.4 Distribution of Value — Dollars by Tranche</Text>
        <DistributionTable allocations={r.opm.allocations} tranches={r.opm.tranches} mode="usd" equityValue={r.equityValue} />
      </BodyPage>

      {/* Appendix A.5 */}
      <BodyPage data={data} section="Appendix A">
        <Text style={s.h2}>A.5 Valuation of Each Equity Class</Text>
        <View style={s.table}>
          <ClassHeaderRow />
          <EquityClassRow al={commonAlloc} dlom={r.dlom.value} fmv={r.concludedFmv} />
          {prefAlloc.map((al) => (
            <EquityClassRow key={al.key} al={al} />
          ))}
          {optAlloc.map((al) => (
            <EquityClassRow key={al.key} al={al} />
          ))}
          <View style={s.trTotal}>
            <Text style={[s.tdBold, { width: "30%" }]}>Total</Text>
            <Text style={[s.tdBold, { width: "18%" }, { textAlign: "right" }]}>{fmtMoney(r.equityValue)}</Text>
            <Text style={[s.tdBold, { width: "52%" }]}></Text>
          </View>
        </View>
      </BodyPage>

      {/* Appendix B — GPC */}
      <BodyPage data={data} section="Appendix B">
        <H1>Appendix B — Guideline Public Company Volatility</H1>
        {GPC_VOLATILITY_NARRATIVE.map((para, i) => (
          <Text key={i} style={s.p}>
            {para}
          </Text>
        ))}
        <Text style={s.exhibit}>Exhibit B-1 — Selected Guideline Public Companies</Text>
        <View style={s.table}>
          <View style={s.trHead}>
            <Text style={[s.th, { width: "36%" }]}>Company</Text>
            <Text style={[s.th, { width: "12%" }]}>Ticker</Text>
            <Text style={[s.th, { width: "14%" }, { textAlign: "right" }]}>σ (ann.)</Text>
            <Text style={[s.th, { width: "38%" }]}>Relevance</Text>
          </View>
          {GPC_COMPANIES.map((g) => (
            <View style={s.tr} key={g.ticker}>
              <Text style={[s.td, { width: "36%" }]}>{g.name}</Text>
              <Text style={[s.td, { width: "12%" }]}>{g.ticker}</Text>
              <Text style={[s.td, { width: "14%" }, { textAlign: "right" }]}>{fmtPct(g.vol)}</Text>
              <Text style={[s.td, { width: "38%" }]}>{g.note}</Text>
            </View>
          ))}
          <View style={s.trTotal}>
            <Text style={[s.tdBold, { width: "48%" }]}>Simple average (unweighted)</Text>
            <Text style={[s.tdBold, { width: "14%" }, { textAlign: "right" }]}>{fmtPct(gpcMedian)}</Text>
            <Text style={[s.tdBold, { width: "38%" }]}>Reference only</Text>
          </View>
        </View>
        <Text style={s.p}>
          The concluded volatility of {fmtPct(a.volatility)} reflects judgment within and around the GPC range, adjusted
          for the Company&apos;s stage, size, and risk relative to the guideline set.
        </Text>
      </BodyPage>

      {/* Appendix C — DLOM */}
      <BodyPage data={data} section="Appendix C">
        <H1>Appendix C — Marketability Discount Literature</H1>
        <Text style={s.p}>
          This appendix supplements Section 10 with additional context on empirical restricted stock and pre-IPO studies
          commonly cited in private company valuations.
        </Text>
        <View style={s.table}>
          <View style={s.trHead}>
            <Text style={[s.th, { width: "40%" }]}>Study / model</Text>
            <Text style={[s.th, { width: "25%" }]}>Period</Text>
            <Text style={[s.th, { width: "35%" }]}>Indicative discount</Text>
          </View>
          {DLOM_STUDIES.map((row) => (
            <View style={s.tr} key={row.source}>
              <Text style={[s.td, { width: "40%" }]}>{row.source}</Text>
              <Text style={[s.td, { width: "25%" }]}>{row.period}</Text>
              <Text style={[s.td, { width: "35%" }]}>{row.median}</Text>
            </View>
          ))}
        </View>
        {DLOM_NARRATIVE.map((para, i) => (
          <Text key={i} style={s.p}>
            {para}
          </Text>
        ))}
      </BodyPage>

      {/* Appendix D — Securities */}
      <BodyPage data={data} section="Appendix D">
        <H1>Appendix D — Securities Terms and Financing History</H1>
        <Text style={s.h2}>Share Class Rights Summary</Text>
        <View style={s.table}>
          <View style={s.trHead}>
            <Text style={[s.th, { width: "28%" }]}>Class</Text>
            <Text style={[s.th, { width: "18%" }]}>Type</Text>
            <Text style={[s.th, { width: "14%" }, { textAlign: "right" }]}>Liq. pref.</Text>
            <Text style={[s.th, { width: "14%" }, { textAlign: "center" }]}>Part.</Text>
            <Text style={[s.th, { width: "12%" }, { textAlign: "center" }]}>Senior.</Text>
            <Text style={[s.th, { width: "14%" }]}>Notes</Text>
          </View>
          {(data.shareClassTerms?.length ? data.shareClassTerms : defaultShareTerms(r)).map((sc, i) => (
            <View style={s.tr} key={i}>
              <Text style={[s.td, { width: "28%" }]}>{sc.name}</Text>
              <Text style={[s.td, { width: "18%" }]}>{sc.type}</Text>
              <Text style={[s.td, { width: "14%" }, { textAlign: "right" }]}>{sc.liquidationPref}x</Text>
              <Text style={[s.td, { width: "14%" }, { textAlign: "center" }]}>{sc.isParticipating ? "Yes" : "No"}</Text>
              <Text style={[s.td, { width: "12%" }, { textAlign: "center" }]}>{sc.seniority}</Text>
              <Text style={[s.td, { width: "14%" }]}>—</Text>
            </View>
          ))}
        </View>
        <Text style={s.h2}>Financing History (Detail)</Text>
        <Text style={s.p}>
          See Exhibit 5-2 for round-level pricing. Preferred original issue prices in the OPM capitalization reflect
          closed-round pricing where available.
        </Text>
      </BodyPage>

      {/* Appendix E — BSM */}
      <BodyPage data={data} section="Appendix E">
        <H1>Appendix E — Black-Scholes-Merton Model</H1>
        <Text style={s.p}>{BSM_APPENDIX}</Text>
      </BodyPage>

      {/* Glossary */}
      <BodyPage data={data} section="Glossary">
        <H1>Glossary of Terms</H1>
        {GLOSSARY.map((g) => (
          <View key={g.term} wrap={false} style={{ marginBottom: 6 }}>
            <Text style={s.h3}>{g.term}</Text>
            <Text style={s.pTight}>{g.definition}</Text>
          </View>
        ))}
      </BodyPage>

      {/* Bibliography */}
      <BodyPage data={data} section="Bibliography">
        <H1>Bibliography and Appraiser Qualifications</H1>
        <Text style={s.h2}>References</Text>
        {BIBLIOGRAPHY.map((ref, i) => (
          <Numbered key={i} i={i + 1}>
            {ref}
          </Numbered>
        ))}
        <Text style={s.h2}>Appraiser Qualifications</Text>
        <Text style={s.p}>{APPRAISER_QUALIFICATIONS}</Text>
        <Text style={s.p}>
          Report reference: {reportId} · {company} · Valuation date {fmtDate(data.meta.valuationDate)}
        </Text>
      </BodyPage>
    </Document>
  );
}

function defaultFinancingRows(r: ValuationReportData["result"]) {
  if (r.backsolve) {
    return [
      {
        name: r.backsolve.roundName ?? r.backsolve.seriesName,
        status: "closed",
        closeDate: r.valuationDate,
        preMoneyValuation: null,
        investmentAmount: null,
        pricePerShare: r.backsolve.targetPricePerShare,
      },
    ];
  }
  return [];
}

function defaultShareTerms(r: ValuationReportData["result"]) {
  const rows = [{ name: "Common Stock", type: "common", liquidationPref: 0, isParticipating: false, seniority: 0 }];
  for (const p of r.capStructure.preferred) {
    rows.push({
      name: p.name,
      type: "preferred",
      liquidationPref: p.liquidationMultiple,
      isParticipating: p.participating,
      seniority: p.seniority,
    });
  }
  return rows;
}
