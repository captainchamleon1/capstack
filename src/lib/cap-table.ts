import { differenceInMonths, isBefore } from "date-fns";

export interface VestingInput {
  sharesGranted: number;
  cliffMonths: number;
  vestingMonths: number;
  vestingFrequency: string;
  startDate: Date;
  asOfDate?: Date;
}

export interface CapTableEntry {
  grantId: string;
  stakeholderId: string;
  stakeholderName: string;
  stakeholderType: string;
  shareClassName: string;
  shareClassType: string;
  securityType: string;
  sharesGranted: number;
  sharesVested: number;
  sharesExercised: number;
  sharesOutstanding: number;
  fullyDilutedShares: number;
  ownershipPercent: number;
  strikePrice?: number;
  grantDate: Date;
}

export interface CapTableSummary {
  totalAuthorized: number;
  totalIssued: number;
  totalOutstanding: number;
  totalFullyDiluted: number;
  optionPoolSize: number;
  optionPoolAvailable: number;
  optionPoolPercent: number;
  entries: CapTableEntry[];
  byShareClass: { name: string; type: string; shares: number; percent: number }[];
  byStakeholderType: { type: string; shares: number; percent: number }[];
}

export interface FundraiseScenario {
  name: string;
  preMoneyValuation: number;
  investmentAmount: number;
  optionPoolTarget: number;
  currentFullyDiluted: number;
  postMoneyValuation: number;
  pricePerShare: number;
  newShares: number;
  optionPoolShares: number;
  founderDilution: number;
  investorOwnership: number;
  postMoneyOwnership: CapTableEntry[];
}

export interface WaterfallTier {
  name: string;
  amount: number;
  recipients: {
    name: string;
    amount: number;
    percent: number;
    detail?: string;
  }[];
}

export interface LiquidationPrefConfig {
  shareClassName: string;
  multiple: number;
  participating: boolean;
  seniority: number;
  originalIssuePrice: number;
}

export interface WaterfallParticipant {
  stakeholderId: string;
  stakeholderName: string;
  shareClassName: string;
  shareClassType: string;
  securityType: string;
  shares: number;
  originalIssuePrice?: number;
  liquidationMultiple: number;
  isParticipating: boolean;
  seniority: number;
  strikePrice?: number;
}

export interface WaterfallResult {
  tiers: WaterfallTier[];
  stakeholderPayouts: {
    name: string;
    amount: number;
    percent: number;
    breakdown: string;
    shareClassName: string;
  }[];
  shareClassPayouts: {
    name: string;
    type: string;
    amount: number;
    percent: number;
    shares: number;
    holders: string[];
  }[];
  summary: {
    exitValue: number;
    totalDistributed: number;
    pricePerShare: number;
    participatingShares: number;
    preferredTookPreference: number;
    preferredConverted: number;
  };
}

export function calculateVestedShares(input: VestingInput): number {
  const { sharesGranted, cliffMonths, vestingMonths, startDate, asOfDate = new Date() } = input;
  const monthsElapsed = differenceInMonths(asOfDate, startDate);

  if (monthsElapsed < cliffMonths) return 0;
  if (monthsElapsed >= vestingMonths) return sharesGranted;

  const vestedFraction = monthsElapsed / vestingMonths;
  return Math.floor(sharesGranted * vestedFraction);
}

export function calculateVestingProgress(input: VestingInput): number {
  const vested = calculateVestedShares(input);
  return input.sharesGranted > 0 ? vested / input.sharesGranted : 0;
}

export function getNextVestingDate(input: VestingInput): Date | null {
  const { cliffMonths, vestingMonths, startDate, asOfDate = new Date() } = input;
  const monthsElapsed = differenceInMonths(asOfDate, startDate);

  if (monthsElapsed >= vestingMonths) return null;

  const nextMonth = monthsElapsed < cliffMonths ? cliffMonths : monthsElapsed + 1;
  const next = new Date(startDate);
  next.setMonth(next.getMonth() + nextMonth);
  return next;
}

