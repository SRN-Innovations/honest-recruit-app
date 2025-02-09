"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Toaster, toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  nationality: string;
  rightToWork: "yes" | "no";
  accountEmail: string;
  password: string;
  acceptedTerms: boolean;
}

export default function CandidateSignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    dateOfBirth: "",
    gender: undefined,
    nationality: "",
    rightToWork: "no",
    accountEmail: "",
    password: "",
    acceptedTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const steps = ["Personal Information", "Account Setup", "Review & Submit"];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isStepOneComplete = () => {
    return Boolean(
      formData.fullName.trim() &&
        formData.email.trim() &&
        formData.phoneNumber.trim() &&
        formData.nationality.trim() &&
        formData.rightToWork
    );
  };

  const isStepTwoComplete = () => {
    return Boolean(
      formData.accountEmail.trim() &&
        formData.password.trim() &&
        formData.password.length >= 6
    );
  };

  const isStepThreeComplete = () => {
    return formData.acceptedTerms;
  };

  const handleNextStep = async () => {
    // Validate current step before proceeding
    if (currentStep === 1 && !isStepOneComplete()) {
      toast.error("Please fill in all required fields before proceeding");
      return;
    }
    if (currentStep === 2 && !isStepTwoComplete()) {
      toast.error("Please complete the account setup before proceeding");
      return;
    }
    if (currentStep === 3 && !isStepThreeComplete()) {
      toast.error("Please accept the terms and conditions to continue");
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    // Handle final submission
    if (currentStep === steps.length) {
      try {
        setIsLoading(true);

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.accountEmail)) {
          toast.error("Please enter a valid email address");
          setIsLoading(false);
          return;
        }

        // Create auth user with metadata
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: formData.accountEmail.toLowerCase(),
            password: formData.password,
            options: {
              data: {
                full_name: formData.fullName,
                user_type: "candidate",
              },
            },
          }
        );

        if (authError) {
          console.error("Auth error:", authError);
          if (authError.message.includes("User already registered")) {
            toast.error(
              <div className="flex flex-col">
                <span>This email is already registered.</span>
                <Link href="/signin" className="text-[#00A3FF] hover:underline">
                  Click here to sign in
                </Link>
              </div>
            );
          } else if (authError.status === 429) {
            toast.error(
              "Too many registration attempts. Please try again in a few minutes."
            );
          } else {
            toast.error(authError.message);
          }
          return;
        }

        if (!authData.user) {
          toast.error("Failed to create user account");
          return;
        }

        // Create user profile
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: authData.user.id,
            user_type: "candidate",
          });

        if (profileError) throw profileError;

        // Create candidate profile
        const { error: candidateError } = await supabase
          .from("candidate_profiles")
          .insert({
            id: authData.user.id,
            full_name: formData.fullName,
            email: formData.email.toLowerCase(), // Convert to lowercase
            phone_number: formData.phoneNumber,
            address: formData.address || null,
            date_of_birth: formData.dateOfBirth || null,
            gender: formData.gender || null,
            nationality: formData.nationality,
            right_to_work: formData.rightToWork === "yes",
          });

        if (candidateError) throw candidateError;

        toast.success(
          "Registration successful! Please check your email to verify your account."
        );
        router.push("/signin");
      } catch (error: any) {
        console.error("Registration error:", error);

        if (error.status === 429) {
          toast.error(
            "Too many registration attempts. Please try again in a few minutes."
          );
          return;
        }

        // Handle duplicate key error
        if (error.code === "23505") {
          toast.error(
            <div className="flex flex-col">
              <span>This email is already registered.</span>
              <Link href="/signin" className="text-[#00A3FF] hover:underline">
                Click here to sign in
              </Link>
            </div>
          );
          return;
        }

        toast.error(error.message || "An error occurred during registration");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={inputClassName}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={inputClassName}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={inputClassName}
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Home Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={inputClassName}
                placeholder="Enter your address (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className={inputClassName}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={inputClassName}
              >
                <option value="">Select gender (optional)</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nationality <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className={inputClassName}
                placeholder="Enter your nationality"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Right to Work <span className="text-red-500">*</span>
              </label>
              <select
                name="rightToWork"
                value={formData.rightToWork}
                onChange={handleInputChange}
                className={inputClassName}
                required
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="accountEmail"
                value={formData.accountEmail}
                onChange={handleInputChange}
                className={inputClassName}
                placeholder="Enter your account email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={inputClassName}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Review Your Information
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Personal Information
                </h4>
                <dl className="mt-2 space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Full Name
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {formData.fullName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {formData.email}
                    </dd>
                  </div>
                  {/* Add other fields here */}
                </dl>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                name="acceptedTerms"
                checked={formData.acceptedTerms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    acceptedTerms: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-[#00A3FF] focus:ring-[#00A3FF] border-gray-300 rounded"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
              >
                I accept the{" "}
                <Link
                  href="/terms"
                  className="text-[#00A3FF] hover:underline"
                  target="_blank"
                >
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-[#00A3FF] hover:underline"
                  target="_blank"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Honest Recruit Logo"
                width={45}
                height={45}
                className="object-contain"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-[#00A3FF]">
                  HONEST RECRUIT
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-300 -mt-1">
                  INTEGRITY IN EVERY HIRE
                </span>
              </div>
            </Link>

            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              <Link href="/about" className="nav-link dark:text-white">
                About
              </Link>
              <Link href="/contact" className="nav-link dark:text-white">
                Contact
              </Link>
              <ThemeToggle />
              <Link href="/signin" className="btn-primary">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`flex items-center ${
                    index < steps.length - 1 ? "w-full" : ""
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      currentStep > index + 1
                        ? "border-[#00A3FF] bg-[#00A3FF]"
                        : currentStep === index + 1
                        ? "border-[#00A3FF]"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        currentStep > index + 1
                          ? "text-white"
                          : currentStep === index + 1
                          ? "text-[#00A3FF]"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium whitespace-nowrap ${
                      currentStep === index + 1
                        ? "text-[#00A3FF]"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {step}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        currentStep > index + 1
                          ? "bg-[#00A3FF]"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handlePreviousStep}
                className={`px-6 py-2.5 rounded-full border-2 border-[#00A3FF] text-[#00A3FF] hover:bg-[#00A3FF] hover:text-white transition-colors ${
                  currentStep === 1 ? "invisible" : ""
                }`}
              >
                Previous
              </button>
              <button
                onClick={handleNextStep}
                disabled={
                  isLoading ||
                  (currentStep === 1 && !isStepOneComplete()) ||
                  (currentStep === 2 && !isStepTwoComplete()) ||
                  (currentStep === 3 && !isStepThreeComplete())
                }
                className={`px-6 py-2.5 rounded-full bg-[#00A3FF] text-white hover:bg-[#0082CC] transition-colors ${
                  isLoading ||
                  (currentStep === 1 && !isStepOneComplete()) ||
                  (currentStep === 2 && !isStepTwoComplete()) ||
                  (currentStep === 3 && !isStepThreeComplete())
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
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
                    Processing...
                  </div>
                ) : currentStep === steps.length ? (
                  "Confirm"
                ) : (
                  "Next"
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 mt-auto">
        {/* ... Footer content (same as landing page) ... */}
      </footer>
    </div>
  );
}

// Update all input field styles to have better contrast in light mode
const inputClassName = `
  w-full px-4 py-2 
  border border-gray-300 dark:border-gray-600 
  rounded-lg 
  focus:ring-2 focus:ring-[#00A3FF] focus:border-transparent 
  bg-white dark:bg-gray-700 
  text-gray-800 dark:text-white 
  placeholder-gray-500 dark:placeholder-gray-400
`;
