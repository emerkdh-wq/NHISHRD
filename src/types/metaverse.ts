export type TimeOfDay = 'morning' | 'day' | 'sunset' | 'night';

export type CameraMode = 'third-person' | 'first-person' | 'drone';

export interface TeleportSpot {
  id: string;
  label: string;
  subtitle: string;
  position: [number, number, number];
  yaw: number;
}

export interface MindfulPoint {
  id: string;
  title: string;
  subtitle: string;
  quote: string;
  actionLabel: string;
  position: [number, number, number];
  radius: number;
}

export interface WishNote {
  id: string;
  author: string;
  message: string;
  createdAt: string;
  color: string;
}

export interface HudSnapshot {
  playerX: number;
  playerY: number;
  playerZ: number;
  playerYaw: number;
  speed: number;
  nearbyPoint: MindfulPoint | null;
  goalCount: number;
  zoneName: string;
}
