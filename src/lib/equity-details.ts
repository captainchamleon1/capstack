import { differenceInDays, differenceInMonths } from "date-fns";
import { calculateVestedShares } from "./cap-table";
import type { CapTableEntry } from "./cap-table";

export const DEFAULT_FMV = 0.55;

export const SECURITY_LABELS: Record<string, string> = {
  iso: "Incentive Stock Option (ISO)",
  nso: "Non-Qualified Stock Option (NSO)",
  rsu: "Restricted Stock Unit (RSU)",
  rsa: "Restricted Stock Award (RSA)",
  warrant: "Warrant",
  common_stock: "Common Stock",
  preferred_stock: "Preferred Stock",
};

interface GrantInput {
  type: string;
  status: string;
  sharesGranted: number;
  sharesExercised: number;
  strikePrice: number | null;
  grantDate: Date;
  boardApprovalDate: Date | null;
  expirationDate: Date | null;
  notes: string | null;
  vestingSchedule: {
    cliffMonths: number;
    vestingMonths: number;
    vestingFrequency: string;
    startDate: Date;
    accelerationType: string | null;
    type: string;
  } | null;
  shareClass: {
    name: string;
    type: string;
    votesPerShare: number;
    liquidationPref: number;
    isParticipating: boolean;
    seniority: number;
  };
}

export function getGrantMetrics(
  grant: GrantInput,
  entry: CapTableEntry | null,
  fairMarketValue = DEFAULT_FMV
) {
  const vesting = grant.vestingSchedule;
  const vestedShares = entry
    ? entry.sharesVested
    : vesting
      ? calculateVestedShares({
          sharesGranted: grant.sharesGranted,
          cliffMonths: vesting.cliffMonths,
          vestingMonths: vesting.vestingMonths,
          vestingFrequency: vesting.vestingFrequency,
          startDate: vesting.startDate,
        })
      : grant.sharesGranted;

  const unvestedShares = Math.max(0, grant.sharesGranted - vestedShares);
  const exercisableShares = Math.max(0, vestedShares - grant.sharesExercised);
  const isOption = ["iso", "nso", "warrant"].includes(grant.type);
  const spread =
    isOption && grant.strikePrice != null
      ? Math.max(0, fairMarketValue - grant.strikePrice)
      : 0;

  const cliffEndDate = vesting
    ? new Date(vesting.startDate.getFullYear(), vesting.startDate.getMonth() + vesting.cliffMonths, vesting.startDate.getDate())
    : null;

  const daysToExpiration = grant.expirationDate
    ? differenceInDays(grant.expirationDate, new Date())
    : null;

  return {
    vestedShares,
    unvestedShares,
    exercisableShares,
    spread,
    vestedSpreadValue: vestedShares * spread,
    unvestedSpreadValue: unvestedShares * spread,
    exercisableSpreadValue: exercisableShares * spread,
    exerciseCost: exercisableShares * (grant.strikePrice ?? 0),
    cliffEndDate,
    daysToExpiration,
    isOption,
    securityLabel: SECURITY_LABELS[grant.type] ?? grant.type,
  };
}

interface StakeholderInput {
  type: string;
  relationship: string | null;
  startDate: Date | null;
  equityGrants: { status: string; grantDate: Date; type: string }[];
  safes: { investmentAmount: number; status: string }[];
  convertibleNotes: { principalAmount: number; status: string }[];
}

export function getStakeholderMetrics(
  stakeholder: StakeholderInput,
  entries: CapTableEntry[],
  shareClasses: { name: string; votesPerShare: number }[],
  documentCount: number
) {
  const classVotes = new Map(shareClasses.map((sc) => [sc.name, sc.votesPerShare]));

  const votingShares = entries.reduce((sum, e) => {
    const votes = classVotes.get(e.shareClassName) ?? 1;
    return sum + e.sharesOutstanding * votes;
  }, 0);

  const totalUnvested = entries.reduce((sum, e) => {
    if (["iso", "nso", "rsu", "rsa", "warrant"].includes(e.securityType)) {
      return sum + Math.max(0, e.sharesGranted - e.sharesVested);
    }
    return sum;
  }, 0);

  const totalInvested =
    stakeholder.safes.reduce((s, safe) => s + safe.investmentAmount, 0) +
    stakeholder.convertibleNotes.reduce((s, note) => s + note.principalAmount, 0);

  const outstandingSafes = stakeholder.safes.filter((s) => s.status === "outstanding").length;
  const outstandingNotes = stakeholder.convertibleNotes.filter((n) => n.status === "outstanding").length;

  const activeGrants = stakeholder.equityGrants.filter((g) => g.status === "active");
  const isoCount = stakeholder.equityGrants.filter((g) => g.type === "iso").length;
  const nsoCount = stakeholder.equityGrants.filter((g) => g.type === "nso").length;

  const lastGrantDate =
    stakeholder.equityGrants.length > 0
      ? stakeholder.equityGrants.reduce(
          (latest, g) => (g.grantDate > latest ? g.grantDate : latest),
          stakeholder.equityGrants[0].grantDate
        )
      : null;

  const tenureMonths = stakeholder.startDate
    ? differenceInMonths(new Date(), stakeholder.startDate)
    : null;

  return {
    votingShares,
    totalUnvested,
    totalInvested,
    outstandingSafes,
    outstandingNotes,
    activeGrants: activeGrants.length,
    isoCount,
    nsoCount,
    lastGrantDate,
    tenureMonths,
    documentCount,
  };
}

export function formatTenure(months: number | null): string {
  if (months === null) return "—";
  if (months < 1) return "< 1 month";
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${months} mo`;
  if (rem === 0) return `${years} yr`;
  return `${years} yr ${rem} mo`;
}

export function formatDaysRemaining(days: number | null): string {
  if (days === null) return "—";
  if (days < 0) return "Expired";
  if (days === 0) return "Today";
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)} mo`;
  return `${(days / 365).toFixed(1)} yr`;
}
