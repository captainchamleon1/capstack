import { Document, Packer, HeadingLevel } from "docx";
import type { GrantDocumentData } from "./types";
import {
  docTitle,
  docHeading,
  docParagraph,
  docBlank,
  docSignatureBlock,
  docKeyValueTable,
  docBullet,
  formatLongDate,
  formatShares,
  formatMoney,
  vestingDescription,
  isISO,
  optionLabel,
  optionLabelShort,
} from "./docx-helpers";

export function buildNoticeOfGrant(data: GrantDocumentData): Document {
  const { company, grant, stakeholder } = data;
  const legalName = company.legalName || company.name;
  const strike = grant.strikePrice ?? 0;

  const children = [
    docParagraph(legalName, { bold: true }),
    docParagraph(formatLongDate(grant.grantDate)),
    docBlank(),
    docParagraph(`Dear ${stakeholder.name},`),
    docBlank(),
    docParagraph(
      `We are pleased to inform you that the Board of Directors of ${legalName} (the "Company") has approved the grant of a stock option to you under the Company's Equity Incentive Plan (the "Plan"), subject to the terms and conditions set forth in the attached ${optionLabel(grant.type)} Agreement.`
    ),

    docHeading("Grant Summary", HeadingLevel.HEADING_2),
    docKeyValueTable([
      { label: "Optionee", value: stakeholder.name },
      { label: "Employee ID / Title", value: stakeholder.title || "—" },
      { label: "Grant Date", value: formatLongDate(grant.grantDate) },
      { label: "Option Type", value: `${optionLabelShort(grant.type)} (${optionLabel(grant.type)})` },
      { label: "Shares Subject to Option", value: formatShares(grant.sharesGranted) },
      { label: "Exercise Price Per Share", value: formatMoney(strike) },
      { label: "Total Exercise Price", value: formatMoney(strike * grant.sharesGranted) },
      { label: "Vesting Commencement", value: data.vesting ? formatLongDate(data.vesting.startDate) : formatLongDate(grant.grantDate) },
      {
        label: "Expiration",
        value: grant.expirationDate ? formatLongDate(grant.expirationDate) : "10 years from Grant Date",
      },
    ]),

    docBlank(),
    docHeading("Vesting Schedule"),
    docParagraph(vestingDescription(data)),

    docBlank(),
    docHeading("Important Information"),
    docBullet("This option grant must be accepted by signing and returning the Option Agreement within thirty (30) days."),
    docBullet("The Exercise Price equals the Fair Market Value per share as determined by the Board based on the most recent 409A valuation."),
    docBullet("You must be an employee (for ISOs) or service provider of the Company at the time of grant and exercise."),
    ...(isISO(grant.type)
      ? [
          docBullet(
            "ISOs receive favorable tax treatment if you hold shares for at least 2 years from grant and 1 year from exercise. Consult your tax advisor."
          ),
          docBullet(
            "If the value of ISOs vesting in a calendar year exceeds $100,000, the excess automatically converts to NSO treatment."
          ),
        ]
      : [
          docBullet(
            "NSOs are taxed as ordinary income on the spread at exercise. The Company will report this on your Form W-2 or 1099."
          ),
        ]),
    docBullet("Upon termination, you generally have 90 days to exercise vested options (unless otherwise agreed in writing)."),
    docBullet("If early exercise is permitted, you must file an 83(b) election within 30 days of exercise."),

    docBlank(),
    docParagraph(
      "Please review the attached Option Agreement carefully. By signing below, you acknowledge receipt of this Notice and the Option Agreement, and agree to be bound by their terms."
    ),

    ...docSignatureBlock("Acknowledged and Accepted:", stakeholder.name),

    docBlank(),
    docParagraph(
      "DISCLAIMER: This notice is generated from a standard template. Consult qualified legal and tax counsel before signing.",
      { italic: true }
    ),
  ];

  return new Document({
    sections: [{ children }],
  });
}

export async function generateNoticeOfGrantBuffer(data: GrantDocumentData): Promise<Buffer> {
  const doc = buildNoticeOfGrant(data);
  return Buffer.from(await Packer.toBuffer(doc));
}
