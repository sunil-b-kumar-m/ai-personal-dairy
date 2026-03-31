import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

function AuthCallbackPage() {
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshAuth().then(() => {
      navigate("/dashboard", { replace: true });
    });
  }, [refreshAuth, navigate]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}

export default AuthCallbackPage;
