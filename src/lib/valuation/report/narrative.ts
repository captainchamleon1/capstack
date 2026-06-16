/** Long-form narrative blocks for the 409A report. Written in formal appraisal style. */

export const RR59_60_FACTORS: { title: string; body: string }[] = [
  {
    title: "The Nature of the Business and the History of the Enterprise from Its Inception",
    body: "The Company operates as a privately held corporation. Its operating history, product development stage, customer traction, and capital-raising activity inform the risk profile of its equity and the reasonableness of using a recent financing transaction as an indication of value. Management has represented that the business is a going concern with no planned liquidation or cessation of operations.",
  },
  {
    title: "The Economic Outlook in General and the Condition and Outlook of the Specific Industry in Particular",
    body: "General economic conditions—including interest rates, equity market volatility, and venture capital investment activity—affect the cost of capital and exit multiples available to venture-backed companies. Industry-specific trends in the Company's sector influence revenue growth expectations, competitive dynamics, and the selection of guideline public companies for volatility analysis. We considered prevailing market conditions as of the Valuation Date.",
  },
  {
    title: "The Book Value of the Stock and the Financial Condition of the Business",
    body: "For early-stage and growth-stage companies, book value often understates enterprise value because intangible assets, development-stage technology, and human capital are not fully reflected on the balance sheet. Where audited financial statements were not provided for this engagement, we relied on management representations and the Company's capitalization data. The financial condition of the Company supports a going-concern premise of value.",
  },
  {
    title: "The Earning Capacity of the Company",
    body: "Historical earnings may be negative or immaterial for venture-backed companies investing heavily in growth. Accordingly, the Income Approach was not selected as the primary method of valuation. Future earning capacity is implicitly reflected in the pricing of the Company's preferred securities in arm's-length financings and in the growth expectations embedded in guideline public company volatility.",
  },
  {
    title: "The Dividend-Paying Capacity",
    body: "The Company has not historically paid dividends and is not expected to pay dividends prior to a liquidity event. A dividend yield of zero was applied in the option pricing and marketability discount models.",
  },
  {
    title: "Whether or Not the Enterprise Has Goodwill or Other Intangible Value",
    body: "Goodwill and intangible value—including developed technology, customer relationships, assembled workforce, and brand—are significant value drivers for the Company. These elements are not separately valued in this engagement but are reflected in the total equity value implied by the recent financing and allocated among security classes through the Option Pricing Method.",
  },
  {
    title: "Sales of the Stock and the Size of the Block of Stock to Be Valued",
    body: "The subject interest is a minority, non-controlling interest in the Company's common stock. Recent sales of preferred stock in arm's-length financings provide objective evidence of investor pricing. The common stock lacks a ready public market; a discount for lack of marketability is applied to reflect this difference.",
  },
  {
    title: "The Market Price of Stocks of Corporations Engaged in the Same or a Similar Line of Business Whose Stocks Are Actively Traded in a Free and Open Market",
    body: "Guideline public companies in comparable industries provide a basis for estimating equity volatility, a key input to the Option Pricing Method and the marketability discount models. Selected companies reflect similar growth profiles, risk characteristics, and market segments, subject to adjustments for differences in size, liquidity, and stage of development.",
  },
];

export const ALLOCATION_METHODS = [
  {
    method: "Current Value Method (CVM)",
    description:
      "The CVM allocates enterprise value to each class as if the business were sold on the Valuation Date for an amount equal to its current value. It is most appropriate when a liquidity event is imminent or when the enterprise value is below the aggregate liquidation preferences.",
    selected: false,
    rationale:
      "Not selected. A liquidity event is not imminent within the near term, and total equity value exceeds aggregate liquidation preferences at the concluded value.",
  },
  {
    method: "Probability-Weighted Expected Return Method (PWERM)",
    description:
      "The PWERM models discrete future exit scenarios (e.g., IPO, strategic sale, dissolution) with assigned probabilities and exit values, allocates value in each scenario, and weights the results. It requires explicit forecasts of exit timing, exit value, and probability for each scenario.",
    selected: false,
    rationale:
      "Not selected. While PWERM can provide granular scenario analysis, the required probability and exit-value assumptions are highly subjective at the Company's current stage. The OPM provides a robust alternative that captures the option-like nature of preferred and common interests without discrete scenario specification.",
  },
  {
    method: "Option Pricing Method (OPM)",
    description:
      "The OPM treats each class of equity as a call option on the enterprise's equity value, with exercise prices set at cumulative breakpoints derived from liquidation preferences, participation rights, conversion thresholds, and option exercise prices. Value is allocated using Black-Scholes-Merton option pricing across tranches between breakpoints.",
    selected: true,
    rationale:
      "Selected. The Company has multiple classes of stock with differing rights and preferences, an uncertain time to liquidity, and a range of possible exit values. The OPM is consistent with AICPA guidance for this fact pattern.",
  },
];

