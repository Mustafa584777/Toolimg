import {
  Binary,
  CircleDot,
  FileCode2,
  Gauge,
  Grid3x3,
  Pipette,
  RefreshCw,
  ShieldOff,
  Smile,
  UserSquare2,
} from 'lucide-react';
import type { HubTool } from '@/lib/tools-data';

interface ToolIconProps {
  name: HubTool['iconName'];
  className?: string;
}

export function ToolIcon({ name, className = 'h-5 w-5' }: ToolIconProps) {
  switch (name) {
    case 'Gauge':
      return <Gauge className={className} aria-hidden="true" />;
    case 'RefreshCw':
      return <RefreshCw className={className} aria-hidden="true" />;
    case 'ShieldOff':
      return <ShieldOff className={className} aria-hidden="true" />;
    case 'Grid3x3':
      return <Grid3x3 className={className} aria-hidden="true" />;
    case 'Smile':
      return <Smile className={className} aria-hidden="true" />;
    case 'UserSquare2':
      return <UserSquare2 className={className} aria-hidden="true" />;
    case 'FileCode2':
      return <FileCode2 className={className} aria-hidden="true" />;
    case 'Binary':
      return <Binary className={className} aria-hidden="true" />;
    case 'CircleDot':
      return <CircleDot className={className} aria-hidden="true" />;
    case 'Pipette':
      return <Pipette className={className} aria-hidden="true" />;
  }
}
