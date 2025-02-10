import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "../components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Honest Recruit Logo"
                width={45}
                height={45}
                className="object-contain"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-[#00A3FF]">
                  HONEST RECRUIT
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-300 -mt-1">
                  INTEGRITY IN EVERY HIRE
                </span>
              </div>
            </div>
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              <Link href="/about" className="nav-link dark:text-white">
                About
              </Link>
              <Link href="/contact" className="nav-link dark:text-white">
                Contact
              </Link>
              <ThemeToggle />
              <Link href="/signin" className="btn-primary">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-16">
        <div className="bg-gradient-to-r from-[#00A3FF] to-[#0082CC] dark:from-[#33B5FF] dark:to-[#00A3FF] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center md:text-left">
                <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                  Transform Your Recruitment Process
                </h1>
                <p className="text-xl text-blue-50 max-w-2xl mx-auto md:mx-0 mb-8">
                  Connect with the right talent and opportunities through our
                  AI-powered recruitment platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Link
                    href="/register"
                    className="btn-primary bg-white text-[#00A3FF] hover:bg-blue-50"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/about"
                    className="btn-primary bg-transparent border-2 border-white hover:bg-white/10"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="hidden md:block">
                <Image
                  src="/recruitment.jpg"
                  alt="Recruitment Process"
                  width={600}
                  height={500}
                  className="object-cover rounded-lg shadow-lg w-full h-[500px]"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Types Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">
          Choose Your Path
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Employers Card */}
          <div className="card hover:scale-105 transition-transform">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              For Employers
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Find the perfect candidates for your organization with our
              advanced matching system.
            </p>
            <Link
              href="/register/employer"
              className="btn-primary w-full text-center"
            >
              Join as Employer
            </Link>
          </div>

          {/* Recruiters Card */}
          <div className="card hover:scale-105 transition-transform">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              For Recruiters
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Connect with top companies and candidates. Streamline your
              recruitment process.
            </p>
            <Link
              href="/register/recruiter"
              className="btn-primary w-full text-center"
            >
              Join as Recruiter
            </Link>
          </div>

          {/* Candidates Card */}
          <div className="card hover:scale-105 transition-transform">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              For Candidates
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Discover opportunities that match your skills and career
              aspirations.
            </p>
            <Link
              href="/register/candidate"
              className="btn-primary w-full text-center"
            >
              Join as Candidate
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
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
                  HONEST RECRUIT
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

            {/* For Employers */}
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
    </div>
  );
}
