"use client";
import { Button } from "@/components/ui/button";
import ImageInput from "@/components/ui/image-input";
import { ArrowRight, ImageIcon, Loader } from "lucide-react";
import { useActionState, useState } from "react";

export default function Home() {
  const [imageInput, setImageInput] = useState<File | null>(null);
  const [state, action, pending] = useActionState(
    (prev: unknown, formData: FormData) => {
      const file = formData.get("upload-input") as File;
      console.log("Received file:", file);
    },
    undefined
  );
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <form action={action} className="max-w-xl space-y-4 p-1">
        {imageInput ? (
          <div className="bg-zinc-100 border border-zinc-200 p-3 rounded-lg flex items-center gap-4 w-full">
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className="bg-zinc-300 rounded-full [&_svg]:size-5 p-2">
                <ImageIcon />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="truncate">{imageInput.name}</h3>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setImageInput(null)}
              variant="outline"
            >
              Remove
            </Button>
          </div>
        ) : (
          <ImageInput setImage={setImageInput} />
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader className="animate-spin" /> : <ArrowRight />}
          {pending ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
}
