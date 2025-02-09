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

interface SubUser {
  name: string;
  email: string;
  password: string;
}

interface FormData {
  companyName: string;
  location: string;
  industry: string;
  email: string;
  phoneNumber: string;
  companyDescription: string;
  website?: string;
  employeeCount?: string;
  linkedIn?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  registrationNumber?: string;
  foundedYear?: string;
  accountEmail: string;
  password: string;
  needsSubUsers: boolean;
  subUsers: SubUser[];
  acceptedTerms: boolean;
}

export default function EmployerSignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    location: "",
    industry: "",
    email: "",
    phoneNumber: "",
    companyDescription: "",
    website: "",
    employeeCount: "",
    linkedIn: "",
    twitter: "",
    facebook: "",
    instagram: "",
    registrationNumber: "",
    foundedYear: "",
    accountEmail: "",
    password: "",
    needsSubUsers: false,
    subUsers: [],
    acceptedTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const steps = [
    "Basic Information",
    "Company Profile",
    "Account Setup",
    "Review & Submit",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isStepOneComplete = () => {
    return (
      formData.companyName &&
      formData.location &&
      formData.industry &&
      formData.email &&
      formData.phoneNumber
    );
  };

  const isStepTwoComplete = () => {
    return formData.companyDescription.trim() !== "";
  };

  const isStepThreeComplete = () => {
    return formData.accountEmail && formData.password;
  };

  const isStepFourComplete = () => {
    return formData.acceptedTerms;
  };

  const handleNextStep = async () => {
    console.log("Current step:", currentStep);
    console.log("Total steps:", steps.length);
    console.log("Form data:", formData);

    // Validate current step before proceeding
    if (currentStep === 1 && !isStepOneComplete()) {
      toast.error("Please fill in all required fields before proceeding");
      return;
    }
    if (currentStep === 2 && !isStepTwoComplete()) {
      toast.error("Please provide a company description before proceeding");
      return;
    }
    if (currentStep === 3 && !isStepThreeComplete()) {
      toast.error("Please complete the account setup before proceeding");
      return;
    }
    if (
      currentStep === 3 &&
      formData.needsSubUsers &&
      (formData.subUsers.length === 0 ||
        formData.subUsers.some(
          (user) => !user.name || !user.email || !user.password
        ))
    ) {
      toast.error("Please complete all additional user details");
      return;
    }
    if (currentStep === 4 && !isStepFourComplete()) {
      toast.error("Please accept the terms and conditions to continue");
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    // Only proceed with API calls if we're on the final step and all validations pass
    if (currentStep === steps.length) {
      console.log("Starting registration process...");
      try {
        setIsLoading(true);

        // Test Supabase connection
        console.log("Testing Supabase connection...");
        const { data: testData, error: testError } = await supabase
          .from("user_profiles")
          .select("*")
          .limit(1);

        if (testError) {
          console.error("Supabase connection test failed:", testError);
          throw new Error("Failed to connect to database");
        }
        console.log("Supabase connection test successful");

        // 1. Create auth user
        console.log("Creating auth user with email:", formData.accountEmail);
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: formData.accountEmail,
            password: formData.password,
            options: {
              data: {
                user_type: "employer",
              },
            },
          }
        );

        if (authError) {
          console.error("Auth error:", authError);
          throw authError;
        }
        if (!authData.user) {
          console.error("No user data returned");
          throw new Error("Failed to create user");
        }
        console.log("Auth user created successfully:", authData.user.id);

        // 2. Create user profile
        console.log("Creating user profile...");
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: authData.user.id,
            user_type: "employer",
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          throw profileError;
        }
        console.log("User profile created successfully");

        // 3. Create employer profile
        const { error: employerError } = await supabase
          .from("employer_profiles")
          .insert({
            id: authData.user.id,
            company_name: formData.companyName,
            location: formData.location,
            industry: formData.industry,
            business_email: formData.email,
            phone_number: formData.phoneNumber,
            company_description: formData.companyDescription,
            website: formData.website || null,
            employee_count: formData.employeeCount || null,
            linkedin_url: formData.linkedIn || null,
            twitter_url: formData.twitter || null,
            facebook_url: formData.facebook || null,
            instagram_url: formData.instagram || null,
            registration_number: formData.registrationNumber || null,
            founded_year: formData.foundedYear || null,
          });

        if (employerError) throw employerError;

        // 4. Create sub-users if needed
        if (formData.needsSubUsers && formData.subUsers.length > 0) {
          for (const subUser of formData.subUsers) {
            const { data: subAuthData, error: subAuthError } =
              await supabase.auth.signUp({
                email: subUser.email,
                password: subUser.password,
              });

            if (subAuthError) throw subAuthError;
            if (!subAuthData.user) throw new Error("Failed to create sub-user");

            const { error: subProfileError } = await supabase
              .from("user_profiles")
              .insert({
                id: subAuthData.user.id,
                user_type: "employer",
              });

            if (subProfileError) throw subProfileError;
          }
        }

        toast.success(
          "Registration successful! Please check your email to verify your account."
        );
        router.push("/dashboard");
      } catch (error: any) {
        console.error("Registration error:", error);
        toast.error(
          error.message ||
            "An error occurred during registration. Please check the console for details."
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const addSubUser = () => {
    setFormData((prev) => ({
      ...prev,
      subUsers: [...prev.subUsers, { name: "", email: "", password: "" }],
    }));
  };

  const removeSubUser = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      subUsers: prev.subUsers.filter((_, i) => i !== index),
    }));
  };

  const updateSubUser = (
    index: number,
    field: keyof SubUser,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      subUsers: prev.subUsers.map((user, i) =>
        i === index ? { ...user, [field]: value } : user
      ),
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#FFFFFF",
            color: "#1F2937",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          },
          error: {
            icon: (
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="text-[#00A3FF]"
              />
            ),
            style: {
              background: "#FFFFFF",
              color: "#1F2937",
            },
          },
        }}
      />
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

            {/* Add Menu Items */}
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
        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto pt-8 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step} className="flex flex-col items-center w-full">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-2 
                  ${
                    currentStep > index + 1
                      ? "bg-[#00A3FF] text-white"
                      : currentStep === index + 1
                      ? "bg-[#00A3FF] text-white"
                      : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {index + 1}
                </div>
                <div
                  className={`text-sm ${
                    currentStep >= index + 1
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-400"
                  }`}
                >
                  {step}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 w-full mt-4 ${
                      currentStep > index + 1
                        ? "bg-[#00A3FF]"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Company Details
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label
                      htmlFor="companyName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="e.g. Acme Corporation"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g. London, United Kingdom"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="industry"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Industry <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white"
                      required
                    >
                      <option value="" className="text-gray-500">
                        Select your company's industry
                      </option>
                      <option value="technology">Technology</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="finance">Finance</option>
                      <option value="education">Education</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="retail">Retail</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Business Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. contact@acmecorp.com"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. +44 20 1234 5678"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Company Details
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label
                      htmlFor="companyDescription"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Company Description{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="companyDescription"
                      name="companyDescription"
                      value={formData.companyDescription}
                      onChange={handleInputChange}
                      placeholder="Tell us about your company, its mission, and values"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 min-h-[120px]"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="website"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Company Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="e.g. https://www.acmecorp.com"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="employeeCount"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Number of Employees
                    </label>
                    <select
                      id="employeeCount"
                      name="employeeCount"
                      value={formData.employeeCount}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white"
                    >
                      <option value="" className="text-gray-500">
                        Select company size
                      </option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1001+">1001+ employees</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Social Media Links
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="url"
                        id="linkedIn"
                        name="linkedIn"
                        value={formData.linkedIn}
                        onChange={handleInputChange}
                        placeholder="LinkedIn URL"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      />
                      <input
                        type="url"
                        id="twitter"
                        name="twitter"
                        value={formData.twitter}
                        onChange={handleInputChange}
                        placeholder="Twitter URL"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      />
                      <input
                        type="url"
                        id="facebook"
                        name="facebook"
                        value={formData.facebook}
                        onChange={handleInputChange}
                        placeholder="Facebook URL"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      />
                      <input
                        type="url"
                        id="instagram"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleInputChange}
                        placeholder="Instagram URL"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="registrationNumber"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Company Registration Number
                      </label>
                      <input
                        type="text"
                        id="registrationNumber"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        placeholder="e.g. 12345678"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="foundedYear"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Founded Year
                      </label>
                      <input
                        type="number"
                        id="foundedYear"
                        name="foundedYear"
                        value={formData.foundedYear}
                        onChange={handleInputChange}
                        placeholder="e.g. 2020"
                        min="1800"
                        max={new Date().getFullYear()}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Account Setup
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label
                      htmlFor="accountEmail"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="accountEmail"
                      name="accountEmail"
                      value={formData.accountEmail}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a strong password"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="needsSubUsers"
                        name="needsSubUsers"
                        checked={formData.needsSubUsers}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            needsSubUsers: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-[#00A3FF] focus:ring-[#00A3FF] border-gray-300 rounded"
                      />
                      <label
                        htmlFor="needsSubUsers"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Add additional user account (e.g., HR personnel)
                      </label>
                    </div>

                    {formData.needsSubUsers && (
                      <div className="space-y-4 mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        {formData.subUsers.map((user, index) => (
                          <div
                            key={index}
                            className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                Additional User {index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeSubUser(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={user.name}
                                  onChange={(e) =>
                                    updateSubUser(index, "name", e.target.value)
                                  }
                                  placeholder="Enter name"
                                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="email"
                                  value={user.email}
                                  onChange={(e) =>
                                    updateSubUser(
                                      index,
                                      "email",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter email address"
                                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Password{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="password"
                                  value={user.password}
                                  onChange={(e) =>
                                    updateSubUser(
                                      index,
                                      "password",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Create a password"
                                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-[#00A3FF] focus:border-[#00A3FF] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addSubUser}
                          className="mt-4 w-full px-4 py-2 border-2 border-[#00A3FF] text-[#00A3FF] rounded-lg hover:bg-[#00A3FF] hover:text-white transition-colors"
                        >
                          Add Another User
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Review Your Details
                </h2>

                <div className="space-y-8">
                  {/* Basic Information */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Basic Information
                    </h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Company Name
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-white mt-1">
                          {formData.companyName}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Location
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-white mt-1">
                          {formData.location}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Industry
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-white mt-1">
                          {formData.industry}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Business Email
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-white mt-1">
                          {formData.email}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Phone Number
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-white mt-1">
                          {formData.phoneNumber}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Company Profile */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Company Profile
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Description
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-white mt-1">
                          {formData.companyDescription}
                        </dd>
                      </div>
                      {formData.website && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Website
                          </dt>
                          <dd className="text-sm text-gray-900 dark:text-white mt-1">
                            {formData.website}
                          </dd>
                        </div>
                      )}
                      {formData.employeeCount && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Company Size
                          </dt>
                          <dd className="text-sm text-gray-900 dark:text-white mt-1">
                            {formData.employeeCount}
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Account Details
                    </h3>
                    <dl className="grid grid-cols-1 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Account Email
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-white mt-1">
                          {formData.accountEmail}
                        </dd>
                      </div>
                      {formData.needsSubUsers &&
                        formData.subUsers.length > 0 && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                              Additional Users
                            </dt>
                            <dd className="space-y-2">
                              {formData.subUsers.map((user, index) => (
                                <div
                                  key={index}
                                  className="text-sm text-gray-900 dark:text-white"
                                >
                                  {user.name} ({user.email})
                                </div>
                              ))}
                            </dd>
                          </div>
                        )}
                    </dl>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="space-y-4">
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
              </div>
            )}

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
                  (currentStep === 1 && !isStepOneComplete()) || isLoading
                }
                className={`px-6 py-2.5 rounded-full bg-[#00A3FF] text-white hover:bg-[#0082CC] transition-colors ${
                  (currentStep === 1 && !isStepOneComplete()) || isLoading
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

      {/* Footer - Updated to match landing page */}
      <footer className="bg-white dark:bg-gray-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="Honest Recruit Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <span className="text-lg font-bold text-[#00A3FF]">
                  HONEST RECRUIT
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Transforming recruitment through integrity and innovation.
              </p>
            </div>

            {/* For Job Seekers */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                For Job Seekers
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/jobs"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Browse Jobs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/career-advice"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Career Advice
                  </Link>
                </li>
                <li>
                  <Link
                    href="/resume-tips"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Resume Tips
                  </Link>
                </li>
                <li>
                  <Link
                    href="/salary-guide"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Salary Guide
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Employers */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                For Employers
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/post-job"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Post a Job
                  </Link>
                </li>
                <li>
                  <Link
                    href="/talent-search"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Talent Search
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/recruitment-solutions"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Recruitment Solutions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Company
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8">
            <p className="text-sm text-gray-400 text-center">
              © {new Date().getFullYear()} Honest Recruit. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
