"use client";

import { useEffect, useState } from "react";

import CandidateSidebar from "@/components/layout/CandidateSidebar";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";

interface SavedJob {
  id: string;
  job: {
    id: string;
    title: string;
    company_name: string;
    location: string;
    employment_type: string;
    working_hours: string;
    salary_min: number;
    salary_max: number;
    skills: string[];
    optional_skills: string[];
    languages: Array<{
      language: string;
      speak: boolean;
      read: boolean;
      write: boolean;
    }>;
    role_type: string;
    created_at: string;
    description?: string;
    requirements?: string;
    benefits?: string;
    status?: string;
  };
  saved_at: string;
}

export default function CandidateSaved() {
  const { userType } = useAuth();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingJob, setRemovingJob] = useState<string | null>(null);

  useEffect(() => {
    if (userType === "candidate") {
      fetchSavedJobs();
    }
  }, [userType]);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      // First get the saved job IDs
      const { data: savedJobData, error: savedJobError } = await supabase
        .from("saved_jobs")
        .select("id, job_id, created_at")
        .eq("candidate_id", user.id)
        .order("created_at", { ascending: false });

      if (savedJobError) {
        console.error("Error fetching saved job IDs:", savedJobError);
        toast.error("Failed to fetch saved jobs");
        return;
      }

      if (!savedJobData || savedJobData.length === 0) {
        setSavedJobs([]);
        return;
      }

      // Then get the job details for each saved job (no joins to avoid 400)
      const jobIds = savedJobData.map((item) => item.job_id);
      const { data: jobPostings, error: jobsError } = await supabase
        .from("job_postings")
        .select("*")
        .in("id", jobIds);

      if (jobsError) {
        console.error("Error fetching job postings:", jobsError);
        toast.error("Failed to fetch job details");
        return;
      }

      // Fetch employer company names separately and merge client-side
      const employerIds = Array.from(
        new Set(
          (jobPostings || []).map((j: any) => j.employer_id).filter(Boolean)
        )
      );
      let employerIdToCompanyName: Record<string, string> = {};
      if (employerIds.length > 0) {
        const { data: employers, error: employersError } = await supabase
          .from("employer_profiles")
          .select("id, company_name")
          .in("id", employerIds);
        if (employersError) {
          console.error("Error fetching employer profiles:", employersError);
        } else if (employers) {
          employerIdToCompanyName = employers.reduce(
            (
              acc: Record<string, string>,
              curr: { id: string; company_name: string }
            ) => {
              acc[curr.id] = curr.company_name;
              return acc;
            },
            {}
          );
        }
      }

      // Combine the data
      const data = savedJobData.map((savedJob) => ({
        id: savedJob.id,
        created_at: savedJob.created_at,
        job: jobPostings?.find((job) => job.id === savedJob.job_id) || {},
      }));

      // Debug: Log the first job to see the structure
      if (data.length > 0 && data[0].job) {
        console.log("Sample job data structure:", data[0].job);
      }

      // Transform the data to match our interface
      const transformedJobs: SavedJob[] = (data || []).map((item) => {
        const job: any = item.job || {};

        // Handle job details that might be nested in job_details
        const jobDetails = job.job_details || {};

        return {
          id: item.id,
          job: {
            id: job.id,
            title:
              jobDetails.title ||
              job.job_title ||
              job.title ||
              "Untitled Position",
            company_name:
              employerIdToCompanyName[job.employer_id as string] ||
              job.company_name ||
              job.company ||
              "Company Not Specified",
            location:
              jobDetails.location || job.location || "Location not specified",
            employment_type:
              jobDetails.employmentType || job.employment_type || "Full-time",
            working_hours:
              jobDetails.workingHours || job.working_hours || "40 hours/week",
            salary_min: jobDetails.salary?.min || job.salary_min || 0,
            salary_max: jobDetails.salary?.max || job.salary_max || 0,
            skills: Array.isArray(jobDetails.skills)
              ? jobDetails.skills
              : Array.isArray(job.skills)
              ? job.skills
              : typeof job.skills === "string"
              ? JSON.parse(job.skills || "[]")
              : [],
            optional_skills: Array.isArray(jobDetails.optionalSkills)
              ? jobDetails.optionalSkills
              : Array.isArray(job.optional_skills)
              ? job.optional_skills
              : typeof job.optional_skills === "string"
              ? JSON.parse(job.optional_skills || "[]")
              : [],
            languages: Array.isArray(jobDetails.languages)
              ? jobDetails.languages
              : Array.isArray(job.languages)
              ? job.languages
              : typeof job.languages === "string"
              ? JSON.parse(job.languages || "[]")
              : [],
            role_type: jobDetails.roleType || job.role_type || "General",
            created_at: job.created_at || new Date().toISOString(),
            description: jobDetails.description || job.description || "",
            requirements: jobDetails.requirements || job.requirements || "",
            benefits: jobDetails.benefits || job.benefits || "",
            status: job.status || "active",
          },
          saved_at: item.created_at,
        };
      });

      setSavedJobs(transformedJobs);
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      toast.error("Failed to fetch saved jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSavedJob = async (savedJobId: string, jobId: string) => {
    try {
      setRemovingJob(savedJobId);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      const { error } = await supabase
        .from("saved_jobs")
        .delete()
        .eq("id", savedJobId)
        .eq("candidate_id", user.id);

      if (error) {
        console.error("Error removing saved job:", error);
        toast.error("Failed to remove job from saved list");
        return;
      }

      // Update local state
      setSavedJobs((prev) => prev.filter((job) => job.id !== savedJobId));

      toast.success("Job removed from saved jobs");
    } catch (error) {
      console.error("Error removing saved job:", error);
      toast.error("Failed to remove job from saved list");
    } finally {
      setRemovingJob(null);
    }
  };

  const formatSalary = (min: number | undefined, max: number | undefined) => {
    if (min === undefined || max === undefined) {
      return "Salary not specified";
    }
    return `£${min.toLocaleString()} - £${max.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (userType !== "candidate") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center items-center h-screen">
          <p className="text-gray-600 dark:text-gray-400">
            This page is only available for candidates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CandidateSidebar isSidebarOpen={false} />

      <div className="lg:pl-72">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Saved Jobs
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Your saved job opportunities
            </p>
          </div>

          {/* Results Summary */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              {savedJobs.length} saved job{savedJobs.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Saved Jobs List */}
          {!loading && (
            <div className="space-y-4">
              {savedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    You haven't saved any jobs yet.
                  </p>
                  <a href="/candidate/jobs" className="btn-primary">
                    Browse Jobs
                  </a>
                </div>
              ) : (
                savedJobs.map((savedJob) => (
                  <div
                    key={savedJob.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      {/* Job Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                              {savedJob.job.title}
                            </h3>
                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">
                              {savedJob.job.company_name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              {savedJob.job.role_type}
                            </p>
                          </div>

                          {/* Saved Date */}
                          <div className="flex flex-col items-end">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                              Saved
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Saved on {formatDate(savedJob.saved_at)}
                            </p>
                          </div>
                        </div>

                        {/* Job Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Location
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {savedJob.job.location}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Type
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {savedJob.job.employment_type}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Hours
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {savedJob.job.working_hours}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Salary
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatSalary(
                                savedJob.job.salary_min,
                                savedJob.job.salary_max
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Required Skills
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {savedJob.job.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          {savedJob.job.optional_skills.length > 0 && (
                            <>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-3">
                                Optional Skills
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {savedJob.job.optional_skills.map(
                                  (skill, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                    >
                                      {skill}
                                    </span>
                                  )
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-3 mt-4 lg:mt-0 lg:ml-6">
                        <button className="btn-success whitespace-nowrap flex items-center justify-center gap-2">
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
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Apply Now
                        </button>
                        <button className="btn-outline whitespace-nowrap flex items-center justify-center gap-2">
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          View Details
                        </button>
                        <button
                          className="btn-danger whitespace-nowrap flex items-center justify-center gap-2"
                          onClick={() =>
                            handleRemoveSavedJob(savedJob.id, savedJob.job.id)
                          }
                          disabled={removingJob === savedJob.id}
                        >
                          {removingJob === savedJob.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Removing...
                            </>
                          ) : (
                            <>
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Remove from Saved
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Refresh Button */}
          {!loading && savedJobs.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={fetchSavedJobs}
                className="btn-secondary flex items-center justify-center gap-2 mx-auto"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh Saved Jobs
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
