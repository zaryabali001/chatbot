"use client";

import { Suspense } from "react";
import Sana from "@/components/Sana";

export const dynamic = "force-dynamic";


export default function Page() {
  return (
    <div >
      {/* Hospital Chatbot */}
      <Suspense fallback={<div>Loading...</div>}>
        <Sana />
      </Suspense>
    </div>
  )
}
