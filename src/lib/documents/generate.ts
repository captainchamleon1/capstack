import type { GrantDocumentData, OptionDocumentType } from "./types";
import { generateOptionAgreementBuffer } from "./option-agreement";
import { generateNoticeOfGrantBuffer } from "./notice-of-grant";
import { generateBoardConsentBuffer } from "./board-consent";
import { optionLabelShort } from "./docx-helpers";

export function documentFilename(data: GrantDocumentData, type: OptionDocumentType): string {
  const name = data.stakeholder.name.replace(/[^a-zA-Z0-9]/g, "_");
  const prefix = data.company.name.replace(/[^a-zA-Z0-9]/g, "_");

  switch (type) {
    case "agreement":
      return `${prefix}_${optionLabelShort(data.grant.type)}_Agreement_${name}.docx`;
    case "notice":
      return `${prefix}_Notice_of_Grant_${name}.docx`;
    case "board_consent":
      return `${prefix}_Board_Consent_Option_Grant_${name}.docx`;
  }
}

export async function generateOptionDocument(
  data: GrantDocumentData,
  type: OptionDocumentType
): Promise<Buffer> {
  switch (type) {
    case "agreement":
      return generateOptionAgreementBuffer(data);
    case "notice":
      return generateNoticeOfGrantBuffer(data);
    case "board_consent":
      return generateBoardConsentBuffer(data);
  }
}

export const OPTION_DOCUMENT_TYPES: { type: OptionDocumentType; label: string; description: string }[] = [
  {
    type: "agreement",
    label: "Option Agreement",
    description: "Full ISO/NSO agreement (YC/Clerky-style)",
  },
  {
    type: "notice",
    label: "Notice of Grant",
    description: "Grant summary letter for the optionee",
  },
  {
    type: "board_consent",
    label: "Board Consent",
    description: "Unanimous written consent approving the grant",
  },
];
