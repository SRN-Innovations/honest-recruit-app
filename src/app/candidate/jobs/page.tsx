"use client";

import { useEffect, useState } from "react";

import CandidateSidebar from "@/components/layout/CandidateSidebar";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";

interface JobMatch {
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
  };
  score: number;
  matchReasons: string[];
  skillMatch: number;
  salaryMatch: number;
  preferenceMatch: number;
  isSaved?: boolean;
}

interface JobMatchesResponse {
  matches: JobMatch[];
  totalJobs: number;
  matchedJobs: number;
}

interface FullJobPosting {
  id: string;
  employer_id: string;
  job_details?: {
    title: string;
    description: string;
    numberOfPositions?: number;
    roleType: string;
    skills: string[];
    optionalSkills?: string[];
    startRequired?: string;
    employmentType: string;
    salary?: {
      type: "exact" | "range";
      exact?: number;
      min?: number;
      max?: number;
    };
    location: string;
    workingHours: string;
    equipment?: string[];
    noticePeriod?: string;
    languages?: {
      language: string;
      speak: boolean;
      read: boolean;
      write: boolean;
    }[];
  };
  recruitment_process?: {
    stages: {
      name: string;
      type: string;
      details?: string;
      required: boolean;
    }[];
    applicationLimit?: number;
    expiryDate?: string | null;
    expectedInterviewDates?: string[];
  };
  compensation?: {
    paidHolidays?: number;
    sickPay?: boolean;
    bonusScheme?: string;
    probationPeriod?: string;
    benefits?: string[];
  };
  perks?: {
    wellnessPrograms?: string[];
    socialEvents?: string[];
    foodAndBeverages?: string[];
    companyCar?: boolean;
    transportation?: { drivingLicense?: boolean; personalCar?: boolean };
  };
  legal?: {
    rightToWork?: boolean;
    backgroundCheck?: boolean;
    references?: { count?: number; type?: string[] };
  };
  status?: string;
  created_at: string;
}

