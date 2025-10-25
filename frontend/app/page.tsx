"use client";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
import { ArrowRight, Loader } from "lucide-react";
import { useActionState, useState } from "react";

export default function Home() {
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [state, action, pending] = useActionState(
    (prev: unknown, formData: FormData) => {
      const file = formData.get("file-input") as File;
      console.log("Received file:", file);
    },
    undefined
  );
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <form action={action} className="max-w-xl space-y-4 p-1">
        <FileInput name="file-input" file={fileInput} setFile={setFileInput} />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader className="animate-spin" /> : <ArrowRight />}
          {pending ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
}
