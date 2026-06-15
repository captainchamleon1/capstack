import { prisma } from "@/lib/prisma";
import {
  buildCapTable,
  modelFundraise,
  modelNoteConversion,
  modelSafeConversion,
} from "@/lib/cap-table";

export interface CloseRoundInput {
  companyId: string;
  name: string;
  type: string;
  preMoneyValuation: number;
  investmentAmount: number;
  optionPoolTarget: number;
  investorStakeholderId: string;
  closeDate?: Date;
  convertSafes?: boolean;
  convertNotes?: boolean;
  liquidationPref?: number;
}

export class CloseRoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CloseRoundError";
  }
}

function preferredShareClassName(name: string): string {
  return name.toLowerCase().includes("preferred") ? name : `${name} Preferred`;
}

export async function closeFundraiseRound(input: CloseRoundInput) {
  const company = await prisma.company.findUnique({
    where: { id: input.companyId },
    include: {
      shareClasses: true,
      stakeholders: true,
      equityGrants: {
        include: {
          stakeholder: true,
          shareClass: true,
          vestingSchedule: true,
        },
      },
      safes: { include: { stakeholder: true } },
      convertibleNotes: { include: { stakeholder: true } },
    },
  });

  if (!company) throw new CloseRoundError("Company not found");

  const investor = company.stakeholders.find((s) => s.id === input.investorStakeholderId);
  if (!investor) throw new CloseRoundError("Lead investor stakeholder not found");

  const shareClassName = preferredShareClassName(input.name);
  if (company.shareClasses.some((sc) => sc.name === shareClassName)) {
    throw new CloseRoundError(`Share class "${shareClassName}" already exists`);
  }

  const capTable = buildCapTable({
    authorizedShares: company.authorizedShares,
    shareClasses: company.shareClasses,
    equityGrants: company.equityGrants,
    safes: company.safes,
  });

  const founderIds = company.stakeholders.filter((s) => s.type === "founder").map((s) => s.id);
  const scenario = modelFundraise(
    capTable,
    input.preMoneyValuation,
    input.investmentAmount,
    input.optionPoolTarget,
    founderIds
  );

  const closeDate = input.closeDate ?? new Date();
  const postMoney = scenario.postMoneyValuation;
  const pricePerShare = scenario.pricePerShare;
  const maxSeniority = company.shareClasses.reduce((max, sc) => Math.max(max, sc.seniority), 0);

  const safeConversions =
    input.convertSafes !== false
      ? modelSafeConversion(
          company.safes.map((s) => ({
            id: s.id,
            status: s.status,
            investmentAmount: s.investmentAmount,
            valuationCap: s.valuationCap,
            discountRate: s.discountRate,
            type: s.type,
            stakeholder: { id: s.stakeholderId, name: s.stakeholder.name },
          })),
          postMoney,
          pricePerShare
        )
      : [];

  const noteConversions =
    input.convertNotes !== false
      ? modelNoteConversion(
          company.convertibleNotes.map((n) => ({
            id: n.id,
            status: n.status,
            principalAmount: n.principalAmount,
            interestRate: n.interestRate,
            valuationCap: n.valuationCap,
            discountRate: n.discountRate,
            issueDate: n.issueDate,
            stakeholder: { id: n.stakeholderId, name: n.stakeholder.name },
          })),
          postMoney,
          pricePerShare,
          closeDate
        )
      : [];

  return prisma.$transaction(async (tx) => {
    const shareClass = await tx.shareClass.create({
      data: {
        companyId: input.companyId,
        name: shareClassName,
        type: input.type,
        votesPerShare: 1,
        liquidationPref: input.liquidationPref ?? 1,
        isParticipating: false,
        seniority: maxSeniority + 1,
      },
    });

    const roundGrant = await tx.equityGrant.create({
      data: {
        companyId: input.companyId,
        stakeholderId: input.investorStakeholderId,
        shareClassId: shareClass.id,
        type: "preferred_stock",
        sharesGranted: scenario.newShares,
        sharesExercised: scenario.newShares,
        strikePrice: pricePerShare,
        grantDate: closeDate,
        boardApprovalDate: closeDate,
        notes: `${input.name} round investment`,
      },
    });

    if (scenario.optionPoolShares > 0) {
      const poolReservation = await tx.equityGrant.findFirst({
        where: {
          companyId: input.companyId,
          type: "pool_reservation",
          status: { notIn: ["cancelled", "expired"] },
        },
      });

      if (poolReservation) {
        await tx.equityGrant.update({
          where: { id: poolReservation.id },
          data: { sharesGranted: poolReservation.sharesGranted + scenario.optionPoolShares },
        });
      } else {
        const optionPool = company.shareClasses.find((sc) => sc.type === "option_pool");
        const founder = company.stakeholders.find((s) => s.type === "founder");
        if (optionPool && founder) {
          await tx.equityGrant.create({
            data: {
              companyId: input.companyId,
              stakeholderId: founder.id,
              shareClassId: optionPool.id,
              type: "pool_reservation",
              sharesGranted: scenario.optionPoolShares,
              grantDate: closeDate,
              boardApprovalDate: closeDate,
            },
          });
        }
      }
    }

    const conversionGrants = [];

    for (const conv of safeConversions) {
      if (!conv.instrumentId || !conv.stakeholderId) continue;

      const grant = await tx.equityGrant.create({
        data: {
          companyId: input.companyId,
          stakeholderId: conv.stakeholderId,
          shareClassId: shareClass.id,
          type: "preferred_stock",
          sharesGranted: conv.shares,
          sharesExercised: conv.shares,
          strikePrice: pricePerShare,
          grantDate: closeDate,
          boardApprovalDate: closeDate,
          notes: `SAFE conversion (${conv.conversionMethod})`,
        },
      });

      await tx.safe.update({
        where: { id: conv.instrumentId },
        data: {
          status: "converted",
          conversionDate: closeDate,
          convertedShares: conv.shares,
          shareClassId: shareClass.id,
        },
      });

      conversionGrants.push(grant);
    }

    for (const conv of noteConversions) {
      if (!conv.instrumentId || !conv.stakeholderId) continue;

      const grant = await tx.equityGrant.create({
        data: {
          companyId: input.companyId,
          stakeholderId: conv.stakeholderId,
          shareClassId: shareClass.id,
          type: "preferred_stock",
          sharesGranted: conv.shares,
          sharesExercised: conv.shares,
          strikePrice: pricePerShare,
          grantDate: closeDate,
          boardApprovalDate: closeDate,
          notes: `Note conversion (${conv.conversionMethod})`,
        },
      });

      await tx.convertibleNote.update({
        where: { id: conv.instrumentId },
        data: {
          status: "converted",
          conversionDate: closeDate,
          convertedShares: conv.shares,
        },
      });

      conversionGrants.push(grant);
    }

    const fundraiseRound = await tx.fundraiseRound.create({
      data: {
        companyId: input.companyId,
        name: input.name,
        type: input.type,
        status: "closed",
        preMoneyValuation: input.preMoneyValuation,
        investmentAmount: input.investmentAmount,
        pricePerShare,
        newShares: scenario.newShares,
        optionPoolIncrease: input.optionPoolTarget,
        closeDate,
        notes: `Converted ${safeConversions.length} SAFE(s) and ${noteConversions.length} note(s)`,
      },
    });

    await tx.company.update({
      where: { id: input.companyId },
      data: {
        currentFmv409A: pricePerShare,
        fmv409AEffectiveDate: closeDate,
      },
    });

    return {
      fundraiseRound,
      shareClass,
      roundGrant,
      conversionGrants,
      safeConversions,
      noteConversions,
      scenario,
    };
  });
}