interface GrantData {
  id: string;
  type: string;
  status: string;
  sharesGranted: number;
  sharesExercised: number;
  strikePrice: number | null;
  grantDate: Date;
  stakeholder: { id: string; name: string; type: string };
  shareClass: { name: string; type: string };
  vestingSchedule: {
    cliffMonths: number;
    vestingMonths: number;
    vestingFrequency: string;
    startDate: Date;
  } | null;
}

interface CompanyData {
  authorizedShares: number;
  shareClasses: { id: string; name: string; type: string }[];
  equityGrants: GrantData[];
  safes: {
    id: string;
    status: string;
    investmentAmount: number;
    valuationCap: number | null;
    discountRate: number | null;
    type: string;
    stakeholder: { id: string; name: string; type: string };
  }[];
}

const OPTION_TYPES = new Set(["iso", "nso", "rsu", "rsa", "warrant"]);

export function isPoolReservationGrant(grant: { type: string }): boolean {
  return grant.type === "pool_reservation";
}

export function getOptionPoolStats(
  grants: Array<{
    type: string;
    status: string;
    sharesGranted: number;
    shareClass: { type: string };
  }>
) {
  let reserved = 0;
  let granted = 0;

  for (const grant of grants) {
    if (grant.status === "cancelled" || grant.status === "expired") continue;
    if (isPoolReservationGrant(grant)) {
      reserved += grant.sharesGranted;
      continue;
    }
    if (grant.shareClass.type === "option_pool" && OPTION_TYPES.has(grant.type)) {
      granted += grant.sharesGranted;
    }
  }

  return {
    reserved,
    granted,
    available: Math.max(0, reserved - granted),
  };
}

export function buildCapTable(company: CompanyData): CapTableSummary {
  const entries: CapTableEntry[] = [];
  let totalFullyDiluted = 0;

  const poolStats = getOptionPoolStats(company.equityGrants);

  for (const grant of company.equityGrants) {
    if (grant.status === "cancelled" || grant.status === "expired") continue;
    if (isPoolReservationGrant(grant)) continue;

    const isOption = ["iso", "nso", "warrant"].includes(grant.type);

    let sharesVested = grant.sharesGranted;
    if (grant.vestingSchedule && (isOption || grant.type === "rsu")) {
      sharesVested = calculateVestedShares({
        sharesGranted: grant.sharesGranted,
        cliffMonths: grant.vestingSchedule.cliffMonths,
        vestingMonths: grant.vestingSchedule.vestingMonths,
        vestingFrequency: grant.vestingSchedule.vestingFrequency,
        startDate: grant.vestingSchedule.startDate,
      });
    }

    const sharesOutstanding =
      grant.type === "common_stock" || grant.type === "preferred_stock" || grant.type === "rsa"
        ? grant.sharesExercised || grant.sharesGranted
        : grant.sharesExercised;

    const fullyDiluted = isOption || grant.type === "rsu" ? grant.sharesGranted : sharesOutstanding;

    totalFullyDiluted += fullyDiluted;

    entries.push({
      grantId: grant.id,
      stakeholderId: grant.stakeholder.id,
      stakeholderName: grant.stakeholder.name,
      stakeholderType: grant.stakeholder.type,
      shareClassName: grant.shareClass.name,
      shareClassType: grant.shareClass.type,
      securityType: grant.type,
      sharesGranted: grant.sharesGranted,
      sharesVested,
      sharesExercised: grant.sharesExercised,
      sharesOutstanding,
      fullyDilutedShares: fullyDiluted,
      ownershipPercent: 0,
      strikePrice: grant.strikePrice ?? undefined,
      grantDate: grant.grantDate,
    });
  }

  totalFullyDiluted += poolStats.available;

  entries.forEach((e) => {
    e.ownershipPercent = totalFullyDiluted > 0 ? e.fullyDilutedShares / totalFullyDiluted : 0;
  });

  const classMap = new Map<string, { name: string; type: string; shares: number }>();
  for (const e of entries) {
    const key = e.shareClassName;
    const existing = classMap.get(key) || { name: e.shareClassName, type: e.shareClassType, shares: 0 };
    existing.shares += e.fullyDilutedShares;
    classMap.set(key, existing);
  }

  const typeMap = new Map<string, number>();
  for (const e of entries) {
    if (e.shareClassType === "option_pool") continue;
    typeMap.set(e.stakeholderType, (typeMap.get(e.stakeholderType) || 0) + e.fullyDilutedShares);
  }

  const totalOutstanding = entries
    .filter((e) => e.shareClassType !== "option_pool")
    .reduce((sum, e) => sum + e.sharesOutstanding, 0);

  return {
    totalAuthorized: company.authorizedShares,
    totalIssued: totalOutstanding,
    totalOutstanding,
    totalFullyDiluted,
    optionPoolSize: poolStats.reserved,
    optionPoolAvailable: poolStats.available,
    optionPoolPercent: totalFullyDiluted > 0 ? poolStats.reserved / totalFullyDiluted : 0,
    entries: entries.sort((a, b) => b.ownershipPercent - a.ownershipPercent),
    byShareClass: Array.from(classMap.values()).map((c) => ({
      ...c,
      percent: totalFullyDiluted > 0 ? c.shares / totalFullyDiluted : 0,
    })),
    byStakeholderType: Array.from(typeMap.entries()).map(([type, shares]) => ({
      type,
      shares,
      percent: totalFullyDiluted > 0 ? shares / totalFullyDiluted : 0,
    })),
  };
}

