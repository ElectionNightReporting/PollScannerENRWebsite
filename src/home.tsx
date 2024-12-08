import { Card } from "@/components/ui/card";
import MichiganMap from "./michigan_map";

export default function Home() {
  return (
    <div className="flex justify-center items-center w-screen bg-white">
      {/* <Card className="p-8 w-full bg-white max-w-[85%]"> */}
      <MichiganMap />
      {/* </Card> */}
    </div>
  );
}
