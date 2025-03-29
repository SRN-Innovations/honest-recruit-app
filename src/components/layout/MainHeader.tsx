"use client";

import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "../ThemeToggle";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

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
  const router = useRouter();
  const { isLoggedIn, userType, signOut, redirectToDashboard } = useAuth();

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isLoggedIn && userType) {
      e.preventDefault();
      redirectToDashboard();
    }
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
            {showSignIn && !isLoggedIn && (
              <Link href="/signin" className="btn-primary">
                Sign In
              </Link>
            )}
            {(showSignOut || isLoggedIn) && (
              <button
                onClick={signOut}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
