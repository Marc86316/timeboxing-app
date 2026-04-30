import React, { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';
import { RULER_VALUES, TICK_WIDTH } from '../../utils/constants.js';

const AdvancedPomodoro = ({ activeTask, onDropTask, onCompleteTask, onInterrupt, onStartTaskless, globalMinutes, setGlobalMinutes }) => {
  const [status, setStatus] = useState('idle'); 
  const [localMinutes, setLocalMinutes] = useState(globalMinutes);
  const [secondsLeft, setSecondsLeft] = useState(globalMinutes === '∞' ? 0 : globalMinutes * 60);
  const [prevTaskId, setPrevTaskId] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const [pressProgress, setPressProgress] = useState(0);
  const progressTimerRef = useRef(null);
  const pressTimerRef = useRef(null);
  const countdownRef = useRef(null);
  
  const rulerRef = useRef(null);
  const scrollTimeout = useRef(null);
  
  const [isRulerDragging, setIsRulerDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const rulerVelocity = useRef(0);
  const lastPointerX = useRef(0);
  const lastPointerTime = useRef(0);
  const inertiaFrame = useRef(null);
  
  const isInitialized = useRef(false);

  useEffect(() => {
    if (rulerRef.current && status === 'idle' && !isInitialized.current) {
      const targetIndex = Math.max(0, RULER_VALUES.indexOf(globalMinutes));
      setTimeout(() => {
        if (rulerRef.current) {
          rulerRef.current.scrollLeft = targetIndex * TICK_WIDTH;
          setTimeout(() => { isInitialized.current = true; }, 100); 
        }
      }, 50);
    }
  }, [globalMinutes, status]);

  useEffect(() => {
    if (status === 'idle' && rulerRef.current && isInitialized.current) {
      const targetIndex = Math.max(0, RULER_VALUES.indexOf(globalMinutes));
      rulerRef.current.scrollTo({ left: targetIndex * TICK_WIDTH, behavior: 'smooth' });
    }
  }, [status]);

  useEffect(() => {
    if (activeTask && activeTask.id !== prevTaskId) {
      const taskMins = activeTask.timerDuration || activeTask.duration || localMinutes;
      setLocalMinutes(taskMins);
      setGlobalMinutes(taskMins);
      setSecondsLeft(taskMins === '∞' ? 0 : taskMins * 60);
      setStatus('running'); 
      setPrevTaskId(activeTask.id);
    }
  }, [activeTask, prevTaskId, setGlobalMinutes]);

  useEffect(() => {
    if (status === 'running') {
      countdownRef.current = setInterval(() => {
        setSecondsLeft(p => localMinutes === '∞' ? p + 1 : p - 1);
      }, 1000);
    }
    return () => clearInterval(countdownRef.current);
  }, [status, localMinutes]);

  useEffect(() => {
    if (status === 'running' && localMinutes !== '∞' && secondsLeft <= 0) {
      clearInterval(countdownRef.current);
      setStatus('idle');
      if (activeTask) onCompleteTask(activeTask, localMinutes, localMinutes * 60);
    }
  }, [secondsLeft, status, localMinutes, activeTask, onCompleteTask]);

  const handlePressStart = () => {
    if (status !== 'running') return;
    setPressProgress(0);
    progressTimerRef.current = setInterval(() => setPressProgress(p => Math.min(p + 5, 100)), 50);
    pressTimerRef.current = setTimeout(() => {
      clearInterval(countdownRef.current);
      clearInterval(progressTimerRef.current);
      setStatus('idle');
      
      const elapsed = localMinutes === '∞' ? secondsLeft : ((localMinutes * 60) - secondsLeft);
      
      if (localMinutes === '∞') {
        onCompleteTask(activeTask, '∞', elapsed);
      } else {
        onInterrupt(activeTask, elapsed, localMinutes);
      }
      
      setSecondsLeft(localMinutes === '∞' ? 0 : localMinutes * 60);
      setPressProgress(0);
      setPrevTaskId(null);
    }, 1000);
  };

  const handlePressEnd = () => {
    clearTimeout(pressTimerRef.current);
    clearInterval(progressTimerRef.current);
    if (pressProgress < 100) setPressProgress(0);
  };

  const snapToNearestValid = () => {
    if (!rulerRef.current) return;
    const scrollLeft = rulerRef.current.scrollLeft;
    const currentIndex = Math.round(scrollLeft / TICK_WIDTH);
    let validIndex = Math.round(currentIndex / 5) * 5;
    validIndex = Math.max(0, Math.min(120, validIndex)); 
    
    rulerRef.current.scrollTo({ left: validIndex * TICK_WIDTH, behavior: 'smooth' });
    
    const val = RULER_VALUES[validIndex];
    if (val !== undefined) {
      setLocalMinutes(val);
      setGlobalMinutes(val);
      if (status !== 'running') setSecondsLeft(val === '∞' ? 0 : val * 60);
    }
  };

  const onMouseDown = (e) => {
    if (status === 'running') return;
    setIsRulerDragging(true);
    dragStartX.current = e.pageX;
    dragScrollLeft.current = rulerRef.current.scrollLeft;
    lastPointerX.current = e.pageX;
    lastPointerTime.current = Date.now();
    if (inertiaFrame.current) cancelAnimationFrame(inertiaFrame.current);
  };

  const onMouseMove = (e) => {
    if (!isRulerDragging || !rulerRef.current) return;
    e.preventDefault();
    const x = e.pageX;
    const walk = (dragStartX.current - x); 
    rulerRef.current.scrollLeft = dragScrollLeft.current + walk;

    const now = Date.now();
    const dt = now - lastPointerTime.current;
    if (dt > 0) {
      rulerVelocity.current = (lastPointerX.current - x) / dt;
      lastPointerX.current = x;
      lastPointerTime.current = now;
    }
  };

  const onMouseUpOrLeave = () => {
    if (!isRulerDragging) return;
    setIsRulerDragging(false);

    let v = rulerVelocity.current * 16; 
    const friction = 0.95;

    const applyInertia = () => {
      if (!rulerRef.current) return;
      rulerRef.current.scrollLeft += v;
      v *= friction;

      if (Math.abs(v) > 0.5) {
        inertiaFrame.current = requestAnimationFrame(applyInertia);
      } else {
        snapToNearestValid();
      }
    };

    if (Math.abs(v) > 1.5) {
      inertiaFrame.current = requestAnimationFrame(applyInertia);
    } else {
      snapToNearestValid();
    }
  };

  const handleScroll = (e) => {
    if (isRulerDragging || !isInitialized.current || status === 'running') return;
    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => { snapToNearestValid(); }, 200);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (status !== 'running') {
      const taskId = e.dataTransfer.getData("text/plain");
      if (taskId) onDropTask(taskId, localMinutes);
    }
  };

  const formattedTime = status === 'idle' 
    ? (localMinutes === '∞' ? '∞' : `${String(localMinutes).padStart(2, '0')}:00`)
    : `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return (
    <div 
      className={`relative w-full max-w-[280px] h-[240px] mx-auto transition-all duration-300 flex flex-col items-center justify-center select-none
        ${isDragOver ? 'ring-4 ring-rose-400 ring-inset bg-rose-50/50 rounded-3xl' : ''}
      `}
      onDragOver={e => { e.preventDefault(); if (status !== 'running') setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-rose-500/90 flex items-center justify-center animate-in fade-in zoom-in-95 duration-200 backdrop-blur-sm rounded-3xl pointer-events-none">
          <span className="text-white font-black text-lg tracking-widest px-4 text-center leading-snug">
            放開滑鼠<br/>立刻開始專注
          </span>
        </div>
      )}

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center py-2">
        {status === 'idle' && (
          <>
            <div className="relative w-full h-16 mask-edges flex flex-col justify-end shrink-0 mb-4">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-rose-500 z-20" />
              <div 
                ref={rulerRef} 
                onScroll={handleScroll}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUpOrLeave}
                onMouseLeave={onMouseUpOrLeave}
                className={`flex items-end overflow-x-auto scrollbar-hide h-full w-full ${isRulerDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ paddingLeft: `calc(50% - ${TICK_WIDTH/2}px)`, paddingRight: `calc(50% - ${TICK_WIDTH/2}px)` }}
              >
                {RULER_VALUES.map(m => {
                  const isMajor = m === '∞' || m % 5 === 0;
                  const isSelected = localMinutes === m;
                  return (
                    <div key={m} className={`flex-shrink-0 flex flex-col items-center justify-end h-full pb-[4px] pointer-events-none`} style={{ width: `${TICK_WIDTH}px` }}>
                       <span className={`text-[10px] font-bold mb-1 transition-all duration-100 
                         ${isSelected && isMajor ? 'text-rose-500 text-sm scale-125' : 'text-neutral-400'} 
                         ${!isMajor ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}
                       `}>
                         {isMajor ? m : ''}
                       </span>
                       <div className={`w-[2px] rounded-full transition-colors duration-100 ${isSelected ? 'bg-rose-500' : 'bg-neutral-300'} ${isMajor || isSelected ? 'h-6' : 'h-3'}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div 
              onClick={() => onStartTaskless(localMinutes)}
              className={`text-6xl font-black tracking-tighter text-neutral-800 transition-transform cursor-pointer hover:scale-105 hover:text-rose-500 mb-2 ${localMinutes === '∞' ? 'text-7xl' : ''}`}
            >
              {formattedTime}
            </div>

            <div className="text-xs font-bold text-neutral-400 flex items-center shrink-0">
              <Timer size={14} className="mr-1 opacity-70" /> 
              {localMinutes === '∞' ? '正計時模式 ‧ 點擊或拖曳啟動' : '點擊時間，或拖曳任務啟動'}
            </div>
          </>
        )}

        {status === 'running' && activeTask && (
          <div className="flex flex-col items-center justify-center w-full h-full animate-in zoom-in-95 fade-in duration-200">
            <div className="text-base font-black text-neutral-700 truncate w-full text-center px-4 mb-1">
              {activeTask.title}
            </div>
            
            <div 
              className={`text-7xl font-black tracking-tighter text-rose-500 drop-shadow-sm transition-transform my-2 ${localMinutes === '∞' ? 'text-emerald-500' : ''}`}
              style={{ opacity: 1 - (pressProgress / 100) * 0.5, transform: `scale(${1 - (pressProgress / 100) * 0.05})` }}
            >
              {formattedTime}
            </div>

            <div className="w-full px-4 shrink-0 flex justify-center mt-2">
              <div 
                onMouseDown={handlePressStart} 
                onMouseUp={handlePressEnd} 
                onMouseLeave={handlePressEnd} 
                className="relative cursor-pointer py-2 px-6 group select-none flex flex-col items-center"
              >
                <span className={`relative z-10 text-sm font-bold transition-colors ${pressProgress > 0 ? 'text-rose-600' : 'text-neutral-400 group-hover:text-neutral-600'}`}>
                  {pressProgress > 0 ? (localMinutes === '∞' ? '結束結算中...' : '中斷取消中...') : (localMinutes === '∞' ? '長壓結束專注' : '長壓中斷任務')}
                </span>
                <div className={`absolute bottom-1 left-0 h-[2px] transition-all duration-[50ms] ${localMinutes === '∞' ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${pressProgress}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AdvancedPomodoro;
