"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface Row {
  id: string;
  candidate_id: string;
  job_id: string;
  status: string;
  created_at: string;
  candidate_name?: string;
  job_title?: string;
  match_score?: number;
}

interface CandidateDetails {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  professional_summary?: string;
  skills?: string[];
  experience?: Array<{
    company: string;
    position: string;
    start_date: string;
    end_date?: string;
    current: boolean;
    description?: string;
    skills_used?: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    start_date: string;
    end_date?: string;
    current: boolean;
  }>;
  languages?: Array<{
    language: string;
    speak: boolean;
    read: boolean;
    write: boolean;
  }>;
}

export default function Applicants() {
  const [rows, setRows] = useState<Row[]>([]);
  const [allRows, setAllRows] = useState<Row[]>([]); // Store all rows for filtering
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateDetails | null>(null);
  const [selectedCandidateStatus, setSelectedCandidateStatus] =
    useState<string>("");
  const [loadingCandidate, setLoadingCandidate] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [availableJobs, setAvailableJobs] = useState<
    Array<{
      id: string;
      title: string;
    }>
  >([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Find this employer's job ids
        const { data: jobs } = await supabase
          .from("job_postings")
          .select("id, job_details")
          .eq("employer_id", user.id);
        const jobIds = (jobs || []).map((j) => j.id);

        // Set available jobs for filter
        const jobsForFilter = (jobs || []).map((job) => ({
          id: job.id,
          title: job.job_details?.title || "Untitled Position",
        }));
        setAvailableJobs(jobsForFilter);
        if (jobIds.length === 0) {
          setRows([]);
          return;
        }
        // Get applications for these jobs
        const { data: apps, error: appsError } = await supabase
          .from("job_applications")
          .select("id, candidate_id, job_id, status, created_at, match_score")
          .in("job_id", jobIds)
          .order("created_at", { ascending: false });

        if (appsError) {
          console.error("Error fetching applications:", appsError);
        } else {
          console.log("Raw applications data:", apps);
        }

        if (apps && apps.length > 0) {
          // Fetch candidate names
          const candidateIds = [
            ...new Set(apps.map((app) => app.candidate_id)),
          ];
          const { data: candidates } = await supabase
            .from("candidate_profiles")
            .select("id, full_name")
            .in("id", candidateIds);

          // Fetch job titles
          const { data: jobDetails } = await supabase
            .from("job_postings")
            .select("id, job_details")
            .in("id", jobIds);

          // Create lookup maps
          const candidateMap = new Map(
            (candidates || []).map((c) => [c.id, c.full_name])
          );
          const jobMap = new Map(
            (jobDetails || []).map((j) => [
              j.id,
              j.job_details?.title || "Untitled Position",
            ])
          );

          // Enrich the applications with names and titles
          const enrichedApps = apps.map((app) => {
            console.log(`Application ${app.id} match_score:`, app.match_score);
            return {
              ...app,
              candidate_name:
                candidateMap.get(app.candidate_id) || "Unknown Candidate",
              job_title: jobMap.get(app.job_id) || "Unknown Job",
              match_score: app.match_score || 0, // Use actual match score from database
            };
          });

          setAllRows(enrichedApps);
          setRows(enrichedApps); // Initially show all rows
        } else {
          setRows([]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter function
  const applyFilters = () => {
    let filtered = allRows;

    if (statusFilter !== "all") {
      filtered = filtered.filter((row) => row.status === statusFilter);
    }

    if (jobFilter !== "all") {
      filtered = filtered.filter((row) => row.job_id === jobFilter);
    }

    setRows(filtered);
  };

  // Helper function to get valid next statuses based on current status
  const getValidNextStatuses = (currentStatus: string) => {
    const statusFlow = {
      pending: [
        { value: "pending", label: "Pending" },
        { value: "reviewed", label: "Under Review" },
        { value: "rejected", label: "Rejected" },
      ],
      reviewed: [
        { value: "reviewed", label: "Under Review" },
        { value: "shortlisted", label: "Shortlisted" },
        { value: "rejected", label: "Rejected" },
      ],
      shortlisted: [
        { value: "shortlisted", label: "Shortlisted" },
        { value: "interviewed", label: "Interviewed" },
        { value: "rejected", label: "Rejected" },
      ],
      interviewed: [
        { value: "interviewed", label: "Interviewed" },
        { value: "accepted", label: "Accepted" },
        { value: "rejected", label: "Rejected" },
      ],
      accepted: [{ value: "accepted", label: "Accepted" }],
      rejected: [{ value: "rejected", label: "Rejected" }],
      withdrawn: [{ value: "withdrawn", label: "Withdrawn" }],
    };

    return (
      statusFlow[currentStatus as keyof typeof statusFlow] || statusFlow.pending
    );
  };

  // Apply filters when filter values change
  useEffect(() => {
    applyFilters();
  }, [statusFilter, jobFilter, allRows]);

  const fetchCandidateDetails = async (
    candidateId: string,
    applicationId: string
  ) => {
    try {
      setLoadingCandidate(true);

      // Get candidate profile
      const { data: candidate, error } = await supabase
        .from("candidate_profiles")
        .select("*")
        .eq("id", candidateId)
        .single();

      if (error) {
        toast.error("Failed to load candidate details");
        return;
      }

      // Get application status
      const { data: application, error: appError } = await supabase
        .from("job_applications")
        .select("status")
        .eq("id", applicationId)
        .single();

      if (appError) {
        console.error("Error fetching application status:", appError);
        setSelectedCandidateStatus("unknown");
      } else {
        setSelectedCandidateStatus(application.status);
      }

      // Parse JSON fields
      const parsedCandidate: CandidateDetails = {
        ...candidate,
        skills: Array.isArray(candidate.skills)
          ? candidate.skills
          : JSON.parse(candidate.skills || "[]"),
        experience: Array.isArray(candidate.experience)
          ? candidate.experience
          : JSON.parse(candidate.experience || "[]"),
        education: Array.isArray(candidate.education)
          ? candidate.education
          : JSON.parse(candidate.education || "[]"),
        languages: Array.isArray(candidate.languages)
          ? candidate.languages
          : JSON.parse(candidate.languages || "[]"),
      };

      setSelectedCandidate(parsedCandidate);
    } catch (error) {
      console.error("Error fetching candidate details:", error);
      toast.error("Failed to load candidate details");
    } finally {
      setLoadingCandidate(false);
    }
  };

  return (
    <div className="p-8">
      <h3 className="text-gray-800 dark:text-gray-100 text-lg font-semibold mb-4">
        Applicants
      </h3>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="reviewed">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interviewed">Interviewed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Job
            </label>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Jobs</option>
              {availableJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter("all");
                setJobFilter("all");
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Filter Results Count */}
      {!loading && allRows.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {rows.length} of {allRows.length} applications
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No applications yet.</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-600 dark:text-gray-400">
                <th className="p-4">Match Score</th>
                <th className="p-4">Candidate</th>
                <th className="p-4">Job</th>
                <th className="p-4">Applied</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-gray-100 dark:border-gray-700"
                >
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        (r.match_score || 0) >= 90
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : (r.match_score || 0) >= 80
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                          : (r.match_score || 0) >= 70
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {r.match_score || 0}%
                    </span>
                  </td>
                  <td className="p-4 text-gray-900 dark:text-white">
                    {r.candidate_name || r.candidate_id}
                  </td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">
                    {r.job_title || r.job_id}
                  </td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">
                    {new Date(r.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="p-4">
                    <div className="relative">
                      <select
                        className="form-select text-sm"
                        disabled={updatingId === r.id}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          if (newStatus === r.status) return;

                          setUpdatingId(r.id);
                          try {
                            await supabase
                              .from("job_applications")
                              .update({ status: newStatus })
                              .eq("id", r.id);
                            setRows((prev) =>
                              prev.map((x) =>
                                x.id === r.id ? { ...x, status: newStatus } : x
                              )
                            );
                            setAllRows((prev) =>
                              prev.map((x) =>
                                x.id === r.id ? { ...x, status: newStatus } : x
                              )
                            );
                          } catch (error) {
                            console.error("Error updating status:", error);
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                        value={r.status}
                      >
                        {getValidNextStatuses(r.status).map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      {updatingId === r.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      className="btn-outline px-3 py-1 text-xs"
                      onClick={() =>
                        fetchCandidateDetails(r.candidate_id, r.id)
                      }
                      disabled={loadingCandidate}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Candidate Details Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Candidate Details
                </h2>
                <button
                  onClick={() => {
                    setSelectedCandidate(null);
                    setSelectedCandidateStatus("");
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {loadingCandidate ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Name
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedCandidate.full_name}
                        </p>
                      </div>

                      {/* Contact Details - Only show if shortlisted or beyond */}
                      {selectedCandidateStatus === "shortlisted" ||
                      selectedCandidateStatus === "interviewed" ||
                      selectedCandidateStatus === "accepted" ? (
                        <>
                          <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Email
                            </label>
                            <p className="text-gray-900 dark:text-white">
                              {selectedCandidate.email}
                            </p>
                          </div>
                          {selectedCandidate.phone_number && (
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Phone
                              </label>
                              <p className="text-gray-900 dark:text-white">
                                {selectedCandidate.phone_number}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="col-span-2">
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <div className="flex items-center">
                              <svg
                                className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                                Contact details are only available for
                                shortlisted candidates and beyond. Update the
                                application status to &ldquo;Shortlisted&rdquo;
                                to view contact information. The candidate will
                                be notified of any status changes.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Professional Summary */}
                  {selectedCandidate.professional_summary && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Professional Summary
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        {selectedCandidate.professional_summary}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {selectedCandidate.skills &&
                    selectedCandidate.skills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedCandidate.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Experience */}
                  {selectedCandidate.experience &&
                    selectedCandidate.experience.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Experience
                        </h3>
                        <div className="space-y-4">
                          {selectedCandidate.experience.map((exp, index) => (
                            <div
                              key={index}
                              className="border-l-4 border-blue-500 pl-4"
                            >
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {exp.position}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400">
                                {exp.company}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-500">
                                {exp.start_date} -{" "}
                                {exp.current ? "Present" : exp.end_date}
                              </p>
                              {exp.description && (
                                <p className="text-gray-700 dark:text-gray-300 mt-2">
                                  {exp.description}
                                </p>
                              )}
                              {exp.skills_used &&
                                exp.skills_used.length > 0 && (
                                  <div className="mt-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-500">
                                      Skills used:{" "}
                                    </span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {exp.skills_used.join(", ")}
                                    </span>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Education */}
                  {selectedCandidate.education &&
                    selectedCandidate.education.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Education
                        </h3>
                        <div className="space-y-4">
                          {selectedCandidate.education.map((edu, index) => (
                            <div
                              key={index}
                              className="border-l-4 border-green-500 pl-4"
                            >
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {edu.degree}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400">
                                {edu.institution}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-500">
                                {edu.start_date} -{" "}
                                {edu.current ? "Present" : edu.end_date}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Languages */}
                  {selectedCandidate.languages &&
                    selectedCandidate.languages.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Languages
                        </h3>
                        <div className="space-y-2">
                          {selectedCandidate.languages.map((lang, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-4"
                            >
                              <span className="font-medium text-gray-900 dark:text-white">
                                {lang.language}
                              </span>
                              <div className="flex gap-2 text-sm">
                                {lang.speak && (
                                  <span className="text-green-600 dark:text-green-400">
                                    Speak
                                  </span>
                                )}
                                {lang.read && (
                                  <span className="text-blue-600 dark:text-blue-400">
                                    Read
                                  </span>
                                )}
                                {lang.write && (
                                  <span className="text-purple-600 dark:text-purple-400">
                                    Write
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
