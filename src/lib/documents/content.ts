import type { GrantDocumentData, OptionDocumentType } from "./types";
import {
  formatLongDate,
  formatShares,
  formatMoney,
  vestingDescription,
  isISO,
  optionLabel,
  optionLabelShort,
} from "./docx-helpers";

export interface DocumentSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface DocumentContent {
  title: string;
  subtitle?: string;
  table: { label: string; value: string }[];
  sections: DocumentSection[];
  disclaimer: string;
}

export function buildDocumentContent(data: GrantDocumentData, type: OptionDocumentType): DocumentContent {
  switch (type) {
    case "agreement":
      return buildAgreementContent(data);
    case "notice":
      return buildNoticeContent(data);
    case "board_consent":
      return buildBoardConsentContent(data);
  }
}

function buildAgreementContent(data: GrantDocumentData): DocumentContent {
  const { company, grant, stakeholder } = data;
  const legalName = company.legalName || company.name;
  const state = company.state || "Delaware";
  const strike = grant.strikePrice ?? 0;
  const iso = isISO(grant.type);

  return {
    title: `${optionLabel(grant.type).toUpperCase()} AGREEMENT`,
    subtitle: `${legalName}, a ${state} corporation`,
    table: [
      { label: "Optionee", value: stakeholder.name },
      { label: "Grant Date", value: formatLongDate(grant.grantDate) },
      { label: "Number of Shares", value: formatShares(grant.sharesGranted) },
      { label: "Exercise Price", value: formatMoney(strike) },
      { label: "Type of Option", value: optionLabelShort(grant.type) },
      {
        label: "Expiration Date",
        value: grant.expirationDate
          ? formatLongDate(grant.expirationDate)
          : "10th anniversary of Grant Date",
      },
    ],
    sections: [
      {
        heading: "1. Grant of Option",
        paragraphs: [
          `The Company grants the Optionee an option to purchase ${formatShares(grant.sharesGranted)} shares of ${grant.shareClassName} at ${formatMoney(strike)} per share.`,
          iso
            ? "The Option is intended to qualify as an Incentive Stock Option under Section 422 of the Code."
            : "The Option is a Non-Qualified Stock Option and is not intended to qualify as an ISO.",
        ],
      },
      {
        heading: "2. Vesting",
        paragraphs: [vestingDescription(data)],
      },
      {
        heading: "3. Exercise of Option",
        paragraphs: [
          "The Option may be exercised by delivery of written notice and payment of the aggregate Exercise Price.",
        ],
        bullets: [
          "Cash or check payable to the Company",
          "Cashless exercise pursuant to an approved program",
          "Net exercise, if permitted by the Administrator",
        ],
      },
      {
        heading: "4. Termination of Continuous Service",
        paragraphs: [
          "Upon termination, the Optionee may exercise vested shares for 90 days (or 12 months for death/disability), subject to expiration of the Option. Unvested shares are forfeited.",
        ],
      },
      {
        heading: "5. Non-Transferability",
        paragraphs: [
          "The Option may not be transferred except by will or laws of descent and distribution.",
        ],
      },
      {
        heading: "6. Tax Matters",
        paragraphs: [
          iso
            ? "ISO tax treatment may apply. Consult a tax advisor regarding AMT and the $100,000 annual ISO limit."
            : "Ordinary income is recognized upon exercise equal to the spread. The Company may withhold taxes.",
          "THE OPTIONEE IS ADVISED TO CONSULT WITH A TAX ADVISOR BEFORE EXERCISING THIS OPTION.",
        ],
      },
      {
        heading: "7. Corporate Transactions",
        paragraphs: [
          "In a Corporate Transaction, the Administrator may continue, assume, substitute, accelerate, or cancel the Option without Optionee consent.",
        ],
      },
      {
        heading: "8. Governing Law",
        paragraphs: [
          `This Agreement is governed by the laws of the State of ${state}. This Agreement, together with the Plan, constitutes the entire agreement between the parties.`,
        ],
      },
      {
        heading: "Signatures",
        paragraphs: [
          `COMPANY: ${legalName}`,
          "By: _________________________________",
          `OPTIONEE: ${stakeholder.name}`,
          "Date: _________________________________",
        ],
      },
    ],
    disclaimer:
      "DISCLAIMER: Generated from a standard template for informational purposes. Consult qualified counsel before execution.",
  };
}

