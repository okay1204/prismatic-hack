"use client";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import React, { useState, useRef } from "react";
import { Button } from "./button";

export default function UploadInput({
  file,
  setFile,
}: {
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        setFile(droppedFile);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      className={cn(
        "border border-dashed rounded-xl p-12 text-center transition-all",
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
            Drop your PDF here or click to browse
          </p>
          <p className="text-sm text-muted-foreground">
            Maximum file size: 10MB
          </p>
        </div>

        <div>
          <Button
            size="lg"
            className="cursor-pointer"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            Select PDF File
          </Button>

          <input
            id="file-upload"
            name="upload-input"
            ref={inputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) setFile(selectedFile);
            }}
            className="sr-only"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