export const DLOM_NARRATIVE = [
  `A discount for lack of marketability ("DLOM") reflects the reduction in value attributable to the inability to convert an ownership interest to cash quickly and with minimal transaction costs. Empirical research on restricted stock transactions, pre-IPO studies, and option-based models supports the application of marketability discounts to closely held equity interests.`,
  `We considered the Finnerty (2012) average-strike put option model and the Chaffee (1993) protective put model. The Finnerty model estimates the cost of a put option struck at the arithmetic average price over the restriction period, reflecting the holder's inability to sell at the optimal point in time. The Chaffee model uses an at-the-money European put as a proxy for the cost of illiquidity. Both models require estimates of volatility and the expected holding period to liquidity.`,
  `Restricted stock studies (e.g., FMV Opinions, Stout Risius Ross) have historically indicated marketability discounts for closely held stock ranging widely depending on holding period, company risk, and transaction structure. Option-based models provide a forward-looking, company-specific estimate tied to the concluded volatility and time to liquidity used in the OPM.`,
];

export const BSM_APPENDIX = `The Black-Scholes-Merton ("BSM") model estimates the value of a European call option as:

C = S₀ · e^(−qT) · N(d₁) − X · e^(−rT) · N(d₂)

where:
  d₁ = [ln(S₀/X) + (r − q + σ²/2) · T] / (σ · √T)
  d₂ = d₁ − σ · √T

S₀ = current value of the underlying (total equity value)
X  = exercise price (breakpoint)
T  = time to expiration (expected time to liquidity)
r  = risk-free interest rate (continuously compounded)
q  = dividend yield (continuously compounded)
σ  = volatility of the underlying
N(·) = cumulative standard normal distribution

In the OPM, the value of each tranche between consecutive breakpoints equals the difference between call values struck at the lower and upper bounds. The incremental value is allocated among participating security classes according to their marginal participation in that tranche.`;

export const GLOSSARY: { term: string; definition: string }[] = [
  { term: "409A", definition: "IRC Section 409A and regulations governing nonqualified deferred compensation, including stock option exercise pricing." },
  { term: "Backsolve", definition: "A calibration technique that solves for total equity value such that the OPM allocates a target per-share value to a recently issued preferred class." },
  { term: "Breakpoint", definition: "An equity-value threshold at which the marginal distribution of proceeds among security classes changes." },
  { term: "Common stock", definition: "The residual equity class, subordinate to preferred liquidation preferences unless preferred converts." },
  { term: "DLOM", definition: "Discount for lack of marketability; reduction in value for absence of a ready public market." },
  { term: "Fair market value", definition: "Price at which property would change hands between a willing buyer and seller, per Rev. Rul. 59-60." },
  { term: "Fully diluted", definition: "Capitalization including all outstanding shares plus shares issuable upon exercise of options and conversion of convertible securities." },
  { term: "Liquidation preference", definition: "Contractual right of preferred stock to receive proceeds before common stock upon a liquidity event." },
  { term: "OPM", definition: "Option Pricing Method; allocates equity value using option pricing across breakpoint tranches." },
  { term: "Participating preferred", definition: "Preferred stock that receives its liquidation preference and also shares in residual proceeds with common." },
  { term: "Time to liquidity", definition: "Expected period until an exit event (IPO, sale, or similar) at which equity value is realized." },
  { term: "Volatility", definition: "Standard deviation of equity returns; key input to OPM and DLOM models." },
];

