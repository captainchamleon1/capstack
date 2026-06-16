import "dotenv/config";
import { createPrismaClient } from "../src/lib/create-prisma-client";
import { issueSecurityDocuments } from "../src/lib/documents/issue";
import bcrypt from "bcryptjs";

const prisma = createPrismaClient();

async function main() {
  await prisma.auditEvent.deleteMany();
  await prisma.companyInvite.deleteMany();
  await prisma.document.deleteMany();
  await prisma.boardResolution.deleteMany();
  await prisma.fundraiseRound.deleteMany();
  await prisma.convertibleNote.deleteMany();
  await prisma.safe.deleteMany();
  await prisma.vestingSchedule.deleteMany();
  await prisma.equityGrant.deleteMany();
  await prisma.stakeholder.deleteMany();
  await prisma.shareClass.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  const company = await prisma.company.create({
    data: {
      name: "Acme Robotics",
      legalName: "Acme Robotics, Inc.",
      incorporationDate: new Date("2022-03-15"),
      state: "Delaware",
      authorizedShares: 15000000,
      parValue: 0.00001,
      currentFmv409A: 0.55,
      fmv409AEffectiveDate: new Date("2024-01-01"),
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: "demo@acmerobotics.com",
      name: "Demo User",
      passwordHash: await bcrypt.hash("demo12345", 12),
    },
  });

  const analystUser = await prisma.user.create({
    data: {
      email: "analyst@equitr.com",
      name: "Equitr Analyst",
      passwordHash: await bcrypt.hash("analyst12345", 12),
      isAnalyst: true,
    },
  });
  void analystUser;

  await prisma.membership.create({
    data: { userId: demoUser.id, companyId: company.id, role: "owner" },
  });

  const common = await prisma.shareClass.create({
    data: { companyId: company.id, name: "Common Stock", type: "common", votesPerShare: 1 },
  });
  const optionPool = await prisma.shareClass.create({
    data: { companyId: company.id, name: "Option Pool", type: "option_pool", votesPerShare: 0 },
  });
  const seriesA = await prisma.shareClass.create({
    data: {
      companyId: company.id,
      name: "Series A Preferred",
      type: "series_a",
      votesPerShare: 1,
      liquidationPref: 1,
      isParticipating: false,
      seniority: 1,
    },
  });

  const alex = await prisma.stakeholder.create({
    data: { companyId: company.id, name: "Alex Chen", email: "alex@acmerobotics.com", type: "founder", title: "CEO", startDate: new Date("2022-03-15") },
  });
  const jordan = await prisma.stakeholder.create({
    data: { companyId: company.id, name: "Jordan Park", email: "jordan@acmerobotics.com", type: "founder", title: "CTO", startDate: new Date("2022-03-15") },
  });
  const sam = await prisma.stakeholder.create({
    data: { companyId: company.id, name: "Sam Rivera", email: "sam@acmerobotics.com", type: "employee", relationship: "employee", title: "VP Engineering", department: "Engineering", startDate: new Date("2023-01-10") },
  });
  const taylor = await prisma.stakeholder.create({
    data: { companyId: company.id, name: "Taylor Kim", email: "taylor@acmerobotics.com", type: "employee", relationship: "employee", title: "Head of Product", department: "Product", startDate: new Date("2023-06-01") },
  });
  const morgan = await prisma.stakeholder.create({
    data: { companyId: company.id, name: "Morgan Blake", email: "morgan@acmerobotics.com", type: "advisor", relationship: "contractor", title: "Advisor", startDate: new Date("2023-03-01") },
  });
  const sequoia = await prisma.stakeholder.create({
    data: { companyId: company.id, name: "Sequoia Capital", email: "partner@sequoia.com", type: "investor" },
  });
  const a16z = await prisma.stakeholder.create({
    data: { companyId: company.id, name: "Andreessen Horowitz", email: "partner@a16z.com", type: "investor" },
  });
  const angel1 = await prisma.stakeholder.create({
    data: { companyId: company.id, name: "Chris Nakamura", email: "chris@example.com", type: "investor" },
  });

  const founderGrants = [
    { stakeholder: alex, shares: 3500000 },
    { stakeholder: jordan, shares: 3000000 },
  ];

  for (const fg of founderGrants) {
    const grant = await prisma.equityGrant.create({
      data: {
        companyId: company.id,
        stakeholderId: fg.stakeholder.id,
        shareClassId: common.id,
        type: "common_stock",
        sharesGranted: fg.shares,
        sharesExercised: fg.shares,
        grantDate: new Date("2022-03-15"),
        boardApprovalDate: new Date("2022-03-15"),
      },
    });
    await issueSecurityDocuments(grant.id, {
      status: "signed",
      signedAt: new Date("2022-03-15"),
    });
  }

  await prisma.equityGrant.create({
    data: {
      companyId: company.id,
      stakeholderId: alex.id,
      shareClassId: optionPool.id,
      type: "pool_reservation",
      sharesGranted: 2000000,
      grantDate: new Date("2022-03-15"),
      boardApprovalDate: new Date("2022-03-15"),
    },
  });

  const employeeGrants = [
    { stakeholder: sam, shares: 150000, strike: 0.42, start: "2023-01-10" },
    { stakeholder: taylor, shares: 100000, strike: 0.55, start: "2023-06-01" },
    { stakeholder: morgan, shares: 25000, strike: 0.30, start: "2023-03-01" },
  ];

  for (const eg of employeeGrants) {
    const grant = await prisma.equityGrant.create({
      data: {
        companyId: company.id,
        stakeholderId: eg.stakeholder.id,
        shareClassId: optionPool.id,
        type: eg.stakeholder.type === "advisor" ? "nso" : "iso",
        sharesGranted: eg.shares,
        strikePrice: eg.strike,
        grantDate: new Date(eg.start),
        boardApprovalDate: new Date(eg.start),
        expirationDate: new Date(new Date(eg.start).getFullYear() + 10, new Date(eg.start).getMonth(), new Date(eg.start).getDate()),
      },
    });
    await prisma.vestingSchedule.create({
      data: {
        equityGrantId: grant.id,
        cliffMonths: eg.stakeholder.type === "advisor" ? 0 : 12,
        vestingMonths: eg.stakeholder.type === "advisor" ? 24 : 48,
        startDate: new Date(eg.start),
      },
    });
    await issueSecurityDocuments(grant.id, {
      status: "signed",
      signedAt: new Date(eg.start),
    });
  }

  const seriesAGrant = await prisma.equityGrant.create({
    data: {
      companyId: company.id,
      stakeholderId: sequoia.id,
      shareClassId: seriesA.id,
      type: "preferred_stock",
      sharesGranted: 1200000,
      sharesExercised: 1200000,
      grantDate: new Date("2024-06-15"),
      boardApprovalDate: new Date("2024-06-15"),
    },
  });
  await issueSecurityDocuments(seriesAGrant.id, {
    status: "signed",
    signedAt: new Date("2024-06-15"),
  });

  await prisma.safe.create({
    data: {
      companyId: company.id,
      stakeholderId: a16z.id,
      type: "valuation_cap",
      investmentAmount: 500000,
      valuationCap: 12000000,
      proRata: true,
      issueDate: new Date("2023-09-01"),
    },
  });

  await prisma.safe.create({
    data: {
      companyId: company.id,
      stakeholderId: angel1.id,
      type: "cap_and_discount",
      investmentAmount: 100000,
      valuationCap: 8000000,
      discountRate: 0.20,
      issueDate: new Date("2023-11-15"),
    },
  });

  await prisma.convertibleNote.create({
    data: {
      companyId: company.id,
      stakeholderId: angel1.id,
      principalAmount: 50000,
      interestRate: 0.05,
      valuationCap: 10000000,
      discountRate: 0.15,
      issueDate: new Date("2023-04-01"),
      maturityDate: new Date("2025-04-01"),
    },
  });

  await prisma.fundraiseRound.create({
    data: {
      companyId: company.id,
      name: "Series A",
      type: "series_a",
      status: "closed",
      preMoneyValuation: 18000000,
      investmentAmount: 5000000,
      pricePerShare: 4.17,
      newShares: 1200000,
      optionPoolIncrease: 0.05,
      closeDate: new Date("2024-06-15"),
    },
  });

  await prisma.fundraiseRound.create({
    data: {
      companyId: company.id,
      name: "Series B (Planned)",
      type: "series_b",
      status: "planned",
      preMoneyValuation: 50000000,
      investmentAmount: 15000000,
      optionPoolIncrease: 0.10,
    },
  });

  await prisma.boardResolution.create({
    data: {
      companyId: company.id,
      title: "Approve 2024 Option Pool Increase",
      type: "option_pool",
      status: "approved",
      description: "Increase option pool by 5% to support hiring plan",
      meetingDate: new Date("2024-05-01"),
      approvedAt: new Date("2024-05-01"),
    },
  });

  await prisma.boardResolution.create({
    data: {
      companyId: company.id,
      title: "Series A Financing Approval",
      type: "fundraise",
      status: "approved",
      description: "Authorize Series A preferred stock issuance",
      meetingDate: new Date("2024-06-10"),
      approvedAt: new Date("2024-06-10"),
    },
  });

  await prisma.boardResolution.create({
    data: {
      companyId: company.id,
      title: "Q1 2025 Option Grants",
      type: "grant_approval",
      status: "pending",
      description: "Approve option grants for 3 new engineering hires",
      meetingDate: new Date("2025-01-15"),
    },
  });

  await prisma.document.createMany({
    data: [
      { companyId: company.id, name: "Series A Stock Purchase Agreement", type: "stock_purchase", status: "signed", signedAt: new Date("2024-06-15") },
      { companyId: company.id, name: "a16z SAFE Agreement", type: "safe", status: "signed", signedAt: new Date("2023-09-01") },
      { companyId: company.id, name: "Board Consent - Option Pool Increase", type: "board_consent", status: "signed", signedAt: new Date("2024-05-01") },
    ],
  });

  await prisma.auditEvent.createMany({
    data: [
      {
        companyId: company.id,
        userId: demoUser.id,
        action: "grant.created",
        entityType: "grant",
        summary: "Granted 150,000 ISO options to Sam Rivera",
        createdAt: new Date("2023-01-10T16:00:00"),
      },
      {
        companyId: company.id,
        userId: demoUser.id,
        action: "safe.created",
        entityType: "safe",
        summary: "Recorded $500,000 SAFE from Andreessen Horowitz",
        createdAt: new Date("2023-09-01T11:30:00"),
      },
      {
        companyId: company.id,
        userId: demoUser.id,
        action: "board_resolution.updated",
        entityType: "board_resolution",
        summary: "Approved board resolution: Approve 2024 Option Pool Increase",
        createdAt: new Date("2024-05-01T14:00:00"),
      },
      {
        companyId: company.id,
        userId: demoUser.id,
        action: "round.closed",
        entityType: "fundraise_round",
        summary: "Closed Series A round ($5M at $18M pre-money)",
        createdAt: new Date("2024-06-15T17:45:00"),
      },
      {
        companyId: company.id,
        userId: demoUser.id,
        action: "document.signed",
        entityType: "document",
        summary: 'Marked "Series A Stock Purchase Agreement" as signed',
        createdAt: new Date("2024-06-15T18:00:00"),
      },
      {
        companyId: company.id,
        userId: demoUser.id,
        action: "company.updated",
        entityType: "company",
        summary: "Updated 409A fair market value to $0.55",
        createdAt: new Date("2024-12-01T10:00:00"),
      },
      {
        companyId: company.id,
        userId: demoUser.id,
        action: "board_resolution.created",
        entityType: "board_resolution",
        summary: "Created board resolution: Q1 2025 Option Grants",
        createdAt: new Date("2025-01-02T09:15:00"),
      },
    ],
  });

  console.log("Seed complete:", company.name);
  console.log("Demo login: demo@acmerobotics.com / demo12345");
  console.log("Analyst login: analyst@equitr.com / analyst12345");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
