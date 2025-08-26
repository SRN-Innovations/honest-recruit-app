"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { toast, Toaster } from "react-hot-toast";
import MainHeader from "@/components/layout/MainHeader";
import MainFooter from "@/components/layout/MainFooter";
import PasswordFields, {
  PASSWORD_REQUIREMENTS,
  calculatePasswordStrength,
} from "@/components/auth/PasswordFields";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if we have a session
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Invalid or expired reset link");
        router.push("/signin");
      }
    };

    checkSession();
  }, [router]);

  // Password validation function
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    }

    // Check all password requirements
    const failedRequirements = PASSWORD_REQUIREMENTS.filter(
      (requirement) => !requirement.regex.test(password)
    );

    if (failedRequirements.length > 0) {
      setPasswordError(`Password must meet all requirements`);
      return false;
    }

    setPasswordError("");
    return true;
  };

  // Confirm password validation
  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      return false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    if (passwordError) {
      validatePassword(newPassword);
    }
    // Clear confirm password error if passwords now match
    if (confirmPassword && newPassword === confirmPassword) {
      setConfirmPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (newConfirmPassword: string) => {
    setConfirmPassword(newConfirmPassword);
    if (confirmPasswordError) {
      validateConfirmPassword(newConfirmPassword);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate both fields
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password updated successfully! Redirecting to sign in...");

      // Small delay to show success message
      setTimeout(() => {
        router.push("/signin");
      }, 1500);
    } catch (error) {
      console.error("Update password error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      password &&
      confirmPassword &&
      !passwordError &&
      !confirmPasswordError
    ) {
      handleUpdatePassword(e as any);
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
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Update Password
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Create a new secure password for your account
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <PasswordFields
                  password={password}
                  confirmPassword={confirmPassword}
                  onPasswordChange={handlePasswordChange}
                  onConfirmPasswordChange={handleConfirmPasswordChange}
                  className="flex-col"
                />

                {/* Error Messages */}
                {passwordError && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
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
                    {passwordError}
                  </p>
                )}

                {confirmPasswordError && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
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
                    {confirmPasswordError}
                  </p>
                )}

                {/* Password Requirements Summary */}
                {password && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Password Requirements
                    </h4>
                    <div className="grid grid-cols-1 gap-1">
                      {PASSWORD_REQUIREMENTS.map((requirement, index) => (
                        <div key={index} className="flex items-center text-xs">
                          <span
                            className={`mr-2 ${
                              requirement.regex.test(password)
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {requirement.regex.test(password) ? (
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </span>
                          <span
                            className={
                              requirement.regex.test(password)
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-gray-500 dark:text-gray-400"
                            }
                          >
                            {requirement.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    !password ||
                    !confirmPassword ||
                    !!passwordError ||
                    !!confirmPasswordError
                  }
                  onKeyDown={handleKeyDown}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 ${
                    isLoading ||
                    !password ||
                    !confirmPassword ||
                    !!passwordError ||
                    !!confirmPasswordError
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
                      Updating Password...
                    </div>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>

              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Remember your new password - you'll need it to sign in
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toaster position="top-right" />
      <MainFooter />
    </div>
  );
}
