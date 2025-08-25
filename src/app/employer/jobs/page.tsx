"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
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
  applicationCount?: number;
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

      const { data: jobPostings, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("employer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

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
              return { ...job, applicationCount: 0 };
            }

            return { ...job, applicationCount: count || 0 };
          })
        );

        setJobs(jobsWithCounts);
      } else {
        setJobs([]);
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
      // Validate the new status
      const validStatuses = ["active", "paused", "closed"];
      if (!validStatuses.includes(newStatus)) {
        toast.error("Invalid status value");
        return;
      }

      // First, let's check if the job exists and get its current data
      const { data: currentJob, error: fetchError } = await supabase
        .from("job_postings")
        .select("id, status, employer_id")
        .eq("id", jobId)
        .single();

      if (fetchError) {
        toast.error("Failed to fetch job data");
        return;
      }

      // Verify the user owns this job
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || currentJob.employer_id !== user.id) {
        toast.error("You don't have permission to update this job");
        return;
      }

      // Now update the status
      const { error } = await supabase
        .from("job_postings")
        .update({ status: newStatus })
        .eq("id", jobId)
        .eq("employer_id", user.id)
        .select();

      if (error) {
        toast.error(`Update failed: ${error.message}`);
        return;
      }

      // Update local state immediately
      setJobs(
        jobs.map((job) =>
          job.id === jobId ? { ...job, status: newStatus } : job
        )
      );

      toast.success("Job status updated successfully");

      // Refresh the jobs list to ensure we have the latest data
      setTimeout(() => {
        fetchJobs();
      }, 500);
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
        <Link href="/employer/jobs/post" className="btn-primary">
          Post New Job
        </Link>
      </div>

      <div className="grid gap-6">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div className="flex-1 min-w-0">
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
              <div className="flex items-center gap-3 flex-shrink-0">
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
                  href={`/employer/jobs/${job.id}`}
                  className="btn-secondary whitespace-nowrap px-4 py-2"
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
                <span>{job.applicationCount || 0} Applications</span>
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
