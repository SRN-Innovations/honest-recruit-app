import Image from "next/image";
import Link from "next/link";

export default function Footer({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  return (
    <footer
      className={`bg-white dark:bg-gray-800 mt-auto ${
        isSidebarOpen ? "ml-64" : "ml-0"
      } transition-margin duration-300`}
    >
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
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
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
