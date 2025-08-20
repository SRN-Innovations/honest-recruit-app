"use client";

import { useState } from "react";

interface JobDetails {
  title: string;
  description: string;
  numberOfPositions: number;
  roleType: string;
  skills: string[];
  optionalSkills: string[];
  startRequired: string;
  employmentType: string;
  salary: {
    type: "exact" | "range";
    exact?: number;
    min?: number;
    max?: number;
  };
  location: string;
  workingHours: string;
  equipment: string[];
  noticePeriod: string;
  languages: {
    language: string;
    speak: boolean;
    read: boolean;
    write: boolean;
  }[];
}

interface Props {
  data: JobDetails;
  onSave: (data: JobDetails) => void;
  onCancel: () => void;
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

export default function JobDetailsEditForm({ data, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState<JobDetails>(data);
  const [newSkill, setNewSkill] = useState("");
  const [newOptionalSkill, setNewOptionalSkill] = useState("");
  const [newEquipment, setNewEquipment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const addOptionalSkill = () => {
    if (
      newOptionalSkill &&
      !formData.optionalSkills.includes(newOptionalSkill)
    ) {
      setFormData({
        ...formData,
        optionalSkills: [...formData.optionalSkills, newOptionalSkill],
      });
      setNewOptionalSkill("");
    }
  };

  const removeOptionalSkill = (skill: string) => {
    setFormData({
      ...formData,
      optionalSkills: formData.optionalSkills.filter((s) => s !== skill),
    });
  };

  const addEquipment = () => {
    if (newEquipment && !formData.equipment.includes(newEquipment)) {
      setFormData({
        ...formData,
        equipment: [...formData.equipment, newEquipment],
      });
      setNewEquipment("");
    }
  };

  const removeEquipment = (item: string) => {
    setFormData({
      ...formData,
      equipment: formData.equipment.filter((e) => e !== item),
    });
  };

  const toggleLanguage = (
    language: string,
    field: "speak" | "read" | "write"
  ) => {
    setFormData({
      ...formData,
      languages: formData.languages.map((lang) =>
        lang.language === language ? { ...lang, [field]: !lang[field] } : lang
      ),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="form-input"
            required
          />
        </div>

        <div>
          <label className="form-label">
            Role Type <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.roleType}
            onChange={(e) =>
              setFormData({ ...formData, roleType: e.target.value })
            }
            className="form-input"
            required
          />
        </div>
      </div>

      <div>
        <label className="form-label">
          Job Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
          className="form-textarea"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label">
            Number of Positions <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={formData.numberOfPositions}
            onChange={(e) =>
              setFormData({
                ...formData,
                numberOfPositions: parseInt(e.target.value),
              })
            }
            className="form-input"
            required
          />
        </div>

        <div>
          <label className="form-label">
            Start Required <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.startRequired}
            onChange={(e) =>
              setFormData({ ...formData, startRequired: e.target.value })
            }
            className="form-select"
            required
          >
            <option value="">Select Start Date</option>
            {startOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">
            Employment Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.employmentType}
            onChange={(e) =>
              setFormData({ ...formData, employmentType: e.target.value })
            }
            className="form-select"
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            className="form-input"
            required
          />
        </div>

        <div>
          <label className="form-label">
            Working Hours <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.workingHours}
            onChange={(e) =>
              setFormData({ ...formData, workingHours: e.target.value })
            }
            className="form-select"
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

      <div>
        <label className="form-label">Salary</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <select
              value={formData.salary.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  salary: {
                    type: e.target.value as "exact" | "range",
                    exact: undefined,
                    min: undefined,
                    max: undefined,
                  },
                })
              }
              className="form-select"
            >
              <option value="exact">Exact Amount</option>
              <option value="range">Salary Range</option>
            </select>
          </div>
          {formData.salary.type === "exact" ? (
            <div>
              <input
                type="number"
                placeholder="Amount"
                value={formData.salary.exact || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salary: {
                      ...formData.salary,
                      exact: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="form-input"
              />
            </div>
          ) : (
            <>
              <div>
                <input
                  type="number"
                  placeholder="Min Amount"
                  value={formData.salary.min || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salary: {
                        ...formData.salary,
                        min: parseInt(e.target.value) || undefined,
                      },
                    })
                  }
                  className="form-input"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max Amount"
                  value={formData.salary.max || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salary: {
                        ...formData.salary,
                        max: parseInt(e.target.value) || undefined,
                      },
                    })
                  }
                  className="form-input"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <label className="form-label">Required Skills</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add a skill"
            className="form-input flex-1"
          />
          <button type="button" onClick={addSkill} className="btn-primary">
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm flex items-center gap-2"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="text-blue-600 hover:text-blue-800"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label">Optional Skills</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newOptionalSkill}
            onChange={(e) => setNewOptionalSkill(e.target.value)}
            placeholder="Add an optional skill"
            className="form-input flex-1"
          />
          <button
            type="button"
            onClick={addOptionalSkill}
            className="btn-primary"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.optionalSkills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full text-sm flex items-center gap-2"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeOptionalSkill(skill)}
                className="text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label">Equipment Provided</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newEquipment}
            onChange={(e) => setNewEquipment(e.target.value)}
            placeholder="Add equipment"
            className="form-input flex-1"
          />
          <button type="button" onClick={addEquipment} className="btn-primary">
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.equipment.map((item, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm flex items-center gap-2"
            >
              {item}
              <button
                type="button"
                onClick={() => removeEquipment(item)}
                className="text-green-600 hover:text-green-800"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label">Notice Period</label>
        <select
          value={formData.noticePeriod}
          onChange={(e) =>
            setFormData({ ...formData, noticePeriod: e.target.value })
          }
          className="form-select"
        >
          <option value="">Select Notice Period</option>
          {noticePeriods.map((period) => (
            <option key={period} value={period}>
              {period}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="form-label">Language Requirements</label>
        <div className="space-y-3">
          {languages.map((language) => {
            const langData = formData.languages.find(
              (l) => l.language === language
            ) || {
              language,
              speak: false,
              read: false,
              write: false,
            };

            return (
              <div key={language} className="flex items-center gap-4">
                <span className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {language}
                </span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={langData.speak}
                    onChange={() => toggleLanguage(language, "speak")}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Speak
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={langData.read}
                    onChange={() => toggleLanguage(language, "read")}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Read
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={langData.write}
                    onChange={() => toggleLanguage(language, "write")}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save Changes
        </button>
      </div>
    </form>
  );
}
