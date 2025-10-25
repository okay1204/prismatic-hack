"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="flex items-center justify-center flex-col min-h-screen px-4 bg-zinc-100 space-y-10">
      <h1 className="text-3xl font-medium">App Name</h1>
      <Card className="max-w-xl">
        <CardContent>
          <form action={action} className="space-y-5">
            <FileInput
              name="file-input"
              file={fileInput}
              setFile={setFileInput}
            />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader className="animate-spin" /> : <ArrowRight />}
              {pending ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
