"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Folder, File } from "lucide-react";
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
    tooltip: "src",
    type: "folder",
    children: [
      {
        id: "2",
        name: "components",
        tooltip: "components",
        type: "folder",
        children: [
          { id: "3", name: "Button.tsx", tooltip: "Button's tooltip", type: "file" },
          { id: "4", name: "Card.tsx", tooltip: "Card's tooltip", type: "file" },
        ],
      },
      {
        id: "5",
        name: "lib",
        tooltip: "lib",
        type: "folder",
        children: [{ id: "6", name: "utils.ts", tooltip: "utils's tooltip", type: "file" }],
      },
    ],
  },
];

export default function TreeNodeTooltip({ node }: { node: TreeNode }) {
  const [expanded, setExpanded] = useState(false);

  const isFolder = node.type === "folder";

  const toggle = () => {
    if (isFolder) setExpanded((prev) => !prev);
  };

  return (
    <div className="w-full">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggle}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md w-full text-left",
                "hover:bg-white/10 hover:text-white text-zinc-400 transition-colors cursor-pointer"
              )}
            >
              {isFolder ? (
                <Folder
                  size={16}
                  className={cn(
                    "text-zinc-500",
                    expanded && "text-zinc-300"
                  )}
                />
              ) : (
                <File size={16} className="text-zinc-500" />
              )}
              <span className="truncate text-xs font-mono">{node.name}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{node.tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Animate children */}
      {isFolder && (
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-4 border-l border-white/10 pl-2 space-y-1 overflow-hidden"
            >
              {node.children?.map((child) => (
                <TreeNodeTooltip key={child.id} node={child} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export function TreeViewDemo() {
  return (
    <div className="p-2 bg-transparent rounded-xl w-full">
      {demoData.map((node) => (
        <TreeNodeTooltip key={node.id} node={node} />
      ))}
    </div>
  );
}
