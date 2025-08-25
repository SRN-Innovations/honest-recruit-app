"use client";

import { EMPLOYMENT_TYPES, WORKING_HOURS } from "@/lib/constants";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface CandidateProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  date_of_birth: string | null;
  gender: string | null;
  nationality: string;
  right_to_work: {
    status: string;
    visa_type?: string;
    visa_expiry?: string;
  };
  professional_summary?: string;
  preferred_role_types?: string[];
  preferred_employment_types?: string[];
  preferred_location_types?: string[];
  preferred_working_hours?: string[];
  salary_expectations?: {
    type: "exact" | "range";
    exact?: number;
    min?: number;
    max?: number;
  };
  skills?: string[];
  languages?: Array<{
    language: string;
    speak: boolean;
    read: boolean;
    write: boolean;
  }>;
  experience?: Array<{
    id: string;
    company: string;
    position: string;
    start_date: string;
    end_date?: string;
    current: boolean;
    description: string;
    skills_used: string[];
  }>;
  education?: Array<{
    id: string;
    institution: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date?: string;
    current: boolean;
    description?: string;
  }>;
  certifications?: Array<{
    id: string;
    name: string;
    issuing_organization: string;
    issue_date: string;
    expiry_date?: string;
    credential_id?: string;
    credential_url?: string;
  }>;
  open_for_work?: boolean;
  discoverable?: boolean;
  show_email_in_search?: boolean;
  show_phone_in_search?: boolean;
}

interface RoleType {
  id: number;
  name: string;
}

interface SearchFilters {
  roleTypes: string[];
  skills: string[];
  location: string;
  employmentTypes: string[];
  workingHours: string[];
  salaryMin: number;
  salaryMax: number;
  keywords: string;
}

interface SearchResult {
  candidate: CandidateProfile;
  matchScore: number;
  matchReasons: string[];
  breakdown: {
    role: { matched: boolean; reason: string };
    skills: {
      matched: number;
      total: number;
      matchedSkills: string[];
      missingSkills: string[];
    };
    location: { matched: boolean; reason: string };
    employment: { matched: boolean; reason: string };
    hours: { matched: boolean; reason: string };
    salary: { matched: boolean; reason: string };
  };
}

