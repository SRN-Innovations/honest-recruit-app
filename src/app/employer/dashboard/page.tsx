"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { supabase } from "@/lib/supabase";

function Dashboard() {
  const [stats, setStats] = useState({
    totalApplications: 0,
    totalApplicationsChange: 0,
    pending: 0,
    pendingChange: 0,
    underReview: 0,
    underReviewChange: 0,
    shortlisted: 0,
    shortlistedChange: 0,
    onBoarded: 0,
    onBoardedChange: 0,
  });

  const [recentJobs, setRecentJobs] = useState<
    Array<{
      id: string;
      title: string;
      company_name: string;
      created_at: string;
      applicationCount: number;
    }>
  >([]);

  const loadDashboardData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: jobs } = await supabase
      .from("job_postings")
      .select("id")
      .eq("employer_id", user.id);
    const jobIds = (jobs || []).map((j) => j.id);
    if (jobIds.length === 0) return;
    const { data: apps } = await supabase
      .from("job_applications")
      .select("status, created_at")
      .in("job_id", jobIds);

    console.log("Raw applications data:", apps);

    const total = apps?.length || 0;
    const pending = apps?.filter((a) => a.status === "pending").length || 0;
    const underReview =
      apps?.filter((a) => a.status === "reviewed").length || 0;
    const shortlisted =
      apps?.filter((a) => a.status === "shortlisted").length || 0;
    const onBoarded = apps?.filter((a) => a.status === "accepted").length || 0;

    console.log("Calculated stats:", {
      total,
      pending,
      underReview,
      shortlisted,
      onBoarded,
    });

    setStats((s) => ({
      ...s,
      totalApplications: total,
      pending,
      underReview,
      shortlisted,
      onBoarded,
    }));

    // Fetch recent jobs with application counts
    if (jobIds.length > 0) {
      const { data: jobPostings } = await supabase
        .from("job_postings")
        .select("id, job_details, created_at")
        .in("id", jobIds)
        .order("created_at", { ascending: false })
        .limit(5);

      if (jobPostings) {
        // Fetch application counts for each job
        const jobsWithCounts = await Promise.all(
          jobPostings.map(async (job) => {
            const { count, error: countError } = await supabase
              .from("job_applications")
              .select("*", { count: "exact", head: true })
              .eq("job_id", job.id);

            if (countError) {
              console.error(
                `Error fetching count for job ${job.id}:`,
                countError
              );
              return {
                id: job.id,
                title: job.job_details?.title || "Untitled Position",
                company_name: "Your Company", // We'll get this from employer profile
                created_at: job.created_at,
                applicationCount: 0,
              };
            }

            return {
              id: job.id,
              title: job.job_details?.title || "Untitled Position",
              company_name: "Your Company", // We'll get this from employer profile
              created_at: job.created_at,
              applicationCount: count || 0,
            };
          })
        );

        setRecentJobs(jobsWithCounts);
      }
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="p-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-[#F1FFE4] dark:bg-[#1E2A1E] rounded-2xl p-6">
          <h3 className="text-gray-800 dark:text-gray-100 text-lg font-semibold mb-4">
            Total Applications
          </h3>
          <div className="flex items-end justify-between">
            <span className="text-gray-900 dark:text-white text-4xl font-bold">
              {stats.totalApplications}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              Today {stats.totalApplicationsChange}% ↗
            </span>
          </div>
        </div>

        <div className="bg-[#FFE6E6] dark:bg-[#3A1A1A] rounded-2xl p-6">
          <h3 className="text-gray-800 dark:text-gray-100 text-lg font-semibold mb-4">
            Pending
          </h3>
          <div className="flex items-end justify-between">
            <span className="text-gray-900 dark:text-white text-4xl font-bold">
              {stats.pending}
            </span>
            <span className="text-red-600 dark:text-red-400">
              Today {stats.pendingChange}% ↗
            </span>
          </div>
        </div>

        <div className="bg-[#E6F3FF] dark:bg-[#1A2A3A] rounded-2xl p-6">
          <h3 className="text-gray-800 dark:text-gray-100 text-lg font-semibold mb-4">
            Under Review
          </h3>
          <div className="flex items-end justify-between">
            <span className="text-gray-900 dark:text-white text-4xl font-bold">
              {stats.underReview}
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              Today {stats.underReviewChange}% ↗
            </span>
          </div>
        </div>

        <div className="bg-[#F4F1FF] dark:bg-[#1E1A2E] rounded-2xl p-6">
          <h3 className="text-gray-800 dark:text-gray-100 text-lg font-semibold mb-4">
            Shortlisted
          </h3>
          <div className="flex items-end justify-between">
            <span className="text-gray-900 dark:text-white text-4xl font-bold">
              {stats.shortlisted}
            </span>
            <span className="text-purple-600 dark:text-purple-400">
              Today {stats.shortlistedChange}% ↘
            </span>
          </div>
        </div>

        <div className="bg-[#FFF8E6] dark:bg-[#2A2518] rounded-2xl p-6">
          <h3 className="text-gray-800 dark:text-gray-100 text-lg font-semibold mb-4">
            Hired
          </h3>
          <div className="flex items-end justify-between">
            <span className="text-gray-900 dark:text-white text-4xl font-bold">
              {stats.onBoarded}
            </span>
            <span className="text-yellow-600 dark:text-yellow-400">
              Today {stats.onBoardedChange}% ↗
            </span>
          </div>
        </div>
      </div>

      {/* Recent Jobs Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-gray-900 dark:text-white text-xl font-semibold">
            Recent Job Postings
          </h3>
          <Link
            href="/employer/jobs"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View All Jobs
          </Link>
        </div>

        {recentJobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No job postings yet. Create your first job posting to get started!
            </p>
            <Link
              href="/employer/jobs/post"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Post a Job
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="text-gray-900 dark:text-white font-semibold">
                    {job.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Posted on {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {job.applicationCount}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Applications
                    </div>
                  </div>
                  <a
                    href={`/employer/jobs/${job.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    View Details
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
