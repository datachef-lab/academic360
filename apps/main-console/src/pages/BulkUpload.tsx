import { Uploader } from "@/components/common/Uploader";

const BulkUploadPage = () => {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Bulk Upload</h1>
            <Uploader />
        </div>
    );
};

export default BulkUploadPage;
