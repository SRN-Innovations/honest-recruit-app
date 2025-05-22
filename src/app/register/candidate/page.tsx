"use client";

import { AuthError, SupabaseClient } from "@supabase/supabase-js";

import Link from "next/link";
import MainFooter from "@/components/layout/MainFooter";
import MainHeader from "@/components/layout/MainHeader";
import PasswordFields from "@/components/auth/PasswordFields";
import { supabase } from "../../../lib/supabase";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  dateOfBirth?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  nationality: string;
  rightToWork: {
    status: string;
    visaType?: string;
    visaExpiryDate?: string;
  };
  accountEmail: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

interface AddressResult {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

const createProfiles = async (
  supabase: SupabaseClient,
  userData: {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    dateOfBirth: string | null;
    gender: string | null;
    nationality: string;
    rightToWork: {
      status: string;
      visaType?: string;
      visaExpiryDate?: string;
    };
  },
  maxAttempts = 3
): Promise<void> => {
  // Format the address for storage
  const formattedAddress = `${userData.address.street}, ${userData.address.city}, ${userData.address.state} ${userData.address.postalCode}, ${userData.address.country}`;

  // Format the right to work information
  const rightToWorkInfo = {
    status: userData.rightToWork.status,
    ...(userData.rightToWork.visaType && {
      visa_type: userData.rightToWork.visaType,
    }),
    ...(userData.rightToWork.visaExpiryDate && {
      visa_expiry: userData.rightToWork.visaExpiryDate,
    }),
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { error } = await supabase.rpc("create_candidate_profiles", {
      p_user_id: userData.userId,
      p_full_name: userData.fullName,
      p_email: userData.email,
      p_phone_number: userData.phoneNumber,
      p_address: formattedAddress,
      p_date_of_birth: userData.dateOfBirth,
      p_gender: userData.gender,
      p_nationality: userData.nationality,
      p_right_to_work: rightToWorkInfo,
    });

    if (!error) return;

    if (
      error.message.includes("User does not exist in auth.users") ||
      error.message.includes("violates foreign key constraint")
    ) {
      if (attempt === maxAttempts) {
        throw new Error(
          "Account creation is taking longer than expected. Please try signing in after a few minutes."
        );
      }
      // Wait longer between each attempt
      await new Promise((resolve) => setTimeout(resolve, 3000));
      continue;
    }

    // If it's not a user existence error, throw immediately
    throw error;
  }
};

const searchAddresses = async (query: string): Promise<AddressResult[]> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&addressdetails=1&countrycodes=gb&limit=5`,
      {
        headers: {
          "Accept-Language": "en-GB,en",
        },
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return [];
  }
};

// Add this constant at the top with other constants
const nationalities = [
  "British",
  "Irish",
  "French",
  "German",
  "Italian",
  "Spanish",
  "Polish",
  "Romanian",
  "Portuguese",
  "Greek",
  "Dutch",
  "Belgian",
  "Swedish",
  "Danish",
  "Norwegian",
  "Finnish",
  "Swiss",
  "Austrian",
  "Hungarian",
  "Czech",
  "Slovak",
  "Bulgarian",
  "Croatian",
  "Serbian",
  "Ukrainian",
  "Russian",
  "American",
  "Canadian",
  "Australian",
  "New Zealander",
  "Chinese",
  "Japanese",
  "Korean",
  "Indian",
  "Pakistani",
  "Bangladeshi",
  "Other",
].sort();

// Add this constant for right to work options
const rightToWorkOptions = [
  {
    value: "citizen",
    label: "British Citizen",
  },
  {
    value: "settled",
    label: "Settled Status / Indefinite Leave to Remain",
  },
  {
    value: "pre-settled",
    label: "Pre-Settled Status",
  },
  {
    value: "work-visa",
    label: "Work Visa",
  },
  {
    value: "student-visa",
    label: "Student Visa with Work Rights",
  },
  {
    value: "dependent-visa",
    label: "Dependent Visa",
  },
  {
    value: "other",
    label: "Other Immigration Status",
  },
  {
    value: "no",
    label: "No Right to Work in UK",
  },
];

// Add these password validation constants
const PASSWORD_REQUIREMENTS = [
  { regex: /.{8,}/, label: "At least 8 characters long" },
  { regex: /[A-Z]/, label: "Contains uppercase letter" },
  { regex: /[a-z]/, label: "Contains lowercase letter" },
  { regex: /[0-9]/, label: "Contains number" },
  { regex: /[^A-Za-z0-9]/, label: "Contains special character" },
];

// Add this function to calculate password strength
const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  PASSWORD_REQUIREMENTS.forEach((requirement) => {
    if (requirement.regex.test(password)) {
      strength += 1;
    }
  });
  return (strength / PASSWORD_REQUIREMENTS.length) * 100;
};

// Add this email validation function
const isValidEmail = (email: string): boolean => {
  // More comprehensive email regex
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

export default function CandidateSignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    dateOfBirth: "",
    gender: undefined,
    nationality: "",
    rightToWork: {
      status: "",
      visaType: "",
      visaExpiryDate: "",
    },
    accountEmail: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const steps = ["Personal Information", "Account Setup", "Review & Submit"];

  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressResult[]>(
    []
  );
  const [isSearching, setIsSearching] = useState(false);

  // Update the authError state type
  const [authError, setAuthError] = useState<
    string | React.ReactElement | null
  >(null);

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
    const { status, visaType, visaExpiryDate } = formData.rightToWork;
    const basicFieldsComplete =
      formData.fullName &&
      formData.email &&
      formData.phoneNumber &&
      formData.address.city &&
      formData.nationality &&
      status;

    if (status === "work-visa") {
      return basicFieldsComplete && visaType && visaExpiryDate;
    }

    return basicFieldsComplete;
  };

  const isStepTwoComplete = () => {
    const passwordStrength = calculatePasswordStrength(formData.password);
    return Boolean(
      formData.accountEmail.trim() &&
        formData.password.trim() &&
        formData.confirmPassword.trim() &&
        formData.password === formData.confirmPassword &&
        passwordStrength >= 80 // Requires at least 4 out of 5 requirements
    );
  };

  const isStepThreeComplete = () => {
    return formData.acceptedTerms;
  };

  const handleNextStep = async () => {
    if (currentStep < steps.length) {
      setAuthError(null);

      // When moving from step 1 to step 2, populate the account email
      if (currentStep === 1 && isStepOneComplete()) {
        setFormData((prev) => ({
          ...prev,
          accountEmail: prev.email,
        }));
        setCurrentStep(currentStep + 1);
        return;
      }

      if (currentStep === 2 && isStepTwoComplete()) {
        // Validate email format first
        if (!isValidEmail(formData.accountEmail)) {
          setAuthError(
            <div className="text-center space-y-2">
              <p className="text-red-500">
                Please enter a valid email address.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Example: name@company.com
              </p>
            </div>
          );
          return;
        }

        setIsLoading(true);
        try {
          const { error } = await supabase.auth.signUp({
            email: formData.accountEmail,
            password: formData.password,
          });

          if (error) {
            if (error.message.includes("already registered")) {
              setAuthError(
                <div className="text-center">
                  <p className="text-red-500 mb-2">
                    This email is already registered.
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Would you like to{" "}
                    <Link
                      href="/signin"
                      className="text-[#00A3FF] hover:underline"
                    >
                      sign in
                    </Link>{" "}
                    instead?
                  </p>
                </div>
              );
            } else {
              // Show user-friendly error messages
              const errorMessage = error.message.includes("Email")
                ? "Please enter a valid email address"
                : "An error occurred. Please try again.";
              setAuthError(errorMessage);
            }
            setIsLoading(false);
            return;
          }

          setCurrentStep(currentStep + 1);
        } catch (error) {
          if (error instanceof AuthError) {
            setAuthError("Unable to create account. Please try again.");
          } else {
            setAuthError("An unexpected error occurred. Please try again.");
          }
          return;
        } finally {
          setIsLoading(false);
        }
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else if (currentStep === steps.length && isStepThreeComplete()) {
      // Handle final submission
      setIsLoading(true);
      try {
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
          setAuthError(
            authError.message || "An error occurred during registration"
          );
          setIsLoading(false);
          return;
        }

        if (!authData.user) {
          setAuthError("Failed to create user account");
          setIsLoading(false);
          return;
        }

        // Initial wait for auth user creation
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Create candidate profile
        await createProfiles(supabase, {
          userId: authData.user.id,
          fullName: formData.fullName,
          email: formData.email.toLowerCase(),
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          dateOfBirth: formData.dateOfBirth || null,
          gender: formData.gender || null,
          nationality: formData.nationality,
          rightToWork: formData.rightToWork,
        });

        toast.success(
          "Registration successful! Please check your email to verify your account."
        );
        router.push("/signin");
      } catch (error: unknown) {
        console.error("Registration error:", error);
        setAuthError(
          error instanceof Error
            ? error.message
            : "An error occurred during registration"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleAddressSearch = async (query: string) => {
    setAddressQuery(query);
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setIsSearching(true);
    const results = await searchAddresses(query);
    setAddressSuggestions(results);
    setIsSearching(false);
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

            {/* Address Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Home Address
              </h3>

              {/* Address Search */}
              <div className="relative">
                <label htmlFor="addressSearch" className="form-label">
                  Search Address
                </label>
                <input
                  type="text"
                  id="addressSearch"
                  value={addressQuery}
                  onChange={(e) => handleAddressSearch(e.target.value)}
                  className={inputClassName}
                  placeholder="Start typing your address..."
                />

                {/* Loading indicator */}
                {isSearching && (
                  <div className="absolute right-3 top-9">
                    <svg
                      className="animate-spin h-5 w-5 text-gray-400"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                )}

                {/* Address suggestions */}
                {addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                    {addressSuggestions.map((result, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            address: {
                              street: `${result.address.house_number || ""} ${
                                result.address.road || ""
                              }`.trim(),
                              city: result.address.city || "",
                              state: result.address.state || "",
                              postalCode: result.address.postcode || "",
                              country: result.address.country || "",
                            },
                          }));
                          setAddressQuery(result.display_name);
                          setAddressSuggestions([]);
                        }}
                      >
                        {result.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="street" className="form-label">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={formData.address.street}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address, street: e.target.value },
                      }))
                    }
                    className={inputClassName}
                    placeholder="123 Main St, Apt 4B"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="form-label">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value },
                      }))
                    }
                    className={inputClassName}
                    placeholder="London"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="state" className="form-label">
                    State/Province/Region
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.address.state}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value },
                      }))
                    }
                    className={inputClassName}
                    placeholder="Greater London"
                  />
                </div>
                <div>
                  <label htmlFor="postalCode" className="form-label">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.address.postalCode}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: {
                          ...prev.address,
                          postalCode: e.target.value,
                        },
                      }))
                    }
                    className={inputClassName}
                    placeholder="SW1A 1AA"
                  />
                </div>
                <div>
                  <label htmlFor="country" className="form-label">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.address.country}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address, country: e.target.value },
                      }))
                    }
                    className={inputClassName}
                    placeholder="United Kingdom"
                  />
                </div>
              </div>
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
              <select
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className={`${inputClassName} ${
                  !formData.nationality
                    ? "text-gray-500"
                    : "text-gray-900 dark:text-white"
                }`}
                required
              >
                <option value="" className="text-gray-500">
                  Select your nationality
                </option>
                {nationalities.map((nationality) => (
                  <option
                    key={nationality}
                    value={nationality}
                    className="text-gray-900 dark:text-white"
                  >
                    {nationality}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Right to Work Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="rightToWork.status"
                  value={formData.rightToWork.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      rightToWork: {
                        ...prev.rightToWork,
                        status: e.target.value,
                      },
                    }))
                  }
                  className={`${inputClassName} ${
                    !formData.rightToWork.status
                      ? "text-gray-500"
                      : "text-gray-900 dark:text-white"
                  }`}
                  required
                >
                  <option value="" className="text-gray-500">
                    Select your right to work status
                  </option>
                  {rightToWorkOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="text-gray-900 dark:text-white"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional fields based on work visa selection */}
              {formData.rightToWork.status === "work-visa" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Visa Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="rightToWork.visaType"
                      value={formData.rightToWork.visaType}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          rightToWork: {
                            ...prev.rightToWork,
                            visaType: e.target.value,
                          },
                        }))
                      }
                      className={inputClassName}
                      required
                    >
                      <option value="">Select visa type</option>
                      <option value="skilled-worker">
                        Skilled Worker Visa
                      </option>
                      <option value="health-care">
                        Health and Care Worker Visa
                      </option>
                      <option value="global-talent">Global Talent Visa</option>
                      <option value="scale-up">Scale-up Worker Visa</option>
                      <option value="graduate">Graduate Visa</option>
                      <option value="high-potential">
                        High Potential Individual Visa
                      </option>
                      <option value="other">Other Work Visa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Visa Expiry Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="rightToWork.visaExpiryDate"
                      value={formData.rightToWork.visaExpiryDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          rightToWork: {
                            ...prev.rightToWork,
                            visaExpiryDate: e.target.value,
                          },
                        }))
                      }
                      className={inputClassName}
                      required
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </>
              )}
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
              <div className="relative">
                <input
                  type="email"
                  name="accountEmail"
                  value={formData.accountEmail}
                  onChange={(e) => {
                    handleInputChange(e);
                    if (authError) setAuthError(null);
                  }}
                  onBlur={(e) => {
                    if (e.target.value && !isValidEmail(e.target.value)) {
                      setAuthError(
                        <div className="text-center space-y-2">
                          <p className="text-red-500">
                            Please enter a valid email address.
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Example: name@company.com
                          </p>
                        </div>
                      );
                    }
                  }}
                  className={`${inputClassName} ${
                    authError ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <PasswordFields
              password={formData.password}
              confirmPassword={formData.confirmPassword}
              onPasswordChange={(password) =>
                setFormData((prev) => ({ ...prev, password }))
              }
              onConfirmPasswordChange={(confirmPassword) =>
                setFormData((prev) => ({ ...prev, confirmPassword }))
              }
            />

            {/* Show auth error if present */}
            {authError && (
              <div className="mt-4">
                {typeof authError === "string" ? (
                  <p className="text-red-500 text-center">{authError}</p>
                ) : (
                  authError
                )}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Review Your Information
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Personal Information
                  </h4>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-sm text-[#00A3FF] hover:text-[#0082CC] flex items-center gap-1"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit
                  </button>
                </div>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Full Name
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formData.fullName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formData.email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Phone Number
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formData.phoneNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Date of Birth
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formData.dateOfBirth || "Not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Gender
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formData.gender
                        ? formData.gender
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")
                        : "Not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Nationality
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formData.nationality}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Address Information */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Address Information
                  </h4>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-sm text-[#00A3FF] hover:text-[#0082CC] flex items-center gap-1"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit
                  </button>
                </div>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Street Address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formData.address.street}
                    </dd>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        City
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formData.address.city}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        State/Province
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formData.address.state}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Postal Code
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formData.address.postalCode}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Country
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formData.address.country}
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>

              {/* Right to Work Information */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Right to Work Information
                  </h4>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-sm text-[#00A3FF] hover:text-[#0082CC] flex items-center gap-1"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit
                  </button>
                </div>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {rightToWorkOptions.find(
                        (option) => option.value === formData.rightToWork.status
                      )?.label || formData.rightToWork.status}
                    </dd>
                  </div>
                  {formData.rightToWork.status === "work-visa" && (
                    <>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Visa Type
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {formData.rightToWork.visaType}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Visa Expiry Date
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {formData.rightToWork.visaExpiryDate}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>

              {/* Account Information */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Account Information
                  </h4>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-sm text-[#00A3FF] hover:text-[#0082CC] flex items-center gap-1"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit
                  </button>
                </div>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Account Email
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formData.accountEmail}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="acceptedTerms"
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
                  htmlFor="acceptedTerms"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  I agree to the{" "}
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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MainHeader showSignIn={false} />

      {/* Main Content - Added mb-12 */}
      <main className="flex-grow pt-24 mb-12">
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

      <MainFooter />
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
