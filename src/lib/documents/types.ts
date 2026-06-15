export type OptionDocumentType = "agreement" | "notice" | "board_consent";

export interface GrantDocumentData {
  company: {
    name: string;
    legalName: string;
    state: string;
    incorporationDate: Date | null;
  };
  grant: {
    id: string;
    type: string;
    sharesGranted: number;
    strikePrice: number | null;
    grantDate: Date;
    boardApprovalDate: Date | null;
    expirationDate: Date | null;
    shareClassName: string;
  };
  stakeholder: {
    name: string;
    email: string | null;
    title: string | null;
    type: string;
  };
  vesting: {
    cliffMonths: number;
    vestingMonths: number;
    vestingFrequency: string;
    startDate: Date;
    accelerationType: string | null;
  } | null;
}
