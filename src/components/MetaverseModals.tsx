import { Send, X } from 'lucide-react';
import { useState } from 'react';
import type { MindfulPoint, WishNote } from '../types/metaverse';

const CAMPUS_PHOTOS = [
  {
    src: '/assets/aistudio/DSC_9145_fa24a30c.JPG',
    title: '운동장에서 바라본 인재개발원 전경',
    caption: '푸른 잔디 운동장 너머 본관과 목재 파고라, 서측 생활관 및 금수산 능선',
  },
  {
    src: '/assets/aistudio/DSC_9457_03d91c5b.JPG',
    title: '본관 교육동과 파고라 스탠드',
    caption: '국민건강보험공단 인재개발원 본관의 수직 루버 유리 파사드와 목재 데크',
  },
  {
    src: '/assets/aistudio/DJI_0037_04607508.JPG',
    title: '캠퍼스 항공 전경 (남→북)',
    caption: '남측 테니스장, 대운동장, 농구장, 본관, 생활관, 체육관 및 산정 정자',
  },
  {
    src: '/assets/aistudio/DJI_0030_0f61df5c.JPG',
    title: '금수산 자락과 인재개발원',
    caption: '산과 호수가 감싸 안은 배산임수의 명당 터',
  },
  {
    src: '/assets/aistudio/DJI_0008_4c9ce9df.JPG',
    title: '청풍호반과 인재개발원',
    caption: '캠퍼스 남쪽으로 펼쳐지는 청풍호와 청풍대교 파노라마',
  },
];

const LANTERN_COLORS = [
  { hex: '#F59E0B', label: '금빛 연등' },
  { hex: '#FB7185', label: '연꽃 분홍' },
  { hex: '#34D399', label: '청풍 옥빛' },
  { hex: '#60A5FA', label: '하늘 청빛' },
];

export function MindfulReflectionModal({
  point,
  onClose,
  onOpenLantern,
}: {
  point: MindfulPoint;
  onClose: () => void;
  onOpenLantern: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-stone-900 p-6 text-stone-100 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs text-amber-400 font-medium mb-1">청풍 산사 명상 스팟</p>
            <h2 className="font-serif-kr text-xl font-bold text-white">{point.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-stone-300 leading-relaxed mb-4">{point.subtitle}</p>

        <blockquote className="rounded-xl bg-stone-950/70 border border-white/10 p-4 font-serif-kr text-sm text-amber-100/90 leading-relaxed mb-5">
          “{point.quote}”
        </blockquote>

        <div className="flex items-center justify-end gap-2">
          {point.id === 'lake-lantern' && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLantern();
              }}
              className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-500 transition-colors cursor-pointer"
            >
              청풍호에 연등 띄우기
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-stone-800 px-4 py-2 text-xs font-medium text-stone-200 hover:bg-stone-700 transition-colors cursor-pointer"
          >
            계속 거닐기
          </button>
        </div>
      </div>
    </div>
  );
}

export function WishLanternModal({
  wishes,
  onAddWish,
  onClose,
}: {
  wishes: WishNote[];
  onAddWish: (author: string, message: string, color: string) => void;
  onClose: () => void;
}) {
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [selectedColor, setSelectedColor] = useState(LANTERN_COLORS[0].hex);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onAddWish(author.trim() || '방문객', message.trim(), selectedColor);
    setMessage('');
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-stone-900 p-6 text-stone-100 shadow-2xl max-h-[86vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-amber-400 font-medium mb-1">청풍호반 연등 공양</p>
            <h2 className="font-serif-kr text-xl font-bold text-white">
              청풍호에 소원 연등 띄우기
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pb-4 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="이름 또는 닉네임 (예: 연수생)"
              maxLength={20}
              className="flex-1 min-w-[160px] rounded-lg border border-white/10 bg-stone-950/70 px-3 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center gap-1.5">
              {LANTERN_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setSelectedColor(c.hex)}
                  title={c.label}
                  aria-label={c.label}
                  className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                    selectedColor === c.hex ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="청풍호 물결에 띄워 보낼 소원이나 다짐을 적어주세요"
              maxLength={120}
              className="flex-1 rounded-lg border border-white/10 bg-stone-950/70 px-3 py-2 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>연등 띄우기</span>
            </button>
          </div>
        </form>

        <div className="mt-4 space-y-2.5 overflow-y-auto pr-1">
          {wishes.map((w) => (
            <div
              key={w.id}
              className="rounded-xl border border-white/10 bg-stone-950/55 p-3.5 text-sm"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-stone-400 mb-1">
                <span className="font-medium text-stone-200">{w.author}</span>
                <span>{w.createdAt}</span>
              </div>
              <p className="text-stone-200 leading-relaxed text-xs">{w.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CampusPhotosModal({ onClose }: { onClose: () => void }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const current = CAMPUS_PHOTOS[selectedIdx];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-stone-900 p-5 text-stone-100 shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-emerald-400 font-medium">3D 메타버스 구현 참조 사진</p>
            <h2 className="font-serif-kr text-lg font-bold text-white">
              국민건강보험공단 인재개발원 실제 전경
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-stone-950 mb-3">
          <img
            src={current.src}
            alt={current.title}
            className="w-full h-[360px] object-cover"
          />
          <div className="bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 absolute inset-x-0 bottom-0">
            <div className="font-medium text-sm text-white">{current.title}</div>
            <div className="text-xs text-stone-300 mt-0.5">{current.caption}</div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {CAMPUS_PHOTOS.map((photo, idx) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`overflow-hidden rounded-lg border-2 cursor-pointer transition-opacity ${
                idx === selectedIdx
                  ? 'border-emerald-400 opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              <img
                src={photo.src}
                alt={photo.title}
                className="w-full h-16 object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
