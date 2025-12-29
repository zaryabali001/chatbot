"use client";

import { Suspense } from "react";
import Sana from "@/components/Sana";

export const dynamic = "force-dynamic";


export default function Page() {
  return (
    <div className="bg-transparent h-screen  w-screen overflow-hidden">
      {/* Hospital Chatbot */}
      <Suspense fallback={<div>Loading...</div>}>
        <Sana />
      </Suspense>
    </div>
  )
}
