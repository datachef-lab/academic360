import DocumentContent from "@/components/documents/DocumentContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documents",
};

// We no longer need to fetch documents on the server side
// The client will fetch documents based on the current user's details
export default function DocumentsPage() {
  return <DocumentContent />;
}
