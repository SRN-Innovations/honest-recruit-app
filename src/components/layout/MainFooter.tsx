"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface MainFooterProps {
  isSidebarOpen?: boolean;
}

export default function MainFooter({ isSidebarOpen }: MainFooterProps) {
  const { isLoggedIn, userType } = useAuth();
  return (
    <footer className="bg-white dark:bg-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Honest Recruit Logo"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="text-lg font-bold text-[#00A3FF]">
                HONEST RECRUITMENT
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Transforming recruitment through integrity and innovation.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://linkedin.com"
                className="text-gray-400 hover:text-[#00A3FF]"
              >
                <span className="sr-only">LinkedIn</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                className="text-gray-400 hover:text-[#00A3FF]"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            </div>
          </div>

          {/* For Job Seekers */}
          {!(isLoggedIn && userType === "employer") && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                For Job Seekers
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/jobs/search"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Browse Jobs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/career-advice"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Career Advice
                  </Link>
                </li>
                <li>
                  <Link
                    href="/resume-tips"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Resume Tips
                  </Link>
                </li>
                <li>
                  <Link
                    href="/salary-guide"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Salary Guide
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* For Employers */}
          {!(isLoggedIn && userType === "candidate") && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                For Employers
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/post-job"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Post a Job
                  </Link>
                </li>
                <li>
                  <Link
                    href="/talent-search"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Talent Search
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/recruitment-solutions"
                    className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                  >
                    Recruitment Solutions
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-600 dark:text-gray-300 hover:text-[#00A3FF] text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8">
          <p className="text-sm text-gray-400 text-center">
            © {new Date().getFullYear()} Honest Recruit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
