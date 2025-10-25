"use client";
import { cn } from "@/lib/utils";
import { ImageIcon, Upload } from "lucide-react";
import React, { useState, useRef, Fragment } from "react";
import { Button } from "./button";
import IconContainer from "./icon-container";

function FileInput({
  name,
  file,
  setFile,
}: {
  name: string;
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Fragment>
      {file ? (
        <div className="bg-white border border-zinc-200 p-3 rounded-xl flex items-center gap-6 w-full">
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <IconContainer>
              <ImageIcon />
            </IconContainer>
            <div className="flex-1 min-w-0">
              <h3 className="truncate">{file.name}</h3>
            </div>
          </div>
          <Button type="button" onClick={() => setFile(null)} variant="outline">
            Remove
          </Button>
        </div>
      ) : (
        <div
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);

            const [droppedFile] = e.dataTransfer.files;
            setFile(droppedFile);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={cn(
            "border border-zinc-300 rounded-xl p-12 text-center transition-all w-full",
            isDragging
              ? "border bg-primary/5 scale-[1.01]"
              : "border-dashed hover:bg-zinc-100/50"
          )}
        >
          <div className="flex flex-col items-center gap-4">
            <IconContainer>
              <Upload />
            </IconContainer>

            <div className="space-y-2">
              <p className="text-lg font-medium">
                Drop your image here or click to browse
              </p>
            </div>

            <div>
              <Button
                size="sm"
                className="cursor-pointer"
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
              >
                Select Image
              </Button>
            </div>
          </div>
        </div>
      )}

      <input
        id="image-upload"
        name={name}
        ref={inputRef}
        type="file"
        onChange={(e) => {
          const selectedFile = e.target.files?.[0];
          if (selectedFile) setFile(selectedFile);
        }}
        className="sr-only"
      />
    </Fragment>
  );
}

export { FileInput };
