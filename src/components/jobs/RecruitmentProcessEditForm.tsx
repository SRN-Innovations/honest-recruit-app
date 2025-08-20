"use client";

import { useState } from "react";

interface RecruitmentProcess {
  stages: {
    name: string;
    type: string;
    details: string;
    required: boolean;
  }[];
  applicationLimit: number;
  expiryDate: string;
  expectedInterviewDates: string[];
}

interface Props {
  data: RecruitmentProcess;
  onSave: (data: RecruitmentProcess) => void;
  onCancel: () => void;
}

const stageTypes = [
  "Phone Interview",
  "Video Interview",
  "In-Person Interview",
  "Take-Home Test",
  "Live Coding Challenge",
  "Assessment Center",
  "Final Interview",
  "Reference Check",
];

export default function RecruitmentProcessEditForm({
  data,
  onSave,
  onCancel,
}: Props) {
  const [formData, setFormData] = useState<RecruitmentProcess>(data);
  const [newStage, setNewStage] = useState({
    name: "",
    type: "",
    details: "",
    required: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addStage = () => {
    if (newStage.name && newStage.type) {
      setFormData({
        ...formData,
        stages: [...formData.stages, newStage],
      });
      setNewStage({ name: "", type: "", details: "", required: true });
    }
  };

  const removeStage = (index: number) => {
    setFormData({
      ...formData,
      stages: formData.stages.filter((_, i) => i !== index),
    });
  };

  const updateStage = (index: number, field: string, value: any) => {
    setFormData({
      ...formData,
      stages: formData.stages.map((stage, i) =>
        i === index ? { ...stage, [field]: value } : stage
      ),
    });
  };

  const moveStage = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === formData.stages.length - 1)
    ) {
      return;
    }

    const newStages = [...formData.stages];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newStages[index], newStages[targetIndex]] = [
      newStages[targetIndex],
      newStages[index],
    ];

    setFormData({
      ...formData,
      stages: newStages,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">
            Application Limit <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={formData.applicationLimit}
            onChange={(e) =>
              setFormData({
                ...formData,
                applicationLimit: parseInt(e.target.value),
              })
            }
            className="form-input"
            required
          />
        </div>

        <div>
          <label className="form-label">Expiry Date</label>
          <input
            type="date"
            value={formData.expiryDate || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                expiryDate: e.target.value,
              })
            }
            className="form-input"
          />
        </div>
      </div>

      <div>
        <label className="form-label">Recruitment Stages</label>
        <div className="space-y-4">
          {formData.stages.map((stage, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Stage {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveStage(index, "up")}
                    disabled={index === 0}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStage(index, "down")}
                    disabled={index === formData.stages.length - 1}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStage(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Stage Name</label>
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) => updateStage(index, "name", e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Stage Type</label>
                  <select
                    value={stage.type}
                    onChange={(e) => updateStage(index, "type", e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">Select Type</option>
                    {stageTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label">Stage Details</label>
                <textarea
                  value={stage.details}
                  onChange={(e) =>
                    updateStage(index, "details", e.target.value)
                  }
                  rows={2}
                  className="form-textarea"
                  placeholder="Additional details about this stage..."
                />
              </div>

              <div className="mt-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={stage.required}
                    onChange={(e) =>
                      updateStage(index, "required", e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Required Stage
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Stage */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 mt-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Add New Stage
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Stage Name</label>
              <input
                type="text"
                value={newStage.name}
                onChange={(e) =>
                  setNewStage({ ...newStage, name: e.target.value })
                }
                className="form-input"
                placeholder="e.g., Technical Interview"
              />
            </div>

            <div>
              <label className="form-label">Stage Type</label>
              <select
                value={newStage.type}
                onChange={(e) =>
                  setNewStage({ ...newStage, type: e.target.value })
                }
                className="form-select"
              >
                <option value="">Select Type</option>
                {stageTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label className="form-label">Stage Details</label>
            <textarea
              value={newStage.details}
              onChange={(e) =>
                setNewStage({ ...newStage, details: e.target.value })
              }
              rows={2}
              className="form-textarea"
              placeholder="Additional details about this stage..."
            />
          </div>

          <div className="mt-3 flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newStage.required}
                onChange={(e) =>
                  setNewStage({ ...newStage, required: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Required Stage
              </span>
            </label>

            <button
              type="button"
              onClick={addStage}
              disabled={!newStage.name || !newStage.type}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Stage
            </button>
          </div>
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
