"use client";
import { Button } from "@/components/ui/button";
import UploadInput from "@/components/ui/upload-input";
import { ArrowRight, Loader } from "lucide-react";
import { useActionState, useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [state, action, pending] = useActionState(
    (prev: unknown, formData: FormData) => {
      const file = formData.get("upload-input") as File;
      console.log("Received file:", file);
    },
    undefined
  );
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <form action={action}>
        <UploadInput file={file} setFile={setFile} />
        {file && <div>{file.name}</div>}
        <Button type="submit" className="mt-8 w-full" disabled={pending}>
          {pending ? <Loader className="animate-spin" /> : <ArrowRight />}
          {pending ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
}
