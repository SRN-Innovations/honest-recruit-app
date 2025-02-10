"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { toast, Toaster } from "react-hot-toast";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setIsSubmitted(true);
      toast.success("Password reset instructions sent to your email");
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
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
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Check Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                We've sent password reset instructions to {email}
              </p>
              <Link
                href="/signin"
                className="block w-full text-center py-2.5 bg-[#00A3FF] text-white rounded-lg hover:bg-[#0082CC] transition-colors"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Reset Password
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Enter your email address and we'll send you instructions to
                  reset your password.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#00A3FF] focus:border-[#00A3FF] dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className={`w-full py-2.5 bg-[#00A3FF] text-white rounded-lg hover:bg-[#0082CC] transition-colors ${
                    isLoading || !email ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? "Sending..." : "Reset Password"}
                </button>
              </form>

              <div className="text-center">
                <Link
                  href="/signin"
                  className="text-[#00A3FF] hover:underline text-sm"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
