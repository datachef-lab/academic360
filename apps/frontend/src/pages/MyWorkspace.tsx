import ExamDates from "@/components/home/ExamDates";
import NoticeTable from "@/components/home/NoticeTable";
export default function MyWorkspacePage() {
  return (
    <>
      <div>
        {/* <h1 className="text-2xl font-medium my-3">
          MyWorkspacePage. This page will contain dynamic ui based on type of account.
        </h1>
        <ul className="ml-5">
          <li>Recent activites perfomed on database in the form of table.</li>
          <li>Notice board in the form of table.</li>
          <li>Exam Date in cards.</li>
          <li>Previous changes done by the logged-in user to the database.</li>
        </ul> */}
        <ExamDates />
        <NoticeTable/>
      </div>
    </>
  );
}
