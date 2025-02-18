"use client";

import { useEffect, useState } from "react";

import { JobPosting } from "@/app/employer/dashboard/jobs/post/page";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface Props {
  data: JobPosting["jobDetails"];
  onChange: (data: JobPosting["jobDetails"]) => void;
  errors?: Record<string, string[]>;
}

interface RoleType {
  id: number;
  name: string;
}

interface Skill {
  id: number;
  name: string;
}

const startOptions = [
  "Immediate",
  "2 weeks",
  "1 month",
  "2 months",
  "3 months",
  "Flexible",
];

const employmentTypes = [
  "Permanent",
  "Temporary",
  "Contract",
  "Apprenticeship",
  "Work Experience",
];

const locationTypes = ["Remote", "Office", "Hybrid"];

const workingHours = [
  "Full-time",
  "Part-time",
  "Flexible",
  "Shift work",
  "Weekend",
];

const equipmentOptions = [
  "Laptop",
  "Desktop Computer",
  "Phone",
  "Headset",
  "Monitor",
];

const noticePeriods = [
  "1 week",
  "2 weeks",
  "1 month",
  "2 months",
  "3 months",
  "Negotiable",
];

const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Mandarin",
  "Japanese",
];

const salaryRanges = [
  { min: 20000, max: 30000 },
  { min: 30000, max: 40000 },
  { min: 40000, max: 50000 },
  { min: 50000, max: 60000 },
  { min: 60000, max: 70000 },
  { min: 70000, max: 80000 },
  { min: 80000, max: 90000 },
  { min: 90000, max: 100000 },
  { min: 100000, max: 120000 },
  { min: 120000, max: 150000 },
  { min: 150000, max: 200000 },
];

