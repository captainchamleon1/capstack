import { Document, Packer, Paragraph } from "docx";
import type { GrantDocumentData } from "./types";
import {
  docTitle,
  docHeading,
  docParagraph,
  docBullet,
  docBlank,
  docSignatureBlock,
  docKeyValueTable,
  formatLongDate,
  formatShares,
  formatMoney,
  vestingDescription,
  isISO,
  optionLabel,
  optionLabelShort,
} from "./docx-helpers";

export function buildOptionAgreement(data: GrantDocumentData): Document {
  const { company, grant, stakeholder } = data;
  const legalName = company.legalName || company.name;
  const state = company.state || "Delaware";
  const strike = grant.strikePrice ?? 0;
  const expiration = grant.expirationDate
    ? formatLongDate(grant.expirationDate)
    : "the tenth (10th) anniversary of the Grant Date";
  const iso = isISO(grant.type);

  const children: (Paragraph | ReturnType<typeof docKeyValueTable>)[] = [
    docTitle(`${optionLabel(grant.type).toUpperCase()} AGREEMENT`),
    docParagraph(legalName, { bold: true, spacingAfter: 80 }),
    docParagraph(`A ${state} corporation`, { italic: true, spacingAfter: 300 }),

    docKeyValueTable([
      { label: "Optionee", value: stakeholder.name },
      { label: "Grant Date", value: formatLongDate(grant.grantDate) },
      { label: "Number of Shares", value: formatShares(grant.sharesGranted) },
      { label: "Exercise Price", value: formatMoney(strike) },
      { label: "Type of Option", value: optionLabelShort(grant.type) },
      { label: "Expiration Date", value: expiration },
    ]),

    docBlank(),
    docParagraph(
      `This ${optionLabel(grant.type)} Agreement (this "Agreement") is entered into as of ${formatLongDate(grant.grantDate)} by and between ${legalName}, a ${state} corporation (the "Company"), and ${stakeholder.name} (the "Optionee").`
    ),
    docParagraph(
      'This Agreement evidences a stock option granted by the Company to the Optionee under the Company\'s Equity Incentive Plan (the "Plan"). Capitalized terms not defined herein have the meanings set forth in the Plan.'
    ),

    docHeading("1. Grant of Option"),
    docParagraph(
      `Subject to the terms and conditions of this Agreement and the Plan, the Company hereby grants to the Optionee an option (the "Option") to purchase ${formatShares(grant.sharesGranted)} shares (the "Option Shares") of the Company's ${grant.shareClassName} at an exercise price of ${formatMoney(strike)} per share (the "Exercise Price").`
    ),
    docParagraph(
      iso
        ? "The Option is intended to qualify as an Incentive Stock Option under Section 422 of the Internal Revenue Code of 1986, as amended (the \"Code\"), but the Company makes no representation or warranty that the Option will qualify as an ISO. To the extent the Option does not qualify as an ISO, it shall be treated as a Non-Qualified Stock Option."
        : "The Option is a Non-Qualified Stock Option and is not intended to qualify as an Incentive Stock Option under Section 422 of the Code."
    ),

    docHeading("2. Vesting"),
    docParagraph(vestingDescription(data)),
    docParagraph(
      "Notwithstanding the foregoing, upon a Change in Control (as defined in the Plan), unvested Option Shares may accelerate in accordance with the Plan and any applicable acceleration provisions set forth in a separate agreement between the Optionee and the Company."
    ),
    ...(data.vesting?.accelerationType
      ? [
          docParagraph(
            `Acceleration: This grant is subject to ${data.vesting.accelerationType.replace(/_/g, "-")} acceleration as described in the Plan.`
          ),
        ]
      : []),

    docHeading("3. Exercise of Option"),
    docParagraph(
      "The Option may be exercised, in whole or in part, by delivery to the Company of a written notice of exercise in the form prescribed by the Company, together with payment of the aggregate Exercise Price for the shares being purchased."
    ),
    docParagraph("Payment may be made by any of the following methods (as approved by the Administrator):"),
    docBullet("Cash or check payable to the Company;"),
    docBullet("Cashless exercise pursuant to a program approved by the Administrator;"),
    docBullet("Net exercise, if permitted by the Administrator; or"),
    docBullet("Such other method as the Administrator may approve."),

    docHeading("4. Termination of Continuous Service"),
    docParagraph(
      "If the Optionee's Continuous Service terminates for any reason except death or Disability, the Optionee may exercise the vested portion of the Option for a period of ninety (90) days following the date of termination (or such longer period as may be approved by the Board and set forth in a separate written agreement), but in no event later than the expiration of the Option."
    ),
    docParagraph(
      "Upon termination due to death or Disability, the Optionee (or the Optionee's estate or beneficiary) may exercise the vested portion of the Option for a period of twelve (12) months following the date of termination, subject to the expiration of the Option."
    ),
    docParagraph(
      "Any unvested Option Shares shall be forfeited immediately upon termination of Continuous Service for any reason."
    ),

    docHeading("5. Non-Transferability"),
    docParagraph(
      "The Option may not be sold, assigned, transferred, pledged, hypothecated, or otherwise disposed of, except by will or the laws of descent and distribution. During the Optionee's lifetime, the Option is exercisable only by the Optionee."
    ),

    docHeading("6. No Right to Continued Service"),
    docParagraph(
      "Nothing in this Agreement or the Plan confers upon the Optionee any right to continue in the employ or service of the Company or any subsidiary, or interferes with the Company's right to terminate the Optionee's employment or service at any time, with or without cause."
    ),

    docHeading("7. Tax Matters"),
    ...(iso
      ? [
          docParagraph(
            "If the Option qualifies as an ISO, the Optionee will not recognize taxable income upon grant or exercise (except for purposes of the alternative minimum tax). Upon a disposition of the shares, the Optionee may recognize capital gain or loss. The Optionee should consult with a tax advisor regarding ISO tax treatment."
          ),
          docParagraph(
            "If the aggregate Fair Market Value of shares subject to ISOs that become exercisable for the first time during any calendar year exceeds $100,000, the portion of the Option in excess of such amount shall be treated as a Non-Qualified Stock Option."
          ),
        ]
      : [
          docParagraph(
            "The Optionee will recognize ordinary income upon exercise equal to the excess of the Fair Market Value of the shares on the date of exercise over the Exercise Price. The Company may be required to withhold taxes and may require the Optionee to remit an amount sufficient to satisfy withholding obligations."
          ),
        ]),
    docParagraph(
      "THE OPTIONEE IS ADVISED TO CONSULT WITH A TAX ADVISOR BEFORE EXERCISING THIS OPTION OR DISPOSING OF ANY SHARES."
    ),

    docHeading("8. Adjustments"),
    docParagraph(
      "In the event of any stock split, reverse stock split, stock dividend, recapitalization, reorganization, merger, consolidation, or similar transaction, the number of Option Shares and the Exercise Price shall be adjusted as provided in the Plan."
    ),

    docHeading("9. Corporate Transactions"),
    docParagraph(
      "In the event of a Corporate Transaction (as defined in the Plan), the Administrator may, without the consent of the Optionee, provide for one or more of the following: (a) continuation of the Option by the Company or successor; (b) assumption or substitution of the Option by the successor; (c) acceleration of vesting; (d) cancellation in exchange for a cash payment equal to the excess of the per-share consideration over the Exercise Price; or (e) cancellation for no consideration if the Exercise Price equals or exceeds the per-share consideration."
    ),

    docHeading("10. Securities Law Compliance"),
    docParagraph(
      "The Option Shares shall be subject to restrictions on transfer under the Securities Act of 1933 and applicable state securities laws. The Optionee may be required to execute a stock purchase agreement and/or market standoff agreement as a condition of exercise."
    ),

    docHeading("11. 83(b) Election"),
    docParagraph(
      "If the Option is early exercisable and the Optionee exercises prior to vesting, the Optionee may file an election under Section 83(b) of the Code within thirty (30) days of exercise. THE OPTIONEE IS SOLELY RESPONSIBLE FOR FILING ANY APPLICABLE 83(b) ELECTION."
    ),

    docHeading("12. Entire Agreement; Governing Law"),
    docParagraph(
      `This Agreement, together with the Plan, constitutes the entire agreement between the parties with respect to the Option. This Agreement shall be governed by the laws of the State of ${state}, without regard to conflict of law principles.`
    ),
    docParagraph(
      "IN WITNESS WHEREOF, the parties have executed this Agreement as of the Grant Date set forth above."
    ),

    ...docSignatureBlock("COMPANY:", legalName),
    ...docSignatureBlock("By:", "Authorized Signatory"),
    ...docSignatureBlock("OPTIONEE:", stakeholder.name),

    docBlank(),
    docParagraph(
      "DISCLAIMER: This document is generated from a standard template for informational purposes. It does not constitute legal advice. Consult qualified counsel before execution.",
      { italic: true, spacingAfter: 0 }
    ),
  ];

  return new Document({
    sections: [{ children }],
  });
}

export async function generateOptionAgreementBuffer(data: GrantDocumentData): Promise<Buffer> {
  const doc = buildOptionAgreement(data);
  return Buffer.from(await Packer.toBuffer(doc));
}
