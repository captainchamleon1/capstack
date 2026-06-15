import { renderToBuffer } from "@react-pdf/renderer";
import type { GrantDocumentData, OptionDocumentType } from "../types";
import { buildDocumentContent } from "../content";
import { GrantPdfDocument } from "./grant-pdf";
import { optionLabelShort } from "../docx-helpers";

export async function generateOptionDocumentPdf(
  data: GrantDocumentData,
  type: OptionDocumentType
): Promise<Buffer> {
  const content = buildDocumentContent(data, type);
  const buffer = await renderToBuffer(<GrantPdfDocument content={content} />);
  return Buffer.from(buffer);
}

export function pdfFilename(data: GrantDocumentData, type: OptionDocumentType): string {
  const name = data.stakeholder.name.replace(/[^a-zA-Z0-9]/g, "_");
  const prefix = data.company.name.replace(/[^a-zA-Z0-9]/g, "_");

  switch (type) {
    case "agreement":
      return `${prefix}_${optionLabelShort(data.grant.type)}_Agreement_${name}.pdf`;
    case "notice":
      return `${prefix}_Notice_of_Grant_${name}.pdf`;
    case "board_consent":
      return `${prefix}_Board_Consent_Option_Grant_${name}.pdf`;
  }
}
