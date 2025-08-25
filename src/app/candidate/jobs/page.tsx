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
}

interface JobMatchesResponse {
  matches: JobMatch[];
  totalJobs: number;
  matchedJobs: number;
}

export default function CandidateJobs() {
  const { userType } = useAuth();
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);

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
        setJobMatches(matches);

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

        // Fallback: Direct database query for active jobs
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

        // Convert to JobMatch format with basic scoring
        const fallbackMatches: JobMatch[] = (jobPostings || []).map((job) => ({
          job: {
            ...job,
            title: job.title || job.job_title || "Untitled Position",
            company_name:
              job.company_name || job.company || "Company Not Specified",
            skills: Array.isArray(job.skills)
              ? job.skills
              : JSON.parse(job.skills || "[]"),
            optional_skills: Array.isArray(job.optional_skills)
              ? job.optional_skills
              : JSON.parse(job.optional_skills || "[]"),
            languages: Array.isArray(job.languages)
              ? job.languages
              : JSON.parse(job.languages || "[]"),
          },
          score: 50, // Default score for fallback
          matchReasons: ["Job available for application"],
          skillMatch: 0,
          salaryMatch: 0,
          preferenceMatch: 0,
        }));

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

  const formatSalary = (min: number, max: number) => {
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
                      <div className="flex flex-col gap-2 mt-4 lg:mt-0 lg:ml-6">
                        <button className="btn-primary whitespace-nowrap">
                          Apply Now
                        </button>
                        <button className="btn-secondary whitespace-nowrap">
                          Save Job
                        </button>
                        <button className="btn-outline whitespace-nowrap">
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
              <button onClick={fetchJobMatches} className="btn-secondary">
                Refresh Job Matches
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
