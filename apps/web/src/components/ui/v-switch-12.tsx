"use client";

import {
  EyeIcon,
  MapPinIcon,
  MicIcon,
  ShieldIcon,
  SmartphoneIcon,
} from "lucide-react";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const settings = [
  {
    description: "Allow apps to access your location",
    Icon: MapPinIcon,
    id: "location",
    label: "Location Services",
  },
  {
    description: "Grant access to media devices",
    Icon: SmartphoneIcon,
    id: "camera",
    label: "Camera & Microphone",
  },
  {
    description: "Used for voice features",
    Icon: MicIcon,
    id: "microphone",
    label: "Microphone Only",
  },
  {
    description: "Help improve your experience",
    Icon: EyeIcon,
    id: "activity",
    label: "Activity Tracking",
  },
  {
    description: "See relevant advertisements",
    Icon: ShieldIcon,
    id: "ads",
    label: "Personalised Ads",
  },
];

export default function Particle() {
  const [values, setValues] = useState<Record<string, boolean>>({
    activity: true,
    ads: false,
    camera: false,
    location: true,
    microphone: false,
  });

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10">
      <div className="border-b border-zinc-200 dark:border-white/10 px-4 py-3">
        <p className="font-semibold text-sm">Privacy Settings</p>
      </div>
      <div className="divide-y divide-zinc-200 dark:divide-white/10">
        {settings.map(({ id, Icon, label, description }, i) => (
          <div key={id}>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5">
                <Icon
                  aria-hidden="true"
                  className="size-4 text-zinc-600 dark:text-zinc-400"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs">{description}</p>
              </div>
              <Switch
                checked={values[id]}
                onCheckedChange={(v) =>
                  setValues((prev) => ({ ...prev, [id]: v }))
                }
                size="sm"
              />
            </div>
            {i === 2 && <Separator />}
          </div>
        ))}
      </div>
    </div>
  );
}