export function modelFundraise(
  capTable: CapTableSummary,
  preMoneyValuation: number,
  investmentAmount: number,
  optionPoolTarget: number,
  founderStakeholderIds: string[]
): FundraiseScenario {
  const postMoneyValuation = preMoneyValuation + investmentAmount;
  const currentFD = capTable.totalFullyDiluted;

  const poolIncrease = Math.ceil(currentFD * optionPoolTarget - capTable.optionPoolSize);
  const adjustedFD = currentFD + Math.max(0, poolIncrease);
  const pricePerShare = preMoneyValuation / adjustedFD;
  const newShares = Math.ceil(investmentAmount / pricePerShare);

  const founderShares = capTable.entries
    .filter((e) => founderStakeholderIds.includes(e.stakeholderId))
    .reduce((sum, e) => sum + e.fullyDilutedShares, 0);

  const postFD = adjustedFD + newShares;
  const founderDilution = founderShares / postFD;
  const investorOwnership = newShares / postFD;

  const postMoneyOwnership = capTable.entries.map((e) => ({
    ...e,
    fullyDilutedShares: e.fullyDilutedShares,
    ownershipPercent: e.fullyDilutedShares / postFD,
  }));

  postMoneyOwnership.push({
    grantId: "new-investor",
    stakeholderId: "new-investor",
    stakeholderName: "New Investor",
    stakeholderType: "investor",
    shareClassName: "Series Preferred",
    shareClassType: "preferred",
    securityType: "preferred_stock",
    sharesGranted: newShares,
    sharesVested: newShares,
    sharesExercised: newShares,
    sharesOutstanding: newShares,
    fullyDilutedShares: newShares,
    ownershipPercent: investorOwnership,
    grantDate: new Date(),
  });

  return {
    name: "Fundraise Scenario",
    preMoneyValuation,
    investmentAmount,
    optionPoolTarget,
    currentFullyDiluted: currentFD,
    postMoneyValuation,
    pricePerShare,
    newShares,
    optionPoolShares: Math.max(0, poolIncrease),
    founderDilution,
    investorOwnership,
    postMoneyOwnership,
  };
}

interface SafeInput {
  id?: string;
  status: string;
  investmentAmount: number;
  valuationCap: number | null;
  discountRate: number | null;
  type: string;
  stakeholder: { id?: string; name: string };
}

export interface ConversionResult {
  instrumentId?: string;
  stakeholderId?: string;
  stakeholderName: string;
  investmentAmount: number;
  shares: number;
  conversionMethod: string;
}

