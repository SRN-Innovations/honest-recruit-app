import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "../components/ThemeToggle";
import MainFooter from "@/components/layout/MainFooter";
import MainHeader from "@/components/layout/MainHeader";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <MainHeader />

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

      <MainFooter />
    </div>
  );
}
