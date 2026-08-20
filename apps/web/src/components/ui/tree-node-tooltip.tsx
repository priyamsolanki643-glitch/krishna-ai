"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Folder, FolderOpen, File, FileCode2, FileText, ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type TreeNode = {
  id: string;
  name: string;
  tooltip?: string;
  type: "folder" | "file";
  children?: TreeNode[];
};

export const demoData: TreeNode[] = [
  {
    id: "1",
    name: "src",
    tooltip: "Source root directory for The Council engine",
    type: "folder",
    children: [
      {
        id: "2",
        name: "components",
        tooltip: "Reusable React UI primitives & widgets",
        type: "folder",
        children: [
          { id: "3", name: "Button.tsx", tooltip: "Accessible multi-state button component", type: "file" },
          { id: "4", name: "Card.tsx", tooltip: "Obsidian glass container card", type: "file" },
        ],
      },
      {
        id: "5",
        name: "lib",
        tooltip: "Core utilities & runtime helpers",
        type: "folder",
        children: [{ id: "6", name: "utils.ts", tooltip: "Tailwind merge & className utilities", type: "file" }],
      },
    ],
  },
];

interface TreeNodeTooltipProps {
  node: TreeNode;
  onSelect?: (node: TreeNode) => void;
  isLight?: boolean;
}

export default function TreeNodeTooltip({ 
  node, 
  onSelect,
  isLight = false 
}: TreeNodeTooltipProps) {
  const [expanded, setExpanded] = useState(true);

  const isFolder = node.type === "folder";

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      setExpanded((prev) => !prev);
    } else if (onSelect) {
      onSelect(node);
    }
  };

  return (
    <div className="select-none text-xs">
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggle}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg w-full text-left transition-colors cursor-pointer group",
                isLight 
                  ? "hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950" 
                  : "hover:bg-white/10 text-zinc-300 hover:text-white"
              )}
            >
              {isFolder ? (
                <>
                  <ChevronRight 
                    className={cn(
                      "size-3 text-zinc-500 transition-transform duration-200 shrink-0",
                      expanded && "rotate-90"
                    )} 
                  />
                  {expanded ? (
                    <FolderOpen size={15} className={isLight ? "text-amber-600" : "text-amber-400"} />
                  ) : (
                    <Folder size={15} className={isLight ? "text-amber-600/80" : "text-amber-400/80"} />
                  )}
                </>
              ) : (
                <>
                  <span className="w-3" />
                  <FileCode2 size={15} className={isLight ? "text-blue-600" : "text-blue-400"} />
                </>
              )}
              <span className="truncate font-mono text-[12px]">{node.name}</span>
            </button>
          </TooltipTrigger>
          {node.tooltip && (
            <TooltipContent 
              side="right" 
              className={cn(
                "font-sans text-xs px-2.5 py-1 shadow-lg",
                isLight ? "bg-zinc-950 text-white border-zinc-800" : "bg-zinc-900 text-zinc-100 border-white/15"
              )}
            >
              {node.tooltip}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {/* Animate children */}
      {isFolder && (
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "ml-3.5 border-l pl-2 my-0.5 space-y-0.5",
                isLight ? "border-zinc-200" : "border-white/10"
              )}
            >
              {node.children?.map((child) => (
                <TreeNodeTooltip 
                  key={child.id} 
                  node={child} 
                  onSelect={onSelect}
                  isLight={isLight}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export function TreeViewDemo({ onSelect, isLight = false }: { onSelect?: (node: TreeNode) => void; isLight?: boolean }) {
  return (
    <div className="p-2 space-y-1">
      {demoData.map((node) => (
        <TreeNodeTooltip key={node.id} node={node} onSelect={onSelect} isLight={isLight} />
      ))}
    </div>
  );
}
