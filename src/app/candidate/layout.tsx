"use client";

import CandidateSidebar from "@/components/layout/CandidateSidebar";
import MainFooter from "@/components/layout/MainFooter";
import MainHeader from "@/components/layout/MainHeader";
import RouteGuard from "@/components/auth/RouteGuard";
import { useState } from "react";

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <RouteGuard requiredUserType="candidate">
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <MainHeader
          showSignIn={false}
          showThemeToggle={true}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          showSignOut={true}
        />

        <CandidateSidebar isSidebarOpen={isSidebarOpen} />

        {/* Main Content */}
        <main
          className={`flex-grow pt-16 ${
            isSidebarOpen ? "ml-64" : "ml-0"
          } transition-margin duration-300`}
        >
          {children}
        </main>

        <MainFooter isSidebarOpen={isSidebarOpen} />
      </div>
    </RouteGuard>
  );
}
