import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Header from "./Header";
import { useAuth } from "@/hooks/useAuth";
import { VerificationBanner } from "@/components/features/auth/VerificationBanner";

function Layout() {
  const { isAuthenticated, user } = useAuth();
  const showVerificationBanner = isAuthenticated && user && !user.emailVerified;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {showVerificationBanner && <VerificationBanner />}
        <Outlet />
      </main>
      <Toaster position="top-right" />
    </div>
  );
}

export default Layout;
