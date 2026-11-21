import { useCallback, useEffect, useRef, useState } from 'react';
import { soundscape } from './audio/soundscape';
import { ControlDock } from './components/ControlDock';
import {
  CampusPhotosModal,
  MindfulReflectionModal,
  WishLanternModal,
} from './components/MetaverseModals';
import { INITIAL_WISHES, TELEPORT_SPOTS } from './data/campusLocations';
import { MetaverseCanvas, type MetaverseHandle } from './scene/MetaverseCanvas';
import type {
  CameraMode,
  HudSnapshot,
  MindfulPoint,
  TeleportSpot,
  TimeOfDay,
  WishNote,
} from './types/metaverse';

export default function App() {
  const metaverseRef = useRef<MetaverseHandle | null>(null);

  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [cameraMode, setCameraMode] = useState<CameraMode>('third-person');
  const [activeSpotId, setActiveSpotId] = useState<string>(TELEPORT_SPOTS[0].id);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const [wishes, setWishes] = useState<WishNote[]>(INITIAL_WISHES);
  const [activeReflection, setActiveReflection] = useState<MindfulPoint | null>(null);
  const [showWishModal, setShowWishModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);

  const [hud, setHud] = useState<HudSnapshot>({
    playerX: 0,
    playerY: 0,
    playerZ: 14,
    playerYaw: Math.PI,
    speed: 0,
    nearbyPoint: null,
    goalCount: 0,
    zoneName: '대운동장 (잔디 축구장)',
  });

  const showToast = useCallback((msg: string) => {
    setToastText(msg);
  }, []);

  useEffect(() => {
    if (!toastText) return;
    const id = window.setTimeout(() => setToastText(null), 3200);
    return () => clearTimeout(id);
  }, [toastText]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.code === 'KeyH') {
        setDockCollapsed((prev) => !prev);
      } else if (e.code === 'Escape') {
        setActiveReflection(null);
        setShowWishModal(false);
        setShowPhotosModal(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      soundscape.dispose();
    };
  }, []);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundscape.setMuted(next);
  };

  const handleSelectSpot = (spot: TeleportSpot) => {
    setActiveSpotId(spot.id);
    metaverseRef.current?.teleportTo(spot);
    showToast(`${spot.label}으로 이동했습니다`);
  };

  const handleTriggerMindfulAction = (point: MindfulPoint) => {
    if (point.id === 'resonance-bell') {
      metaverseRef.current?.strikeBell();
      setIsMuted(false);
      showToast('청풍 명상종의 맑은 울림이 퍼져나갑니다');
    } else if (point.id === 'lake-lantern') {
      soundscape.playWindChime(0.16);
      setShowWishModal(true);
      return;
    } else {
      soundscape.playWindChime(0.14);
    }
    setActiveReflection(point);
  };

  const handleAddWish = (author: string, message: string, color: string) => {
    const newWish: WishNote = {
      id: `w-${Date.now()}`,
      author,
      message,
      createdAt: '방금 전',
      color,
    };
    setWishes((prev) => [newWish, ...prev]);
    metaverseRef.current?.spawnWishLantern(color);
    soundscape.playWindChime(0.18);
    showToast('청풍호 물결 위로 소원 연등을 띄웠습니다');
  };

  const handleGoalScored = useCallback(
    (count: number) => {
      showToast(`운동장 골인! (${count}호 골)`);
    },
    [showToast]
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950">
      {/* Full-Viewport 3D Metaverse Canvas */}
      <MetaverseCanvas
        ref={metaverseRef}
        timeOfDay={timeOfDay}
        cameraMode={cameraMode}
        wishes={wishes}
        onHudUpdate={setHud}
        onInteractPoint={handleTriggerMindfulAction}
        onGoalScored={handleGoalScored}
      />

      {/* Minimal Top-Left Identity & Zone Readout (Zero Pulsating Dots, Zero Side Clutter) */}
      {!dockCollapsed && (
        <header className="pointer-events-none fixed top-4 left-4 z-20 max-w-[calc(100vw-2rem)]">
          <div className="pointer-events-auto inline-flex flex-col rounded-xl border border-white/15 bg-stone-900/86 px-4 py-2.5 text-stone-100 shadow-lg">
            <h1 className="font-serif-kr text-sm md:text-base font-bold tracking-tight text-white whitespace-nowrap">
              국민건강보험공단 인재개발원
            </h1>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-300 whitespace-nowrap">
              <span>청풍 산사 메타버스</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-300 font-medium">{hud.zoneName}</span>
              {hud.goalCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums text-amber-300">득점 {hud.goalCount}</span>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Subtle Top-Center Notification Toast */}
      {toastText && (
        <div className="pointer-events-none fixed top-5 left-1/2 -translate-x-1/2 z-30">
          <div className="rounded-xl border border-white/15 bg-stone-900/92 px-4 py-2 text-xs font-medium text-amber-100 shadow-xl whitespace-nowrap">
            {toastText}
          </div>
        </div>
      )}

      {/* Collapsible Bottom Control Dock */}
      <ControlDock
        collapsed={dockCollapsed}
        onToggleCollapse={() => setDockCollapsed((prev) => !prev)}
        activeSpotId={activeSpotId}
        onSelectSpot={handleSelectSpot}
        cameraMode={cameraMode}
        onChangeCameraMode={setCameraMode}
        timeOfDay={timeOfDay}
        onChangeTimeOfDay={setTimeOfDay}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        nearbyPoint={hud.nearbyPoint}
        onTriggerMindfulAction={handleTriggerMindfulAction}
        onOpenWishes={() => setShowWishModal(true)}
        onOpenPhotos={() => setShowPhotosModal(true)}
        onResetBall={() => {
          metaverseRef.current?.resetSoccerBall();
          showToast('축구공을 운동장 중앙으로 옮겼습니다');
        }}
        onMoveVector={(x, y) => metaverseRef.current?.setJoystickVector(x, y)}
      />

      {/* Modals */}
      {activeReflection && (
        <MindfulReflectionModal
          point={activeReflection}
          onClose={() => setActiveReflection(null)}
          onOpenLantern={() => setShowWishModal(true)}
        />
      )}

      {showWishModal && (
        <WishLanternModal
          wishes={wishes}
          onAddWish={handleAddWish}
          onClose={() => setShowWishModal(false)}
        />
      )}

      {showPhotosModal && (
        <CampusPhotosModal onClose={() => setShowPhotosModal(false)} />
      )}
    </div>
  );
}
