// redirect to visitor page by default

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/visitor");
}