function convertAmountToShares(
  amount: number,
  valuationCap: number | null,
  discountRate: number | null,
  roundValuation: number,
  pricePerShare: number
): { shares: number; method: string } {
  if (valuationCap && discountRate) {
    const capPrice = valuationCap / (roundValuation / pricePerShare);
    const discountPrice = pricePerShare * (1 - discountRate);
    if (capPrice < discountPrice) {
      return { shares: Math.ceil(amount / capPrice), method: "valuation_cap" };
    }
    return { shares: Math.ceil(amount / discountPrice), method: "discount" };
  }
  if (valuationCap) {
    const capPrice = valuationCap / (roundValuation / pricePerShare);
    return { shares: Math.ceil(amount / capPrice), method: "valuation_cap" };
  }
  if (discountRate) {
    const discountPrice = pricePerShare * (1 - discountRate);
    return { shares: Math.ceil(amount / discountPrice), method: "discount" };
  }
  return { shares: Math.ceil(amount / pricePerShare), method: "mfn" };
}

export function modelSafeConversion(
  safes: SafeInput[],
  roundValuation: number,
  pricePerShare: number
): ConversionResult[] {
  return safes
    .filter((s) => s.status === "outstanding")
    .map((safe) => {
      const { shares, method } = convertAmountToShares(
        safe.investmentAmount,
        safe.valuationCap,
        safe.discountRate,
        roundValuation,
        pricePerShare
      );

      return {
        instrumentId: safe.id,
        stakeholderId: safe.stakeholder.id,
        stakeholderName: safe.stakeholder.name,
        investmentAmount: safe.investmentAmount,
        shares,
        conversionMethod: method,
      };
    });
}

interface NoteInput {
  id?: string;
  status: string;
  principalAmount: number;
  interestRate: number;
  valuationCap: number | null;
  discountRate: number | null;
  issueDate: Date;
  stakeholder: { id?: string; name: string };
}

export function modelNoteConversion(
  notes: NoteInput[],
  roundValuation: number,
  pricePerShare: number,
  asOfDate: Date = new Date()
): (ConversionResult & { accruedInterest: number })[] {
  return notes
    .filter((n) => n.status === "outstanding")
    .map((note) => {
      const years = Math.max(0, differenceInMonths(asOfDate, note.issueDate) / 12);
      const accruedInterest = note.principalAmount * note.interestRate * years;
      const totalAmount = note.principalAmount + accruedInterest;
      const { shares, method } = convertAmountToShares(
        totalAmount,
        note.valuationCap,
        note.discountRate,
        roundValuation,
        pricePerShare
      );

      return {
        instrumentId: note.id,
        stakeholderId: note.stakeholder.id,
        stakeholderName: note.stakeholder.name,
        investmentAmount: totalAmount,
        accruedInterest,
        shares,
        conversionMethod: method,
      };
    });
}

/** Unallocated option pool reservation (not a real stakeholder grant) */
function isPoolReservation(entry: CapTableEntry): boolean {
  return entry.securityType === "pool_reservation";
}

export function buildWaterfallParticipants(
  capTable: CapTableSummary,
  liquidationPrefs: LiquidationPrefConfig[],
  exitValue: number
): WaterfallParticipant[] {
  const prefByClass = new Map(liquidationPrefs.map((p) => [p.shareClassName, p]));
  const eligible = capTable.entries.filter((e) => !isPoolReservation(e));

  const rawParticipants: WaterfallParticipant[] = eligible.map((e) => {
    const pref = prefByClass.get(e.shareClassName);
    const isPreferred =
      e.shareClassType === "preferred" ||
      e.shareClassType.startsWith("series_") ||
      e.securityType === "preferred_stock";

    let shares = e.fullyDilutedShares;
    if (["iso", "nso", "warrant"].includes(e.securityType)) {
      shares = e.sharesVested;
    } else if (e.securityType === "rsu") {
      shares = e.sharesVested;
    } else if (e.securityType === "common_stock" || e.securityType === "preferred_stock") {
      shares = e.sharesOutstanding || e.fullyDilutedShares;
    }

    return {
      stakeholderId: e.stakeholderId,
      stakeholderName: e.stakeholderName,
      shareClassName: e.shareClassName,
      shareClassType: e.shareClassType,
      securityType: e.securityType,
      shares,
      originalIssuePrice: pref?.originalIssuePrice,
      liquidationMultiple: pref?.multiple ?? 0,
      isParticipating: pref?.participating ?? false,
      seniority: pref?.seniority ?? 0,
      strikePrice: e.strikePrice,
    };
  });

  const totalShares = rawParticipants.reduce((sum, p) => sum + p.shares, 0);
  const pricePerShare = totalShares > 0 ? exitValue / totalShares : 0;

  return rawParticipants.filter((p) => {
    if (p.shares <= 0) return false;
    if (["iso", "nso", "warrant"].includes(p.securityType) && p.strikePrice !== undefined) {
      return pricePerShare > p.strikePrice;
    }
    return true;
  });
}

