"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CustomCalendar from "../../components/Calendar";

interface Applicant {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  appliedDate: string;
  status: "onBoard" | "applied" | "hired" | "rejected";
}

interface Task {
  id: string;
  title: string;
  description: string;
  candidates: string[];
}

function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState("November");

  // Example data - replace with real data from your backend
  const stats = {
    totalApplications: 1525,
    totalApplicationsChange: 12.5,
    shortlisted: 899,
    shortlistedChange: 25.4,
    onBoarded: 155,
    onBoardedChange: 35.2,
  };

  const tasks: Task[] = [
    {
      id: "1",
      title: "Candidate Shortlisting",
      description:
        "Collaborate with hiring managers to finalize the shortlist.",
      candidates: [
        "/avatars/1.jpg",
        "/avatars/2.jpg",
        "/avatars/3.jpg",
        "/avatars/4.jpg",
        "/avatars/5.jpg",
      ],
    },
    {
      id: "2",
      title: "Interview Feedback Collection",
      description: "Gather feedback from interviewers post-interview.",
      candidates: [
        "/avatars/6.jpg",
        "/avatars/7.jpg",
        "/avatars/8.jpg",
        "/avatars/9.jpg",
        "/avatars/10.jpg",
      ],
    },
  ];

  const applicants: Applicant[] = [
    {
      id: "1",
      name: "Richard Evans",
      email: "richard.evans@mail.com",
      jobTitle: "Developer",
      appliedDate: "03/12/24",
      status: "onBoard",
    },
    // ... add more applicants
  ];

  return (
    <div className="p-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#F1FFE4] dark:bg-[#1E2A1E] rounded-2xl p-6">
          <h3 className="text-gray-800 dark:text-gray-100 text-lg font-semibold mb-4">
            Total Applications
          </h3>
          <div className="flex items-end justify-between">
            <span className="text-gray-900 dark:text-white text-4xl font-bold">
              {stats.totalApplications}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              Today {stats.totalApplicationsChange}% ↗
            </span>
          </div>
        </div>

        <div className="bg-[#F4F1FF] dark:bg-[#1E1A2E] rounded-2xl p-6">
          <h3 className="text-gray-800 dark:text-gray-100 text-lg font-semibold mb-4">
            Shortlisted
          </h3>
          <div className="flex items-end justify-between">
            <span className="text-gray-900 dark:text-white text-4xl font-bold">
              {stats.shortlisted}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              Today {stats.shortlistedChange}% ↘
            </span>
          </div>
        </div>

        <div className="bg-[#FFF8E6] dark:bg-[#2A2518] rounded-2xl p-6">
          <h3 className="text-gray-800 dark:text-gray-100 text-lg font-semibold mb-4">
            On Boarded
          </h3>
          <div className="flex items-end justify-between">
            <span className="text-gray-900 dark:text-white text-4xl font-bold">
              {stats.onBoarded}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              Today {stats.onBoardedChange}% ↗
            </span>
          </div>
        </div>
      </div>

      {/* Tasks and Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Today's Tasklist */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-gray-900 dark:text-white text-xl font-semibold">
              Todays Tasklist
            </h3>
            <Link
              href="/tasks"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              See All
            </Link>
          </div>

          <div className="space-y-6">
            {tasks.map((task) => (
              <div key={task.id} className="flex justify-between items-start">
                <div>
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-1">
                    {task.title}
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {task.description}
                  </p>
                  <div className="flex -space-x-2 mt-2">
                    {task.candidates.map((avatar, index) => (
                      <Image
                        key={index}
                        src={avatar}
                        alt="Candidate"
                        width={32}
                        height={32}
                        className="rounded-full border-2 border-white"
                      />
                    ))}
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                      +
                      {task.candidates.length > 5
                        ? task.candidates.length - 5
                        : ""}
                    </div>
                  </div>
                </div>
                <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                  •••
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-[#4CAF50] dark:bg-[#2E7D32] text-white p-4 rounded-xl flex justify-between items-center">
            <span>You have another 5 tasks today, Keep it up!</span>
            <button className="p-2 text-white hover:bg-[#45a049] dark:hover:bg-[#266A2A] rounded-lg">
              →
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-gray-900 dark:text-white text-xl font-semibold">
              Calendar
            </h3>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border-none bg-transparent text-gray-700 dark:text-gray-300 font-medium"
            >
              <option value="November">November</option>
              {/* Add more months */}
            </select>
          </div>
          <CustomCalendar />
        </div>
      </div>

      {/* Applicant Details */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-gray-900 dark:text-white text-xl font-semibold">
            Applicant Details
          </h3>
          <Link
            href="/applicants"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            View All
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-600 dark:text-gray-400">
                <th className="pb-4">Applicant Name</th>
                <th className="pb-4">Job Title</th>
                <th className="pb-4">Applied Date</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((applicant) => (
                <tr
                  key={applicant.id}
                  className="border-t border-gray-100 dark:border-gray-700"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={`/avatars/${applicant.id}.jpg`}
                        alt={applicant.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <div className="text-gray-900 dark:text-white font-medium">
                          {applicant.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {applicant.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-gray-900 dark:text-white">
                    {applicant.jobTitle}
                  </td>
                  <td className="py-4 text-gray-900 dark:text-white">
                    {applicant.appliedDate}
                  </td>
                  <td className="py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        applicant.status === "onBoard"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : applicant.status === "hired"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : applicant.status === "rejected"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      }`}
                    >
                      {applicant.status.charAt(0).toUpperCase() +
                        applicant.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
