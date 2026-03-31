import { useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";
import type { UserWithRoles, AuthRole } from "@diary/shared";
import toast from "react-hot-toast";

interface UsersResponse {
  success: boolean;
  users: UserWithRoles[];
  total: number;
  page: number;
  limit: number;
}

interface RolesResponse {
  success: boolean;
  data: AuthRole[];
}

function UserTable() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [allRoles, setAllRoles] = useState<AuthRole[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingRoles, setEditingRoles] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    const res = await api.get<UsersResponse>(`/users?${params}`);
    setUsers(res.users);
    setTotal(res.total);
  }, [page, search]);

  const fetchRoles = useCallback(async () => {
    const res = await api.get<RolesResponse>("/roles");
    setAllRoles(res.data);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const handleToggleActive = async (user: UserWithRoles) => {
    try {
      await api.put(`/users/${user.id}`, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? "deactivated" : "activated"}`);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  };

  const handleSaveRoles = async (userId: string) => {
    try {
      await api.put(`/users/${userId}/roles`, { roleIds: selectedRoleIds });
      toast.success("Roles updated");
      setEditingRoles(null);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  };

  const startEditRoles = (user: UserWithRoles) => {
    setEditingRoles(user.id);
    setSelectedRoleIds(user.roles.map((r) => r.id));
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-xs"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Provider</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Roles</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 capitalize">
                  {user.provider}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingRoles === user.id ? (
                    <div className="flex flex-wrap gap-1">
                      {allRoles.map((role) => (
                        <label key={role.id} className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={selectedRoleIds.includes(role.id)}
                            onChange={(e) => {
                              setSelectedRoleIds(
                                e.target.checked
                                  ? [...selectedRoleIds, role.id]
                                  : selectedRoleIds.filter((id) => id !== role.id),
                              );
                            }}
                          />
                          {role.name}
                        </label>
                      ))}
                      <button
                        onClick={() => handleSaveRoles(user.id)}
                        className="ml-2 rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingRoles(null)}
                        className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span
                          key={role.id}
                          className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                        >
                          {role.name}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditRoles(user)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Roles
                    </button>
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={user.isActive ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { UserTable };
