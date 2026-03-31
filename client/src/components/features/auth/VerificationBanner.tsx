import { useState } from "react";
import { api } from "@/services/api";
import toast from "react-hot-toast";

function VerificationBanner() {
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent. Check your inbox.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to resend email",
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-amber-600 text-sm font-medium">
            Please verify your email address. Check your inbox for a verification link.
          </span>
        </div>
        <button
          onClick={handleResend}
          disabled={isResending}
          className="ml-4 rounded-md bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 hover:bg-amber-200 disabled:opacity-50"
        >
          {isResending ? "Sending..." : "Resend"}
        </button>
      </div>
    </div>
  );
}

export { VerificationBanner };