export default function CandidateJobs() {
  const { userType } = useAuth();
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingJob, setSavingJob] = useState<string | null>(null);
  const [applyingJob, setApplyingJob] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [viewJob, setViewJob] = useState<FullJobPosting | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Prevent page scroll when modal is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    if (viewJob) {
      body.classList.add("overflow-hidden");
    } else {
      body.classList.remove("overflow-hidden");
    }
    return () => {
      body.classList.remove("overflow-hidden");
    };
  }, [viewJob]);

  useEffect(() => {
    if (userType === "candidate") {
      fetchJobMatches();
    }
  }, [userType]);

  const fetchJobMatches = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      // Fetch saved jobs for this candidate
      const { data: savedJobs, error: savedJobsError } = await supabase
        .from("saved_jobs")
        .select("job_id")
        .eq("candidate_id", user.id);

      if (savedJobsError) {
        console.error("Error fetching saved jobs:", savedJobsError);
      }

      const savedJobIds = new Set(savedJobs?.map((sj) => sj.job_id) || []);

      // Fetch already applied jobs for this candidate
      const { data: existingApps } = await supabase
        .from("job_applications")
        .select("job_id")
        .eq("candidate_id", user.id);
      setAppliedJobIds(new Set(existingApps?.map((a) => a.job_id) || []));

      // Try to call the edge function first, fallback to direct database query
      try {
        console.log(
          "Attempting to call edge function with candidateId:",
          user.id
        );

        const { data, error } = await supabase.functions.invoke("match-jobs", {
          body: { candidateId: user.id },
        });

        if (error) {
          console.log("Edge function error:", error);
          throw error;
        }

        console.log("Edge function response:", data);
        const response: JobMatchesResponse = data;
        const matches = response.matches || [];

        // Add saved status to each job
        const matchesWithSavedStatus = matches.map((match) => ({
          ...match,
          isSaved: savedJobIds.has(match.job.id),
        }));

        setJobMatches(matchesWithSavedStatus);

        if (response.matchedJobs === 0) {
          toast(
            "No jobs match your current profile preferences. Consider updating your profile!",
            {
              icon: "ℹ️",
            }
          );
        }
      } catch (edgeFunctionError) {
        console.log("Edge function failed, using fallback:", edgeFunctionError);
        console.warn(
          "Job matching service temporarily unavailable. Falling back to all active jobs."
        );

        // Fallback: Direct database query for active jobs (no joins to avoid 400)
        const { data: jobPostings, error: jobsError } = await supabase
          .from("job_postings")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (jobsError) {
          console.error("Error fetching jobs:", jobsError);
          toast.error("Failed to fetch jobs");
          return;
        }

        // Fetch employer profiles and merge company names client-side
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

        // Convert to JobMatch format with basic scoring
        const fallbackMatches: JobMatch[] = (jobPostings || []).map((job) => {
          const jd =
            typeof (job as any).job_details === "string"
              ? JSON.parse((job as any).job_details || "{}")
              : (job as any).job_details || {};
          return {
            job: {
              id: job.id,
              title:
                jd.title ||
                (job as any).title ||
                (job as any).job_title ||
                "Untitled Position",
              company_name:
                employerIdToCompanyName[job.employer_id as string] ||
                (job as any).company_name ||
                (job as any).company ||
                "Company Not Specified",
              location:
                jd.location ||
                (job as any).location ||
                "Location not specified",
              employment_type:
                jd.employmentType ||
                (job as any).employment_type ||
                "Full-time",
              working_hours:
                jd.workingHours ||
                (job as any).working_hours ||
                "40 hours/week",
              salary_min: jd.salary?.min || (job as any).salary_min || 0,
              salary_max: jd.salary?.max || (job as any).salary_max || 0,
              skills: Array.isArray(jd.skills)
                ? jd.skills
                : Array.isArray((job as any).skills)
                ? (job as any).skills
                : typeof (job as any).skills === "string"
                ? JSON.parse((job as any).skills || "[]")
                : [],
              optional_skills: Array.isArray(jd.optionalSkills)
                ? jd.optionalSkills
                : Array.isArray((job as any).optional_skills)
                ? (job as any).optional_skills
                : typeof (job as any).optional_skills === "string"
                ? JSON.parse((job as any).optional_skills || "[]")
                : [],
              languages: Array.isArray(jd.languages)
                ? jd.languages
                : Array.isArray((job as any).languages)
                ? (job as any).languages
                : typeof (job as any).languages === "string"
                ? JSON.parse((job as any).languages || "[]")
                : [],
              role_type: jd.roleType || (job as any).role_type || "General",
              created_at: (job as any).created_at || new Date().toISOString(),
            },
            score: 50, // Default score for fallback
            matchReasons: ["Job available for application"],
            skillMatch: 0,
            salaryMatch: 0,
            preferenceMatch: 0,
            isSaved: savedJobIds.has(job.id),
          };
        });

        setJobMatches(fallbackMatches);

        if (fallbackMatches.length === 0) {
          toast("No jobs available at the moment. Check back later!", {
            icon: "ℹ️",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching job matches:", error);
      toast.error("Failed to fetch job matches");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80)
      return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
    if (score >= 60)
      return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
    if (score >= 40)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
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

  const formatFullSalary = (
    salary?: FullJobPosting["job_details"]["salary"]
  ) => {
    if (!salary) return "Salary not specified";
    if (salary.type === "exact" && salary.exact !== undefined) {
      return `£${salary.exact.toLocaleString()}`;
    }
    if (salary.min === undefined || salary.max === undefined)
      return "Salary not specified";
    return `£${salary.min.toLocaleString()} - £${salary.max.toLocaleString()}`;
  };

  const handleViewDetails = async (jobId: string) => {
    try {
      setViewLoading(true);
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("id", jobId)
        .single();
      if (error) {
        console.error("Error fetching job details:", error);
        toast.error("Failed to load job details");
        return;
      }
      // Ensure JSON fields are objects
      const parsed: FullJobPosting = {
        ...data,
        job_details:
          typeof data.job_details === "string"
            ? JSON.parse(data.job_details || "{}")
            : data.job_details || {},
        recruitment_process:
          typeof data.recruitment_process === "string"
            ? JSON.parse(data.recruitment_process || "{}")
            : data.recruitment_process || {},
        compensation:
          typeof data.compensation === "string"
            ? JSON.parse(data.compensation || "{}")
            : data.compensation || {},
        perks:
          typeof data.perks === "string"
            ? JSON.parse(data.perks || "{}")
            : data.perks || {},
        legal:
          typeof data.legal === "string"
            ? JSON.parse(data.legal || "{}")
            : data.legal || {},
      };
      setViewJob(parsed);
    } finally {
      setViewLoading(false);
    }
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      setSavingJob(jobId);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      const { error } = await supabase.from("saved_jobs").insert({
        candidate_id: user.id,
        job_id: jobId,
      });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          toast.error("Job is already saved");
        } else {
          console.error("Error saving job:", error);
          toast.error("Failed to save job");
        }
        return;
      }

      // Update local state
      setJobMatches((prev) =>
        prev.map((match) =>
          match.job.id === jobId ? { ...match, isSaved: true } : match
        )
      );

      toast.success("Job saved successfully");
    } catch (error) {
      console.error("Error saving job:", error);
      toast.error("Failed to save job");
    } finally {
      setSavingJob(null);
    }
  };

  const handleUnsaveJob = async (jobId: string) => {
    try {
      setSavingJob(jobId);

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
        .eq("candidate_id", user.id)
        .eq("job_id", jobId);

      if (error) {
        console.error("Error unsaving job:", error);
        toast.error("Failed to unsave job");
        return;
      }

      // Update local state
      setJobMatches((prev) =>
        prev.map((match) =>
          match.job.id === jobId ? { ...match, isSaved: false } : match
        )
      );

      toast.success("Job removed from saved jobs");
    } catch (error) {
      console.error("Error unsaving job:", error);
      toast.error("Failed to unsave job");
    } finally {
      setSavingJob(null);
    }
  };

  const handleApplyNow = async (jobId: string) => {
    try {
      setApplyingJob(jobId);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User not authenticated");
        return;
      }
      // Prevent duplicate applications
      if (appliedJobIds.has(jobId)) {
        toast("You have already applied to this job.");
        return;
      }

      // Find the match score for this job
      const jobMatch = jobMatches.find((match) => match.job.id === jobId);
      const matchScore = jobMatch?.score || 0;

      const { error } = await supabase.from("job_applications").insert({
        candidate_id: user.id,
        job_id: jobId,
        status: "pending",
        match_score: matchScore,
      });
      if (error) {
        console.error("Error applying to job:", error);
        toast.error("Failed to apply");
        return;
      }
      setAppliedJobIds((prev) => new Set(prev).add(jobId));
      toast.success("Application submitted");
    } catch (e) {
      console.error("Apply error:", e);
      toast.error("Failed to apply");
    } finally {
      setApplyingJob(null);
    }
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
              Browse Jobs
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Jobs matched to your profile preferences
            </p>
          </div>

          {/* Results Summary */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              Showing {jobMatches.length} jobs with 90%+ match score
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Job Listings */}
          {!loading && (
            <div className="space-y-4">
              {jobMatches.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    No jobs match your profile with 90%+ compatibility. Consider
                    updating your profile preferences to see more opportunities!
                  </p>
                </div>
              ) : (
                jobMatches.map((match) => (
                  <div
                    key={match.job.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      {/* Job Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                              {match.job.title}
                            </h3>
                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">
                              {match.job.company_name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              {match.job.role_type}
                            </p>
                          </div>

                          {/* Match Score */}
                          <div className="flex flex-col items-end">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(
                                match.score
                              )}`}
                            >
                              {match.score}% Match
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Posted {formatDate(match.job.created_at)}
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
                              {match.job.location}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Type
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {match.job.employment_type}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Hours
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {match.job.working_hours}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Salary
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatSalary(
                                match.job.salary_min,
                                match.job.salary_max
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
                            {match.job.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          {match.job.optional_skills.length > 0 && (
                            <>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-3">
                                Optional Skills
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {match.job.optional_skills.map(
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

                        {/* Match Reasons */}
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Why this job matches you:
                          </p>
                          <ul className="space-y-1">
                            {match.matchReasons.map((reason, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-600 dark:text-gray-400 flex items-start"
                              >
                                <span className="text-green-500 mr-2">✓</span>
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-3 mt-4 lg:mt-0 lg:ml-6">
                        <button
                          className="btn-success whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-60"
                          onClick={() => handleApplyNow(match.job.id)}
                          disabled={
                            applyingJob === match.job.id ||
                            appliedJobIds.has(match.job.id)
                          }
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
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          {applyingJob === match.job.id
                            ? "Applying..."
                            : appliedJobIds.has(match.job.id)
                            ? "Applied"
                            : "Apply Now"}
                        </button>
                        <button
                          className={`whitespace-nowrap flex items-center justify-center gap-2 ${
                            match.isSaved ? "btn-danger" : "btn-outline"
                          }`}
                          onClick={() =>
                            match.isSaved
                              ? handleUnsaveJob(match.job.id)
                              : handleSaveJob(match.job.id)
                          }
                          disabled={savingJob === match.job.id}
                        >
                          {savingJob === match.job.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              {match.isSaved ? "Removing..." : "Saving..."}
                            </>
                          ) : match.isSaved ? (
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
                                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                                />
                              </svg>
                              Save Job
                            </>
                          )}
                        </button>
                        <button
                          className="btn-outline whitespace-nowrap flex items-center justify-center gap-2"
                          onClick={() => handleViewDetails(match.job.id)}
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
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Refresh Button */}
          {!loading && (
            <div className="mt-8 text-center">
              <button
                onClick={fetchJobMatches}
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
                Refresh Job Matches
              </button>
            </div>
          )}
        </div>
      </div>
      {viewJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {viewJob.job_details?.title || "Job Details"}
              </h2>
              <button
                onClick={() => setViewJob(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            {/* Meta */}
            <div className="mb-6 text-gray-600 dark:text-gray-300">
              <div className="flex flex-wrap gap-4">
                <span>{viewJob.job_details?.roleType}</span>
                <span>•</span>
                <span>{viewJob.job_details?.location}</span>
                <span>•</span>
                <span>{formatFullSalary(viewJob.job_details?.salary)}</span>
              </div>
            </div>

            {/* Description */}
            {viewJob.job_details?.description && (
              <div className="card mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Job Description
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {viewJob.job_details.description}
                </p>
              </div>
            )}

            {/* Quick facts */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Employment Type
                </span>
                <p className="text-gray-900 dark:text-white">
                  {viewJob.job_details?.employmentType || ""}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Working Hours
                </span>
                <p className="text-gray-900 dark:text-white">
                  {viewJob.job_details?.workingHours || ""}
                </p>
              </div>
              {viewJob.job_details?.startRequired && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Start Required
                  </span>
                  <p className="text-gray-900 dark:text-white">
                    {viewJob.job_details.startRequired}
                  </p>
                </div>
              )}
              {viewJob.job_details?.noticePeriod && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Notice Period
                  </span>
                  <p className="text-gray-900 dark:text-white">
                    {viewJob.job_details.noticePeriod}
                  </p>
                </div>
              )}
            </div>

            {/* Skills */}
            {(viewJob.job_details?.skills?.length || 0) > 0 && (
              <div className="card mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {viewJob.job_details!.skills!.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                {(viewJob.job_details?.optionalSkills?.length || 0) > 0 && (
                  <div className="mt-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Optional Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {viewJob.job_details!.optionalSkills!.map(
                        (skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recruitment Process */}
            {(viewJob.recruitment_process?.stages?.length || 0) > 0 && (
              <div className="card mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Recruitment Process
                </h3>
                <div className="space-y-4">
                  {viewJob.recruitment_process!.stages!.map((stage, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-blue-500 pl-4"
                    >
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
              </div>
            )}

            {/* Compensation */}
            {viewJob.compensation && (
              <div className="card mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Compensation & Benefits
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Salary
                    </span>
                    <p className="text-gray-900 dark:text-white">
                      {formatFullSalary(viewJob.job_details?.salary)}
                    </p>
                  </div>
                  {typeof viewJob.compensation.paidHolidays === "number" && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Paid Holidays
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {viewJob.compensation.paidHolidays} days
                      </p>
                    </div>
                  )}
                  {typeof viewJob.compensation.sickPay === "boolean" && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Sick Pay
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {viewJob.compensation.sickPay ? "Yes" : "No"}
                      </p>
                    </div>
                  )}
                  {viewJob.compensation.probationPeriod && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Probation Period
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {viewJob.compensation.probationPeriod}
                      </p>
                    </div>
                  )}
                </div>
                {(viewJob.compensation.benefits?.length || 0) > 0 && (
                  <div className="mt-4">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Benefits
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {viewJob.compensation.benefits!.map((benefit, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-sm"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Perks */}
            {viewJob.perks && (
              <div className="card mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Perks & Benefits
                </h3>
                <div className="space-y-4">
                  {(viewJob.perks.wellnessPrograms?.length || 0) > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Wellness Programs
                      </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {viewJob.perks.wellnessPrograms!.map((p, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded text-sm"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(viewJob.perks.socialEvents?.length || 0) > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Social Events
                      </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {viewJob.perks.socialEvents!.map((p, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded text-sm"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(viewJob.perks.foodAndBeverages?.length || 0) > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Food & Beverages
                      </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {viewJob.perks.foodAndBeverages!.map((p, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-sm"
                          >
                            {p}
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
                        {viewJob.perks.companyCar ? "Yes" : "No"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Transportation
                      </span>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {viewJob.perks.transportation?.drivingLicense && (
                          <div>Driving License Required</div>
                        )}
                        {viewJob.perks.transportation?.personalCar && (
                          <div>Personal Car Required</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legal */}
            {viewJob.legal && (
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Legal Requirements
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Right to Work Check
                    </span>
                    <p className="text-gray-900 dark:text-white">
                      {viewJob.legal.rightToWork ? "Required" : "Not Required"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Background Check
                    </span>
                    <p className="text-gray-900 dark:text-white">
                      {viewJob.legal.backgroundCheck
                        ? "Required"
                        : "Not Required"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      References Required
                    </span>
                    <p className="text-gray-900 dark:text-white">
                      {viewJob.legal.references?.count ?? 0}
                    </p>
                  </div>
                  {(viewJob.legal.references?.type?.length || 0) > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Reference Types
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {viewJob.legal.references!.type!.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-sm"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// View Details Modal
// Render after the main return using a fragment
// eslint-disable-next-line @next/next/no-sync-scripts
