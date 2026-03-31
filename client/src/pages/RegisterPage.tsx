import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { RegisterForm } from "@/components/features/auth/RegisterForm";
import { OAuthButtons } from "@/components/features/auth/OAuthButtons";

function RegisterPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
        Create account
      </h1>

      <div className="rounded-lg bg-white p-8 shadow-md">
        <RegisterForm />

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-300" />
          <span className="mx-4 text-sm text-gray-500">or continue with</span>
          <div className="flex-grow border-t border-gray-300" />
        </div>

        <OAuthButtons />

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
