"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

interface JobPosting {
  id: string;
  employer_id: string;
  job_details: {
    title: string;
    description: string;
    location: string;
    roleType: string;
  };
  recruitment_process: {
    stages: {
      name: string;
      type: string;
    }[];
    applicationLimit: number;
    expiryDate: string;
  };
  status: string;
  created_at: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("employer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setJobs(data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("job_postings")
        .update({ status: newStatus })
        .eq("id", jobId);

      if (error) throw error;

      setJobs(
        jobs.map((job) =>
          job.id === jobId ? { ...job, status: newStatus } : job
        )
      );

      toast.success("Job status updated successfully");
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error("Failed to update job status");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Posted Jobs
        </h1>
        <Link href="/employer/dashboard/jobs/post" className="btn-primary">
          Post New Job
        </Link>
      </div>

      <div className="grid gap-6">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {job.job_details.title}
                </h2>
                <p className="mt-1 text-gray-600 dark:text-gray-300">
                  {job.job_details.roleType} • {job.job_details.location}
                </p>
                <p className="mt-2 text-gray-600 dark:text-gray-400 line-clamp-2">
                  {job.job_details.description}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={job.status}
                  onChange={(e) => handleStatusChange(job.id, e.target.value)}
                  className="form-select min-w-[120px]"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
                <Link
                  href={`/employer/dashboard/jobs/${job.id}`}
                  className="btn-secondary"
                >
                  View Details
                </Link>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  Posted {format(new Date(job.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>0 Applications</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>
                  {job.recruitment_process.stages.length} Interview Stages
                </span>
              </div>
            </div>
          </div>
        ))}

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No jobs posted yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Get started by posting your first job
            </p>
            <Link
              href="/employer/dashboard/jobs/post"
              className="btn-primary mt-4 inline-block"
            >
              Post a Job
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
