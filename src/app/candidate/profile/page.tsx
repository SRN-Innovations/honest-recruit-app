"use client";

import {
  EMPLOYMENT_TYPES,
  GENDER_OPTIONS,
  LANGUAGES,
  LOCATION_TYPES,
  NATIONALITIES,
  SALARY_RANGES,
  WORKING_HOURS,
} from "@/lib/constants";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";

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

// Using shared constants from @/lib/constants

export default function CandidateProfile() {
  const { userType } = useAuth();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalProfile, setOriginalProfile] =
    useState<CandidateProfile | null>(null);
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newExperience, setNewExperience] = useState({
    company: "",
    position: "",
    start_date: "",
    end_date: "",
    current: false,
    description: "",
    skills_used: [] as string[],
  });
  const [newEducation, setNewEducation] = useState({
    institution: "",
    degree: "",
    field_of_study: "",
    start_date: "",
    end_date: "",
    current: false,
    description: "",
  });
  const [newCertification, setNewCertification] = useState({
    name: "",
    issuing_organization: "",
    issue_date: "",
    expiry_date: "",
    credential_id: "",
    credential_url: "",
  });

  useEffect(() => {
    if (userType === "candidate") {
      fetchProfile();
      fetchRoleTypes();
    }
  }, [userType]);

  // Debug effect to monitor hasUnsavedChanges
  useEffect(() => {
    console.log("hasUnsavedChanges changed to:", hasUnsavedChanges);
  }, [hasUnsavedChanges]);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("candidate_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Profile doesn't exist, create a default one
          console.log("Profile not found, creating default profile...");
          await createDefaultProfile(user);
          return;
        }
        console.error("Error fetching profile:", error);
        return;
      }

      // Parse JSON fields with safe parsing
      const safeJsonParse = (value: unknown, defaultValue: unknown) => {
        if (!value) return defaultValue;
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch (error) {
            console.warn("Failed to parse JSON:", value, error);
            return defaultValue;
          }
        }
        if (typeof value === "object") {
          return value; // Already parsed
        }
        return defaultValue;
      };

      const parsedProfile = {
        ...data,
        right_to_work: safeJsonParse(data.right_to_work, {}),
        skills: safeJsonParse(data.skills, []),
        languages: safeJsonParse(data.languages, []),
        experience: safeJsonParse(data.experience, []),
        education: safeJsonParse(data.education, []),
        certifications: safeJsonParse(data.certifications, []),
        preferred_role_types: safeJsonParse(data.preferred_role_types, []),
        preferred_employment_types: safeJsonParse(
          data.preferred_employment_types,
          []
        ),
        preferred_location_types: safeJsonParse(
          data.preferred_location_types,
          []
        ),
        preferred_working_hours: safeJsonParse(
          data.preferred_working_hours,
          []
        ),
        salary_expectations: safeJsonParse(data.salary_expectations, {
          type: "range",
          min: 0,
          max: 0,
        }),
      };

      console.log("Setting profile and originalProfile:", parsedProfile);
      setProfile(parsedProfile);
      setOriginalProfile(parsedProfile);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkForChanges = (newProfile: CandidateProfile) => {
    console.log("checkForChanges called with:", {
      originalProfile,
      newProfile,
    });

    if (!originalProfile) {
      console.log("No originalProfile, returning false");
      return false;
    }

    // Deep comparison of profiles
    const originalStr = JSON.stringify(originalProfile);
    const newStr = JSON.stringify(newProfile);
    const hasChanges = originalStr !== newStr;

    // Debug logging
    console.log("Checking for changes:", {
      hasChanges,
      originalProfile: originalProfile,
      newProfile: newProfile,
    });

    return hasChanges;
  };

  const updateProfile = (
    updater: (profile: CandidateProfile) => CandidateProfile
  ) => {
    if (!profile) return;
    const newProfile = updater(profile);
    console.log("Updating profile:", { oldProfile: profile, newProfile });
    setProfile(newProfile);
    const hasChanges = checkForChanges(newProfile);
    console.log("Setting hasUnsavedChanges to:", hasChanges);
    setHasUnsavedChanges(hasChanges);
  };

  const createDefaultProfile = async (user: { id: string; email?: string }) => {
    try {
      // Get user metadata from auth
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      // Create a default profile with basic information
      const defaultProfile: CandidateProfile = {
        id: user.id,
        full_name: authUser?.user_metadata?.full_name || "",
        email: user.email || "",
        phone_number: "",
        address: {
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        },
        date_of_birth: null,
        gender: null,
        nationality: "",
        right_to_work: {
          status: "",
          visa_type: "",
          visa_expiry: "",
        },
        professional_summary: "",
        preferred_role_types: [],
        preferred_employment_types: [],
        preferred_location_types: [],
        preferred_working_hours: [],
        salary_expectations: { type: "range", min: 0, max: 0 },
        skills: [],
        languages: [],
        experience: [],
        education: [],
        certifications: [],
        open_for_work: true,
        discoverable: true,
        show_email_in_search: false,
        show_phone_in_search: false,
      };

      // Try to create a full profile first (now that migration should be working)
      try {
        const { error: fullProfileError } = await supabase
          .from("candidate_profiles")
          .insert({
            id: user.id,
            full_name: defaultProfile.full_name,
            email: defaultProfile.email,
            phone_number: defaultProfile.phone_number,
            address: JSON.stringify(defaultProfile.address),
            date_of_birth: defaultProfile.date_of_birth,
            gender: defaultProfile.gender,
            nationality: defaultProfile.nationality,
            right_to_work: JSON.stringify(defaultProfile.right_to_work),
            professional_summary: defaultProfile.professional_summary,
            preferred_role_types: JSON.stringify(
              defaultProfile.preferred_role_types
            ),
            preferred_employment_types: JSON.stringify(
              defaultProfile.preferred_employment_types
            ),
            preferred_location_types: JSON.stringify(
              defaultProfile.preferred_location_types
            ),
            preferred_working_hours: JSON.stringify(
              defaultProfile.preferred_working_hours
            ),
            salary_expectations: JSON.stringify(
              defaultProfile.salary_expectations
            ),
            skills: JSON.stringify(defaultProfile.skills),
            languages: JSON.stringify(defaultProfile.languages),
            experience: JSON.stringify(defaultProfile.experience),
            education: JSON.stringify(defaultProfile.education),
            certifications: JSON.stringify(defaultProfile.certifications),
            open_for_work: defaultProfile.open_for_work,
            discoverable: defaultProfile.discoverable,
            show_email_in_search: defaultProfile.show_email_in_search,
            show_phone_in_search: defaultProfile.show_phone_in_search,
          });

        if (!fullProfileError) {
          // Success with full profile
          setProfile(defaultProfile);
          toast.success("Profile created successfully!");
          return;
        }
      } catch {
        console.log("Full profile creation failed, trying minimal approach");
      }

      // Fallback: Try to create a minimal profile if full profile fails
      try {
        const { error: minimalError } = await supabase
          .from("candidate_profiles")
          .insert({
            id: user.id,
            full_name: defaultProfile.full_name,
            email: defaultProfile.email,
            phone_number: defaultProfile.phone_number,
            address: JSON.stringify(defaultProfile.address),
            date_of_birth: defaultProfile.date_of_birth,
            gender: defaultProfile.gender,
            nationality: defaultProfile.nationality,
            right_to_work: JSON.stringify(defaultProfile.right_to_work),
          });

        if (!minimalError) {
          // Success with minimal profile
          setProfile(defaultProfile);
          toast.success("Profile created successfully!");
          return;
        }
      } catch {
        console.log(
          "Minimal profile creation failed, trying alternative approach"
        );
      }

      // If minimal profile fails, try to create just the basic user profile
      try {
        const { error: userProfileError } = await supabase
          .from("user_profiles")
          .insert({
            id: user.id,
            user_type: "candidate",
          });

        if (userProfileError) {
          console.error("User profile creation error:", userProfileError);
          toast.error("Failed to create user profile. Please try again.");
          return;
        }

        // Set a basic profile in state (without database persistence for now)
        setProfile(defaultProfile);
        toast.success(
          "Basic profile loaded. Please run database migration to enable full features."
        );
      } catch (error) {
        console.error("Error creating basic profile:", error);
        toast.error("Failed to create profile. Please try again.");
      }
    } catch (error) {
      console.error("Error creating default profile:", error);
      toast.error("Failed to create profile. Please try again.");
    }
  };

  const fetchRoleTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("role_types")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching role types:", error);
        return;
      }

      setRoleTypes(data);
    } catch (error) {
      console.error("Error fetching role types:", error);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Log the profile data being saved for debugging
      console.log("Saving profile with data:", {
        id: user.id,
        full_name: profile.full_name,
        email: profile.email,
        phone_number: profile.phone_number,
        address: profile.address,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        nationality: profile.nationality,
        right_to_work: profile.right_to_work,
        professional_summary: profile.professional_summary,
        preferred_role_types: profile.preferred_role_types,
        preferred_employment_types: profile.preferred_employment_types,
        preferred_location_types: profile.preferred_location_types,
        preferred_working_hours: profile.preferred_working_hours,
        salary_expectations: profile.salary_expectations,
        skills: profile.skills,
        languages: profile.languages,
        experience: profile.experience,
        education: profile.education,
        certifications: profile.certifications,
        open_for_work: profile.open_for_work,
        discoverable: profile.discoverable,
        show_email_in_search: profile.show_email_in_search,
        show_phone_in_search: profile.show_phone_in_search,
      });

      const { error } = await supabase.from("candidate_profiles").upsert({
        id: user.id,
        full_name: profile.full_name,
        email: profile.email,
        phone_number: profile.phone_number,
        address: JSON.stringify(profile.address),
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        nationality: profile.nationality,
        right_to_work: JSON.stringify(profile.right_to_work),
        professional_summary: profile.professional_summary,
        preferred_role_types: JSON.stringify(
          profile.preferred_role_types || []
        ),
        preferred_employment_types: JSON.stringify(
          profile.preferred_employment_types || []
        ),
        preferred_location_types: JSON.stringify(
          profile.preferred_location_types || []
        ),
        preferred_working_hours: JSON.stringify(
          profile.preferred_working_hours || []
        ),
        salary_expectations: JSON.stringify(profile.salary_expectations || {}),
        skills: JSON.stringify(profile.skills || []),
        languages: JSON.stringify(profile.languages || []),
        experience: JSON.stringify(profile.experience || []),
        education: JSON.stringify(profile.education || []),
        certifications: JSON.stringify(profile.certifications || []),
        open_for_work: profile.open_for_work,
        discoverable: profile.discoverable,
        show_email_in_search: profile.show_email_in_search,
        show_phone_in_search: profile.show_phone_in_search,
      });

      if (error) {
        console.error("Database error during save:", error);
        throw error;
      }

      toast.success("Profile updated successfully!");
      console.log("Save successful, updating originalProfile:", profile);
      setOriginalProfile(profile);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toTitleCase = (value: string) =>
    value
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const handleAddSkill = async () => {
    if (!newSkill.trim() || !profile) return;

    try {
      const roleType =
        Array.isArray(profile.preferred_role_types) &&
        profile.preferred_role_types.length > 0
          ? profile.preferred_role_types[0]
          : "General";

      const rawSkill = newSkill.trim();
      const normalizedSkill = toTitleCase(rawSkill);

      // Upsert into role_skills, case-insensitive check per role
      const { data: existingRoleSkill, error: checkError } = await supabase
        .from("role_skills")
        .select("id, skill_name")
        .eq("role_type", roleType)
        .ilike("skill_name", rawSkill);

      if (checkError) throw checkError;

      if (!existingRoleSkill || existingRoleSkill.length === 0) {
        const { error: insertError } = await supabase
          .from("role_skills")
          .insert({ role_type: roleType, skill_name: normalizedSkill });
        if (insertError) throw insertError;
      }

      // Add to profile skills if not already present (case-insensitive)
      const currentSkills = profile.skills || [];
      const alreadyHas = currentSkills.some(
        (s) => s.trim().toLowerCase() === rawSkill.toLowerCase()
      );
      const updatedSkills = alreadyHas
        ? currentSkills
        : [...currentSkills, normalizedSkill];

      setProfile({ ...profile, skills: updatedSkills });
      setNewSkill("");

      toast.success("Skill added successfully!");
    } catch (error) {
      console.error("Error adding skill:", error);
      toast.error("Failed to add skill. Please try again.");
    }
  };

  const handleAddExperience = () => {
    if (
      !profile ||
      !newExperience.company ||
      !newExperience.position ||
      !newExperience.start_date
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const experience = {
      id: Date.now().toString(),
      ...newExperience,
      skills_used: newExperience.skills_used,
    };

    setProfile({
      ...profile,
      experience: [...(profile.experience || []), experience],
    });

    setNewExperience({
      company: "",
      position: "",
      start_date: "",
      end_date: "",
      current: false,
      description: "",
      skills_used: [],
    });

    toast.success("Experience added successfully!");
  };

  const handleAddEducation = () => {
    if (
      !profile ||
      !newEducation.institution ||
      !newEducation.degree ||
      !newEducation.start_date
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const education = {
      id: Date.now().toString(),
      ...newEducation,
    };

    setProfile({
      ...profile,
      education: [...(profile.education || []), education],
    });

    setNewEducation({
      institution: "",
      degree: "",
      field_of_study: "",
      start_date: "",
      end_date: "",
      current: false,
      description: "",
    });

    toast.success("Education added successfully!");
  };

  const handleAddCertification = () => {
    if (
      !profile ||
      !newCertification.name ||
      !newCertification.issuing_organization ||
      !newCertification.issue_date
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const certification = {
      id: Date.now().toString(),
      ...newCertification,
    };

    setProfile({
      ...profile,
      certifications: [...(profile.certifications || []), certification],
    });

    setNewCertification({
      name: "",
      issuing_organization: "",
      issue_date: "",
      expiry_date: "",
      credential_id: "",
      credential_url: "",
    });

    toast.success("Certification added successfully!");
  };

  const handleRemoveExperience = (id: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      experience: profile.experience?.filter((exp) => exp.id !== id) || [],
    });
  };

  const handleRemoveEducation = (id: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      education: profile.education?.filter((edu) => edu.id !== id) || [],
    });
  };

  const handleRemoveCertification = (id: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      certifications:
        profile.certifications?.filter((cert) => cert.id !== id) || [],
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Candidate Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your profile information and professional details
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {hasUnsavedChanges && (
              <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">Unsaved changes</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                saving || !hasUnsavedChanges
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Status Indicator Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  profile.open_for_work ? "bg-green-500" : "bg-gray-400"
                }`}
              ></div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {profile.open_for_work
                  ? "Open for Work"
                  : "Not Actively Seeking"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  profile.discoverable ? "bg-blue-500" : "bg-gray-400"
                }`}
              ></div>
              <span
                className={`text-sm font-medium ${
                  !profile.open_for_work && !profile.discoverable
                    ? "text-gray-500 dark:text-gray-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {profile.discoverable
                  ? "Discoverable"
                  : !profile.open_for_work
                  ? "Hidden (Not Open for Work)"
                  : "Hidden from Search"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <svg
                  className={`w-4 h-4 ${
                    profile.discoverable ? "text-gray-500" : "text-gray-400"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span
                  className={`text-sm ${
                    profile.show_email_in_search
                      ? "text-gray-600 dark:text-gray-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {profile.show_email_in_search
                    ? "Email visible"
                    : "Email hidden"}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <svg
                  className={`w-4 h-4 ${
                    profile.discoverable ? "text-gray-500" : "text-gray-400"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span
                  className={`text-sm ${
                    profile.show_phone_in_search
                      ? "text-gray-600 dark:text-gray-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {profile.show_phone_in_search
                    ? "Phone visible"
                    : "Phone hidden"}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Profile Status
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {profile.open_for_work && profile.discoverable
                ? "Active & Visible"
                : profile.open_for_work
                ? "Active but Hidden"
                : profile.discoverable
                ? "Visible but Not Seeking"
                : "Hidden & Inactive"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) =>
                  updateProfile((profile) => ({
                    ...profile,
                    full_name: e.target.value,
                  }))
                }
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  updateProfile((profile) => ({
                    ...profile,
                    email: e.target.value,
                  }))
                }
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                value={profile.phone_number}
                onChange={(e) =>
                  updateProfile((profile) => ({
                    ...profile,
                    phone_number: e.target.value,
                  }))
                }
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Nationality</label>
              <select
                value={profile.nationality}
                onChange={(e) =>
                  updateProfile((profile) => ({
                    ...profile,
                    nationality: e.target.value,
                  }))
                }
                className="form-select"
              >
                <option value="">Select nationality</option>
                {NATIONALITIES.map((nationality) => (
                  <option key={nationality} value={nationality}>
                    {nationality}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                value={profile.date_of_birth || ""}
                onChange={(e) =>
                  updateProfile((profile) => ({
                    ...profile,
                    date_of_birth: e.target.value,
                  }))
                }
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Gender</label>
              <select
                value={profile.gender || ""}
                onChange={(e) =>
                  updateProfile((profile) => ({
                    ...profile,
                    gender: e.target.value,
                  }))
                }
                className="form-select"
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender === "male"
                      ? "Male"
                      : gender === "female"
                      ? "Female"
                      : gender === "other"
                      ? "Other"
                      : "Prefer not to say"}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Street Address</label>
              <input
                type="text"
                value={profile.address.street}
                onChange={(e) =>
                  updateProfile((profile) => ({
                    ...profile,
                    address: { ...profile.address, street: e.target.value },
                  }))
                }
                className="form-input"
                placeholder="123 Main St, Apt 4B"
              />
            </div>
            <div>
              <label className="form-label">City</label>
              <input
                type="text"
                value={profile.address.city}
                onChange={(e) =>
                  updateProfile((profile) => ({
                    ...profile,
                    address: { ...profile.address, city: e.target.value },
                  }))
                }
                className="form-input"
                placeholder="London"
              />
            </div>
            <div>
              <label className="form-label">State/Province/Region</label>
              <input
                type="text"
                value={profile.address.state}
                onChange={(e) =>
                  updateProfile((profile) => ({
                    ...profile,
                    address: { ...profile.address, state: e.target.value },
                  }))
                }
                className="form-input"
                placeholder="Greater London"
              />
            </div>
            <div>
              <label className="form-label">Postal Code</label>
              <input
                type="text"
                value={profile.address.postalCode}
                onChange={(e) =>
                  updateProfile((profile) => ({
                    ...profile,
                    address: { ...profile.address, postalCode: e.target.value },
                  }))
                }
                className="form-input"
                placeholder="SW1A 1AA"
              />
            </div>
            <div>
              <label className="form-label">Country</label>
              <input
                type="text"
                value={profile.address.country}
                onChange={(e) =>
                  updateProfile((profile) => ({
                    ...profile,
                    address: { ...profile.address, country: e.target.value },
                  }))
                }
                className="form-input"
                placeholder="United Kingdom"
              />
            </div>
          </div>
        </div>

        {/* Privacy & Visibility Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Privacy & Visibility Settings
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Open for Work
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Indicate that you are actively looking for new opportunities
                </p>
              </div>
              <button
                onClick={() => {
                  const newOpenForWork = !profile.open_for_work;
                  updateProfile((profile) => ({
                    ...profile,
                    open_for_work: newOpenForWork,
                    // If turning off open for work, also disable discoverable
                    discoverable: newOpenForWork ? profile.discoverable : false,
                  }));
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  profile.open_for_work
                    ? "bg-blue-600"
                    : "bg-gray-200 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile.open_for_work ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Discoverable
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Allow employers to find you in candidate search results
                </p>
              </div>
              <button
                onClick={() => {
                  // Only allow discoverable to be enabled if open for work
                  if (!profile.open_for_work && !profile.discoverable) {
                    return; // Prevent enabling discoverable when not open for work
                  }
                  updateProfile((profile) => ({
                    ...profile,
                    discoverable: !profile.discoverable,
                  }));
                }}
                disabled={!profile.open_for_work}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  !profile.open_for_work
                    ? "bg-gray-300 dark:bg-gray-500 cursor-not-allowed"
                    : profile.discoverable
                    ? "bg-blue-600"
                    : "bg-gray-200 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile.discoverable ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Show Email in Search
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Display your email address to employers in search results
                </p>
              </div>
              <button
                onClick={() =>
                  updateProfile((profile) => ({
                    ...profile,
                    show_email_in_search: !profile.show_email_in_search,
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  profile.show_email_in_search
                    ? "bg-blue-600"
                    : "bg-gray-200 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile.show_email_in_search
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Show Phone in Search
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Display your phone number to employers in search results
                </p>
              </div>
              <button
                onClick={() =>
                  updateProfile((profile) => ({
                    ...profile,
                    show_phone_in_search: !profile.show_phone_in_search,
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  profile.show_phone_in_search
                    ? "bg-blue-600"
                    : "bg-gray-200 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile.show_phone_in_search
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
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
                    Privacy Information
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    You must be &ldquo;Open for Work&rdquo; to be discoverable
                    by employers. When discoverable, employers can search for
                    and view your profile. You can control which contact details
                    are visible in search results. Additional contact details
                    are only shared when you are shortlisted for a position.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Professional Summary
          </h2>
          <div>
            <label className="form-label">Professional Summary</label>
            <textarea
              value={profile.professional_summary || ""}
              onChange={(e) =>
                updateProfile((profile) => ({
                  ...profile,
                  professional_summary: e.target.value,
                }))
              }
              rows={4}
              className="form-textarea"
              placeholder="Write a brief summary of your professional background, skills, and career objectives..."
            />
          </div>
        </div>

        {/* Job Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Job Preferences
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Preferred Role Types</label>
              <select
                multiple
                value={profile.preferred_role_types || []}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setProfile({ ...profile, preferred_role_types: selected });
                }}
                className="form-select"
                size={5}
              >
                {roleTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Preferred Employment Types</label>
              <select
                multiple
                value={profile.preferred_employment_types || []}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setProfile({
                    ...profile,
                    preferred_employment_types: selected,
                  });
                }}
                className="form-select"
                size={5}
              >
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Preferred Location Types</label>
              <select
                multiple
                value={profile.preferred_location_types || []}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setProfile({
                    ...profile,
                    preferred_location_types: selected,
                  });
                }}
                className="form-select"
                size={5}
              >
                {LOCATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Preferred Working Hours</label>
              <select
                multiple
                value={profile.preferred_working_hours || []}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setProfile({ ...profile, preferred_working_hours: selected });
                }}
                className="form-select"
                size={5}
              >
                {WORKING_HOURS.map((hours) => (
                  <option key={hours} value={hours}>
                    {hours}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Salary Expectations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Salary Expectations
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <label className="relative flex items-center">
                <input
                  type="radio"
                  checked={profile.salary_expectations?.type === "exact"}
                  onChange={() =>
                    setProfile({
                      ...profile,
                      salary_expectations: {
                        type: "exact",
                        exact: profile.salary_expectations?.exact || 0,
                      },
                    })
                  }
                  className="peer sr-only"
                />
                <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-full peer-checked:border-blue-500 peer-checked:border-4"></div>
                <span className="ml-2 text-gray-700 dark:text-gray-200">
                  Exact Amount
                </span>
              </label>
              <label className="relative flex items-center">
                <input
                  type="radio"
                  checked={profile.salary_expectations?.type === "range"}
                  onChange={() =>
                    setProfile({
                      ...profile,
                      salary_expectations: {
                        type: "range",
                        min: profile.salary_expectations?.min || 0,
                        max: profile.salary_expectations?.max || 0,
                      },
                    })
                  }
                  className="peer sr-only"
                />
                <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-full peer-checked:border-blue-500 peer-checked:border-4"></div>
                <span className="ml-2 text-gray-700 dark:text-gray-200">
                  Salary Range
                </span>
              </label>
            </div>

            {profile.salary_expectations?.type === "exact" ? (
              <div>
                <input
                  type="number"
                  value={profile.salary_expectations.exact || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      salary_expectations: {
                        type: "exact",
                        exact: parseInt(e.target.value),
                      },
                    })
                  }
                  className="form-input"
                  placeholder="Enter salary amount"
                  min="0"
                />
              </div>
            ) : (
              <div>
                <select
                  value={`${profile.salary_expectations?.min || 0}-${
                    profile.salary_expectations?.max || 0
                  }`}
                  onChange={(e) => {
                    const [min, max] = e.target.value.split("-").map(Number);
                    setProfile({
                      ...profile,
                      salary_expectations: { type: "range", min, max },
                    });
                  }}
                  className="form-select"
                >
                  <option value="">Select salary range</option>
                  {SALARY_RANGES.map(({ min, max }) => (
                    <option key={`${min}-${max}`} value={`${min}-${max}`}>
                      £{min.toLocaleString()} - £{max.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Skills
          </h2>
          <div className="space-y-4">
            <div>
              <label className="form-label">Add New Skill</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Enter a skill"
                  className="form-input flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  disabled={!newSkill.trim()}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Skill
                </button>
              </div>
            </div>
            <div>
              <label className="form-label">Your Skills</label>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm 
                      bg-blue-50 dark:bg-blue-900/50 
                      text-blue-700 dark:text-blue-200
                      border border-blue-200 dark:border-blue-800"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => {
                        const updatedSkills =
                          profile.skills?.filter((_, i) => i !== index) || [];
                        setProfile({ ...profile, skills: updatedSkills });
                      }}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Languages
          </h2>
          <div className="space-y-4">
            {LANGUAGES.map((language) => {
              const existingLang = profile.languages?.find(
                (l) => l.language === language
              );
              return (
                <div key={language} className="flex items-center gap-4">
                  <span className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {language}
                  </span>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={existingLang?.speak || false}
                      onChange={(e) => {
                        const updatedLanguages =
                          profile.languages?.map((l) =>
                            l.language === language
                              ? { ...l, speak: e.target.checked }
                              : l
                          ) || [];
                        if (!existingLang) {
                          updatedLanguages.push({
                            language,
                            speak: e.target.checked,
                            read: false,
                            write: false,
                          });
                        }
                        setProfile({ ...profile, languages: updatedLanguages });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Speak
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={existingLang?.read || false}
                      onChange={(e) => {
                        const updatedLanguages =
                          profile.languages?.map((l) =>
                            l.language === language
                              ? { ...l, read: e.target.checked }
                              : l
                          ) || [];
                        if (!existingLang) {
                          updatedLanguages.push({
                            language,
                            speak: false,
                            read: e.target.checked,
                            write: false,
                          });
                        }
                        setProfile({ ...profile, languages: updatedLanguages });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Read
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={existingLang?.write || false}
                      onChange={(e) => {
                        const updatedLanguages =
                          profile.languages?.map((l) =>
                            l.language === language
                              ? { ...l, write: e.target.checked }
                              : l
                          ) || [];
                        if (!existingLang) {
                          updatedLanguages.push({
                            language,
                            speak: false,
                            read: false,
                            write: e.target.checked,
                          });
                        }
                        setProfile({ ...profile, languages: updatedLanguages });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Write
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Experience */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Work Experience
          </h2>

          {/* Add New Experience */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Add New Experience
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Company</label>
                <input
                  type="text"
                  value={newExperience.company}
                  onChange={(e) =>
                    setNewExperience({
                      ...newExperience,
                      company: e.target.value,
                    })
                  }
                  className="form-input"
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="form-label">Position</label>
                <input
                  type="text"
                  value={newExperience.position}
                  onChange={(e) =>
                    setNewExperience({
                      ...newExperience,
                      position: e.target.value,
                    })
                  }
                  className="form-input"
                  placeholder="Job title"
                />
              </div>
              <div>
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  value={newExperience.start_date}
                  onChange={(e) =>
                    setNewExperience({
                      ...newExperience,
                      start_date: e.target.value,
                    })
                  }
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  value={newExperience.end_date}
                  onChange={(e) =>
                    setNewExperience({
                      ...newExperience,
                      end_date: e.target.value,
                    })
                  }
                  className="form-input"
                  disabled={newExperience.current}
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newExperience.current}
                    onChange={(e) =>
                      setNewExperience({
                        ...newExperience,
                        current: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    I currently work here
                  </span>
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Description</label>
                <textarea
                  value={newExperience.description}
                  onChange={(e) =>
                    setNewExperience({
                      ...newExperience,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="form-textarea"
                  placeholder="Describe your responsibilities and achievements..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Skills Used</label>
                <input
                  type="text"
                  value={newExperience.skills_used.join(", ")}
                  onChange={(e) =>
                    setNewExperience({
                      ...newExperience,
                      skills_used: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="form-input"
                  placeholder="Enter skills separated by commas"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddExperience}
              className="mt-4 btn-primary"
            >
              Add Experience
            </button>
          </div>

          {/* Existing Experience */}
          <div className="space-y-4">
            {profile.experience?.map((exp) => (
              <div
                key={exp.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {exp.position}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {exp.company}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {exp.start_date} -{" "}
                      {exp.current ? "Present" : exp.end_date}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(exp.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {exp.description}
                </p>
                {exp.skills_used.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {exp.skills_used.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs 
                          bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Education
          </h2>

          {/* Add New Education */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Add New Education
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Institution</label>
                <input
                  type="text"
                  value={newEducation.institution}
                  onChange={(e) =>
                    setNewEducation({
                      ...newEducation,
                      institution: e.target.value,
                    })
                  }
                  className="form-input"
                  placeholder="University/College name"
                />
              </div>
              <div>
                <label className="form-label">Degree</label>
                <input
                  type="text"
                  value={newEducation.degree}
                  onChange={(e) =>
                    setNewEducation({ ...newEducation, degree: e.target.value })
                  }
                  className="form-input"
                  placeholder="e.g., Bachelor's, Master's"
                />
              </div>
              <div>
                <label className="form-label">Field of Study</label>
                <input
                  type="text"
                  value={newEducation.field_of_study}
                  onChange={(e) =>
                    setNewEducation({
                      ...newEducation,
                      field_of_study: e.target.value,
                    })
                  }
                  className="form-input"
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div>
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  value={newEducation.start_date}
                  onChange={(e) =>
                    setNewEducation({
                      ...newEducation,
                      start_date: e.target.value,
                    })
                  }
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  value={newEducation.end_date}
                  onChange={(e) =>
                    setNewEducation({
                      ...newEducation,
                      end_date: e.target.value,
                    })
                  }
                  className="form-input"
                  disabled={newEducation.current}
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newEducation.current}
                    onChange={(e) =>
                      setNewEducation({
                        ...newEducation,
                        current: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    I am currently studying here
                  </span>
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  value={newEducation.description}
                  onChange={(e) =>
                    setNewEducation({
                      ...newEducation,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="form-textarea"
                  placeholder="Additional details about your education..."
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddEducation}
              className="mt-4 btn-primary"
            >
              Add Education
            </button>
          </div>

          {/* Existing Education */}
          <div className="space-y-4">
            {profile.education?.map((edu) => (
              <div
                key={edu.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {edu.degree} in {edu.field_of_study}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {edu.institution}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {edu.start_date} -{" "}
                      {edu.current ? "Present" : edu.end_date}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(edu.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                {edu.description && (
                  <p className="text-gray-700 dark:text-gray-300">
                    {edu.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Certifications
          </h2>

          {/* Add New Certification */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Add New Certification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Certification Name</label>
                <input
                  type="text"
                  value={newCertification.name}
                  onChange={(e) =>
                    setNewCertification({
                      ...newCertification,
                      name: e.target.value,
                    })
                  }
                  className="form-input"
                  placeholder="e.g., AWS Certified Solutions Architect"
                />
              </div>
              <div>
                <label className="form-label">Issuing Organization</label>
                <input
                  type="text"
                  value={newCertification.issuing_organization}
                  onChange={(e) =>
                    setNewCertification({
                      ...newCertification,
                      issuing_organization: e.target.value,
                    })
                  }
                  className="form-input"
                  placeholder="e.g., Amazon Web Services"
                />
              </div>
              <div>
                <label className="form-label">Issue Date</label>
                <input
                  type="date"
                  value={newCertification.issue_date}
                  onChange={(e) =>
                    setNewCertification({
                      ...newCertification,
                      issue_date: e.target.value,
                    })
                  }
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={newCertification.expiry_date}
                  onChange={(e) =>
                    setNewCertification({
                      ...newCertification,
                      expiry_date: e.target.value,
                    })
                  }
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Credential ID (Optional)</label>
                <input
                  type="text"
                  value={newCertification.credential_id}
                  onChange={(e) =>
                    setNewCertification({
                      ...newCertification,
                      credential_id: e.target.value,
                    })
                  }
                  className="form-input"
                  placeholder="e.g., AWS-12345"
                />
              </div>
              <div>
                <label className="form-label">Credential URL (Optional)</label>
                <input
                  type="url"
                  value={newCertification.credential_url}
                  onChange={(e) =>
                    setNewCertification({
                      ...newCertification,
                      credential_url: e.target.value,
                    })
                  }
                  className="form-input"
                  placeholder="https://..."
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddCertification}
              className="mt-4 btn-primary"
            >
              Add Certification
            </button>
          </div>

          {/* Existing Certifications */}
          <div className="space-y-4">
            {profile.certifications?.map((cert) => (
              <div
                key={cert.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {cert.name}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {cert.issuing_organization}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Issued: {cert.issue_date}
                      {cert.expiry_date && ` | Expires: ${cert.expiry_date}`}
                    </p>
                    {cert.credential_id && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {cert.credential_id}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCertification(cert.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                {cert.credential_url && (
                  <a
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  >
                    View Credential →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              saving || !hasUnsavedChanges
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
