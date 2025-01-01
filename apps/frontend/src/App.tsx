import MyComponent from "@/components/MyComponent";
import { Button } from "@/components/ui/button";

const App = () => {
  return (
    <div className="text-center">
      App
      <MyComponent />
      <Button>Click me</Button>
    </div>
  );
};

export default App;
