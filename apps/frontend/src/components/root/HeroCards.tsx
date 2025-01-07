import { Card, CardHeader } from "@/components/ui/card";

export const HeroCards = () => {
  return (
    <div className="hidden lg:flex flex-row flex-wrap gap-8 relative w-[700px] h-[500px] overflow-hidden">

      <Card
        className="absolute w-[340px] -top-[15px] drop-shadow-xl shadow-black/10 dark:shadow-white/10 
        animate-slide-in-left transition-transform duration-700 hover:scale-110 hover:rotate-3 hover:shadow-2xl"
      >
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <div className="flex flex-col">
            <img
              src="https://static.vecteezy.com/system/resources/previews/047/784/018/non_2x/an-illustration-depicting-a-diverse-group-of-students-utilizing-a-modern-online-learning-platform-showcasing-the-various-features-and-benefits-it-offers-free-vector.jpg"
              alt=""
              className="rounded-xl hover:brightness-90 transition duration-300 ease-in-out"
            />
          </div>
        </CardHeader>
      </Card>


      <Card
        className="absolute right-[20px] top-4 w-80 flex flex-col justify-center items-center drop-shadow-xl 
        shadow-black/10 dark:shadow-white/10 animate-fade-in transition-transform duration-700 hover:scale-110 hover:-rotate-3 hover:shadow-2xl"
      >
        <CardHeader className="mt-8 flex justify-center items-center pb-2">
          <img
            src="https://static.vecteezy.com/system/resources/previews/047/784/018/non_2x/an-illustration-depicting-a-diverse-group-of-students-utilizing-a-modern-online-learning-platform-showcasing-the-various-features-and-benefits-it-offers-free-vector.jpg"
            alt=""
            className="rounded-xl hover:brightness-90 transition duration-300 ease-in-out"
          />
        </CardHeader>
      </Card>

  
      <Card
        className="absolute top-[150px] left-[50px] w-72 drop-shadow-xl shadow-black/10 dark:shadow-white/10 
        animate-zoom-in transition-transform duration-700 hover:scale-110 hover:rotate-6 hover:shadow-2xl"
      >
        <CardHeader>
          <div>
            <img
              src="https://static.vecteezy.com/system/resources/previews/047/784/018/non_2x/an-illustration-depicting-a-diverse-group-of-students-utilizing-a-modern-online-learning-platform-showcasing-the-various-features-and-benefits-it-offers-free-vector.jpg"
              alt=""
              className="rounded-xl hover:brightness-90 transition duration-300 ease-in-out"
            />
          </div>
        </CardHeader>
        <hr className="w-4/5 m-auto mb-4" />
      </Card>


      <Card
        className="absolute w-[350px] -right-[10px] bottom-[35px] drop-shadow-xl shadow-black/10 
        dark:shadow-white/10 animate-fade-up transition-transform duration-700 hover:scale-110 hover:-rotate-6 hover:shadow-2xl"
      >
        <CardHeader className="space-y-1 flex md:flex-row justify-start items-start gap-4">
          <div className="mt-1 bg-primary/20 p-1 rounded-2xl">
            <img
              src="https://static.vecteezy.com/system/resources/previews/047/784/018/non_2x/an-illustration-depicting-a-diverse-group-of-students-utilizing-a-modern-online-learning-platform-showcasing-the-various-features-and-benefits-it-offers-free-vector.jpg"
              alt=""
              className="rounded-xl hover:brightness-90 transition duration-300 ease-in-out"
            />
          </div>
          <div></div>
        </CardHeader>
      </Card>
    </div>
  );
};
