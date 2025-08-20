"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import Link from "next/link";
import JobDetailsEditForm from "@/components/jobs/JobDetailsEditForm";
import RecruitmentProcessEditForm from "@/components/jobs/RecruitmentProcessEditForm";
import CompensationEditForm from "@/components/jobs/CompensationEditForm";
import PerksEditForm from "@/components/jobs/PerksEditForm";
import LegalEditForm from "@/components/jobs/LegalEditForm";

interface JobPosting {
  id: string;
  employer_id: string;
  job_details: {
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
  recruitment_process: {
    stages: {
      name: string;
      type: string;
      details: string;
      required: boolean;
    }[];
    applicationLimit: number;
    expiryDate: string;
    expectedInterviewDates: string[];
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
  status: string;
  created_at: string;
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchJob(params.id as string);
    }
  }, [params.id]);

  const fetchJob = async (jobId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("id", jobId)
        .eq("employer_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setJob(data);
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Failed to fetch job details");
      router.push("/employer/jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!job) return;

    try {
      const { error } = await supabase
        .from("job_postings")
        .update({ status: newStatus })
        .eq("id", job.id);

      if (error) throw error;

      setJob({ ...job, status: newStatus });
      toast.success("Job status updated successfully");
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error("Failed to update job status");
    }
  };

  const formatSalary = (salary: JobPosting["job_details"]["salary"]) => {
    if (salary.type === "exact") {
      return `£${salary.exact?.toLocaleString()}`;
    } else {
      return `£${salary.min?.toLocaleString()} - £${salary.max?.toLocaleString()}`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Job not found
          </h1>
          <Link href="/employer/jobs" className="btn-primary">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <Link href="/employer/jobs" className="btn-secondary">
              ← Back to Jobs
            </Link>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                job.status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : job.status === "paused"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {job.job_details.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
            {job.job_details.roleType} • {job.job_details.location}
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={job.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="form-select min-w-[120px]"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
          <button
            onClick={() => setEditing("job_details")}
            className="btn-primary"
          >
            Edit Job
          </button>
        </div>
      </div>

      {/* Job Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Job Description */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Job Description
              </h2>
              <button
                onClick={() => setEditing("job_details")}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                Edit
              </button>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {job.job_details.description}
            </p>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Employment Type
                </span>
                <p className="text-gray-900 dark:text-white">
                  {job.job_details.employmentType}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Working Hours
                </span>
                <p className="text-gray-900 dark:text-white">
                  {job.job_details.workingHours}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Start Required
                </span>
                <p className="text-gray-900 dark:text-white">
                  {job.job_details.startRequired}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Notice Period
                </span>
                <p className="text-gray-900 dark:text-white">
                  {job.job_details.noticePeriod}
                </p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Required Skills
              </h2>
              <button
                onClick={() => setEditing("job_details")}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                Edit
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {job.job_details.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>

            {job.job_details.optionalSkills &&
              job.job_details.optionalSkills.length > 0 && (
                <>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Optional Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.job_details.optionalSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </>
              )}
          </div>

          {/* Recruitment Process */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recruitment Process
              </h2>
              <button
                onClick={() => setEditing("recruitment_process")}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                Edit
              </button>
            </div>

            <div className="space-y-4">
              {job.recruitment_process.stages.map((stage, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Stage {index + 1}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        stage.required
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {stage.required ? "Required" : "Optional"}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {stage.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stage.type}
                  </p>
                  {stage.details && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {stage.details}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Application Limit
                </span>
                <p className="text-gray-900 dark:text-white">
                  {job.recruitment_process.applicationLimit}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Expiry Date
                </span>
                <p className="text-gray-900 dark:text-white">
                  {job.recruitment_process.expiryDate
                    ? format(
                        new Date(job.recruitment_process.expiryDate),
                        "MMM d, yyyy"
                      )
                    : "Until filled"}
                </p>
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Compensation & Benefits
              </h2>
              <button
                onClick={() => setEditing("compensation")}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                Edit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Salary
                </span>
                <p className="text-gray-900 dark:text-white">
                  {formatSalary(job.job_details.salary)}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Paid Holidays
                </span>
                <p className="text-gray-900 dark:text-white">
                  {job.compensation.paidHolidays} days
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Sick Pay
                </span>
                <p className="text-gray-900 dark:text-white">
                  {job.compensation.sickPay ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Probation Period
                </span>
                <p className="text-gray-900 dark:text-white">
                  {job.compensation.probationPeriod}
                </p>
              </div>
            </div>

            {job.compensation.benefits.length > 0 && (
              <div className="mt-4">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Benefits
                </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {job.compensation.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-sm"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Perks */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Perks & Benefits
              </h2>
              <button
                onClick={() => setEditing("perks")}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                Edit
              </button>
            </div>

            <div className="space-y-4">
              {job.perks.wellnessPrograms.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Wellness Programs
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {job.perks.wellnessPrograms.map((program, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded text-sm"
                      >
                        {program}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {job.perks.socialEvents.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Social Events
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {job.perks.socialEvents.map((event, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded text-sm"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {job.perks.foodAndBeverages.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Food & Beverages
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {job.perks.foodAndBeverages.map((item, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Company Car
                  </span>
                  <p className="text-gray-900 dark:text-white">
                    {job.perks.companyCar ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Transportation
                  </span>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {job.perks.transportation.drivingLicense && (
                      <div>Driving License Required</div>
                    )}
                    {job.perks.transportation.personalCar && (
                      <div>Personal Car Required</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Requirements */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Legal Requirements
              </h2>
              <button
                onClick={() => setEditing("legal")}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                Edit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Right to Work Check
                </span>
                <p className="text-gray-900 dark:text-white">
                  {job.legal.rightToWork ? "Required" : "Not Required"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Background Check
                </span>
                <p className="text-gray-900 dark:text-white">
                  {job.legal.backgroundCheck ? "Required" : "Not Required"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  References Required
                </span>
                <p className="text-gray-900 dark:text-white">
                  {job.legal.references.count}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Reference Types
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {job.legal.references.type.map((type, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-sm"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Applications
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  0
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Views</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  0
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Posted</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {format(new Date(job.created_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Actions
            </h3>
            <div className="space-y-3">
              <Link
                href={`/employer/applicants?job=${job.id}`}
                className="w-full btn-primary text-center block"
              >
                View Applications
              </Link>
              <button
                onClick={() => setEditing("job_details")}
                className="w-full btn-secondary"
              >
                Edit Job Details
              </button>
              <button
                onClick={() => setEditing("recruitment_process")}
                className="w-full btn-secondary"
              >
                Edit Process
              </button>
              <button
                onClick={() => setEditing("compensation")}
                className="w-full btn-secondary"
              >
                Edit Compensation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit{" "}
                {editing
                  .replace("_", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {editing === "job_details" && (
              <JobDetailsEditForm
                data={job.job_details}
                onSave={async (updatedData) => {
                  try {
                    const { error } = await supabase
                      .from("job_postings")
                      .update({ job_details: updatedData })
                      .eq("id", job.id);

                    if (error) throw error;

                    setJob({ ...job, job_details: updatedData });
                    setEditing(null);
                    toast.success("Job details updated successfully");
                  } catch (error) {
                    console.error("Error updating job details:", error);
                    toast.error("Failed to update job details");
                  }
                }}
                onCancel={() => setEditing(null)}
              />
            )}

            {editing === "recruitment_process" && (
              <RecruitmentProcessEditForm
                data={job.recruitment_process}
                onSave={async (updatedData) => {
                  try {
                    const { error } = await supabase
                      .from("job_postings")
                      .update({ recruitment_process: updatedData })
                      .eq("id", job.id);

                    if (error) throw error;

                    setJob({ ...job, recruitment_process: updatedData });
                    setEditing(null);
                    toast.success("Recruitment process updated successfully");
                  } catch (error) {
                    console.error("Error updating recruitment process:", error);
                    toast.error("Failed to update recruitment process");
                  }
                }}
                onCancel={() => setEditing(null)}
              />
            )}

            {editing === "compensation" && (
              <CompensationEditForm
                data={job.compensation}
                onSave={async (updatedData) => {
                  try {
                    const { error } = await supabase
                      .from("job_postings")
                      .update({ compensation: updatedData })
                      .eq("id", job.id);

                    if (error) throw error;

                    setJob({ ...job, compensation: updatedData });
                    setEditing(null);
                    toast.success("Compensation updated successfully");
                  } catch (error) {
                    console.error("Error updating compensation:", error);
                    toast.error("Failed to update compensation");
                  }
                }}
                onCancel={() => setEditing(null)}
              />
            )}

            {editing === "perks" && (
              <PerksEditForm
                data={job.perks}
                onSave={async (updatedData) => {
                  try {
                    const { error } = await supabase
                      .from("job_postings")
                      .update({ perks: updatedData })
                      .eq("id", job.id);

                    if (error) throw error;

                    setJob({ ...job, perks: updatedData });
                    setEditing(null);
                    toast.success("Perks updated successfully");
                  } catch (error) {
                    console.error("Error updating perks:", error);
                    toast.error("Failed to update perks");
                  }
                }}
                onCancel={() => setEditing(null)}
              />
            )}

            {editing === "legal" && (
              <LegalEditForm
                data={job.legal}
                onSave={async (updatedData) => {
                  try {
                    const { error } = await supabase
                      .from("job_postings")
                      .update({ legal: updatedData })
                      .eq("id", job.id);

                    if (error) throw error;

                    setJob({ ...job, legal: updatedData });
                    setEditing(null);
                    toast.success("Legal requirements updated successfully");
                  } catch (error) {
                    console.error("Error updating legal requirements:", error);
                    toast.error("Failed to update legal requirements");
                  }
                }}
                onCancel={() => setEditing(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
