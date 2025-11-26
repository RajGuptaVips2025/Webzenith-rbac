import RequirePermission from "../rbac/RequirePermission";
import ActualUsersPage from "./ActualUsersPage";

export default function UsersPage() {
  return (
    <RequirePermission perm="users.read">
      <ActualUsersPage />
    </RequirePermission>
  );
}
