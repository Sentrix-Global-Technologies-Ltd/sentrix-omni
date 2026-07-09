import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import Logo from "../../components/common/Logo";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid">
          <div className="relative flex items-center justify-center z-1">
            {/* <!-- ===== Common Grid Shape Start ===== --> */}
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Link to="/" className="mb-5 block rounded-2xl bg-white/10 p-4 backdrop-blur" aria-label="Sentrix home">
                <Logo iconOnly className="[&_span:last-child]:text-white" />
              </Link>
              <h2 className="mb-2 text-center text-2xl font-bold text-white">Sentrix</h2>
              <p className="text-center text-gray-300 dark:text-white/60">
                Safety &amp; security operations — incidents, emergencies, dispatch, and
                evidence, in one command console.
              </p>
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
