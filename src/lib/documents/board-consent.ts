import { Document, Packer } from "docx";
import type { GrantDocumentData } from "./types";
import {
  docTitle,
  docHeading,
  docParagraph,
  docBlank,
  docSignatureBlock,
  formatLongDate,
  formatShares,
  formatMoney,
  vestingDescription,
  optionLabel,
  optionLabelShort,
} from "./docx-helpers";

export function buildBoardConsent(data: GrantDocumentData): Document {
  const { company, grant, stakeholder } = data;
  const legalName = company.legalName || company.name;
  const state = company.state || "Delaware";
  const strike = grant.strikePrice ?? 0;
  const approvalDate = grant.boardApprovalDate || grant.grantDate;

  const children = [
    docTitle("ACTION BY UNANIMOUS WRITTEN CONSENT"),
    docTitle("OF THE BOARD OF DIRECTORS"),
    docParagraph(legalName, { bold: true, spacingAfter: 300 }),

    docParagraph(
      `The undersigned, constituting all of the members of the Board of Directors (the "Board") of ${legalName}, a ${state} corporation (the "Company"), hereby adopt the following resolutions by unanimous written consent pursuant to Section 141(f) of the Delaware General Corporation Law and the Company's Bylaws, effective as of ${formatLongDate(approvalDate)}.`
    ),

    docHeading("Option Grant Approval"),
    docParagraph('WHEREAS, the Company maintains an Equity Incentive Plan (the "Plan") under which the Company may grant stock options to employees, directors, consultants, and advisors; and'),
    docParagraph(
      `WHEREAS, the Board deems it advisable and in the best interests of the Company to grant a ${optionLabel(grant.type)} to ${stakeholder.name}${stakeholder.title ? `, ${stakeholder.title}` : ""} (the "Optionee");`
    ),
    docParagraph("NOW, THEREFORE, BE IT RESOLVED, that the following option grant is hereby approved:"),

    docBlank(),
    docParagraph(`Optionee: ${stakeholder.name}`, { bold: true }),
    docParagraph(`Type: ${optionLabelShort(grant.type)} (${optionLabel(grant.type)})`),
    docParagraph(`Shares: ${formatShares(grant.sharesGranted)} shares of ${grant.shareClassName}`),
    docParagraph(`Exercise Price: ${formatMoney(strike)} per share`),
    docParagraph(`Grant Date: ${formatLongDate(grant.grantDate)}`),
    docParagraph(`Vesting: ${vestingDescription(data)}`),
    ...(grant.expirationDate
      ? [docParagraph(`Expiration: ${formatLongDate(grant.expirationDate)}`)]
      : [docParagraph("Expiration: Ten (10) years from the Grant Date")]),

    docBlank(),
    docParagraph(
      "RESOLVED FURTHER, that the Option shall be evidenced by a Stock Option Agreement in substantially the form presented to the Board, with such changes as the Chief Executive Officer or any officer of the Company deems necessary or advisable."
    ),
    docParagraph(
      "RESOLVED FURTHER, that the officers of the Company are hereby authorized and directed to take all actions and execute all documents necessary or advisable to carry out the foregoing resolutions, including entry of the grant on the Company's capitalization table."
    ),
    docParagraph(
      "RESOLVED FURTHER, that all actions previously taken by the officers of the Company in furtherance of the matters contemplated by the foregoing resolutions are hereby ratified, confirmed, and approved in all respects."
    ),

    docBlank(),
    docHeading("Omnibus Resolution"),
    docParagraph(
      "RESOLVED FURTHER, that the officers of the Company are authorized to execute any additional documents and take any additional actions they deem necessary to effectuate the intent of the foregoing resolutions."
    ),

    docBlank(),
    docParagraph("This Action by Unanimous Written Consent may be executed in counterparts, each of which shall constitute an original and all of which together shall constitute one instrument."),
    docBlank(),
    docParagraph(`IN WITNESS WHEREOF, the undersigned directors have executed this Action by Unanimous Written Consent as of ${formatLongDate(approvalDate)}.`),

    ...docSignatureBlock("Director"),
    ...docSignatureBlock("Director"),
    ...docSignatureBlock("Director"),

    docBlank(),
    docParagraph(
      "DISCLAIMER: This board consent is generated from a standard template. Consult qualified legal counsel before execution.",
      { italic: true }
    ),
  ];

  return new Document({
    sections: [{ children }],
  });
}

export async function generateBoardConsentBuffer(data: GrantDocumentData): Promise<Buffer> {
  const doc = buildBoardConsent(data);
  return Buffer.from(await Packer.toBuffer(doc));
}