export const ASSUMPTIONS_EXTENDED: string[] = [
  "This valuation is valid only for the stated purpose and only as of the Valuation Date. Subsequent events—including new financings, material changes in operations, regulatory developments, or macroeconomic shifts—may materially affect the conclusion and would generally require an updated valuation.",
  "Financial, capitalization, and operating information provided by the Company or its representatives has been accepted as accurate without independent audit or verification. We have not performed agreed-upon procedures on underlying data.",
  "Public, industry, and statistical information has been obtained from sources believed to be reliable. We make no representation as to its accuracy or completeness and have performed no procedures to corroborate third-party data.",
  "We do not provide assurance on the achievability of any results forecasted by or for the Company; actual results may differ materially from expectations.",
  "The conclusion assumes that the current level of management expertise and effectiveness will be maintained and that the character and integrity of the enterprise will not be materially changed.",
  "The OPM assumes a single liquidity event at the expected time to liquidity, with equity value distributed according to the rights and preferences in the capital structure as of the Valuation Date. Multiple exit scenarios are not explicitly modeled.",
  "Volatility, time to liquidity, and the risk-free rate are estimates subject to judgment. Reasonable alternative inputs would produce different results, as illustrated in the sensitivity analysis.",
  "Outstanding convertible instruments not reflected in the provided capitalization table may affect the conclusion if converted or if their economic rights differ from representations.",
  "This report is for the exclusive use of the Company for IRC Section 409A compliance and equity compensation matters. It does not constitute investment, legal, or tax advice.",
  "No part of this report may be reproduced or disseminated without prior written consent of Equitr Valuations.",
  "We have no obligation to update this report for events arising after the report date.",
  "An actual transaction may occur at a different value depending on circumstances, motivations, and information available to parties at that time.",
  "No opinion is expressed on matters requiring legal, accounting, or regulatory expertise beyond valuation analysis.",
  "The reviewing valuation analyst is responsible for final approval of assumptions and conclusion prior to reliance for grant pricing.",
];

export const APPRAISER_QUALIFICATIONS = `Equitr Valuations provides independent appraisal services for privately held company equity securities. Valuations are prepared in accordance with the AICPA Accounting and Valuation Guide, "Valuation of Privately-Held-Company Equity Securities Issued as Compensation," and conform to the Uniform Standards of Professional Appraisal Practice (USPAP) to the extent applicable.

Each report is subject to review by a qualified valuation analyst with experience in IRC Section 409A engagements, option pricing allocation methods, and marketability discount analysis. The automated valuation engine produces a preliminary allocation and report; final conclusions are subject to analyst review and sign-off before adoption for grant pricing.`;

export const BIBLIOGRAPHY: string[] = [
  "AICPA Accounting and Valuation Guide: Valuation of Privately-Held-Company Equity Securities Issued as Compensation (current edition).",
  "IRS Revenue Ruling 59-60.",
  "Treas. Reg. § 1.409A-1(b)(5)(iv) (independent appraisal presumption).",
  "Finnerty, John D., \"An Average-Strike Put Option Model of the Marketability Discount,\" Journal of Derivatives (2012).",
  "Chaffee, David B., \"Option Pricing as a Proxy for Discount for Lack of Marketability in Private Company Valuations,\" Business Valuation Review (1993).",
  "Black, F. and Scholes, M., \"The Pricing of Options and Corporate Liabilities,\" Journal of Political Economy (1973).",
  "Merton, R., \"Theory of Rational Option Pricing,\" Bell Journal of Economics and Management Science (1973).",
  "FMV Opinions / Stout Restricted Stock Study (various editions).",
];

