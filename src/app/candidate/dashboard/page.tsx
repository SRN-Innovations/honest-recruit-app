"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { toast } from "react-hot-toast";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
  return `${Math.ceil(diffDays / 365)} years ago`;
};

interface JobMatch {
  job: {
    id: string;
    title: string;
    company_name: string;
    location: string;
    role_type: string;
    employment_type: string;
    working_hours: string;
    salary_min?: number;
    salary_max?: number;
    created_at: string;
  };
  score: number;
  matchReasons: string[];
}

interface ApplicationStatus {
  total: number;
  pending: number;
  reviewed: number;
  interviewed: number;
}

export default function CandidateDashboard() {
  const [matchedJobs, setMatchedJobs] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationStats, setApplicationStats] = useState<ApplicationStatus>({
    total: 0,
    pending: 0,
    reviewed: 0,
    interviewed: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Get the current user's ID
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          throw new Error("No authenticated user found");
        }

        // Fetch user's applications first to filter out already applied jobs
        const { data: userApplications, error: applicationsError } =
          await supabase
            .from("job_applications")
            .select("job_id")
            .eq("candidate_id", session.user.id);

        if (applicationsError) throw applicationsError;

        const appliedJobIds = new Set(
          (userApplications || []).map((app) => app.job_id)
        );

        // Fetch matched jobs using the edge function
        try {
          const { data, error } = await supabase.functions.invoke(
            "match-jobs",
            {
              body: { candidateId: session.user.id },
            }
          );

          if (error) throw error;

          const response = data;
          const matches = response.matches || [];

          // Filter out jobs that have already been applied for
          const availableMatches = matches.filter(
            (match: JobMatch) => !appliedJobIds.has(match.job.id)
          );

          // Limit to 5 jobs for dashboard display
          setMatchedJobs(availableMatches.slice(0, 5));
        } catch (edgeFunctionError) {
          console.log(
            "Edge function failed, using fallback:",
            edgeFunctionError
          );
          // Fallback: Direct database query for active jobs
          const { data: jobPostings, error: jobsError } = await supabase
            .from("job_postings")
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: false });

          if (jobsError) throw jobsError;

          // Filter out already applied jobs in fallback too
          const availableJobs = (jobPostings || []).filter(
            (job) => !appliedJobIds.has(job.id)
          );

          const fallbackMatches: JobMatch[] = availableJobs
            .slice(0, 5)
            .map((job) => ({
              job: {
                ...job,
                title: job.title || job.job_title || "Untitled Position",
                company_name:
                  job.company_name || job.company || "Company Not Specified",
                role_type: job.job_details?.roleType || "Not Specified",
                employment_type:
                  job.job_details?.employmentType || "Not Specified",
                working_hours: job.job_details?.workingHours || "Not Specified",
                salary_min: job.job_details?.salary?.min,
                salary_max: job.job_details?.salary?.max,
                created_at: job.created_at,
              },
              score: 50,
              matchReasons: ["Job available for application"],
            }));

          setMatchedJobs(fallbackMatches);
        }

        // Fetch application statistics
        const { data: stats, error: statsError } = await supabase
          .from("job_applications")
          .select("status")
          .eq("candidate_id", session.user.id);

        if (statsError) throw statsError;

        // Calculate statistics
        const applicationStats = {
          total: stats?.length || 0,
          pending: stats?.filter((app) => app.status === "pending").length || 0,
          reviewed:
            stats?.filter((app) => app.status === "reviewed").length || 0,
          interviewed:
            stats?.filter((app) => app.status === "interviewed").length || 0,
        };

        setApplicationStats(applicationStats);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#F1FFE4] dark:bg-[#1E2A1E] rounded-2xl p-6">
          <h3 className="text-gray-800 dark:text-gray-100 text-lg font-semibold mb-4">
            Total Applications
          </h3>
          <div className="flex items-end justify-between">
            <span className="text-gray-900 dark:text-white text-4xl font-bold">
              {applicationStats.total}
            </span>
          </div>
        </div>

        <div className="bg-[#F4F1FF] dark:bg-[#1E1A2E] rounded-2xl p-6">
          <h3 className="text-gray-800 dark:text-gray-100 text-lg font-semibold mb-4">
            Under Review
          </h3>
          <div className="flex items-end justify-between">
            <span className="text-gray-900 dark:text-white text-4xl font-bold">
              {applicationStats.reviewed}
            </span>
          </div>
        </div>

        <div className="bg-[#FFF8E6] dark:bg-[#2A2518] rounded-2xl p-6">
          <h3 className="text-gray-800 dark:text-gray-100 text-lg font-semibold mb-4">
            Interviews
          </h3>
          <div className="flex items-end justify-between">
            <span className="text-gray-900 dark:text-white text-4xl font-bold">
              {applicationStats.interviewed}
            </span>
          </div>
        </div>
      </div>

      {/* Matched Jobs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-gray-900 dark:text-white text-xl font-semibold">
            Jobs You Can Apply For
          </h3>
          <Link
            href="/candidate/jobs"
            className="text-[#00A3FF] hover:text-[#0082CC]"
          >
            Browse All Jobs
          </Link>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">
                Finding jobs that match your profile...
              </p>
            </div>
          ) : matchedJobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No high-quality job matches found. Update your profile
                preferences to see more opportunities!
              </p>
            </div>
          ) : (
            matchedJobs.map((match) => (
              <div
                key={match.job.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {match.job.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {match.job.company_name}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          match.score >= 95
                            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                        }`}
                      >
                        {match.score}% Match
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{match.job.location}</span>
                      <span>{match.job.role_type}</span>
                      <span>{match.job.employment_type}</span>
                      <span>{match.job.working_hours}</span>
                      {match.job.salary_min && match.job.salary_max && (
                        <span>
                          £{match.job.salary_min.toLocaleString()} - £
                          {match.job.salary_max.toLocaleString()}
                        </span>
                      )}
                      <span>Posted {formatDate(match.job.created_at)}</span>
                    </div>
                    {match.matchReasons.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Why this matches you:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {match.matchReasons
                            .slice(0, 2)
                            .map((reason, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100"
                              >
                                {reason}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Link href="/candidate/jobs" className="btn-primary ml-4">
                    Browse Jobs
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
