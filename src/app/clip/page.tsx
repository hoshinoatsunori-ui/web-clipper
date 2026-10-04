import { Suspense } from "react";
import { ClipForm } from "./ClipForm";

export default function ClipPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-400">読み込み中...</div>
        </div>
      }
    >
      <ClipForm />
    </Suspense>
  );
}
