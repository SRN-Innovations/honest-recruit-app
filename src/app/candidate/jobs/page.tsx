"use client";

import { useEffect, useState } from "react";

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

interface EmployerProfile {
  id: string;
  company_name: string;
  location: string;
  industry: string;
  business_email: string;
  phone_number: string;
  company_description: string;
  website: string;
  employee_count: number;
  linkedin_url: string;
  twitter_url: string;
  facebook_url: string;
  instagram_url: string;
  registration_number: string;
  founded_year: number;
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
  const [employerProfile, setEmployerProfile] =
    useState<EmployerProfile | null>(null);

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

      // Fetch employer profile information
      if (data.employer_id) {
        const { data: employerData, error: employerError } = await supabase
          .from("employer_profiles")
          .select("*")
          .eq("id", data.employer_id)
          .single();

        if (employerError) {
          console.error("Error fetching employer profile:", employerError);
          // Don't show error to user as this is not critical
        } else {
          setEmployerProfile(employerData);
        }
      }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                              {match.job.optional_skills.map((skill, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                >
                                  {skill}
                                </span>
                              ))}
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
      {viewJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {viewJob.job_details?.title || "Job Details"}
              </h2>
              <button
                onClick={() => {
                  setViewJob(null);
                  setEmployerProfile(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            {/* Meta */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Role Type */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                      />
                    </svg>
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Role Type
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {viewJob.job_details?.roleType || "Not specified"}
                  </p>
                </div>

                {/* Location */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Location
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                    {viewJob.job_details?.location || "Not specified"}
                  </p>
                </div>

                {/* Salary */}
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-purple-600 dark:text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Salary
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                    {formatFullSalary(viewJob.job_details?.salary)}
                  </p>
                </div>
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

            {/* Company Details */}
            {employerProfile && (
              <div className="card mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  About {employerProfile.company_name}
                </h3>

                {employerProfile.company_description && (
                  <div className="mb-4">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {employerProfile.company_description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {employerProfile.industry && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Industry
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {employerProfile.industry}
                      </p>
                    </div>
                  )}

                  {employerProfile.location && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Company Location
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {employerProfile.location}
                      </p>
                    </div>
                  )}

                  {employerProfile.employee_count && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Company Size
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {employerProfile.employee_count} employees
                      </p>
                    </div>
                  )}

                  {employerProfile.founded_year && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Founded
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {employerProfile.founded_year}
                      </p>
                    </div>
                  )}

                  {employerProfile.website && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Website
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        <a
                          href={
                            employerProfile.website.startsWith("http")
                              ? employerProfile.website
                              : `https://${employerProfile.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {employerProfile.website}
                        </a>
                      </p>
                    </div>
                  )}

                  {employerProfile.business_email && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Contact Email
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {employerProfile.business_email}
                      </p>
                    </div>
                  )}
                </div>

                {/* Social Media Links */}
                {(employerProfile.linkedin_url ||
                  employerProfile.twitter_url ||
                  employerProfile.facebook_url ||
                  employerProfile.instagram_url) && (
                  <div className="mt-4">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Follow Us
                    </span>
                    <div className="flex gap-3 mt-2">
                      {employerProfile.linkedin_url && (
                        <a
                          href={employerProfile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          aria-label="LinkedIn"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.032-3.047-1.032 0-1.26 1.017-1.26 2.912v5.704h-3.554V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </a>
                      )}
                      {employerProfile.twitter_url && (
                        <a
                          href={employerProfile.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-200"
                          aria-label="Twitter"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                          </svg>
                        </a>
                      )}
                      {employerProfile.facebook_url && (
                        <a
                          href={employerProfile.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          aria-label="Facebook"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </a>
                      )}
                      {employerProfile.instagram_url && (
                        <a
                          href={employerProfile.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-300"
                          aria-label="Instagram"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.49.49-1.297.49-1.787 0-.49-.49-.49-1.297 0-1.787.49-.49 1.297-.49 1.787 0 .49.49.49 1.297 0 1.787z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick facts */}
            <div className="card mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Job Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
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
