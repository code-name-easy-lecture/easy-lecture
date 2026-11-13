import { redirect } from "next/navigation";
import { tripleIntegrals } from "@/lib/mock/lectures";

// The course has one lecture for now, so go straight to it. Replace this with
// a real course page once there is more than one.
export default function Calc3Page() {
  redirect(tripleIntegrals.href);
}
