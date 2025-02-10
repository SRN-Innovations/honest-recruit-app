"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { toast } from "react-hot-toast";

interface JobListing {
  id: string;
  title: string;
  company_name: string;
  location: string;
  salary_range: string;
  posted_date: string;
}

interface ApplicationStatus {
  total: number;
  pending: number;
  reviewed: number;
  interviewed: number;
}

export default function CandidateDashboard() {
  const [recentJobs, setRecentJobs] = useState<JobListing[]>([]);
  const [applicationStats, setApplicationStats] = useState<ApplicationStatus>({
    total: 0,
    pending: 0,
    reviewed: 0,
    interviewed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent job listings
        const { data: jobs, error: jobsError } = await supabase
          .from("job_listings")
          .select("*")
          .limit(5)
          .order("created_at", { ascending: false });

        if (jobsError) throw jobsError;
        setRecentJobs(jobs || []);

        // Fetch application statistics
        const { data: stats, error: statsError } = await supabase
          .from("job_applications")
          .select("status")
          .eq("candidate_id", "current_user_id"); // Replace with actual user ID

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
        setIsLoading(false);
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

      {/* Recent Job Listings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-gray-900 dark:text-white text-xl font-semibold">
            Recent Job Listings
          </h3>
          <Link
            href="/candidate/dashboard/jobs"
            className="text-[#00A3FF] hover:text-[#0082CC]"
          >
            View All
          </Link>
        </div>

        <div className="space-y-4">
          {recentJobs.map((job) => (
            <div
              key={job.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {job.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {job.company_name}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{job.location}</span>
                    <span>{job.salary_range}</span>
                    <span>Posted {job.posted_date}</span>
                  </div>
                </div>
                <Link
                  href={`/candidate/dashboard/jobs/${job.id}`}
                  className="btn-primary"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
