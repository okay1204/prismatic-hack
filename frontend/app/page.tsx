"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileInput } from "@/components/ui/file-input";
import { ArrowRight, Loader, XCircle } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { uploadToLambda } from "./actions";
import { useRouter } from "next/navigation";
import Image from "next/image";

type UploadState =
  | {
      success?: boolean;
      error?: string;
      message?: string;
      diagnosis?: string;
      fileName?: string;
      fileSize?: number;
    }
  | undefined;

export default function Home() {
  const router = useRouter();

  const [fileInput, setFileInput] = useState<File | null>(null);
  const [state, action, pending] = useActionState<UploadState, FormData>(
    async (prev: UploadState, formData: FormData) => {
      if (!formData.get("file-input")) return undefined;
      return await uploadToLambda(formData);
    },
    undefined
  );

  useEffect(() => {
    if (state && state.success && state.diagnosis) {
      // Pass diagnosis to chat page via URL params
      router.push(`/chat?diagnosis=${encodeURIComponent(state.diagnosis)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="flex items-center justify-center flex-col flex-1 px-4 bg-zinc-100 space-y-4">
      <div className="flex items-center justify-center gap-3  mb-10">
        <Image
          src="/prismatic-logo.png"
          alt="Prismatic Logo"
          width={60}
          height={60}
        />
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Prismatic</h1>
          <p className="text-muted-foreground text-sm font-medium">
            AI Cancer Detection
          </p>
        </div>
      </div>

      <Card className="max-w-xl w-full">
        <CardContent className="pt-6">
          <form action={action}>
            {state && !state.success && (
              <div className="px-3">
                <div className="max-w-xl w-full py-1.5 px-3 rounded-t-2xl border-t border-x flex items-center gap-1.5 bg-red-50 border-red-200 text-red-800">
                  <div className="[&_svg]:shrink-0 [&_svg]:size-4">
                    <XCircle />
                  </div>
                  <h3 className="font-medium text-sm flex-1">
                    {state.success ? "Upload Successful" : "Upload Failed"}
                    {state.fileSize && (
                      <span>({(state.fileSize! / 1024).toFixed(2)} KB)</span>
                    )}
                  </h3>
                </div>
              </div>
            )}
            <FileInput
              name="file-input"
              file={fileInput}
              setFile={setFileInput}
            />
            <Button
              type="submit"
              className="w-full mt-5"
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
        </CardContent>
      </Card>
    </div>
  );
}
