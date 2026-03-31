import { useAuth } from "@/hooks/useAuth";

function DashboardPage() {
  const { user, roles } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome back, {user?.name}!
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Account</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">{user?.email}</p>
          <p className="mt-1 text-sm text-gray-500">
            Provider: {user?.provider}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Roles</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {roles.map((role) => (
              <span
                key={role.id}
                className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800"
              >
                {role.name}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Status</h3>
          <p className="mt-1 text-lg font-semibold text-green-600">Active</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
