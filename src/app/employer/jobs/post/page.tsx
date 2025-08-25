"use client";

import { useRef, useState } from "react";

import CompensationForm from "@/components/jobs/CompensationForm";
import JobDetailsForm from "@/components/jobs/JobDetailsForm";
import LegalForm from "@/components/jobs/LegalForm";
import PerksForm from "@/components/jobs/PerksForm";
import RecruitmentProcessForm from "@/components/jobs/RecruitmentProcessForm";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export interface JobPosting {
  jobDetails: {
    title: string;
    description: string;
    numberOfPositions: number;
    roleType: string;
    skills: string[];
    optionalSkills: string[];
    startRequired: string;
    employmentType: string;
    salary: {
      type: "exact" | "range";
      exact?: number;
      min?: number;
      max?: number;
    };
    location: string;
    workingHours: string;
    equipment: string[];
    noticePeriod: string;
    languages: {
      language: string;
      speak: boolean;
      read: boolean;
      write: boolean;
    }[];
  };
  recruitmentProcess: {
    stages: {
      name: string;
      type: string;
      details: string;
      required: boolean;
    }[];
    applicationLimit: number;
    expiryDate: Date | null;
    expectedInterviewDates: Date[];
  };
  compensation: {
    paidHolidays: number;
    sickPay: boolean;
    bonusScheme: string;
    probationPeriod: string;
    benefits: string[];
  };
  perks: {
    wellnessPrograms: string[];
    socialEvents: string[];
    foodAndBeverages: string[];
    companyCar: boolean;
    transportation: {
      drivingLicense: boolean;
      personalCar: boolean;
    };
  };
  legal: {
    rightToWork: boolean;
    backgroundCheck: boolean;
    references: {
      count: number;
      type: string[];
    };
  };
  attachments: File[];
  activeUntil: {
    type: "untilFilled" | "date";
    date?: Date;
  };
}

interface Props {
  data: JobPosting["jobDetails"];
  onChange: (data: JobPosting["jobDetails"]) => void;
  errors?: Record<string, string[]>;
}

