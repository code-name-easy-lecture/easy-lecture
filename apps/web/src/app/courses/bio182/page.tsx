import { redirect } from "next/navigation";
import { populationEcology } from "@/lib/mock/lectures";

// The course has one lecture for now, so go straight to it. Replace this with
// a real course page once there is more than one.
export default function Bio182Page() {
  redirect(populationEcology.href);
}