function CandidateSearch() {
  const [candidates, setCandidates] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [roleTypesOpen, setRoleTypesOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [employmentTypesOpen, setEmploymentTypesOpen] = useState(false);
  const [workingHoursOpen, setWorkingHoursOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    roleTypes: [],
    skills: [],
    location: "",
    employmentTypes: [],
    workingHours: [],
    salaryMin: 0,
    salaryMax: 0,
    keywords: "",
  });

  useEffect(() => {
    fetchRoleTypes();
    fetchAvailableSkills();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".dropdown-container")) {
        setRoleTypesOpen(false);
        setSkillsOpen(false);
        setEmploymentTypesOpen(false);
        setWorkingHoursOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchRoleTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("role_types")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setRoleTypes(data || []);
    } catch (error) {
      console.error("Error fetching role types:", error);
    }
  };

  const fetchAvailableSkills = async () => {
    try {
      const { data, error } = await supabase
        .from("role_skills")
        .select("skill_name")
        .order("skill_name");

      if (error) throw error;
      const skills = [...new Set((data || []).map((item) => item.skill_name))];
      setAvailableSkills(skills);
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  const searchCandidates = async () => {
    setLoading(true);
    try {
      // Call the search-candidates edge function
      const { data, error } = await supabase.functions.invoke(
        "search-candidates",
        {
          body: { filters },
        }
      );

      if (error) {
        console.error("Error calling search function:", error);
        throw error;
      }

      if (data?.results) {
        setCandidates(data.results);
      } else {
        setCandidates([]);
      }
    } catch (error) {
      console.error("Error searching candidates:", error);
      toast.error("Failed to search candidates");
    } finally {
      setLoading(false);
    }
  };

  const isSearchValid = () => {
    // Check if all required fields are filled
    const hasRoleTypes = filters.roleTypes.length > 0;
    const hasEmploymentTypes = filters.employmentTypes.length > 0;
    const hasWorkingHours = filters.workingHours.length > 0;

    // All required filters must be specified
    return hasRoleTypes && hasEmploymentTypes && hasWorkingHours;
  };

  const getContactInfo = (candidate: CandidateProfile) => {
    const contactInfo = [];

    if (candidate.show_email_in_search) {
      contactInfo.push(`Email: ${candidate.email}`);
    }

    if (candidate.show_phone_in_search) {
      contactInfo.push(`Phone: ${candidate.phone_number}`);
    }

    if (contactInfo.length === 0) {
      contactInfo.push("Contact details not shared");
    }

    return contactInfo;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Candidate Search
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find qualified candidates based on your requirements
        </p>
      </div>

      {/* Search Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Search Filters
        </h2>
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Required Filters
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Fields marked with <span className="text-red-500">*</span> are
                required filters. Candidates must match these criteria to appear
                in search results. Other filters are used for scoring and
                ranking.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Role Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role Types <span className="text-red-500">*</span>
            </label>
            <div className="relative dropdown-container">
              <button
                type="button"
                onClick={() => setRoleTypesOpen(!roleTypesOpen)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left flex justify-between items-center"
              >
                <span>
                  {filters.roleTypes.length > 0
                    ? `${filters.roleTypes.length} selected`
                    : "Select role types"}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    roleTypesOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {roleTypesOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {roleTypes.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.roleTypes.includes(role.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters((prev) => ({
                              ...prev,
                              roleTypes: [...prev.roleTypes, role.name],
                            }));
                          } else {
                            setFilters((prev) => ({
                              ...prev,
                              roleTypes: prev.roleTypes.filter(
                                (type) => type !== role.name
                              ),
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{role.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Required Skills
            </label>
            <div className="relative dropdown-container">
              <button
                type="button"
                onClick={() => setSkillsOpen(!skillsOpen)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left flex justify-between items-center"
              >
                <span>
                  {filters.skills.length > 0
                    ? `${filters.skills.length} selected`
                    : "Select skills"}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    skillsOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {skillsOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {availableSkills.map((skill) => (
                    <label
                      key={skill}
                      className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.skills.includes(skill)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters((prev) => ({
                              ...prev,
                              skills: [...prev.skills, skill],
                            }));
                          } else {
                            setFilters((prev) => ({
                              ...prev,
                              skills: prev.skills.filter((s) => s !== skill),
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{skill}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="City, State, or Country"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Employment Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Employment Types <span className="text-red-500">*</span>
            </label>
            <div className="relative dropdown-container">
              <button
                type="button"
                onClick={() => setEmploymentTypesOpen(!employmentTypesOpen)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left flex justify-between items-center"
              >
                <span>
                  {filters.employmentTypes.length > 0
                    ? `${filters.employmentTypes.length} selected`
                    : "Select employment types"}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    employmentTypesOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {employmentTypesOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {EMPLOYMENT_TYPES.map((type) => (
                    <label
                      key={type}
                      className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.employmentTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters((prev) => ({
                              ...prev,
                              employmentTypes: [...prev.employmentTypes, type],
                            }));
                          } else {
                            setFilters((prev) => ({
                              ...prev,
                              employmentTypes: prev.employmentTypes.filter(
                                (t) => t !== type
                              ),
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Working Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Working Hours <span className="text-red-500">*</span>
            </label>
            <div className="relative dropdown-container">
              <button
                type="button"
                onClick={() => setWorkingHoursOpen(!workingHoursOpen)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left flex justify-between items-center"
              >
                <span>
                  {filters.workingHours.length > 0
                    ? `${filters.workingHours.length} selected`
                    : "Select working hours"}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    workingHoursOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {workingHoursOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {WORKING_HOURS.map((hours) => (
                    <label
                      key={hours}
                      className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.workingHours.includes(hours)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters((prev) => ({
                              ...prev,
                              workingHours: [...prev.workingHours, hours],
                            }));
                          } else {
                            setFilters((prev) => ({
                              ...prev,
                              workingHours: prev.workingHours.filter(
                                (h) => h !== hours
                              ),
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{hours}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Keywords
            </label>
            <input
              type="text"
              value={filters.keywords}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, keywords: e.target.value }))
              }
              placeholder="Search in summary, experience, etc."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Salary Range */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minimum Salary (£)
            </label>
            <input
              type="number"
              value={filters.salaryMin}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  salaryMin: Number(e.target.value),
                }))
              }
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Salary (£)
            </label>
            <input
              type="number"
              value={filters.salaryMax}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  salaryMax: Number(e.target.value),
                }))
              }
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="mt-6 flex justify-between items-center">
          {!isSearchValid() && (
            <div className="text-sm text-orange-600 dark:text-orange-400">
              <svg
                className="w-4 h-4 inline mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Please select all required filters: Role Types, Employment Types,
              and Working Hours
            </div>
          )}
          <button
            onClick={searchCandidates}
            disabled={loading || !isSearchValid()}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              loading || !isSearchValid()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {loading ? "Searching..." : "Search Candidates"}
          </button>
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Search Results
          </h2>
          {candidates.length > 0 && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}{" "}
              found
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Searching candidates...
            </p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              No candidates found matching your criteria. Try adjusting your
              filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((result) => (
              <div
                key={result.candidate.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {result.candidate.full_name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {result.candidate.professional_summary ||
                        "No summary provided"}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {result.candidate.preferred_role_types
                        ?.slice(0, 3)
                        .map((role, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                          >
                            {role}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div
                      className={`text-2xl font-bold ${
                        result.matchScore >= 80
                          ? "text-green-600"
                          : result.matchScore >= 60
                          ? "text-yellow-600"
                          : "text-orange-600"
                      }`}
                    >
                      {result.matchScore}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Match Score
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Skills
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {result.candidate.skills
                        ?.slice(0, 5)
                        .map((skill, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs rounded-full ${
                              result.breakdown.skills.matchedSkills.includes(
                                skill
                              )
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                      {result.candidate.skills &&
                        result.candidate.skills.length > 5 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{result.candidate.skills.length - 5} more
                          </span>
                        )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Contact Information
                    </h4>
                    <div className="space-y-1">
                      {getContactInfo(result.candidate).map((info, index) => (
                        <p
                          key={index}
                          className="text-sm text-gray-600 dark:text-gray-400"
                        >
                          {info}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Match Details
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.matchReasons.map((reason, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CandidateSearch;
