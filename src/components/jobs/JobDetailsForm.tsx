"use client";

import { useState } from "react";
import { JobPosting } from "@/app/employer/dashboard/jobs/post/page";

interface Props {
  data: JobPosting["jobDetails"];
  onChange: (data: JobPosting["jobDetails"]) => void;
}

const roleTypes = [
  "Software Developer",
  "QA Engineer",
  "UI/UX Designer",
  "Product Owner",
  "Scrum Master",
  "DevOps Engineer",
  "Data Scientist",
  // Add more as needed
];

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

export default function JobDetailsForm({ data, onChange }: Props) {
  const [newSkill, setNewSkill] = useState("");
  const [newLanguage, setNewLanguage] = useState({
    language: "",
    speak: false,
    read: false,
    write: false,
  });

  const handleSkillAdd = () => {
    if (newSkill && !data.skills.includes(newSkill)) {
      onChange({
        ...data,
        skills: [...data.skills, newSkill],
      });
      setNewSkill("");
    }
  };

  const handleLanguageAdd = () => {
    if (newLanguage.language) {
      onChange({
        ...data,
        languages: [...data.languages, newLanguage],
      });
      setNewLanguage({
        language: "",
        speak: false,
        read: false,
        write: false,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="form-label">Role Title *</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="form-input"
          required
        />
      </div>

      <div>
        <label className="form-label">Role Description *</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          rows={4}
          className="form-textarea"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Number of Positions *</label>
          <input
            type="number"
            min="1"
            value={data.numberOfPositions}
            onChange={(e) =>
              onChange({ ...data, numberOfPositions: parseInt(e.target.value) })
            }
            className="form-input"
            required
          />
        </div>

        <div>
          <label className="form-label">Role Type *</label>
          <select
            value={data.roleType}
            onChange={(e) => onChange({ ...data, roleType: e.target.value })}
            className="form-select"
            required
          >
            <option value="">Select Role Type</option>
            {roleTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add more form fields following the same pattern */}

      {/* Skills Section */}
      <div>
        <label className="form-label">Skills</label>
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            className="form-input"
            placeholder="Add a skill"
          />
          <button
            type="button"
            onClick={handleSkillAdd}
            className="btn-secondary"
          >
            Add
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {data.skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {skill}
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...data,
                    skills: data.skills.filter((s) => s !== skill),
                  })
                }
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Continue adding the remaining form fields */}
    </div>
  );
}
