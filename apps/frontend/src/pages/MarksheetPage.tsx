import { useParams } from "react-router-dom";

export default function MarksheetPage() {
  const { framework, uid, marksheetId } = useParams();
  return (
    <div className="flex gap-2">
      <p>{framework} / </p>
      <p>{uid} / </p>
      <p>{marksheetId}</p>
    </div>
  );
}
