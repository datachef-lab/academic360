import { mockData } from "@/lib/Data";
import { columns } from "./columns";
import { DataTable } from "./DataTable";

const Page = () => {
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

  return (
    <div>
      <DataTable columns={columns} data={mockData} />
    </div>
  );
};

export default Page;
