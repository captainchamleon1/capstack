/** Team roles: owner > admin > viewer */

export function canWriteCapTable(role: string): boolean {
  return role === "owner" || role === "admin";
}

export function canManageTeam(role: string): boolean {
  return role === "owner" || role === "admin";
}

export function canManageMembers(role: string): boolean {
  return role === "owner";
}

export function canEditCompanySettings(role: string): boolean {
  return role === "owner" || role === "admin";
}

export function isViewer(role: string): boolean {
  return role === "viewer";
}

export function roleLabel(role: string): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "viewer":
      return "Viewer";
    default:
      return role;
  }
}
