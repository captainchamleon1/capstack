import { Header } from "@/components/layout/header";
import { PageBody } from "@/components/layout/page-body";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCompanyWithCapTable, requireSessionMembership } from "@/lib/db";
import { canWriteCapTable } from "@/lib/permissions";
import { ReadOnlyBanner } from "@/components/layout/read-only-banner";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { NewSafeDialog } from "@/components/safes/new-safe-dialog";
import { NewNoteDialog } from "@/components/safes/new-note-dialog";
import { SafeRowActions } from "@/components/safes/safe-row-actions";
import { NoteRowActions } from "@/components/safes/note-row-actions";

export default async function SafesPage() {
  const { company: sessionCompany, role } = await requireSessionMembership();
  const data = await getCompanyWithCapTable(sessionCompany.id);
  if (!data) return null;

  const canWrite = canWriteCapTable(role);
  const { company } = data;

  const totalSafeAmount = company.safes
    .filter((s) => s.status === "outstanding")
    .reduce((sum, s) => sum + s.investmentAmount, 0);

  const totalNoteAmount = company.convertibleNotes
    .filter((n) => n.status === "outstanding")
    .reduce((sum, n) => sum + n.principalAmount, 0);

  const investorStakeholders = company.stakeholders
    .filter((s) => s.type === "investor" || s.type === "founder" || s.type === "advisor")
    .map((s) => ({ id: s.id, name: s.name }));

  return (
    <div>
      <Header
        title="SAFEs & Convertible Notes"
        description="Track convertible instruments and model conversions"
        actions={
          canWrite ? (
          <div className="flex items-center gap-2">
            <NewNoteDialog stakeholders={investorStakeholders} />
            <NewSafeDialog stakeholders={investorStakeholders} />
          </div>
          ) : null
        }
      />

      <PageBody>
        {!canWrite && <ReadOnlyBanner />}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="section-label">Outstanding SAFEs</p>
              <p className="mt-2 text-2xl font-bold text-foreground font-display stat-value">{formatCurrency(totalSafeAmount)}</p>
              <p className="text-xs text-subtle-foreground mt-1">
                {company.safes.filter((s) => s.status === "outstanding").length} instruments
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="section-label">Convertible Notes</p>
              <p className="mt-2 text-2xl font-bold text-foreground font-display stat-value">{formatCurrency(totalNoteAmount)}</p>
              <p className="text-xs text-subtle-foreground mt-1">
                {company.convertibleNotes.filter((n) => n.status === "outstanding").length} notes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="section-label">Total Convertible</p>
              <p className="mt-2 text-2xl font-bold text-brand font-display stat-value">{formatCurrency(totalSafeAmount + totalNoteAmount)}</p>
              <p className="text-xs text-subtle-foreground mt-1">Converts at next priced round</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>SAFEs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {company.safes.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No SAFEs recorded yet. Create one to track convertible investments.
              </p>
            ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="text-left py-3 px-6 font-medium">Investor</th>
                  <th className="text-left py-3 px-6 font-medium">Type</th>
                  <th className="text-right py-3 px-6 font-medium">Amount</th>
                  <th className="text-right py-3 px-6 font-medium">Valuation Cap</th>
                  <th className="text-right py-3 px-6 font-medium">Discount</th>
                  <th className="text-left py-3 px-6 font-medium">Issue Date</th>
                  <th className="text-left py-3 px-6 font-medium">Status</th>
                  {canWrite && <th className="text-right py-3 px-6 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {company.safes.map((safe) => (
                  <tr key={safe.id}>
                    <td className="py-3 px-6 font-medium text-foreground">{safe.stakeholder.name}</td>
                    <td className="py-3 px-6">
                      <Badge variant="outline">{safe.type.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="py-3 px-6 text-right stat-value">{formatCurrency(safe.investmentAmount)}</td>
                    <td className="py-3 px-6 text-right stat-value">
                      {safe.valuationCap ? formatCurrency(safe.valuationCap) : "—"}
                    </td>
                    <td className="py-3 px-6 text-right stat-value">
                      {safe.discountRate ? formatPercent(safe.discountRate, 0) : "—"}
                    </td>
                    <td className="py-3 px-6 text-muted-foreground">{formatDate(safe.issueDate)}</td>
                    <td className="py-3 px-6">
                      <Badge variant={safe.status === "outstanding" ? "warning" : "default"}>
                        {safe.status}
                      </Badge>
                    </td>
                    {canWrite && (
                      <td className="py-3 px-6">
                        <SafeRowActions safe={safe} canWrite={canWrite} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Convertible Notes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {company.convertibleNotes.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No convertible notes yet. Record bridge or seed notes here.
              </p>
            ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="text-left py-3 px-6 font-medium">Investor</th>
                  <th className="text-right py-3 px-6 font-medium">Principal</th>
                  <th className="text-right py-3 px-6 font-medium">Interest Rate</th>
                  <th className="text-right py-3 px-6 font-medium">Valuation Cap</th>
                  <th className="text-right py-3 px-6 font-medium">Discount</th>
                  <th className="text-left py-3 px-6 font-medium">Maturity</th>
                  <th className="text-left py-3 px-6 font-medium">Status</th>
                  {canWrite && <th className="text-right py-3 px-6 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {company.convertibleNotes.map((note) => (
                  <tr key={note.id}>
                    <td className="py-3 px-6 font-medium text-foreground">{note.stakeholder.name}</td>
                    <td className="py-3 px-6 text-right stat-value">{formatCurrency(note.principalAmount)}</td>
                    <td className="py-3 px-6 text-right stat-value">{formatPercent(note.interestRate, 1)}</td>
                    <td className="py-3 px-6 text-right stat-value">
                      {note.valuationCap ? formatCurrency(note.valuationCap) : "—"}
                    </td>
                    <td className="py-3 px-6 text-right stat-value">
                      {note.discountRate ? formatPercent(note.discountRate, 0) : "—"}
                    </td>
                    <td className="py-3 px-6 text-muted-foreground">
                      {note.maturityDate ? formatDate(note.maturityDate) : "—"}
                    </td>
                    <td className="py-3 px-6">
                      <Badge variant={note.status === "outstanding" ? "warning" : "default"}>
                        {note.status}
                      </Badge>
                    </td>
                    {canWrite && (
                      <td className="py-3 px-6">
                        <NoteRowActions note={note} canWrite={canWrite} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </CardContent>
        </Card>
      </PageBody>
    </div>
  );
}
