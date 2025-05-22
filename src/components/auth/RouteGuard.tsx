"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredUserType?: "employer" | "candidate" | null;
}

export default function RouteGuard({
  children,
  requiredUserType = null,
}: RouteGuardProps) {
  const { isLoggedIn, userType, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth is loaded before checking
    if (!isLoading) {
      // If user is not logged in, redirect to home
      if (!isLoggedIn) {
        router.push("/");
      }
      // If we require a specific user type and it doesn't match, redirect
      else if (requiredUserType && userType !== requiredUserType) {
        if (userType === "employer") {
          router.push("/employer/dashboard");
        } else if (userType === "candidate") {
          router.push("/candidate/dashboard");
        } else {
          router.push("/");
        }
      }
    }
  }, [isLoggedIn, isLoading, requiredUserType, userType, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A3FF]"></div>
      </div>
    );
  }

  // Show nothing briefly during redirect
  if (!isLoggedIn || (requiredUserType && userType !== requiredUserType)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A3FF] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Render children only if authenticated and authorized
  return <>{children}</>;
}
