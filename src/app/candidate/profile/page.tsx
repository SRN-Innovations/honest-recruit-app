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

      setProfile(parsedProfile);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
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
      });

      if (error) {
        console.error("Database error during save:", error);
        throw error;
      }

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim() || !profile) return;

    try {
      // Check if skill already exists
      const { data: existingSkill } = await supabase
        .from("skills")
        .select("id, name")
        .eq("name", newSkill.trim())
        .single();

      if (existingSkill) {
        // Skill already exists, no need to insert
      } else {
        // Insert new skill
        const { error: insertError } = await supabase
          .from("skills")
          .insert({ name: newSkill.trim() })
          .select()
          .single();

        if (insertError) throw insertError;
      }

      // Add to profile skills
      const updatedSkills = [...(profile.skills || []), newSkill.trim()];
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Candidate Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your profile information and professional details
        </p>
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
                  setProfile({ ...profile, full_name: e.target.value })
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
                  setProfile({ ...profile, email: e.target.value })
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
                  setProfile({ ...profile, phone_number: e.target.value })
                }
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Nationality</label>
              <select
                value={profile.nationality}
                onChange={(e) =>
                  setProfile({ ...profile, nationality: e.target.value })
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
                  setProfile({ ...profile, date_of_birth: e.target.value })
                }
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Gender</label>
              <select
                value={profile.gender || ""}
                onChange={(e) =>
                  setProfile({ ...profile, gender: e.target.value })
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
                  setProfile({
                    ...profile,
                    address: { ...profile.address, street: e.target.value },
                  })
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
                  setProfile({
                    ...profile,
                    address: { ...profile.address, city: e.target.value },
                  })
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
                  setProfile({
                    ...profile,
                    address: { ...profile.address, state: e.target.value },
                  })
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
                  setProfile({
                    ...profile,
                    address: { ...profile.address, postalCode: e.target.value },
                  })
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
                  setProfile({
                    ...profile,
                    address: { ...profile.address, country: e.target.value },
                  })
                }
                className="form-input"
                placeholder="United Kingdom"
              />
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
                setProfile({ ...profile, professional_summary: e.target.value })
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
            disabled={saving}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
