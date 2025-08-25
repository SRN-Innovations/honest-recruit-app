import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const { filters }: { filters: SearchFilters } = await req.json();

    if (!filters) {
      return new Response(JSON.stringify({ error: "Filters are required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Fetch all discoverable candidates who are open for work
    const { data: candidatesData, error: candidatesError } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("discoverable", true)
      .eq("open_for_work", true);

    if (candidatesError) {
      console.error("Error fetching candidates:", candidatesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch candidates" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    if (!candidatesData || candidatesData.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Parse the candidate data
    const parsedCandidates: CandidateProfile[] = candidatesData.map(
      (candidate) => ({
        ...candidate,
        address: JSON.parse(candidate.address || "{}"),
        right_to_work: JSON.parse(candidate.right_to_work || "{}"),
        preferred_role_types: JSON.parse(
          candidate.preferred_role_types || "[]"
        ),
        preferred_employment_types: JSON.parse(
          candidate.preferred_employment_types || "[]"
        ),
        preferred_location_types: JSON.parse(
          candidate.preferred_location_types || "[]"
        ),
        preferred_working_hours: JSON.parse(
          candidate.preferred_working_hours || "[]"
        ),
        salary_expectations: JSON.parse(candidate.salary_expectations || "{}"),
        skills: JSON.parse(candidate.skills || "[]"),
        languages: JSON.parse(candidate.languages || "[]"),
        experience: JSON.parse(candidate.experience || "[]"),
        education: JSON.parse(candidate.education || "[]"),
        certifications: JSON.parse(candidate.certifications || "[]"),
      })
    );

    // Filter candidates based on required criteria first
    const filteredCandidates = parsedCandidates.filter((candidate) => {
      // Required: Role type must match if specified
      if (filters.roleTypes.length > 0 && candidate.preferred_role_types) {
        const roleMatch = filters.roleTypes.some((filterRole) =>
          candidate.preferred_role_types?.includes(filterRole)
        );
        if (!roleMatch) return false;
      }

      // Required: Employment type must match if specified
      if (
        filters.employmentTypes.length > 0 &&
        candidate.preferred_employment_types
      ) {
        const employmentMatch = filters.employmentTypes.some((filterType) =>
          candidate.preferred_employment_types?.includes(filterType)
        );
        if (!employmentMatch) return false;
      }

      // Required: Working hours must match if specified
      if (
        filters.workingHours.length > 0 &&
        candidate.preferred_working_hours
      ) {
        const hoursMatch = filters.workingHours.some((filterHours) =>
          candidate.preferred_working_hours?.includes(filterHours)
        );
        if (!hoursMatch) return false;
      }

      return true;
    });

    // Calculate match scores for filtered candidates
    const searchResults: SearchResult[] = filteredCandidates
      .map((candidate) => calculateMatchScore(candidate, filters))
      .filter((result) => result.matchScore > 0) // Only show candidates with some match
      .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score

    return new Response(JSON.stringify({ results: searchResults }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error in search-candidates function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});

function calculateMatchScore(
  candidate: CandidateProfile,
  filters: SearchFilters
): SearchResult {
  let totalScore = 0;
  let maxScore = 0;
  const matchReasons: string[] = [];
  const breakdown = {
    role: { matched: false, reason: "" },
    skills: {
      matched: 0,
      total: 0,
      matchedSkills: [] as string[],
      missingSkills: [] as string[],
    },
    location: { matched: false, reason: "" },
    employment: { matched: false, reason: "" },
    hours: { matched: false, reason: "" },
    salary: { matched: false, reason: "" },
  };

  // Role type matching (required filter - no points, just pass/fail)
  if (filters.roleTypes.length > 0 && candidate.preferred_role_types) {
    const roleMatch = filters.roleTypes.some((filterRole) =>
      candidate.preferred_role_types?.includes(filterRole)
    );
    if (roleMatch) {
      breakdown.role.matched = true;
      breakdown.role.reason = "Role type matches (required)";
      matchReasons.push("Role type match");
    } else {
      breakdown.role.reason = "Role type mismatch (required)";
    }
  } else {
    breakdown.role.matched = true;
    breakdown.role.reason = "No role filter specified";
  }

  // Skills matching (40 points)
  maxScore += 40;
  if (filters.skills.length > 0 && candidate.skills) {
    const candidateSkills = candidate.skills.map((s) => s.toLowerCase());
    const filterSkills = filters.skills.map((s) => s.toLowerCase());

    const matchedSkills = filterSkills.filter((skill) =>
      candidateSkills.some(
        (candidateSkill) =>
          candidateSkill.includes(skill) || skill.includes(candidateSkill)
      )
    );

    const missingSkills = filterSkills.filter(
      (skill) =>
        !candidateSkills.some(
          (candidateSkill) =>
            candidateSkill.includes(skill) || skill.includes(candidateSkill)
        )
    );

    breakdown.skills.matched = matchedSkills.length;
    breakdown.skills.total = filterSkills.length;
    breakdown.skills.matchedSkills = matchedSkills;
    breakdown.skills.missingSkills = missingSkills;

    const skillsScore = (matchedSkills.length / filterSkills.length) * 40;
    totalScore += skillsScore;

    if (matchedSkills.length > 0) {
      matchReasons.push(
        `${matchedSkills.length}/${filterSkills.length} skills match`
      );
    }
  } else {
    totalScore += 40; // No skills filter, give full points
    breakdown.skills.matched = 0;
    breakdown.skills.total = 0;
  }

  // Location matching (10 points)
  maxScore += 10;
  if (filters.location && candidate.address) {
    const candidateLocation =
      `${candidate.address.city} ${candidate.address.state} ${candidate.address.country}`.toLowerCase();
    const filterLocation = filters.location.toLowerCase();

    if (
      candidateLocation.includes(filterLocation) ||
      filterLocation.includes(candidateLocation)
    ) {
      totalScore += 10;
      breakdown.location.matched = true;
      breakdown.location.reason = "Location matches";
      matchReasons.push("Location match");
    } else {
      breakdown.location.reason = "Location mismatch";
    }
  } else {
    totalScore += 10; // No location filter, give full points
    breakdown.location.matched = true;
    breakdown.location.reason = "No location filter specified";
  }

  // Employment type matching (required filter - no points, just pass/fail)
  if (
    filters.employmentTypes.length > 0 &&
    candidate.preferred_employment_types
  ) {
    const employmentMatch = filters.employmentTypes.some((filterType) =>
      candidate.preferred_employment_types?.includes(filterType)
    );
    if (employmentMatch) {
      breakdown.employment.matched = true;
      breakdown.employment.reason = "Employment type matches (required)";
      matchReasons.push("Employment type match");
    } else {
      breakdown.employment.reason = "Employment type mismatch (required)";
    }
  } else {
    breakdown.employment.matched = true;
    breakdown.employment.reason = "No employment filter specified";
  }

  // Working hours matching (required filter - no points, just pass/fail)
  if (filters.workingHours.length > 0 && candidate.preferred_working_hours) {
    const hoursMatch = filters.workingHours.some((filterHours) =>
      candidate.preferred_working_hours?.includes(filterHours)
    );
    if (hoursMatch) {
      breakdown.hours.matched = true;
      breakdown.hours.reason = "Working hours match (required)";
      matchReasons.push("Working hours match");
    } else {
      breakdown.hours.reason = "Working hours mismatch (required)";
    }
  } else {
    breakdown.hours.matched = true;
    breakdown.hours.reason = "No hours filter specified";
  }

  // Salary matching (bonus points)
  if (
    filters.salaryMin > 0 &&
    filters.salaryMax > 0 &&
    candidate.salary_expectations
  ) {
    const candidateMin =
      candidate.salary_expectations.min ||
      candidate.salary_expectations.exact ||
      0;
    const candidateMax =
      candidate.salary_expectations.max ||
      candidate.salary_expectations.exact ||
      0;

    if (
      candidateMin <= filters.salaryMax &&
      candidateMax >= filters.salaryMin
    ) {
      breakdown.salary.matched = true;
      breakdown.salary.reason = "Salary expectations overlap";
      matchReasons.push("Salary expectations match");
    } else {
      breakdown.salary.reason = "Salary expectations don't overlap";
    }
  }

  const matchScore = Math.round((totalScore / maxScore) * 100);

  return {
    candidate,
    matchScore,
    matchReasons,
    breakdown,
  };
}
