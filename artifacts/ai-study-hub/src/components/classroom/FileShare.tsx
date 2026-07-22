import { useState, useRef } from "react";
import { X, FileText, Image, File, Download, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SharedFile } from "@/lib/classroom-types";

interface FileShareProps {
  files: SharedFile[];
  onShare: (file: { name: string; type: string; size: number; url: string }) => void;
  onClose: () => void;
}

export function FileShare({ files, onShare, onClose }: FileShareProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onShare({
        name: file.name,
        type: file.type,
        size: file.size,
        url: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const getIcon = (type: string) => {
    if (type.startsWith("image/")) return Image;
    if (type.includes("pdf") || type.includes("document") || type.includes("text")) return FileText;
    return File;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="font-serif font-bold text-white">Shared Files</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 flex items-center justify-center">
            <X size={14} />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Upload size={16} /> Upload File
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={handleFileSelect} />
        </div>

        <div className="overflow-y-auto max-h-[50vh] px-4 pb-4 space-y-2">
          {files.length === 0 && (
            <p className="text-center text-zinc-600 text-sm py-6">No files shared yet</p>
          )}
          {files.map((file) => {
            const Icon = getIcon(file.type);
            return (
              <div key={file.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.name}</p>
                  <p className="text-[10px] text-zinc-500">
                    {file.sharedByName} · {formatSize(file.size)}
                  </p>
                </div>
                <a
                  href={file.url}
                  download={file.name}
                  className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-primary flex items-center justify-center"
                >
                  <Download size={14} />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
