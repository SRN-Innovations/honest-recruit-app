"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { toast, Toaster } from "react-hot-toast";
import MainHeader from "@/components/layout/MainHeader";
import MainFooter from "@/components/layout/MainFooter";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) {
      validateEmail(value);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      return;
    }

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
      console.error("Reset password error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && email && !emailError) {
      handleResetPassword(e as any);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MainHeader showSignIn={false} />

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
            HONEST RECRUITMENT
          </h1>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {isSubmitted ? (
              <div className="text-center space-y-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                  <svg
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Check Your Email
                  </h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    We've sent password reset instructions to{" "}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {email}
                    </span>
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Didn't receive the email? Check your spam folder or try
                    again.
                  </p>

                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail("");
                      setEmailError("");
                    }}
                    className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Try Another Email
                  </button>

                  <Link
                    href="/signin"
                    className="block w-full text-center py-2.5 bg-[#00A3FF] text-white rounded-lg hover:bg-[#0082CC] transition-colors"
                  >
                    Return to Sign In
                  </Link>
                </div>
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
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={handleEmailChange}
                        onKeyDown={handleKeyDown}
                        onBlur={() => validateEmail(email)}
                        autoFocus
                        className={`w-full px-4 py-2 
                          border rounded-lg 
                          focus:ring-2 focus:ring-[#00A3FF] focus:border-transparent
                          bg-white dark:bg-gray-700 
                          text-gray-900 dark:text-white
                          placeholder-gray-500 dark:placeholder-gray-400
                          transition-colors
                          ${
                            emailError
                              ? "border-red-300 dark:border-red-600 focus:ring-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        placeholder="Enter your email address"
                      />
                      {email && !emailError && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <svg
                            className="h-5 w-5 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {emailError && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {emailError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email || !!emailError}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 ${
                      isLoading || !email || !!emailError
                        ? "opacity-50 cursor-not-allowed bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                        : "bg-[#00A3FF] hover:bg-[#0082CC] text-white shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
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
                        Sending Reset Instructions...
                      </div>
                    ) : (
                      "Send Reset Instructions"
                    )}
                  </button>
                </form>

                <div className="text-center">
                  <Link
                    href="/signin"
                    className="text-[#00A3FF] hover:text-[#0082CC] hover:underline text-sm font-medium transition-colors"
                  >
                    ← Back to Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Toaster position="top-right" />
      <MainFooter />
    </div>
  );
}
