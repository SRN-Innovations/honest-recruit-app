"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "../ThemeToggle";
import { useAuth } from "@/lib/auth-context";
import { useSubscription } from "@/lib/use-subscription";
import SubscriptionDropdown from "../subscription/SubscriptionDropdown";

interface MainHeaderProps {
  showSignIn?: boolean;
  showThemeToggle?: boolean;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (isOpen: boolean) => void;
  showSignOut?: boolean;
}

export default function MainHeader({
  showSignIn = true,
  showThemeToggle = true,
  isSidebarOpen,
  setIsSidebarOpen,
  showSignOut = false,
}: MainHeaderProps) {
  const { isLoggedIn, userType, signOut, redirectToDashboard } = useAuth();
  const { hasSubscription, isLoading } = useSubscription();
  const [subscriptionDropdownOpen, setSubscriptionDropdownOpen] =
    useState(false);

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isLoggedIn && userType) {
      e.preventDefault();
      redirectToDashboard();
    }
  };

  const handleSubscriptionToggle = () => {
    setSubscriptionDropdownOpen(!subscriptionDropdownOpen);
  };

  const handleSubscriptionClose = () => {
    setSubscriptionDropdownOpen(false);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            {setIsSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg
                  className="w-6 h-6 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}
            <Link
              href="/"
              className="flex items-center gap-3"
              onClick={handleHomeClick}
            >
              <Image
                src="/logo.png"
                alt="Honest Recruit Logo"
                width={45}
                height={45}
                className="object-contain"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-[#00A3FF]">
                  HONEST RECRUITMENT
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-300 -mt-1">
                  INTEGRITY IN EVERY HIRE
                </span>
              </div>
            </Link>
          </div>
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {!isLoggedIn ? (
              <>
                <Link
                  href="/"
                  className="nav-link dark:text-white"
                  onClick={handleHomeClick}
                >
                  Home
                </Link>
                <Link href="/about" className="nav-link dark:text-white">
                  About
                </Link>
                <Link href="/contact" className="nav-link dark:text-white">
                  Contact
                </Link>
                {showThemeToggle && <ThemeToggle />}
                {showSignIn && (
                  <Link href="/signin" className="btn-primary">
                    Sign In
                  </Link>
                )}
              </>
            ) : (
              <>
                {/* Subscription Management - Only show for employers */}
                {userType === "employer" && (
                  <>
                    {!isLoading && !hasSubscription && (
                      <Link
                        href="/pricing"
                        className="btn-primary bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        Subscribe Now
                      </Link>
                    )}

                    {!isLoading && hasSubscription && (
                      <SubscriptionDropdown
                        isOpen={subscriptionDropdownOpen}
                        onToggle={handleSubscriptionToggle}
                        onClose={handleSubscriptionClose}
                      />
                    )}
                  </>
                )}

                {/* Home icon -> dashboard */}
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  onClick={() => redirectToDashboard()}
                  aria-label="Go to dashboard"
                  title="Dashboard"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0H6"
                    />
                  </svg>
                </button>

                {/* Profile icon -> profile page by user type */}
                <Link
                  href={
                    userType === "employer"
                      ? "/employer/profile"
                      : "/candidate/profile"
                  }
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  aria-label="Go to profile"
                  title="Profile"
                >
                  {userType === "employer" ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </Link>
                {showThemeToggle && <ThemeToggle />}
                {(showSignOut || isLoggedIn) && (
                  <button
                    onClick={signOut}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    Sign Out
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
