import { Link } from 'react-router-dom';
import { Zap, Mail, Phone } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

export function Footer() {
  const { isAuthenticated } = useAuthStore();

  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="flex items-center gap-2.5 font-bold text-xl mb-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-blue-700">
                Skill<span className="text-green-600">Link</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              The easiest way to find trusted local providers for any job — from
              home repairs to professional services.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Platform
            </p>
            <nav className="flex flex-col gap-2.5 text-sm text-gray-600">
              <Link
                to="/jobs"
                className="font-medium hover:text-blue-700 transition-colors"
              >
                Find Jobs
              </Link>
              <Link
                to="/services"
                className="font-medium hover:text-blue-700 transition-colors"
              >
                Browse Services
              </Link>
              <Link
                to="/providers"
                className="font-medium hover:text-blue-700 transition-colors"
              >
                View Providers
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="font-semibold text-green-600 hover:text-green-700 transition-colors"
                >
                  Create Free Account
                </Link>
              )}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Support
            </p>
            <div className="flex flex-col gap-2.5 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                support@skilllink.com
              </span>
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-600" />
                +234 814 316 4226
              </span>
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-600" />
                +234 915 202 4439
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} SkillLink. All rights reserved.
          </p>
          <p>Built with care for Nigerian communities.</p>
        </div>
      </div>
    </footer>
  );
}
