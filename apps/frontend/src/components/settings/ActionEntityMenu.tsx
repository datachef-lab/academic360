import React, { useState } from "react";
import { Religion } from "@/types/resources/religion";
import { Degree } from "@/types/resources/degree";
import EditDegreeModal from "./EditModal/EditDegreeModal";
import EditReligionModal from "./EditModal/EditReligionModal";
import { Category } from "@/types/resources/category";
import { BoardUniversity } from "@/types/resources/board-university";
import { Edit} from "lucide-react";
import EditBoardUniversityModal from "./EditModal/EditBoardUniversityModal";
import EditCategoryModal from "./EditModal/EditCategoryModal";
import { AnnualIncome } from "@/types/resources/annual-income";
import EditIncomeModal from "./EditModal/EditIncomeModal";

interface Props {
  type: "Category" | "BoardUniversity" | "Degree" | "Religion" | "AnnualIncome"; 
  data: Degree | Religion | Category | BoardUniversity | AnnualIncome; 
}

const ActionEntityMenu: React.FC<Props> = ({ type, data }) => {
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
const onclick=()=>{
    console.log();
    setIsEditOpen(true);
}
 
  const getEditModal = () => {
    
    switch (type) {
      case "Degree":
        return <EditDegreeModal type={type} data={data as Degree} onClose={() => setIsEditOpen(false)} />;
      case "Religion":
        return <EditReligionModal type={type} data={data as Religion} onClose={() => setIsEditOpen(false)} />;
      case "BoardUniversity":
        return <EditBoardUniversityModal type={type} data={data as BoardUniversity } onClose={() => setIsEditOpen(false)} /> 
      case "Category":
        return <EditCategoryModal type={type} data={data as Category } onClose={() => setIsEditOpen(false)} /> 
      case "AnnualIncome":
        return <EditIncomeModal type={type} data={data as AnnualIncome} onClose={()=>setIsEditOpen(false)}/>
      default:
        return null;
    }
  };

  return (
    <div>
   <div>
   <button
      onClick={onclick}
      className="flex items-center gap-2 p-2 rounded-lg bg-transparent
                 text-green-600 font-semibold  hover:scale-110 "
    >
      <Edit size={18}  className="drop-shadow-lg" />
    
    </button>
     
      </div>

      {isEditOpen && getEditModal()}
    </div>
  );
};

export default ActionEntityMenu;
