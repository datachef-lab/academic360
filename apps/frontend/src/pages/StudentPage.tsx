import { useEffect } from "react";
import { useParams } from "react-router-dom";

export default function StudentPage() {
  const { studentId } = useParams();
  console.log(studentId);

  useEffect(() => {
    // Fetch Student
  }, [studentId]);

  return (
    <div className="flex h-full gap-2">
      <div className="w-[80%] h-full border">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          ABC STUDENT - {studentId}
        </h2>
        <div className="">
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quia expedita ipsa, nesciunt magni a eaque
          repellendus consequuntur quisquam obcaecati ipsum perferendis repudiandae maxime debitis aliquam! Debitis
          repellendus dolores eligendi facere?
        </div>
      </div>
      <div className="w-[20%] h-full border">
        <ul>
            <li>Personal Details</li>
            <li>Health Details</li>
            <li>Parent Details</li>
        </ul>
      </div>
    </div>
  );
}