function buildNoticeContent(data: GrantDocumentData): DocumentContent {
  const { company, grant, stakeholder } = data;
  const legalName = company.legalName || company.name;
  const strike = grant.strikePrice ?? 0;

  return {
    title: "NOTICE OF STOCK OPTION GRANT",
    subtitle: legalName,
    table: [
      { label: "Optionee", value: stakeholder.name },
      { label: "Grant Date", value: formatLongDate(grant.grantDate) },
      { label: "Option Type", value: `${optionLabelShort(grant.type)} (${optionLabel(grant.type)})` },
      { label: "Shares", value: formatShares(grant.sharesGranted) },
      { label: "Exercise Price", value: formatMoney(strike) },
      { label: "Total Exercise Price", value: formatMoney(strike * grant.sharesGranted) },
    ],
    sections: [
      {
        paragraphs: [
          `Dear ${stakeholder.name},`,
          `The Board has approved a stock option grant to you under the Company's Equity Incentive Plan, subject to the attached ${optionLabel(grant.type)} Agreement.`,
        ],
      },
      {
        heading: "Vesting Schedule",
        paragraphs: [vestingDescription(data)],
      },
      {
        heading: "Important Information",
        bullets: [
          "Accept by signing the Option Agreement within 30 days.",
          "Exercise Price reflects the most recent 409A Fair Market Value.",
          isISO(grant.type)
            ? "ISOs receive favorable tax treatment if holding requirements are met."
            : "NSOs are taxed as ordinary income on the spread at exercise.",
          "90-day post-termination exercise window applies unless otherwise agreed.",
        ],
      },
      {
        heading: "Acknowledgment",
        paragraphs: [
          `Acknowledged and Accepted: ${stakeholder.name}`,
          "Date: _________________________________",
        ],
      },
    ],
    disclaimer: "Consult qualified legal and tax counsel before signing.",
  };
}

function buildBoardConsentContent(data: GrantDocumentData): DocumentContent {
  const { company, grant, stakeholder } = data;
  const legalName = company.legalName || company.name;
  const state = company.state || "Delaware";
  const strike = grant.strikePrice ?? 0;
  const approvalDate = grant.boardApprovalDate || grant.grantDate;

  return {
    title: "ACTION BY UNANIMOUS WRITTEN CONSENT",
    subtitle: `OF THE BOARD OF DIRECTORS OF ${legalName.toUpperCase()}`,
    table: [
      { label: "Optionee", value: stakeholder.name },
      { label: "Type", value: `${optionLabelShort(grant.type)} (${optionLabel(grant.type)})` },
      { label: "Shares", value: formatShares(grant.sharesGranted) },
      { label: "Exercise Price", value: formatMoney(strike) },
      { label: "Grant Date", value: formatLongDate(grant.grantDate) },
      { label: "Effective Date", value: formatLongDate(approvalDate) },
    ],
    sections: [
      {
        paragraphs: [
          `The undersigned directors of ${legalName}, a ${state} corporation, adopt the following resolutions by unanimous written consent effective ${formatLongDate(approvalDate)}.`,
        ],
      },
      {
        heading: "Option Grant Approval",
        paragraphs: [
          `RESOLVED, that the Company grant a ${optionLabel(grant.type)} to ${stakeholder.name} for ${formatShares(grant.sharesGranted)} shares of ${grant.shareClassName} at ${formatMoney(strike)} per share.`,
          `Vesting: ${vestingDescription(data)}`,
          "RESOLVED FURTHER, that the Option be evidenced by a Stock Option Agreement and entered on the Company's capitalization table.",
          "RESOLVED FURTHER, that officers are authorized to execute all documents necessary to effectuate these resolutions.",
        ],
      },
      {
        heading: "Director Signatures",
        paragraphs: ["Director: _________________________________", "Director: _________________________________", "Director: _________________________________"],
      },
    ],
    disclaimer: "Consult qualified legal counsel before execution.",
  };
}
