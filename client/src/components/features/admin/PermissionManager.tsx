import { useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";
import type { AuthPermission } from "@diary/shared";
import toast from "react-hot-toast";

interface PermissionsResponse {
  success: boolean;
  data: {
    permissions: AuthPermission[];
    grouped: Record<string, AuthPermission[]>;
  };
}

function PermissionManager() {
  const [grouped, setGrouped] = useState<Record<string, AuthPermission[]>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newPerm, setNewPerm] = useState({ name: "", description: "", module: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", description: "", module: "" });

  const fetchPermissions = useCallback(async () => {
    const res = await api.get<PermissionsResponse>("/permissions");
    setGrouped(res.data.grouped);
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/permissions", newPerm);
      toast.success("Permission created");
      setNewPerm({ name: "", description: "", module: "" });
      setShowCreate(false);
      fetchPermissions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.put(`/permissions/${id}`, editData);
      toast.success("Permission updated");
      setEditingId(null);
      fetchPermissions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/permissions/${id}`);
      toast.success("Permission deleted");
      fetchPermissions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  };

  const startEdit = (perm: AuthPermission) => {
    setEditingId(perm.id);
    setEditData({
      name: perm.name,
      description: perm.description || "",
      module: perm.module,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Permissions</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showCreate ? "Cancel" : "Create Permission"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-lg border bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              placeholder="module.action (e.g. diary.export)"
              value={newPerm.name}
              onChange={(e) => setNewPerm({ ...newPerm, name: e.target.value })}
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Module (e.g. diary)"
              value={newPerm.module}
              onChange={(e) => setNewPerm({ ...newPerm, module: e.target.value })}
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Description"
              value={newPerm.description}
              onChange={(e) => setNewPerm({ ...newPerm, description: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="mt-3 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Save
          </button>
        </form>
      )}

      {Object.entries(grouped).map(([module, perms]) => (
        <div key={module} className="rounded-lg border bg-white">
          <div className="border-b bg-gray-50 px-4 py-2">
            <h3 className="text-sm font-semibold uppercase text-gray-600">{module}</h3>
          </div>
          <div className="divide-y">
            {perms.map((perm) => (
              <div key={perm.id} className="flex items-center justify-between px-4 py-3">
                {editingId === perm.id ? (
                  <div className="flex flex-1 gap-2">
                    <input
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="flex-1 rounded border px-2 py-1 text-sm"
                    />
                    <input
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="flex-1 rounded border px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => handleUpdate(perm.id)}
                      className="rounded bg-blue-600 px-3 py-1 text-xs text-white"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded bg-gray-200 px-3 py-1 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                      <p className="text-xs text-gray-500">{perm.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(perm)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(perm.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export { PermissionManager };
