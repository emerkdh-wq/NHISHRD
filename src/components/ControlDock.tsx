import {
  Bell,
  Camera,
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  Flame,
  Footprints,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useState } from 'react';
import { TELEPORT_SPOTS } from '../data/campusLocations';
import type {
  CameraMode,
  MindfulPoint,
  TeleportSpot,
  TimeOfDay,
} from '../types/metaverse';

interface ControlDockProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeSpotId: string;
  onSelectSpot: (spot: TeleportSpot) => void;
  cameraMode: CameraMode;
  onChangeCameraMode: (mode: CameraMode) => void;
  timeOfDay: TimeOfDay;
  onChangeTimeOfDay: (time: TimeOfDay) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  nearbyPoint: MindfulPoint | null;
  onTriggerMindfulAction: (point: MindfulPoint) => void;
  onOpenWishes: () => void;
  onOpenPhotos: () => void;
  onResetBall: () => void;
  onMoveVector: (x: number, y: number) => void;
}

const CAMERA_OPTIONS: Array<{ id: CameraMode; label: string; icon: typeof Footprints }> = [
  { id: 'third-person', label: '3인칭 산책', icon: Footprints },
  { id: 'first-person', label: '1인칭 시점', icon: Eye },
  { id: 'drone', label: '드론 조감', icon: Camera },
];

const TIME_OPTIONS: Array<{ id: TimeOfDay; label: string; icon: typeof Sun }> = [
  { id: 'morning', label: '새벽 운무', icon: Sunrise },
  { id: 'day', label: '청명한 낮', icon: Sun },
  { id: 'sunset', label: '황혼 노을', icon: Sunset },
  { id: 'night', label: '달빛 밤', icon: Moon },
];