export default function JobDetailsForm({ data, onChange, errors }: Props) {
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(data.skills);
  const [selectedOptionalSkills, setSelectedOptionalSkills] = useState<
    string[]
  >(data.optionalSkills || []);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState("");
  const [newOptionalSkill, setNewOptionalSkill] = useState("");

  useEffect(() => {
    const fetchRoleTypes = async () => {
      const { data: roleTypesData, error } = await supabase
        .from("role_types")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching role types:", error);
        return;
      }

      setRoleTypes(roleTypesData);
      setLoading(false);
    };

    fetchRoleTypes();
  }, []);

  useEffect(() => {
    const fetchSkillsForRole = async () => {
      if (!data.roleType) {
        setAvailableSkills([]);
        return;
      }

      const { data: skillsData, error } = await supabase
        .from("role_skills")
        .select(
          `
          skills (
            id,
            name
          ),
          role_types!inner (
            name
          )
        `
        )
        .eq("role_types.name", data.roleType);

      if (error) {
        console.error("Error fetching skills:", error);
        return;
      }

      // Transform the data to match our Skill interface
      const skills = skillsData
        ?.map((item) => item.skills as Skill)
        .filter((skill): skill is Skill => skill !== null);

      setAvailableSkills(skills || []);
    };

    fetchSkillsForRole();
  }, [data.roleType]);

  const handleSkillToggle = (skillName: string) => {
    const updatedSkills = selectedSkills.includes(skillName)
      ? selectedSkills.filter((s) => s !== skillName)
      : [...selectedSkills, skillName];

    setSelectedSkills(updatedSkills);
    onChange({ ...data, skills: updatedSkills });
  };

  const handleAddCustomSkill = async () => {
    if (!newSkill.trim()) return;

    try {
      // First check if skill already exists
      const { data: existingSkill } = await supabase
        .from("skills")
        .select("id, name")
        .eq("name", newSkill.trim())
        .single();

      let skillId: number;

      if (existingSkill) {
        skillId = existingSkill.id;
      } else {
        // Insert new skill
        const { data: newSkillData, error: insertError } = await supabase
          .from("skills")
          .insert({ name: newSkill.trim() })
          .select()
          .single();

        if (insertError) throw insertError;
        skillId = newSkillData.id;
      }

      // Add relationship to role_skills if a role type is selected
      if (data.roleType) {
        const { data: roleType } = await supabase
          .from("role_types")
          .select("id")
          .eq("name", data.roleType)
          .single();

        if (roleType) {
          await supabase
            .from("role_skills")
            .insert({ role_type_id: roleType.id, skill_id: skillId });
        }
      }

      // Update local state
      const updatedSkills = [...selectedSkills, newSkill.trim()];
      setSelectedSkills(updatedSkills);
      onChange({ ...data, skills: updatedSkills });
      setNewSkill("");
    } catch (error) {
      console.error("Error adding skill:", error);
      toast.error("Failed to add skill. Please try again.");
    }
  };

  const handleOptionalSkillToggle = (skillName: string) => {
    const updatedSkills = selectedOptionalSkills.includes(skillName)
      ? selectedOptionalSkills.filter((s) => s !== skillName)
      : [...selectedOptionalSkills, skillName];

    setSelectedOptionalSkills(updatedSkills);
    onChange({ ...data, optionalSkills: updatedSkills });
  };

  const handleAddOptionalSkill = async () => {
    if (!newOptionalSkill.trim()) return;

    try {
      // First check if skill already exists
      const { data: existingSkill } = await supabase
        .from("skills")
        .select("id, name")
        .eq("name", newOptionalSkill.trim())
        .single();

      let skillId: number;

      if (existingSkill) {
        skillId = existingSkill.id;
      } else {
        // Insert new skill
        const { data: newSkillData, error: insertError } = await supabase
          .from("skills")
          .insert({ name: newOptionalSkill.trim() })
          .select()
          .single();

        if (insertError) throw insertError;
        skillId = newSkillData.id;
      }

      // Update local state
      const updatedSkills = [
        ...selectedOptionalSkills,
        newOptionalSkill.trim(),
      ];
      setSelectedOptionalSkills(updatedSkills);
      onChange({ ...data, optionalSkills: updatedSkills });
      setNewOptionalSkill("");
    } catch (error) {
      console.error("Error adding optional skill:", error);
      toast.error("Failed to add optional skill. Please try again.");
    }
  };

  const handleSalaryTypeChange = (type: "exact" | "range") => {
    onChange({
      ...data,
      salary:
        type === "exact"
          ? { type: "exact", exact: data.salary.exact || 0 }
          : {
              type: "range",
              min: data.salary.min || 0,
              max: data.salary.max || 0,
            },
    });
  };

  const handleLanguageChange = (
    language: string,
    field: keyof Pick<
      JobPosting["jobDetails"]["languages"][0],
      "speak" | "read" | "write"
    >
  ) => {
    const existingLang = data.languages.find((l) => l.language === language);
    if (existingLang) {
      onChange({
        ...data,
        languages: data.languages.map((l) =>
          l.language === language ? { ...l, [field]: !l[field] } : l
        ),
      });
    } else {
      onChange({
        ...data,
        languages: [
          ...data.languages,
          {
            language,
            speak: field === "speak",
            read: field === "read",
            write: field === "write",
          },
        ],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">
            Role Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            className={`form-input ${errors?.title ? "border-red-500" : ""}`}
            required
          />
        </div>

        <div>
          <label className="form-label">
            Role Type <span className="text-red-500">*</span>
          </label>
          <select
            value={data.roleType}
            onChange={(e) => onChange({ ...data, roleType: e.target.value })}
            className={`form-select ${
              errors?.roleType ? "border-red-500" : ""
            }`}
            required
          >
            <option value="">Select Role Type</option>
            {roleTypes.map((type) => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="form-label">
          Role Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          rows={4}
          className={`form-textarea ${
            errors?.description ? "border-red-500" : ""
          }`}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label">
            Employment Type <span className="text-red-500">*</span>
          </label>
          <select
            value={data.employmentType}
            onChange={(e) =>
              onChange({ ...data, employmentType: e.target.value })
            }
            className={`form-select ${
              errors?.employmentType ? "border-red-500" : ""
            }`}
            required
          >
            <option value="">Select Type</option>
            {employmentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">
            Location <span className="text-red-500">*</span>
          </label>
          <select
            value={data.location}
            onChange={(e) => onChange({ ...data, location: e.target.value })}
            className={`form-select ${
              errors?.location ? "border-red-500" : ""
            }`}
            required
          >
            <option value="">Select Location</option>
            {locationTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">
            Working Hours <span className="text-red-500">*</span>
          </label>
          <select
            value={data.workingHours}
            onChange={(e) =>
              onChange({ ...data, workingHours: e.target.value })
            }
            className={`form-select ${
              errors?.workingHours ? "border-red-500" : ""
            }`}
            required
          >
            <option value="">Select Hours</option>
            {workingHours.map((hours) => (
              <option key={hours} value={hours}>
                {hours}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <label className="form-label">
          Salary <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4 mb-2">
          <label className="relative flex items-center">
            <input
              type="radio"
              checked={data.salary.type === "exact"}
              onChange={() => handleSalaryTypeChange("exact")}
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
              checked={data.salary.type === "range"}
              onChange={() => handleSalaryTypeChange("range")}
              className="peer sr-only"
            />
            <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-full peer-checked:border-blue-500 peer-checked:border-4"></div>
            <span className="ml-2 text-gray-700 dark:text-gray-200">
              Salary Range
            </span>
          </label>
        </div>

        {data.salary.type === "exact" ? (
          <div>
            <input
              type="number"
              value={data.salary.exact || ""}
              onChange={(e) =>
                onChange({
                  ...data,
                  salary: { type: "exact", exact: parseInt(e.target.value) },
                })
              }
              className={`form-input ${errors?.salary ? "border-red-500" : ""}`}
              placeholder="Enter salary amount"
              min="0"
            />
          </div>
        ) : (
          <div>
            <select
              value={`${data.salary.min}-${data.salary.max}`}
              onChange={(e) => {
                const [min, max] = e.target.value.split("-").map(Number);
                onChange({
                  ...data,
                  salary: { type: "range", min, max },
                });
              }}
              className={`form-select ${
                errors?.salary ? "border-red-500" : ""
              }`}
            >
              <option value="">Select salary range</option>
              {salaryRanges.map(({ min, max }) => (
                <option key={`${min}-${max}`} value={`${min}-${max}`}>
                  £{min.toLocaleString()} - £{max.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Skills Sections */}
      {data.roleType && (
        <div className="space-y-6">
          {/* Required Skills Section */}
          <div className="space-y-4">
            <div>
              <label className="form-label">
                Required Skills for {data.roleType}
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  ...availableSkills,
                  ...selectedSkills
                    .filter(
                      (skillName) =>
                        !availableSkills.some(
                          (skill) => skill.name === skillName
                        )
                    )
                    .map((skillName) => ({ id: skillName, name: skillName })),
                ].map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => handleSkillToggle(skill.name)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${
                        selectedSkills.includes(skill.name)
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }
                    `}
                  >
                    {skill.name}
                    {selectedSkills.includes(skill.name) && (
                      <span className="ml-1.5">✓</span>
                    )}
                  </button>
                ))}
              </div>
              {availableSkills.length === 0 && selectedSkills.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  No required skills defined for this role type yet.
                </p>
              )}
            </div>

            <div>
              <label className="form-label">Add another required skill</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomSkill();
                    }
                  }}
                  placeholder="Enter a skill"
                  className="form-input flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  disabled={!newSkill.trim()}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Skill
                </button>
              </div>
            </div>
          </div>

          {/* Good to have Skills Section */}
          <div className="space-y-4">
            <div>
              <label className="form-label">Good to have Skills</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  ...availableSkills.filter(
                    (skill) => !selectedSkills.includes(skill.name)
                  ),
                  ...selectedOptionalSkills
                    .filter(
                      (skillName) =>
                        !availableSkills.some(
                          (skill) => skill.name === skillName
                        )
                    )
                    .map((skillName) => ({ id: skillName, name: skillName })),
                ].map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => handleOptionalSkillToggle(skill.name)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${
                        selectedOptionalSkills.includes(skill.name)
                          ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }
                    `}
                  >
                    {skill.name}
                    {selectedOptionalSkills.includes(skill.name) && (
                      <span className="ml-1.5">✓</span>
                    )}
                  </button>
                ))}
              </div>
              {availableSkills.length === 0 &&
                selectedOptionalSkills.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    No optional skills added yet.
                  </p>
                )}
            </div>

            <div>
              <label className="form-label">Add optional skill</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOptionalSkill}
                  onChange={(e) => setNewOptionalSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOptionalSkill();
                    }
                  }}
                  placeholder="Enter a skill"
                  className="form-input flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddOptionalSkill}
                  disabled={!newOptionalSkill.trim()}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Skill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Continue adding the remaining form fields */}
    </div>
  );
}
