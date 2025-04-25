export type Community = "GUJARATI" | "NON-GUJARATI";

export type Level = "UNDER_GRADUATE" | "POST_GRADUATE";

export type Framework = "CCF" | "CBCS";

export type Shift = "MORNING" | "AFTERNOON" | "EVENING";

export type DegreeProgramme = "HONOURS" | "GENERAL";

export type Gender = "MALE" | "FEMALE" | "TRANSGENDER";

export type Disability = "VISUAL" | "HEARING_IMPAIRMENT" | "VISUAL_IMPAIRMENT" | "ORTHOPEDIC" | "OTHER"

export type StudentStatus = "DROPPED_OUT" | "GRADUATED" | "ACTIVE" | "PENDING_CLEARANCE"

export type SubjectCategory = "SPECIAL" | "COMMON" | "HONOURS" | "GENERAL" | "ELECTIVE";

export type ParentType = "BOTH" | "FATHER_ONLY" | "MOTHER_ONLY";

export type ResultStatus = "FAIL" | "PASS";

export type PlaceOfStay = "OWN" |
    "HOSTEL" |
    "FAMILY_FRIENDS" |
    "PAYING_GUEST" |
    "RELATIVES";


    /**
     * 
     * // const AccommodationForm = () => {
//   const [place,setPlace]=useState([]);
//   const [position, setPosition] = useState("");
//   const [formData, setFormData] = useState<Accommodation & { addressData: Address }>({
//     studentId: 0,
//     placeOfStay: "HOSTEL",
//     address: null,
//     startDate: new Date(),
//     endDate: new Date(),
//     addressData: {
//       id: 0,
//       country: "",
//       state: "",
//       city: "",
//       addressLine: "",
//       landmark: "",
//       localityType: "RURAL",
//       phone: "",
//       pincode: "",
//     },
//   });

//   const location = useLocation();
//   const studentId = location.pathname.split("/").pop();
//   const id = Number(studentId);

//   const { data } = useQuery({
//     queryKey: ["accommodation", id],
//     queryFn: () => getAccommodation(id),
//     enabled: !!id,
//   });

//   useEffect(() => {
//     if (data?.payload) {
//       console.log("Fetched data:", data.payload);
//       console.log("placeOfStay***",data.payload.placeOfStay);
//       setPlace((prev)=>({
//         ...prev,
//         ...data.payload.placeOfStay,
//       }))
//       const addressData = data.payload.address || {};
//       setFormData((prev) => ({
//         ...prev,
//         ...data.payload,
//         addressData: {
//           ...prev.addressData,
//           ...addressData,
//         },
//       }));
//     }
//   }, [data]);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value, type, checked } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : name === "studentId" ? Number(value) : value || "",
//     }));
//   };

//   const saveData = useMutation({
//     mutationFn: saveAccommodation,
//     onSuccess: (formData) => {
//       console.log("Data saved:", formData);
//     },
//   });
 

//   const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
//     e.preventDefault();
//     saveData.mutate(formData);
//   };

//   return (
//     <div className="shadow-md border py-10 w-full flex items-center justify-center px-5">
//       <div className="max-w-[90%] w-full grid grid-cols-2 gap-7">
//         {formElements.map(({ name, label, type, icon }) => (
//           <div key={name} className="flex flex-col mr-8">
//             <label htmlFor={name} className="text-md text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
//             <div className="relative">
//               <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
//               <Input id={name} name={name} type={type} value={formData[name as keyof Accommodation] as string || ""} onChange={handleChange} className="w-full pl-10 pr-3 py-2" />
//             </div>
//           </div>
//         ))}
//         <DropdownMenu>
//   {/* <DropdownMenuTrigger>Open</DropdownMenuTrigger> */
//   <DropdownMenuContent onChange={handleSelect}>
//     {place?.map((Place)=>(
//       <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
//       <DropdownMenuItem key={Place.id} value={place.name}>{Place.name}</DropdownMenuItem>
//       </DropdownMenuRadioGroup>
//     ))}
    
//   </DropdownMenuContent>
// </DropdownMenu>



//         {addressFields.map(({ name, label, type, icon }) => (
//           <div key={name} className="flex flex-col mr-8">
//             <label htmlFor={name} className="text-md text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
//             <div className="relative">
//               <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
//               <Input id={name} name={name} type={type} value={formData.addressData[name as keyof Address] as string || ""} onChange={handleChange} className="w-full pl-10 pr-3 py-2" />
//             </div>
//           </div>
//         ))}

