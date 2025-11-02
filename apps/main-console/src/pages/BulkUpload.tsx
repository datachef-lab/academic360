import { Uploader } from "@/components/common/Uploader";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";

const BulkUploadPage = () => {
  useRestrictTempUsers();
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bulk Upload</h1>
      <Uploader />
    </div>
  );
};

export default BulkUploadPage;