export const GPC_VOLATILITY_NARRATIVE = [
  `Equity volatility is a critical input to both the Option Pricing Method and the marketability discount models. For privately held companies, volatility cannot be observed directly; it is typically estimated from the historical or implied volatility of guideline public companies ("GPCs") operating in similar industries and at comparable stages of development.`,
  `We selected GPCs with business models, end markets, and growth profiles reasonably comparable to the Company. Historical equity volatility was calculated over a lookback period ending on or about the Valuation Date, using daily or weekly total return data. Where a GPC had a limited trading history, we considered alternative estimation techniques or excluded the company from the set.`,
  `The concluded equity volatility represents a judgment-based estimate within the range observed for the selected GPCs, adjusted for differences in size, liquidity, leverage, and stage relative to the Company. A higher volatility assumption increases both the allocated value spread between security classes in the OPM and the magnitude of the marketability discount under option-based DLOM models.`,
];

/** Representative GPC set for robotics / industrial automation sector (illustrative). */
export const GPC_COMPANIES: { name: string; ticker: string; vol: number; note: string }[] = [
  { name: "Intuitive Surgical, Inc.", ticker: "ISRG", vol: 0.32, note: "Medical robotics; mature revenue base" },
  { name: "Teradyne, Inc.", ticker: "TER", vol: 0.38, note: "Industrial automation; acquisition of collaborative robotics" },
  { name: "AeroVironment, Inc.", ticker: "AVAV", vol: 0.45, note: "Autonomous systems; defense and commercial" },
  { name: "iRobot Corporation", ticker: "IRBT", vol: 0.52, note: "Consumer robotics; higher growth volatility" },
  { name: "Symbotic Inc.", ticker: "SYM", vol: 0.58, note: "Warehouse automation; growth-stage profile" },
  { name: "Rockwell Automation, Inc.", ticker: "ROK", vol: 0.28, note: "Industrial controls; lower-beta benchmark" },
];

export const DLOM_STUDIES: { source: string; period: string; median: string }[] = [
  { source: "FMV Opinions / Stout", period: "2005–2020", median: "25%–35%" },
  { source: "Silber (restricted stock)", period: "1981–1984", median: "~34%" },
  { source: "Johnson (pre-IPO)", period: "Various", median: "40%–60%" },
  { source: "Finnerty model (implied)", period: "Company-specific", median: "See Exhibit" },
];

export function transmittalLetter(company: string, valuationDate: string, reportDate: string): string[] {
  return [
    `Dear Board of Directors:`,
    `At your request, Equitr Valuations has prepared an independent appraisal of the fair market value of the common stock of ${company} as of ${valuationDate} (the "Valuation Date"). This report has been prepared for the exclusive use of the Company in connection with Internal Revenue Code Section 409A and the pricing of equity-based compensation.`,
    `Our analysis was performed in accordance with the AICPA Accounting and Valuation Guide, "Valuation of Privately-Held-Company Equity Securities Issued as Compensation," and conforms to the Uniform Standards of Professional Appraisal Practice (USPAP) to the extent applicable to valuation engagements for compensation purposes.`,
    `The engagement consisted of reviewing the Company's capitalization structure, financing history, and governing documents; estimating total equity value; allocating value among outstanding security classes using the Option Pricing Method; and applying a discount for lack of marketability to arrive at the fair market value of the common stock on a non-marketable, non-controlling basis.`,
    `This report is subject to the assumptions and limiting conditions set forth herein and to review by a qualified valuation analyst prior to final adoption for grant pricing. We appreciate the opportunity to be of service.`,
    `Respectfully submitted,`,
  ];
}

export const ANALYST_REPRESENTATION: string[] = [
  "The statements of fact contained in this report are true and correct to the best of our knowledge and belief.",
  "The reported analyses, opinions, and conclusions are limited only by the reported assumptions and limiting conditions and are our impartial, unbiased professional analyses, opinions, and conclusions.",
  "We have no present or prospective interest in the Company or the property that is the subject of this report and no personal interest with respect to the parties involved.",
  "We have no bias with respect to the subject of this report or to the parties involved.",
  "Our engagement was not contingent upon developing or reporting predetermined results, and our compensation is not contingent on the conclusion of value.",
  "The economic and financial analyses were prepared by, and the conclusion of value reached under the supervision of, the qualified valuation analyst identified on the signature page.",
  "No one, except those identified herein, provided significant professional assistance in preparing this report.",
  "We have not performed an audit, review, or compilation of the Company's financial statements in connection with this engagement.",
];
