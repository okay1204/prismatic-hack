"use client";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
import { ArrowRight, Loader, CheckCircle, XCircle } from "lucide-react";
import { useActionState, useState } from "react";
import { uploadToLambda } from "./actions";

type UploadState = {
  success?: boolean;
  error?: string;
  message?: string;
  fileName?: string;
  fileSize?: number;
} | undefined;

export default function Home() {
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [state, action, pending] = useActionState<UploadState, FormData>(
    async (prev: UploadState, formData: FormData) => {
      return await uploadToLambda(formData);
    },
    undefined
  );

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="max-w-xl w-full space-y-4 p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Cancer Analysis</h1>
          <p className="text-muted-foreground">
            Upload an image for analysis
          </p>
        </div>

        <form action={action} className="space-y-4">
          <FileInput name="file-input" file={fileInput} setFile={setFileInput} />
          <Button type="submit" className="w-full" disabled={pending || !fileInput}>
            {pending ? <Loader className="animate-spin mr-2" /> : <ArrowRight className="mr-2" />}
            {pending ? "Uploading..." : "Upload & Analyze"}
          </Button>
        </form>
      </div>
    </div>
  );
}
