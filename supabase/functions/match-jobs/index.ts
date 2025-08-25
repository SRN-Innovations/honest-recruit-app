import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface JobPosting {
  id: string;
  title?: string;
  job_title?: string;
  company_name?: string;
  company?: string;
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
}

interface CandidateProfile {
  id: string;
  preferred_role_types: string[];
  preferred_employment_types: string[];
  preferred_location_types: string[];
  preferred_working_hours: string[];
  salary_expectations: {
    type: "exact" | "range";
    exact?: number;
    min?: number;
    max?: number;
  };
  skills: string[];
  languages: Array<{
    language: string;
    speak: boolean;
    read: boolean;
    write: boolean;
  }>;
  experience: Array<{
    position: string;
    company: string;
    skills_used: string[];
  }>;
}

interface JobMatch {
  job: JobPosting;
  score: number;
  matchReasons: string[];
  skillMatch: number;
  salaryMatch: number;
  preferenceMatch: number;
  breakdown: {
    weights: {
      role: number;
      employment: number;
      location: number;
      hours: number;
      skills: number;
      salary: number;
      languages: number;
    };
    role: { matched: boolean; reason: string };
    employment: { matched: boolean; reason: string };
    location: { matched: boolean; reason: string };
    hours: { matched: boolean; reason: string };
    skills: {
      matchedCount: number;
      totalCount: number;
      matched: string[];
      missing: string[];
    };
    salary: {
      matched: boolean;
      jobAverage: number | null;
      candidate: {
        type: string;
        exact?: number;
        min?: number;
        max?: number;
      } | null;
      reason: string;
    };
    languages: {
      matchedPairs: number;
      pairs: Array<{
        language: string;
        required: string[];
        provided: string[];
      }>;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { candidateId } = await req.json();

    if (!candidateId) {
      return new Response(
        JSON.stringify({ error: "Candidate ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Fetch candidate profile
    console.log("Fetching candidate profile for ID:", candidateId);
    const { data: candidateProfile, error: profileError } = await supabaseClient
      .from("candidate_profiles")
      .select("*")
      .eq("id", candidateId)
      .single();

    if (profileError || !candidateProfile) {
      console.log("Profile not found; returning empty matches response.");
      return new Response(
        JSON.stringify({ matches: [], totalJobs: 0, matchedJobs: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Candidate profile found:", candidateProfile);

    // First, let's check what tables exist
    const { data: tables, error: tablesError } = await supabaseClient
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");

    console.log("Available tables:", tables);

    // Fetch all active job postings (no embedded joins)
    console.log("Fetching active job postings...");
    const { data: jobPostings, error: jobsError } = await supabaseClient
      .from("job_postings")
      .select(`*`)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (jobsError) {
      console.log("Error fetching job postings:", jobsError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch job postings",
          details: jobsError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Found job postings:", jobPostings);
    console.log("Number of active jobs:", jobPostings?.length || 0);

    // Fetch employer profiles and merge company names server-side
    let employerIdToCompanyName: Record<string, string> = {};
    try {
      const employerIds = Array.from(
        new Set(
          (jobPostings || []).map((j: any) => j.employer_id).filter(Boolean)
        )
      );
      if (employerIds.length > 0) {
        const { data: employers, error: employersError } = await supabaseClient
          .from("employer_profiles")
          .select("id, company_name")
          .in("id", employerIds);
        if (!employersError && employers) {
          employerIdToCompanyName = employers.reduce(
            (
              acc: Record<string, string>,
              curr: { id: string; company_name: string }
            ) => {
              acc[curr.id] = curr.company_name;
              return acc;
            },
            {}
          );
        } else if (employersError) {
          console.log("Error fetching employer profiles:", employersError);
        }
      }
    } catch (e) {
      console.log("Failed to merge employer names:", e);
    }

    // Parse JSON fields and handle flexible column names
    console.log("Parsing job postings...");
    const parsedJobs: JobPosting[] = jobPostings.map((job) => {
      // Extract data from nested job_details structure
      const jobDetails = job.job_details || {};
      const recruitmentProcess = job.recruitment_process || {};

      return {
        ...job,
        title:
          jobDetails.title || job.title || job.job_title || "Untitled Position",
        company_name:
          employerIdToCompanyName[job.employer_id as string] ||
          job.company_name ||
          job.company ||
          "Company Not Specified",
        role_type: jobDetails.roleType || job.role_type,
        employment_type: jobDetails.employmentType || job.employment_type,
        location: jobDetails.location || job.location,
        working_hours: jobDetails.workingHours || job.working_hours,
        salary_min: jobDetails.salary?.min || job.salary_min,
        salary_max: jobDetails.salary?.max || job.salary_max,
        skills: Array.isArray(jobDetails.skills)
          ? jobDetails.skills
          : Array.isArray(job.skills)
          ? job.skills
          : JSON.parse(job.skills || "[]"),
        optional_skills: Array.isArray(jobDetails.optionalSkills)
          ? jobDetails.optionalSkills
          : Array.isArray(job.optional_skills)
          ? job.optional_skills
          : JSON.parse(job.optional_skills || "[]"),
        languages: Array.isArray(jobDetails.languages)
          ? jobDetails.languages
          : Array.isArray(job.languages)
          ? job.languages
          : JSON.parse(job.languages || "[]"),
      };
    });

    console.log("Parsed jobs:", parsedJobs);
    console.log("Sample parsed job structure:");
    if (parsedJobs.length > 0) {
      const sampleJob = parsedJobs[0];
      console.log("- Title:", sampleJob.title);
      console.log("- Role Type:", sampleJob.role_type);
      console.log("- Employment Type:", sampleJob.employment_type);
      console.log("- Location:", sampleJob.location);
      console.log("- Working Hours:", sampleJob.working_hours);
      console.log("- Salary Min:", sampleJob.salary_min);
      console.log("- Salary Max:", sampleJob.salary_max);
      console.log("- Skills:", sampleJob.skills);
    }

    console.log("Parsing candidate profile...");
    const parsedProfile: CandidateProfile = {
      ...candidateProfile,
      preferred_role_types: Array.isArray(candidateProfile.preferred_role_types)
        ? candidateProfile.preferred_role_types
        : JSON.parse(candidateProfile.preferred_role_types || "[]"),
      preferred_employment_types: Array.isArray(
        candidateProfile.preferred_employment_types
      )
        ? candidateProfile.preferred_employment_types
        : JSON.parse(candidateProfile.preferred_employment_types || "[]"),
      preferred_location_types: Array.isArray(
        candidateProfile.preferred_location_types
      )
        ? candidateProfile.preferred_location_types
        : JSON.parse(candidateProfile.preferred_location_types || "[]"),
      preferred_working_hours: Array.isArray(
        candidateProfile.preferred_working_hours
      )
        ? candidateProfile.preferred_working_hours
        : JSON.parse(candidateProfile.preferred_working_hours || "[]"),
      salary_expectations:
        typeof candidateProfile.salary_expectations === "string"
          ? JSON.parse(candidateProfile.salary_expectations || "{}")
          : candidateProfile.salary_expectations,
      skills: Array.isArray(candidateProfile.skills)
        ? candidateProfile.skills
        : JSON.parse(candidateProfile.skills || "[]"),
      languages: Array.isArray(candidateProfile.languages)
        ? candidateProfile.languages
        : JSON.parse(candidateProfile.languages || "[]"),
      experience: Array.isArray(candidateProfile.experience)
        ? candidateProfile.experience
        : JSON.parse(candidateProfile.experience || "[]"),
    };

    console.log("Parsed profile:", parsedProfile);
    console.log("Profile preferences:");
    console.log("- Role types:", parsedProfile.preferred_role_types);
    console.log(
      "- Employment types:",
      parsedProfile.preferred_employment_types
    );
    console.log("- Location types:", parsedProfile.preferred_location_types);
    console.log("- Working hours:", parsedProfile.preferred_working_hours);
    console.log("- Salary expectations:", parsedProfile.salary_expectations);

    // Match jobs with candidate profile
    console.log("Starting job matching process...");
    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "true";
    const matchedJobs: JobMatch[] = parsedJobs.map((job) => {
      const match = calculateJobMatch(job, parsedProfile);
      if (debug || match.score < 90) {
        console.log(
          `\n--- Match breakdown for: ${job.title} (${match.score}%) ---`
        );
        console.log(`Score: ${match.score}%`);
        console.log(`Reasons: ${match.matchReasons.join(", ")}`);
        console.log(`\nSkills Analysis:`);
        console.log(`  Required Skills: ${job.skills?.join(", ") || "None"}`);
        console.log(
          `  Optional Skills: ${job.optional_skills?.join(", ") || "None"}`
        );
        console.log(
          `  Your Skills: ${parsedProfile.skills?.join(", ") || "None"}`
        );
        console.log(
          `  Matched Skills: ${
            match.breakdown.skills.matched.join(", ") || "None"
          }`
        );
        console.log(
          `  Missing Skills: ${
            match.breakdown.skills.missing.join(", ") || "None"
          }`
        );
        console.log(
          `  Skills Score: ${match.breakdown.skills.matchedCount}/${
            match.breakdown.skills.totalCount
          } (${Math.round(
            (match.breakdown.skills.matchedCount /
              match.breakdown.skills.totalCount) *
              100
          )}%)`
        );

        if (match.breakdown.salary.jobAverage) {
          console.log(`\nSalary Analysis:`);
          console.log(
            `  Job Salary: £${match.breakdown.salary.jobAverage.toLocaleString()}`
          );
          console.log(
            `  Your Expectations: ${JSON.stringify(
              match.breakdown.salary.candidate
            )}`
          );
          console.log(
            `  Salary Match: ${match.breakdown.salary.matched ? "Yes" : "No"}`
          );
        }

        console.log(`\nOther Factors:`);
        console.log(
          `  Role Type: ${match.breakdown.role.matched ? "✓" : "✗"} ${
            match.breakdown.role.reason
          }`
        );
        console.log(
          `  Employment: ${match.breakdown.employment.matched ? "✓" : "✗"} ${
            match.breakdown.employment.reason
          }`
        );
        console.log(
          `  Location: ${match.breakdown.location.matched ? "✓" : "✗"} ${
            match.breakdown.location.reason
          }`
        );
        console.log(
          `  Hours: ${match.breakdown.hours.matched ? "✓" : "✗"} ${
            match.breakdown.hours.reason
          }`
        );
        console.log(
          `  Languages: ${match.breakdown.languages.matchedPairs} pairs matched`
        );
      }
      return match;
    });

    // Sort by match score (highest first) and filter by 90%+ threshold
    console.log("\n=== FINAL RESULTS ===");
    console.log("Total jobs processed:", parsedJobs.length);
    console.log(
      "Jobs with scores > 0:",
      matchedJobs.filter((match) => match.score > 0).length
    );
    console.log(
      "Jobs with scores >= 90%:",
      matchedJobs.filter((match) => match.score >= 90).length
    );

    const sortedJobs = matchedJobs
      .filter((match) => match.score >= 90) // Only show jobs with 90%+ match
      .sort((a, b) => b.score - a.score);

    console.log(
      "Final sorted matches:",
      sortedJobs.map((match) => ({
        title: match.job.title,
        score: match.score,
        reasons: match.matchReasons,
      }))
    );

    return new Response(
      JSON.stringify({
        matches: sortedJobs,
        totalJobs: parsedJobs.length,
        matchedJobs: sortedJobs.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function calculateJobMatch(
  job: JobPosting,
  candidate: CandidateProfile
): JobMatch {
  let score = 0;
  const matchReasons: string[] = [];
  const weights = {
    role: 25,
    employment: 15,
    location: 15,
    hours: 10,
    skills: 20,
    salary: 10,
    languages: 5,
  };

  // 1. Role Type Match (Weight: 25%)
  const roleMatched = candidate.preferred_role_types.includes(job.role_type);
  if (roleMatched) {
    score += weights.role;
    matchReasons.push(`Role type matches your preference: ${job.role_type}`);
  }

  // 2. Employment Type Match (Weight: 15%)
  const employmentMatched = candidate.preferred_employment_types.includes(
    job.employment_type
  );
  if (employmentMatched) {
    score += weights.employment;
    matchReasons.push(
      `Employment type matches your preference: ${job.employment_type}`
    );
  }

  // 3. Location Type Match (Weight: 15%)
  const locationMatched = candidate.preferred_location_types.includes(
    job.location
  );
  if (locationMatched) {
    score += weights.location;
    matchReasons.push(`Location type matches your preference: ${job.location}`);
  }

  // 4. Working Hours Match (Weight: 10%)
  const hoursMatched = candidate.preferred_working_hours.includes(
    job.working_hours
  );
  if (hoursMatched) {
    score += weights.hours;
    matchReasons.push(
      `Working hours match your preference: ${job.working_hours}`
    );
  }

  // 5. Skills Match (Weight: 20%)
  const requiredSkills = job.skills || [];
  const optionalSkills = job.optional_skills || [];
  const allJobSkills = [...requiredSkills, ...optionalSkills];
  const candidateSkills = candidate.skills || [];

  let skillMatches = 0;
  let totalSkills = allJobSkills.length;

  if (totalSkills > 0) {
    skillMatches = allJobSkills.filter((skill) =>
      candidateSkills.includes(skill)
    ).length;

    const skillMatchPercentage = skillMatches / totalSkills;
    score += skillMatchPercentage * weights.skills;

    if (skillMatches > 0) {
      matchReasons.push(
        `You have ${skillMatches} out of ${totalSkills} required skills`
      );
    }
  }

  // 6. Salary Match (Weight: 10%)
  let salaryMatch = 0;
  if (candidate.salary_expectations) {
    const { type, exact, min, max } = candidate.salary_expectations;
    const jobSalary = (job.salary_min + job.salary_max) / 2;

    if (type === "exact" && exact) {
      const difference = Math.abs(jobSalary - exact) / exact;
      if (difference <= 0.1) {
        // Within 10%
        salaryMatch = 1;
        score += weights.salary;
        matchReasons.push("Salary matches your expectations");
      }
    } else if (type === "range" && min && max) {
      if (jobSalary >= min && jobSalary <= max) {
        salaryMatch = 1;
        score += weights.salary;
        matchReasons.push("Salary is within your expected range");
      }
    }
  }

  // 7. Language Match (Weight: 5%)
  const jobLanguages = job.languages || [];
  const candidateLanguages = candidate.languages || [];

  let languageMatches = 0;
  jobLanguages.forEach((jobLang) => {
    const candidateLang = candidateLanguages.find(
      (cl) => cl.language === jobLang.language
    );
    if (candidateLang) {
      if (jobLang.speak && candidateLang.speak) languageMatches++;
      if (jobLang.read && candidateLang.read) languageMatches++;
      if (jobLang.write && candidateLang.write) languageMatches++;
    }
  });

  if (languageMatches > 0) {
    score += Math.min(weights.languages, languageMatches * 1.5);
    matchReasons.push(`Language requirements match your skills`);
  }

  // Build breakdown for logging/debugging
  const breakdown: JobMatch["breakdown"] = {
    weights,
    role: {
      matched: roleMatched,
      reason: roleMatched
        ? `Preferred role includes ${job.role_type}`
        : `Preferred roles do not include ${job.role_type}`,
    },
    employment: {
      matched: employmentMatched,
      reason: employmentMatched
        ? `Preferred employment includes ${job.employment_type}`
        : `Preferred employment types do not include ${job.employment_type}`,
    },
    location: {
      matched: locationMatched,
      reason: locationMatched
        ? `Preferred locations include ${job.location}`
        : `Preferred locations do not include ${job.location}`,
    },
    hours: {
      matched: hoursMatched,
      reason: hoursMatched
        ? `Preferred hours include ${job.working_hours}`
        : `Preferred hours do not include ${job.working_hours}`,
    },
    skills: {
      matchedCount: skillMatches,
      totalCount: totalSkills,
      matched: allJobSkills.filter((s) => candidateSkills.includes(s)),
      missing: allJobSkills.filter((s) => !candidateSkills.includes(s)),
    },
    salary: {
      matched: salaryMatch === 1,
      jobAverage: isFinite((job.salary_min + job.salary_max) / 2)
        ? (job.salary_min + job.salary_max) / 2
        : null,
      candidate: candidate.salary_expectations || null,
      reason:
        salaryMatch === 1
          ? "Salary aligned"
          : "Salary not aligned or expectations not set",
    },
    languages: {
      matchedPairs: languageMatches,
      pairs: jobLanguages.map((jl) => {
        const c = candidateLanguages.find((cl) => cl.language === jl.language);
        return {
          language: jl.language,
          required: [
            jl.speak ? "speak" : null,
            jl.read ? "read" : null,
            jl.write ? "write" : null,
          ].filter(Boolean) as string[],
          provided: c
            ? [
                c.speak ? "speak" : null,
                c.read ? "read" : null,
                c.write ? "write" : null,
              ].filter(Boolean)
            : [],
        };
      }),
    },
  };

  return {
    job,
    score: Math.round(score),
    matchReasons,
    skillMatch: 0,
    salaryMatch: 0,
    preferenceMatch: 0,
    breakdown,
  };
}
