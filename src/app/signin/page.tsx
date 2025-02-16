"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { toast, Toaster } from "react-hot-toast";

export default function SignIn() {
  const [currentPage, setCurrentPage] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data.user) {
        toast.error("Failed to sign in");
        return;
      }

      // Check user type from profiles table - using 'id' instead of 'user_id'
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_type")
        .eq("id", data.user.id) // Changed from user_id to id
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        toast.error("Error fetching user profile");
        return;
      }

      // Redirect based on user type
      if (profileData?.user_type === "employer") {
        router.push("/employer/dashboard");
      } else if (profileData?.user_type === "candidate") {
        router.push("/candidate/dashboard");
      } else {
        console.error("Invalid user type:", profileData);
        toast.error("Invalid user type");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome Back!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your email to continue
            </p>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  focus:ring-2 focus:ring-[#00A3FF] focus:border-transparent
                  bg-white dark:bg-gray-700 
                  text-gray-900 dark:text-white
                  placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter your email"
                required
              />
            </div>
            <button
              onClick={() => setCurrentPage(2)}
              disabled={!email}
              className={`w-full py-2.5 bg-[#00A3FF] text-white rounded-lg hover:bg-[#0082CC] transition-colors ${
                !email ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Continue
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentPage(1)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Enter Password
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please enter your password for {email}
            </p>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  focus:ring-2 focus:ring-[#00A3FF] focus:border-transparent
                  bg-white dark:bg-gray-700 
                  text-gray-900 dark:text-white
                  placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center">
                {/* You can add "Remember me" checkbox here if needed */}
              </div>
              <div className="text-sm">
                <Link
                  href="/reset-password"
                  className="text-[#00A3FF] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            <button
              onClick={handleSignIn}
              disabled={!password || isLoading}
              className={`w-full py-2.5 bg-[#00A3FF] text-white rounded-lg hover:bg-[#0082CC] transition-colors ${
                !password || isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="Honest Recruit Logo"
            width={60}
            height={60}
            className="object-contain"
          />
        </div>
        <h1 className="mt-6 text-center text-3xl font-extrabold text-[#00A3FF]">
          HONEST RECRUIT
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderPage()}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/register/employer"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Employer
              </Link>
              <Link
                href="/register/candidate"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Candidate
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
