import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Requests",
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  // The root layout locks the document to 100vh (html overflow:hidden, body h-screen),
  // so public pages need their own scroll container or their content is clipped.
  return <div className="h-screen overflow-y-auto">{children}</div>;
}
