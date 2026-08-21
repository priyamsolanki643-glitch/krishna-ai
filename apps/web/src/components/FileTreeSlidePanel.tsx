import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderTree, FileText, Code2, FileCode, Plus, X, Copy, Check, 
  ChevronRight, ChevronDown, Folder, Download, Eye, Terminal, Sparkles
} from "lucide-react";

export interface ProjectFile {
  id: string;
  name: string;
  language: string;
  size: string;
  updatedAt: string;
  content: string;
}

export const DEFAULT_PROJECT_FILES: ProjectFile[] = [];

interface FileTreeSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  files?: ProjectFile[];
  onAddFile?: (file: ProjectFile) => void;
}

export function FileTreeSlidePanel({
  isOpen,
  onClose,
  files = DEFAULT_PROJECT_FILES,
  onAddFile
}: FileTreeSlidePanelProps) {
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(files[0] || null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isAddingFile, setIsAddingFile] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>("");
  const [newFileContent, setNewFileContent] = useState<string>("");

  const handleCopy = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const ext = newFileName.split('.').pop() || "txt";
    const newFile: ProjectFile = {
      id: crypto.randomUUID(),
      name: newFileName.trim(),
      language: ext === "ts" || ext === "tsx" ? "typescript" : ext === "py" ? "python" : ext === "sql" ? "sql" : "markdown",
      size: `${(newFileContent.length / 1024).toFixed(1)} KB`,
      updatedAt: "Just now",
      content: newFileContent || `// ${newFileName}`
    };
    onAddFile?.(newFile);
    setSelectedFile(newFile);
    setIsAddingFile(false);
    setNewFileName("");
    setNewFileContent("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex flex-col justify-start">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Top-Down Notification Shade Panel */}
          <motion.div
            initial={{ y: "-100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0.8 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="relative w-full bg-[#0d0d10] border-b border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.95)] max-h-[85vh] flex flex-col overflow-hidden z-10"
          >
            {/* Shade Top Grabber / Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#09090b]">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <FolderTree className="size-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    Council Project Workspace
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5">
                      {files.length} Files
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Session code artifacts and cognitive project tree
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const baseUrl = process.env.NEXT_PUBLIC_COUNCIL_API_URL || "https://the-council-api-1083682147747.us-central1.run.app";
                      const res = await fetch(`${baseUrl}/api/project/proj-default/export`);
                      if (!res.ok) throw new Error(`Export failed (${res.status})`);
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `council-project-${Date.now()}.zip`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch (err: any) {
                      console.error("Failed to export zip:", err);
                      alert(`Export failed: ${err.message || "Network error"}`);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-colors cursor-pointer border border-white/10"
                  title="Download full project as .zip"
                >
                  <Download className="size-3.5" />
                  <span>Export .zip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingFile(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-colors cursor-pointer border border-white/10"
                >
                  <Plus className="size-3.5" />
                  <span>Add File</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="size-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Main Area: Split View on Desktop / Clean stacked on Mobile */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[350px] max-h-[60vh]">
              
              {/* Left Column: File Explorer Tree */}
              <div className="w-full md:w-[280px] border-b md:border-b-0 md:border-r border-white/5 bg-[#0a0a0c] p-3 overflow-y-auto shrink-0 space-y-1">
                <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                  <Folder className="size-3.5 text-zinc-400" />
                  Project Artifacts
                </div>

                {files.map((file) => {
                  const isSelected = selectedFile?.id === file.id;
                  return (
                    <button
                      key={file.id}
                      onClick={() => {
                        setSelectedFile(file);
                        setIsAddingFile(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors text-xs ${
                        isSelected
                          ? "bg-white/10 text-white font-medium shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileCode className={`size-3.5 shrink-0 ${
                          file.language === "python" ? "text-yellow-400" :
                          file.language === "typescript" ? "text-blue-400" :
                          file.language === "sql" ? "text-emerald-400" : "text-purple-400"
                        }`} />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono ml-2">
                        {file.size}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Code Viewer / Editor */}
              <div className="flex-1 flex flex-col bg-[#060608] overflow-hidden">
                {isAddingFile ? (
                  /* Add File Form */
                  <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <h4 className="text-sm font-semibold text-white">Create / Upload Project Artifact</h4>
                    <input
                      type="text"
                      placeholder="File name (e.g. optimizer.ts, query.sql)"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-white/30"
                    />
                    <textarea
                      placeholder="Paste code or document content..."
                      value={newFileContent}
                      onChange={(e) => setNewFileContent(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs outline-none focus:border-white/30 resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsAddingFile(false)}
                        className="px-4 py-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white text-xs font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateFile}
                        className="px-5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200"
                      >
                        Save File to Workspace
                      </button>
                    </div>
                  </div>
                ) : selectedFile ? (
                  /* Syntax Highlighted Code Viewer */
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Viewer Header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d10] border-b border-white/5 text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <Code2 className="size-3.5 text-zinc-300" />
                        <span className="font-mono text-white font-medium">{selectedFile.name}</span>
                        <span className="text-[10px] uppercase font-bold text-zinc-500 bg-white/5 px-2 py-0.5 rounded">
                          {selectedFile.language}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        >
                          {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          <span>{copied ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Viewer Code Body with Line Numbers */}
                    <div className="flex-1 overflow-auto p-4 font-mono text-[12px] leading-relaxed flex bg-[#070709] text-zinc-200">
                      <div className="select-none text-zinc-600 pr-4 text-right border-r border-white/5 shrink-0">
                        {selectedFile.content.split('\n').map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>
                      <pre className="pl-4 overflow-x-auto text-zinc-300 font-mono">
                        <code>{selectedFile.content}</code>
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs">
                    Select a file from the left tree to view code.
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Handle Bar */}
            <div className="py-2.5 bg-[#09090b] border-t border-white/5 flex items-center justify-center cursor-pointer" onClick={onClose}>
              <div className="w-12 h-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors" />
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
