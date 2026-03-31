import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import type { ApiResponse } from "@diary/shared";

interface Invite {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  role?: { name: string } | null;
}

interface Role {
  id: string;
  name: string;
}

function InvitePage() {
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission("admin.dashboard");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitesEnabled, setInvitesEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    api.get<ApiResponse<Invite[]>>("/invites").then((res) => {
      if (res.success && res.data) setInvites(res.data);
    });

    if (!isAdmin) {
      api.get<ApiResponse<Record<string, string>>>("/admin/settings", { silent: true })
        .then((res) => {
          if (res.success && res.data) {
            setInvitesEnabled(res.data.userInvitesEnabled === "true");
          }
        })
        .catch(() => {
          setInvitesEnabled(true);
        });
    } else {
      setInvitesEnabled(true);
    }

    if (isAdmin) {
      api.get<ApiResponse<Role[]>>("/roles").then((res) => {
        if (res.success && res.data) setRoles(res.data);
      });
    }
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post<ApiResponse<Invite>>("/invites", {
        email,
        ...(isAdmin && roleId ? { roleId } : {}),
      });
      toast.success(`Invite sent to ${email}`);
      setEmail("");
      setRoleId("");
      const res = await api.get<ApiResponse<Invite[]>>("/invites");
      if (res.success && res.data) setInvites(res.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invite");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Invites</h1>

      {invitesEnabled === false && !isAdmin ? (
        <div className="rounded-md bg-gray-50 border border-gray-200 p-6 text-center">
          <p className="text-gray-600">User invites are currently disabled by the administrator.</p>
        </div>
      ) : (
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Send an Invite</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="friend@example.com"
              />
            </div>

            {isAdmin && roles.length > 0 && (
              <div>
                <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">
                  Assign Role (optional)
                </label>
                <select
                  id="invite-role"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Default role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send Invite"}
            </button>
          </form>
        </div>
      )}

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Sent Invites</h2>
        {invites.length === 0 ? (
          <p className="text-sm text-gray-500">No invites sent yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 pr-4 text-left font-medium text-gray-700">Email</th>
                  <th className="py-2 pr-4 text-left font-medium text-gray-700">Status</th>
                  <th className="py-2 pr-4 text-left font-medium text-gray-700">Role</th>
                  <th className="py-2 text-left font-medium text-gray-700">Sent</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-900">{invite.email}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          invite.status === "accepted"
                            ? "bg-green-100 text-green-700"
                            : invite.status === "expired"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {invite.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{invite.role?.name ?? "Default"}</td>
                    <td className="py-2 text-gray-600">
                      {new Date(invite.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default InvitePage;
