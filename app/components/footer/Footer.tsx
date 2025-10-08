'use client';
import { usePathname } from "next/navigation";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  if (pathname.startsWith("/projects/")) {
    return null;
  }

  return (
    <footer className="bg-black border-t border-gray-800 text-gray-400 py-6">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">&copy; {currentYear} Klippy. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
