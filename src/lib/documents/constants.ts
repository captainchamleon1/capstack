import type { OptionDocumentType } from "./types";

export const OPTION_DOC_SPECS: {
  variant: OptionDocumentType;
  type: string;
  label: string;
}[] = [
  { variant: "agreement", type: "option_agreement", label: "Option Agreement" },
  { variant: "notice", type: "notice_of_grant", label: "Notice of Grant" },
  { variant: "board_consent", type: "board_consent", label: "Board Consent" },
];

export const DOC_TYPE_TO_VARIANT: Record<string, OptionDocumentType> = {
  option_agreement: "agreement",
  notice_of_grant: "notice",
  board_consent: "board_consent",
};

export const VARIANT_TO_DOC_TYPE: Record<OptionDocumentType, string> = {
  agreement: "option_agreement",
  notice: "notice_of_grant",
  board_consent: "board_consent",
};