export function calculateWaterfall(
  exitValue: number,
  capTable: CapTableSummary,
  liquidationPrefs: LiquidationPrefConfig[]
): WaterfallResult {
  const participants = buildWaterfallParticipants(capTable, liquidationPrefs, exitValue);
  const totalShares = participants.reduce((sum, p) => sum + p.shares, 0);
  const pricePerShare = totalShares > 0 ? exitValue / totalShares : 0;

  const prefHolders = participants.filter(
    (p) =>
      (p.shareClassType === "preferred" || p.shareClassType.startsWith("series_")) &&
      p.originalIssuePrice &&
      p.liquidationMultiple > 0
  );

  const prefDecisions: {
    participant: WaterfallParticipant;
    prefAmount: number;
    conversionAmount: number;
    takesPreference: boolean;
    payout: number;
  }[] = prefHolders.map((p) => {
    const prefAmount = p.shares * (p.originalIssuePrice ?? 0) * p.liquidationMultiple;
    const conversionAmount = p.shares * pricePerShare;
    const takesPreference = p.isParticipating
      ? true
      : prefAmount > conversionAmount;
    const payout = p.isParticipating
      ? prefAmount
      : Math.max(prefAmount, conversionAmount);

    return { participant: p, prefAmount, conversionAmount, takesPreference, payout };
  });

  const tiers: WaterfallTier[] = [];
  const payouts = new Map<string, { amount: number; parts: string[]; shareClassName: string }>();
  const classPayouts = new Map<
    string,
    { amount: number; type: string; holders: Set<string> }
  >();

  function addPayout(participant: WaterfallParticipant, amount: number, part: string) {
    const { stakeholderName, shareClassName, shareClassType } = participant;

    const existing = payouts.get(stakeholderName) || { amount: 0, parts: [], shareClassName };
    existing.amount += amount;
    existing.parts.push(part);
    payouts.set(stakeholderName, existing);

    const classEntry = classPayouts.get(shareClassName) || {
      amount: 0,
      type: shareClassType,
      holders: new Set<string>(),
    };
    classEntry.amount += amount;
    classEntry.holders.add(stakeholderName);
    classPayouts.set(shareClassName, classEntry);
  }

  let remaining = exitValue;

  const prefTierRecipients = prefDecisions.filter((d) => d.takesPreference && !d.participant.isParticipating);
  if (prefTierRecipients.length > 0) {
    const prefTotal = prefTierRecipients.reduce((sum, d) => sum + d.prefAmount, 0);
    const prefPaid = Math.min(remaining, prefTotal);

    const tierRecipients = prefTierRecipients.map((d) => {
      const amount = prefTotal > 0 ? (d.prefAmount / prefTotal) * prefPaid : 0;
      addPayout(
        d.participant,
        amount,
        `1x liquidation preference (${formatPrefDetail(d.participant)})`
      );
      return {
        name: d.participant.stakeholderName,
        amount,
        percent: exitValue > 0 ? amount / exitValue : 0,
        detail: `Pref: ${formatCurrencyShort(d.prefAmount)} vs convert: ${formatCurrencyShort(d.conversionAmount)} → takes preference`,
      };
    });

    tiers.push({
      name: "Liquidation Preference (1x Non-Participating)",
      amount: prefPaid,
      recipients: tierRecipients,
    });
    remaining -= prefPaid;
  }

  const participatingPref = prefDecisions.filter((d) => d.participant.isParticipating);
  if (participatingPref.length > 0 && remaining > 0) {
    const prefTotal = participatingPref.reduce((sum, d) => sum + d.prefAmount, 0);
    const prefPaid = Math.min(remaining, prefTotal);

    const tierRecipients = participatingPref.map((d) => {
      const amount = prefTotal > 0 ? (d.prefAmount / prefTotal) * prefPaid : 0;
      addPayout(d.participant, amount, "participating liquidation preference");
      return {
        name: d.participant.stakeholderName,
        amount,
        percent: exitValue > 0 ? amount / exitValue : 0,
        detail: "Participating preferred — preference + pro-rata",
      };
    });

    tiers.push({
      name: "Liquidation Preference (Participating)",
      amount: prefPaid,
      recipients: tierRecipients,
    });
    remaining -= prefPaid;
  }

  const proRataParticipants = participants.filter((p) => {
    const decision = prefDecisions.find((d) => d.participant.stakeholderId === p.stakeholderId);
    if (!decision) return true;
    if (decision.participant.isParticipating) return true;
    return !decision.takesPreference;
  });

  const proRataShares = proRataParticipants.reduce((sum, p) => sum + p.shares, 0);

  if (remaining > 0 && proRataShares > 0) {
    const tierRecipients = proRataParticipants.map((p) => {
      const amount = (p.shares / proRataShares) * remaining;
      const decision = prefDecisions.find((d) => d.participant.stakeholderId === p.stakeholderId);
      const detail = decision
        ? `Converted — pref ${formatCurrencyShort(decision.prefAmount)} < conversion ${formatCurrencyShort(decision.conversionAmount)}`
        : p.securityType === "iso" || p.securityType === "nso"
          ? `${p.shares.toLocaleString()} vested options @ $${pricePerShare.toFixed(2)}/sh`
          : `${p.shares.toLocaleString()} shares @ $${pricePerShare.toFixed(2)}/sh`;

      addPayout(p, amount, "pro-rata");
      return {
        name: p.stakeholderName,
        amount,
        percent: exitValue > 0 ? amount / exitValue : 0,
        detail,
      };
    });

    tiers.push({
      name: "Pro-Rata Distribution",
      amount: remaining,
      recipients: tierRecipients,
    });
  }

  const stakeholderPayouts = Array.from(payouts.entries())
    .map(([name, { amount, parts, shareClassName }]) => ({
      name,
      amount,
      percent: exitValue > 0 ? amount / exitValue : 0,
      breakdown: parts.join(" + "),
      shareClassName,
    }))
    .sort((a, b) => b.amount - a.amount);

  const shareClassPayouts = Array.from(classPayouts.entries())
    .map(([name, { amount, type, holders }]) => {
      const shares = participants
        .filter((p) => p.shareClassName === name)
        .reduce((sum, p) => sum + p.shares, 0);
      return {
        name,
        type,
        amount,
        percent: exitValue > 0 ? amount / exitValue : 0,
        shares,
        holders: Array.from(holders),
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return {
    tiers,
    stakeholderPayouts,
    shareClassPayouts,
    summary: {
      exitValue,
      totalDistributed: stakeholderPayouts.reduce((sum, p) => sum + p.amount, 0),
      pricePerShare,
      participatingShares: totalShares,
      preferredTookPreference: prefTierRecipients.length,
      preferredConverted: prefDecisions.filter((d) => !d.takesPreference && !d.participant.isParticipating).length,
    },
  };
}

function formatPrefDetail(p: WaterfallParticipant): string {
  return `${p.shares.toLocaleString()} sh × $${p.originalIssuePrice?.toFixed(2)} × ${p.liquidationMultiple}x`;
}

function formatCurrencyShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