export default function PostJob() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [jobPosting, setJobPosting] = useState<JobPosting>({
    // Initialize with default values
    jobDetails: {
      title: "",
      description: "",
      numberOfPositions: 1,
      roleType: "",
      skills: [],
      optionalSkills: [],
      startRequired: "",
      employmentType: "",
      salary: { type: "exact" },
      location: "",
      workingHours: "",
      equipment: [],
      noticePeriod: "",
      languages: [],
    },
    recruitmentProcess: {
      stages: [],
      applicationLimit: 0,
      expiryDate: null,
      expectedInterviewDates: [],
    },
    compensation: {
      paidHolidays: 0,
      sickPay: false,
      bonusScheme: "",
      probationPeriod: "",
      benefits: [],
    },
    perks: {
      wellnessPrograms: [],
      socialEvents: [],
      foodAndBeverages: [],
      companyCar: false,
      transportation: {
        drivingLicense: false,
        personalCar: false,
      },
    },
    legal: {
      rightToWork: false,
      backgroundCheck: false,
      references: {
        count: 0,
        type: [],
      },
    },
    attachments: [],
    activeUntil: {
      type: "untilFilled",
    },
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const formRef = useRef<HTMLDivElement>(null);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string[]> = {};

    switch (step) {
      case 1:
        if (!jobPosting.jobDetails.title) {
          newErrors.title = ["Required"];
        }
        if (!jobPosting.jobDetails.description) {
          newErrors.description = ["Required"];
        }
        if (!jobPosting.jobDetails.roleType) {
          newErrors.roleType = ["Required"];
        }
        break;
      case 2:
        if (jobPosting.recruitmentProcess.stages.length === 0) {
          newErrors.stages = ["At least one recruitment stage is required"];
        }
        if (!jobPosting.recruitmentProcess.expiryDate) {
          newErrors.expiryDate = ["Expiry date is required"];
        }
        break;
      // Add validation for other steps...
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
      const errorMessages = Object.values(newErrors).flat();
      toast.error(
        <div>
          <p className="font-medium">Please fix the following errors:</p>
          <ul className="list-disc list-inside">
            {errorMessages.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      );
    }
    return Object.keys(newErrors).length === 0;
  };

  const validateAllSteps = () => {
    const newErrors: Record<string, string[]> = {};

    // Validate job details
    if (!jobPosting.jobDetails.title) {
      newErrors.title = ["Role title is required"];
    }
    if (!jobPosting.jobDetails.description) {
      newErrors.description = ["Role description is required"];
    }
    if (!jobPosting.jobDetails.roleType) {
      newErrors.roleType = ["Role type is required"];
    }

    // Validate recruitment process
    if (jobPosting.recruitmentProcess.stages.length === 0) {
      newErrors.stages = ["At least one recruitment stage is required"];
    }
    if (!jobPosting.recruitmentProcess.expiryDate) {
      newErrors.expiryDate = ["Expiry date is required"];
    }

    // Add more validations as needed...

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const handleSubmit = async () => {
    if (!validateAllSteps()) {
      toast.error("Please fix all errors before submitting");
      return;
    }
    try {
      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Insert the job posting
      const { error } = await supabase.from("job_postings").insert([
        {
          employer_id: user?.id,
          job_details: jobPosting.jobDetails,
          recruitment_process: jobPosting.recruitmentProcess,
          compensation: jobPosting.compensation,
          perks: jobPosting.perks,
          legal: jobPosting.legal,
          active_until: jobPosting.activeUntil,
          status: "active",
        },
      ]);

      if (error) throw error;

      // Handle file uploads if there are any attachments
      if (jobPosting.attachments.length > 0) {
        const jobId = (
          await supabase
            .from("job_postings")
            .select("id")
            .order("created_at", { ascending: false })
            .limit(1)
            .single()
        ).data?.id;

        if (jobId) {
          for (const file of jobPosting.attachments) {
            const { error: uploadError } = await supabase.storage
              .from("job-attachments")
              .upload(`${jobId}/${file.name}`, file);
            if (uploadError)
              console.error("Error uploading file:", uploadError);
          }
        }
      }

      toast.success("Job posted successfully!");
      router.push("/employer/jobs");
    } catch (error) {
      console.error("Error posting job:", error);
      toast.error("Failed to post job. Please try again.");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <JobDetailsForm
            data={jobPosting.jobDetails}
            onChange={(details) =>
              setJobPosting({ ...jobPosting, jobDetails: details })
            }
            errors={errors}
          />
        );
      case 2:
        return (
          <RecruitmentProcessForm
            data={jobPosting.recruitmentProcess}
            onChange={(process) =>
              setJobPosting({ ...jobPosting, recruitmentProcess: process })
            }
            errors={
              errors.stages || errors.expiryDate
                ? Object.values(errors).flat()
                : undefined
            }
          />
        );
      case 3:
        return (
          <CompensationForm
            data={jobPosting.compensation}
            onChange={(compensation) =>
              setJobPosting({ ...jobPosting, compensation })
            }
          />
        );
      case 4:
        return (
          <PerksForm
            data={jobPosting.perks}
            onChange={(perks: JobPosting["perks"]) =>
              setJobPosting({ ...jobPosting, perks })
            }
          />
        );
      case 5:
        return (
          <LegalForm
            data={jobPosting.legal}
            activeUntil={jobPosting.activeUntil}
            attachments={jobPosting.attachments}
            onChange={(legal, activeUntil, attachments) =>
              setJobPosting({ ...jobPosting, legal, activeUntil, attachments })
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Post a New Job
      </h1>

      <div
        ref={formRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-1/5 h-2 rounded ${
                  step <= currentStep
                    ? "bg-blue-500"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Job Details</span>
            <span>Recruitment</span>
            <span>Compensation</span>
            <span>Perks</span>
            <span>Legal</span>
          </div>
        </div>

        {renderStep()}

        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="btn-secondary"
            >
              Previous
            </button>
          )}
          {currentStep < 5 ? (
            <button onClick={handleNext} className="btn-primary ml-auto">
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn-primary ml-auto">
              Post Job
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
