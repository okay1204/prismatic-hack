"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileInput } from "@/components/ui/file-input";
import { ArrowRight, Loader, CheckCircle, XCircle } from "lucide-react";
import { useActionState, useState } from "react";
import { uploadToLambda } from "./actions";

type UploadState =
  | {
      success?: boolean;
      error?: string;
      message?: string;
      fileName?: string;
      fileSize?: number;
    }
  | undefined;

export default function Home() {
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [state, action, pending] = useActionState<UploadState, FormData>(
    async (prev: UploadState, formData: FormData) => {
      return await uploadToLambda(formData);
    },
    undefined
  );

  return (
    <div className="flex items-center justify-center flex-col min-h-screen px-4 bg-zinc-100 space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Cancer Analysis</h1>
        <p className="text-muted-foreground">Upload an image for analysis</p>
      </div>

      <Card className="max-w-xl w-full">
        <CardContent className="pt-6">
          <form action={action} className="space-y-5">
            <FileInput
              name="file-input"
              file={fileInput}
              setFile={setFileInput}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={pending || !fileInput}
            >
              {pending ? (
                <Loader className="animate-spin mr-2" />
              ) : (
                <ArrowRight className="mr-2" />
              )}
              {pending ? "Uploading..." : "Upload & Analyze"}
            </Button>
          </form>

          {state && (
            <div
              className={`mt-4 p-4 rounded-lg border ${
                state.success
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {state.success ? (
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">
                    {state.success ? "Upload Successful" : "Upload Failed"}
                  </h3>
                  <p className="text-sm">
                    {state.success ? state.message : state.error}
                  </p>
                  {state.fileName && (
                    <p className="text-sm mt-2">
                      <strong>File:</strong> {state.fileName} (
                      {(state.fileSize! / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
