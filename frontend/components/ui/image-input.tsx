"use client";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import React, { useState, useRef } from "react";
import { Button } from "./button";

export default function ImageInput({
  setImage,
}: {
  setImage: React.Dispatch<React.SetStateAction<File | null>>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        setImage(droppedFile);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      className={cn(
        "border border-dashed rounded-xl p-12 text-center transition-all w-full",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 rounded-full bg-muted flex items-center justify-center">
          <Upload className="size-4 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <p className="text-lg font-medium">
            Drop your image here or click to browse
          </p>
          <p className="text-sm text-muted-foreground">...</p>
        </div>

        <div>
          <Button
            size="lg"
            className="cursor-pointer"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            Select Image
          </Button>

          <input
            id="image-upload"
            name="upload-input"
            ref={inputRef}
            type="image"
            accept=".pdf"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) setImage(selectedFile);
            }}
            className="sr-only"
          />
        </div>
      </div>
    </div>
  );
}