//         <div className="col-span-2">
//           <Button type="submit" onClick={handleSubmit} className="w-auto text-white font-bold py-2 px-4 rounded bg-blue-600 hover:bg-blue-700">
//             Submit
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AccommodationForm;
 
// const AccommodationForm = () => {
//   // const [place, setPlace] = useState<PlaceOfStay[]>([]); // Store placeOfStay as an array
//   const [selectedPlace, setSelectedPlace] = useState<PlaceOfStay>("OWN");

//   const handleSelect = (value: PlaceOfStay) => {
//     setSelectedPlace(value);
//   };

//   const [formData, setFormData] = useState<Accommodation & { addressData: Address }>({
//     studentId: 0,
//     placeOfStay: "HOSTEL",
//     address: null,
//     startDate: new Date(),
//     endDate: new Date(),
//     addressData: {
//       id: 0,
//       country: "",
//       state: "",
//       city: "",
//       addressLine: "",
//       landmark: "",
//       localityType: "RURAL",
//       phone: "",
//       pincode: "",
//     },
//   });

//   const location = useLocation();
//   const studentId = location.pathname.split("/").pop();
//   const id = Number(studentId);

//   const { data } = useQuery({
//     queryKey: ["accommodation", id],
//     queryFn: () => getAccommodation(id),
//     enabled: !!id,
//   });

//   useEffect(() => {
//     if (data?.payload) {
//       console.log("Fetched data:", data.payload);
//       console.log("placeOfStay***", data.payload.placeOfStay);
//       // Ensure placeOfStay is stored as an array
//       // if (Array.isArray(data.payload.placeOfStay)) {
//       //   setPlace(data.payload.placeOfStay);
//       // } else {
//       //   setPlace([data.payload.placeOfStay]); // Convert single value to array
//       // }

//       const addressData = data.payload.address || {};
//       setFormData((prev) => ({
//         ...prev,
//         ...data.payload,
//         addressData: {
//           ...prev.addressData,
//           ...addressData,
//         },
//       }));
//     }
//   }, [data]);

//   const handleSelect = (value: string) => {
//     // setPosition(value); // Update dropdown selection
//     setFormData((prev) => ({ ...prev, placeOfStay: value as PlaceOfStay })); // Update formData
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value, type, checked } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : name === "studentId" ? Number(value) : value || "",
//     }));
//   };

//   const saveData = useMutation({
//     mutationFn: saveAccommodation,
//     onSuccess: (data) => {
//       console.log("Data saved:", data);
//     },
//   });

//   const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
//     e.preventDefault();
//     console.log("Final formData before saving:", formData); // Log before saving
//     saveData.mutate(formData);
//   };

//   return (
//     <div className="shadow-md border py-10 w-full flex items-center justify-center px-5">
//       <div className="max-w-[90%] w-full grid grid-cols-2 gap-7">
//         {formElements.map(({ name, label, type, icon }) => (
//           <div key={name} className="flex flex-col mr-8">
//             <label htmlFor={name} className="text-md text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
//             <div className="relative">
//               <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
//               <Input id={name} name={name} type={type} value={formData[name as keyof Accommodation] as string || ""} onChange={handleChange} className="w-full pl-10 pr-3 py-2" />
//             </div>
//           </div>
//         ))}

//         {/* Dropdown for Place of Stay */}
//         <DropdownMenu>
//       <DropdownMenuTrigger>
//         <Button>
//           {selectedPlace} <ArrowDown />
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent>
//         <DropdownMenuRadioGroup value={selectedPlace} onValueChange={handleSelect}>
//           {placeOptions.map((place) => (
//             <DropdownMenuRadioItem key={place} value={place}>
//               {place.replace("_", " ")}
//             </DropdownMenuRadioItem>
//           ))}
//         </DropdownMenuRadioGroup>
//       </DropdownMenuContent>
//     </DropdownMenu>
//         {addressFields.map(({ name, label, type, icon }) => (
//           <div key={name} className="flex flex-col mr-8">
//             <label htmlFor={name} className="text-md text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
//             <div className="relative">
//               <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
//               <Input id={name} name={name} type={type} value={formData.addressData[name as keyof Address] as string || ""} onChange={handleChange} className="w-full pl-10 pr-3 py-2" />
//             </div>
//           </div>
//         ))}

//         <div className="col-span-2">
//           <Button type="submit" onClick={handleSubmit} className="w-auto text-white font-bold py-2 px-4 rounded bg-blue-600 hover:bg-blue-700">
//             Submit
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AccommodationForm;