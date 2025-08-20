"use client";

import { useState } from "react";

interface Legal {
  rightToWork: boolean;
  backgroundCheck: boolean;
  references: {
    count: number;
    type: string[];
  };
}

interface Props {
  data: Legal;
  onSave: (data: Legal) => void;
  onCancel: () => void;
}

const referenceTypes = [
  "Former Manager",
  "Current Manager",
  "Colleague",
  "Client",
  "Professor",
  "Mentor",
  "Supervisor",
  "Team Lead",
  "Project Manager",
  "HR Representative",
];

export default function LegalEditForm({ data, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState<Legal>(data);
  const [newReferenceType, setNewReferenceType] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addReferenceType = () => {
    if (
      newReferenceType &&
      !formData.references.type.includes(newReferenceType)
    ) {
      setFormData({
        ...formData,
        references: {
          ...formData.references,
          type: [...formData.references.type, newReferenceType],
        },
      });
      setNewReferenceType("");
    }
  };

  const removeReferenceType = (type: string) => {
    setFormData({
      ...formData,
      references: {
        ...formData.references,
        type: formData.references.type.filter((t) => t !== type),
      },
    });
  };

  const toggleDefaultReferenceType = (type: string) => {
    if (formData.references.type.includes(type)) {
      removeReferenceType(type);
    } else {
      setFormData({
        ...formData,
        references: {
          ...formData.references,
          type: [...formData.references.type, type],
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Right to Work Check */}
      <div>
        <label className="form-label">Right to Work Check</label>
        <div className="mt-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.rightToWork}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rightToWork: e.target.checked,
                })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Right to work check required
            </span>
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            This ensures candidates have legal permission to work in your
            country
          </p>
        </div>
      </div>

      {/* Background Check */}
      <div>
        <label className="form-label">Background Check</label>
        <div className="mt-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.backgroundCheck}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  backgroundCheck: e.target.checked,
                })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Background check required
            </span>
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            This may include criminal record checks, employment verification,
            etc.
          </p>
        </div>
      </div>

      {/* References */}
      <div>
        <label className="form-label">Reference Requirements</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">
              Number of References <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={formData.references.count}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  references: {
                    ...formData.references,
                    count: parseInt(e.target.value),
                  },
                })
              }
              className="form-input"
              required
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              How many references are required
            </p>
          </div>

          <div>
            <label className="form-label">Reference Types</label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Select from common reference types or add custom ones
            </p>

            {/* Default Reference Types */}
            <div className="grid grid-cols-1 gap-2 mb-4">
              {referenceTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.references.type.includes(type)}
                    onChange={() => toggleDefaultReferenceType(type)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {type}
                  </span>
                </label>
              ))}
            </div>

            {/* Custom Reference Types */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newReferenceType}
                onChange={(e) => setNewReferenceType(e.target.value)}
                placeholder="Add custom reference type"
                className="form-input flex-1"
              />
              <button
                type="button"
                onClick={addReferenceType}
                disabled={!newReferenceType}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>

            {/* Selected Reference Types */}
            {formData.references.type.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.references.type.map((type, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-sm flex items-center gap-2"
                  >
                    {type}
                    <button
                      type="button"
                      onClick={() => removeReferenceType(type)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Legal Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
          Legal Compliance Notes
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Ensure all requirements comply with local employment laws</li>
          <li>• Background checks must follow legal procedures</li>
          <li>• Reference checks should respect privacy regulations</li>
          <li>• Right to work checks are mandatory in many jurisdictions</li>
        </ul>
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
