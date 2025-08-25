"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface ApplicationRow {
  id: string;
  job_id: string;
  status: string;
  created_at: string;
}

interface AppWithJob {
  id: string;
  status: string;
  created_at: string;
  job: {
    id: string;
    title: string;
    company_name: string;
    location: string;
  };
}

export default function CandidateApplications() {
  const [apps, setApps] = useState<AppWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [confirmAppId, setConfirmAppId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch applications for this candidate
        const { data: rows, error } = await supabase
          .from("job_applications")
          .select("id, job_id, status, created_at")
          .eq("candidate_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;

        const jobIds = Array.from(new Set((rows || []).map((r) => r.job_id)));
        let jobs: any[] = [];
        if (jobIds.length > 0) {
          const { data: jobRows, error: jobErr } = await supabase
            .from("job_postings")
            .select("id, employer_id, job_details")
            .in("id", jobIds);
          if (jobErr) throw jobErr;
          jobs = jobRows || [];
        }
        // Fetch employer company names
        const employerIds = Array.from(
          new Set(jobs.map((j) => j.employer_id).filter(Boolean))
        );
        let employerIdToCompany: Record<string, string> = {};
        if (employerIds.length > 0) {
          const { data: employers, error: empErr } = await supabase
            .from("employer_profiles")
            .select("id, company_name")
            .in("id", employerIds);
          if (empErr) throw empErr;
          employerIdToCompany = (employers || []).reduce(
            (acc: Record<string, string>, e: any) => {
              acc[e.id] = e.company_name;
              return acc;
            },
            {}
          );
        }

        const idToJob = new Map(
          jobs.map((j) => [
            j.id,
            {
              id: j.id,
              title:
                j.job_details?.title ||
                j.title ||
                j.job_title ||
                "Untitled Position",
              company_name:
                employerIdToCompany[j.employer_id as string] ||
                "Company Not Specified",
              location:
                j.job_details?.location ||
                j.location ||
                "Location not specified",
            },
          ])
        );

        const combined: AppWithJob[] = (rows || []).map(
          (r: ApplicationRow) => ({
            id: r.id,
            status: r.status,
            created_at: r.created_at,
            job: idToJob.get(r.job_id) || {
              id: r.job_id,
              title: "Untitled Position",
              company_name: "Company Not Specified",
              location: "Location not specified",
            },
          })
        );
        setApps(combined);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load applications");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Prevent background scroll when confirm modal is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    if (confirmAppId) {
      body.classList.add("overflow-hidden");
    } else {
      body.classList.remove("overflow-hidden");
    }
    return () => {
      body.classList.remove("overflow-hidden");
    };
  }, [confirmAppId]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        My Applications
      </h1>
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-300">
          You haven't applied to any jobs yet.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-600 dark:text-gray-400">
                <th className="p-4">Position</th>
                <th className="p-4">Company</th>
                <th className="p-4">Location</th>
                <th className="p-4">Applied</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-gray-100 dark:border-gray-700"
                >
                  <td className="p-4 text-gray-900 dark:text-white">
                    {a.job.title}
                  </td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">
                    {a.job.company_name}
                  </td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">
                    {a.job.location}
                  </td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">
                    {formatDate(a.created_at)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        a.status === "pending"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                          : a.status === "reviewed"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : a.status === "interviewed"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          : a.status === "accepted"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : a.status === "rejected"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {a.status.replace(/^./, (c) => c.toUpperCase())}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {!["accepted", "rejected"].includes(a.status) && (
                        <button
                          className="btn-danger px-3 py-1 text-xs disabled:opacity-60"
                          disabled={withdrawingId === a.id}
                          onClick={() => setConfirmAppId(a.id)}
                        >
                          {withdrawingId === a.id
                            ? "Withdrawing..."
                            : "Withdraw"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {confirmAppId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Withdraw application?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              This will notify the employer and you will no longer be considered
              for this role.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="btn-outline"
                onClick={() => setConfirmAppId(null)}
              >
                Cancel
              </button>
              <button
                className="btn-danger disabled:opacity-60"
                disabled={withdrawingId === confirmAppId}
                onClick={async () => {
                  try {
                    setWithdrawingId(confirmAppId);
                    const { error } = await supabase
                      .from("job_applications")
                      .update({ status: "rejected" })
                      .eq("id", confirmAppId);
                    if (error) throw error;
                    setApps((prev) =>
                      prev.map((x) =>
                        x.id === confirmAppId ? { ...x, status: "rejected" } : x
                      )
                    );
                    setConfirmAppId(null);
                    toast.success("Application withdrawn");
                  } catch (e) {
                    console.error(e);
                    toast.error("Failed to withdraw application");
                  } finally {
                    setWithdrawingId(null);
                  }
                }}
              >
                {withdrawingId === confirmAppId ? "Withdrawing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
