import Link from 'next/link';

export const ContactCard = () => {
  return (
    <div className="dark:bg-card mt-16 rounded-3xl border border-gray-200 bg-white px-6 py-8 shadow-sm sm:px-8 dark:border-white/10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Need a bespoke campaign?</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Reach out to the CSR taskforce for storytelling support, matching programs, and compliant donation
            playbooks.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="mailto:hello@mezon.vn"
            className="dark:bg-brand-primary dark:hover:bg-brand-primary/80 bg-primary shadow-primary/30 hover:bg-primary-light inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition dark:shadow-none"
          >
            Contact CSR team
          </Link>
          <Link
            href="#"
            className="hover:border-primary hover:text-primary dark:hover:border-primary-light inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition dark:border-white/20 dark:text-gray-200 dark:hover:text-white"
          >
            Browse documentation
          </Link>
        </div>
      </div>
    </div>
  );
};
