import {
  LucideIcon,
  Palette,
  Gamepad2,
  Brain,
  Cpu,
  Cloud,
  Terminal,
  ShieldAlert,
  Binary,
  Monitor
} from "lucide-react";

import { GroupInterest } from "../../../../../constant";

export const GROUP_INTEREST_ICON: Record<GroupInterest, LucideIcon> = {
  [GroupInterest.WEB_APP_SERVICE]: Monitor,
  [GroupInterest.UX_UI_DESIGN]: Palette,
  [GroupInterest.GAME_GRAPHICS]: Gamepad2,
  [GroupInterest.AI_DATA_SCIENCE]: Brain,
  [GroupInterest.CIRCUIT_IOT]: Cpu,
  [GroupInterest.NETWORK_CLOUD]: Cloud,
  [GroupInterest.SYSTEM_PROGRAMMING]: Terminal,
  [GroupInterest.SECURITY_HACKING]: ShieldAlert,
  [GroupInterest.ALGORITHM_THEORY]: Binary,
};

export type { GroupInfoDto as GroupInfo } from "../../../../../api/public/group/types";