export function ControlDock({
  collapsed,
  onToggleCollapse,
  activeSpotId,
  onSelectSpot,
  cameraMode,
  onChangeCameraMode,
  timeOfDay,
  onChangeTimeOfDay,
  isMuted,
  onToggleMute,
  nearbyPoint,
  onTriggerMindfulAction,
  onOpenWishes,
  onOpenPhotos,
  onResetBall,
  onMoveVector,
}: ControlDockProps) {
  const [activeTab, setActiveTab] = useState<'places' | 'atmosphere' | 'guide'>('places');

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-20 flex flex-col items-center px-4">
      {/* Contextual Mindfulness Proximity Prompt */}
      {nearbyPoint && !collapsed && (
        <div className="pointer-events-auto mb-3 flex items-center gap-4 rounded-xl border border-amber-300/25 bg-stone-900/92 px-4 py-2.5 text-stone-100 shadow-xl">
          <div className="min-w-0">
            <div className="text-xs text-amber-300/90 font-medium">{nearbyPoint.title}</div>
            <div className="text-xs text-stone-300 truncate max-w-md">{nearbyPoint.subtitle}</div>
          </div>
          <button
            type="button"
            onClick={() => onTriggerMindfulAction(nearbyPoint)}
            className="shrink-0 whitespace-nowrap flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-amber-500 transition-colors cursor-pointer"
          >
            {nearbyPoint.id === 'resonance-bell' ? (
              <Bell className="w-3.5 h-3.5" />
            ) : (
              <Flame className="w-3.5 h-3.5" />
            )}
            <span>{nearbyPoint.actionLabel} (E)</span>
          </button>
        </div>
      )}

      {/* Collapse / Expand Handle */}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? '컨트롤 열기' : '컨트롤 숨기기'}
        className="pointer-events-auto mb-1.5 flex items-center gap-1.5 rounded-t-lg rounded-b-md border border-white/15 bg-stone-900/88 px-3.5 py-1.5 text-xs font-medium text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer whitespace-nowrap"
      >
        {collapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            <span>컨트롤 열기 (H)</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            <span>몰입 감상 모드 (H)</span>
          </>
        )}
      </button>

      {/* Unified Collapsible Bottom Control Dock */}
      {!collapsed && (
        <div
          className="pointer-events-auto w-full max-w-[920px] rounded-2xl border border-white/15 bg-stone-900/90 p-3 shadow-2xl text-stone-100"
        >
          {/* Top Row: Category Tabs + Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-1 rounded-lg bg-stone-950/70 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('places')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'places'
                    ? 'bg-stone-700 text-white'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>캠퍼스 이동</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('atmosphere')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'atmosphere'
                    ? 'bg-stone-700 text-white'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>시점 · 시간대</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'guide'
                    ? 'bg-stone-700 text-white'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>조작 안내</span>
              </button>
            </div>

            {/* Right Utility Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={onOpenWishes}
                className="flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-600/20 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-600/35 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>소원 연등 띄우기</span>
              </button>
              <button
                type="button"
                onClick={onOpenPhotos}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-stone-800/80 px-3 py-1.5 text-xs font-medium text-stone-200 hover:bg-stone-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>실제 전경 사진</span>
              </button>
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={isMuted ? '자연의 소리 켜기' : '소리 끄기'}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isMuted
                    ? 'border-white/10 bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                    : 'border-emerald-400/35 bg-emerald-700/30 text-emerald-200 hover:bg-emerald-700/45'
                }`}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>소리 켜기</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>산사 소리 중</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Row: Active Tab Content */}
          <div className="pt-2.5">
            {activeTab === 'places' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {TELEPORT_SPOTS.map((spot) => {
                  const active = activeSpotId === spot.id;
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => onSelectSpot(spot)}
                      className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                        active
                          ? 'bg-emerald-700/45 border-emerald-400/40 text-emerald-100'
                          : 'bg-stone-800/65 border-white/5 text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`}
                    >
                      {spot.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={onResetBall}
                  title="운동장 중앙으로 축구공 되돌리기"
                  className="ml-auto flex items-center gap-1 rounded-lg border border-white/10 bg-stone-800/65 px-3 py-2 text-xs text-stone-300 hover:bg-stone-800 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>축구공 제자리</span>
                </button>
              </div>
            )}

            {activeTab === 'atmosphere' && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-stone-400 mr-1 whitespace-nowrap">시점</span>
                  {CAMERA_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const active = cameraMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChangeCameraMode(opt.id)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                          active
                            ? 'bg-stone-700 border-white/25 text-white'
                            : 'bg-stone-800/60 border-white/5 text-stone-300 hover:bg-stone-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-stone-400 mr-1 whitespace-nowrap">시간대</span>
                  {TIME_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const active = timeOfDay === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChangeTimeOfDay(opt.id)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                          active
                            ? 'bg-amber-600/35 border-amber-400/40 text-amber-100'
                            : 'bg-stone-800/60 border-white/5 text-stone-300 hover:bg-stone-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'guide' && (
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-300">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>WASD / 방향키 · 걷기</span>
                  <span aria-hidden="true">·</span>
                  <span>Shift · 달리기</span>
                  <span aria-hidden="true">·</span>
                  <span>Space · 점프</span>
                  <span aria-hidden="true">·</span>
                  <span>마우스 드래그 · 시점 회전</span>
                  <span aria-hidden="true">·</span>
                  <span>바닥 클릭 · 자동 걸어가기</span>
                  <span aria-hidden="true">·</span>
                  <span>E · 명상/종 치기</span>
                </div>

                {/* Touch / Pointer Directional Pad for effortless movement */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onPointerDown={() => onMoveVector(-1, 0)}
                    onPointerUp={() => onMoveVector(0, 0)}
                    onPointerLeave={() => onMoveVector(0, 0)}
                    className="rounded-md bg-stone-800 px-2.5 py-1.5 text-xs hover:bg-stone-700 active:bg-stone-600 cursor-pointer"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => onMoveVector(0, 1)}
                    onPointerUp={() => onMoveVector(0, 0)}
                    onPointerLeave={() => onMoveVector(0, 0)}
                    className="rounded-md bg-stone-800 px-2.5 py-1.5 text-xs hover:bg-stone-700 active:bg-stone-600 cursor-pointer"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => onMoveVector(0, -1)}
                    onPointerUp={() => onMoveVector(0, 0)}
                    onPointerLeave={() => onMoveVector(0, 0)}
                    className="rounded-md bg-stone-800 px-2.5 py-1.5 text-xs hover:bg-stone-700 active:bg-stone-600 cursor-pointer"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => onMoveVector(1, 0)}
                    onPointerUp={() => onMoveVector(0, 0)}
                    onPointerLeave={() => onMoveVector(0, 0)}
                    className="rounded-md bg-stone-800 px-2.5 py-1.5 text-xs hover:bg-stone-700 active:bg-stone-600 cursor-pointer"
                  >
                    ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
