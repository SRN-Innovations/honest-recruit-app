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
      console.log("Profile error:", profileError);
      console.log("Profile data:", candidateProfile);
      return new Response(
        JSON.stringify({
          error: "Candidate profile not found",
          details: profileError,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Candidate profile found:", candidateProfile);

    // First, let's check what tables exist
    const { data: tables, error: tablesError } = await supabaseClient
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");

    console.log("Available tables:", tables);

    // Fetch all active job postings
    console.log("Fetching active job postings...");
    const { data: jobPostings, error: jobsError } = await supabaseClient
      .from("job_postings")
      .select("*")
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
          job.company_name || job.company || "Company Not Specified",
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
    const matchedJobs: JobMatch[] = parsedJobs.map((job) => {
      console.log(`\n--- Matching job: ${job.title} ---`);
      const match = calculateJobMatch(job, parsedProfile);
      console.log(`Match score: ${match.score}%`);
      console.log(`Match reasons:`, match.matchReasons);
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

  // 1. Role Type Match (Weight: 25%)
  const roleMatch = candidate.preferred_role_types.includes(job.role_type)
    ? 1
    : 0;
  if (roleMatch) {
    score += 25;
    matchReasons.push(`Role type matches your preference: ${job.role_type}`);
  }

  // 2. Employment Type Match (Weight: 15%)
  const employmentMatch = candidate.preferred_employment_types.includes(
    job.employment_type
  )
    ? 1
    : 0;
  if (employmentMatch) {
    score += 15;
    matchReasons.push(
      `Employment type matches your preference: ${job.employment_type}`
    );
  }

  // 3. Location Type Match (Weight: 15%)
  const locationMatch = candidate.preferred_location_types.includes(
    job.location
  )
    ? 1
    : 0;
  if (locationMatch) {
    score += 15;
    matchReasons.push(`Location type matches your preference: ${job.location}`);
  }

  // 4. Working Hours Match (Weight: 10%)
  const hoursMatch = candidate.preferred_working_hours.includes(
    job.working_hours
  )
    ? 1
    : 0;
  if (hoursMatch) {
    score += 10;
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
    score += skillMatchPercentage * 20;

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
        score += 10;
        matchReasons.push("Salary matches your expectations");
      }
    } else if (type === "range" && min && max) {
      if (jobSalary >= min && jobSalary <= max) {
        salaryMatch = 1;
        score += 10;
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
    score += Math.min(5, languageMatches * 1.5);
    matchReasons.push(`Language requirements match your skills`);
  }

  return {
    job,
    score: Math.round(score),
    matchReasons,
    // Remove detailed breakdowns - only keep overall score and reasons
    skillMatch: 0,
    salaryMatch: 0,
    preferenceMatch: 0,
  };
}
