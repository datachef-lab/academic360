// import  { useEffect, useState } from "react";
// import axios from "axios";
// import { Payment } from "./types";
// import { columns } from "./columns";
// import { DataTable } from "./DataTable";

// // Refactored ReportPage with useState and useEffect using Axios
// const Page = () => {
//   const [data, setData] = useState<Payment[]>([]);
  
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await axios.get("http://localhost:5000/payments");
//         setData(response.data); // Set the data into state
//         console.log(response.data);
//       } catch (error) {
//         console.log("Error fetching data:", error); // Handle any errors
//       }
//     };
    
//     fetchData();
//   }, []); // Empty dependency array means this runs only once, on component mount.

//   return (
//     <div className="container mx-auto py-10">
//       <DataTable columns={columns} data={data} />
//     </div>
//   );
// };

// export default Page;
