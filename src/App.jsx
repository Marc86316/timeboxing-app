import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, GripVertical, CheckCircle2, ListTodo, Wand2, Focus,
  ArrowRight, Timer, AlertTriangle, Sparkles, CornerDownRight, 
  Star, Plus, ChevronRight, Settings2, Trash2, ChevronLeft, AlignLeft, Tag 
} from 'lucide-react';

import { HOURS, ICONS, COLORS } from './utils/constants.js';
import { generateId, addMinutes, formatMonthYear, getWeekDays } from './utils/helpers.js';
import AdvancedPomodoro from './components/Pomodoro/AdvancedPomodoro.jsx';

export default function App() {
  const [appMode, setAppMode] = useState('general'); 
  const [brainDumpText, setBrainDumpText] = useState("我想學 Quant 的基本理論，還有今天要記得回覆老闆關於預算的 Email。");
  const [isProcessing, setIsProcessing] = useState(false);
  const [tasks, setTasks] = useState([]);
  
  const [now, setNow] = useState(new Date()); 
  const [userRefineContext, setUserRefineContext] = useState("");
  const [isReslicing, setIsReslicing] = useState(false); 
  
  const [dragPreview, setDragPreview] = useState(null); 
  const [draggedTaskId, setDraggedTaskId] = useState(null); 
  const [dragOverTaskId, setDragOverTaskId] = useState(null); 
  const [isTrashHovered, setIsTrashHovered] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);
  const [showIconMenu, setShowIconMenu] = useState(false); 
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);

  const [gridInterval, setGridInterval] = useState(15);
  const currentScaleMins = Array.from({ length: Math.ceil(60 / gridInterval) }, (_, i) => i * gridInterval);
  const headerScaleMins = [...currentScaleMins, 60];

  const [newTaskInput, setNewTaskInput] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isFlipping, setIsFlipping] = useState(false); 
  const weekDays = getWeekDays(weekOffset);

  const [globalPomoMinutes, setGlobalPomoMinutes] = useState(25);
  const [pomodoroTask, setPomodoroTask] = useState(null);
  const scrollContainerRef = useRef(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const clearDragState = () => {
    document.body.classList.remove('is-task-dragging');
    document.querySelectorAll('.dragging-active').forEach(el => el.classList.remove('dragging-active'));
    setDragPreview(null);
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setIsTrashHovered(false);
  };

  useEffect(() => {
    const clockTimer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentHour = new Date().getHours();
      const hourElement = document.getElementById(`hour-row-${currentHour}`);
      if (hourElement) {
        scrollContainerRef.current.scrollTo({ top: Math.max(0, hourElement.offsetTop - 64), behavior: 'smooth' });
      }
    }
  }, [appMode]);

  useEffect(() => {
    const handleGlobalDragEnd = () => clearDragState();
    window.addEventListener('dragend', handleGlobalDragEnd);
    window.addEventListener('mouseup', handleGlobalDragEnd);
    window.addEventListener('drop', handleGlobalDragEnd);
    return () => {
      window.removeEventListener('dragend', handleGlobalDragEnd);
      window.removeEventListener('mouseup', handleGlobalDragEnd);
      window.removeEventListener('drop', handleGlobalDragEnd);
    };
  }, []);

  const handleDateSelect = (dateObj) => {
    setIsFlipping(true);
    setSelectedDate(dateObj);
    setTimeout(() => setIsFlipping(false), 300);
  };

  const getCurrentTimeSlot = () => {
    let h = now.getHours();
    let m = now.getMinutes();
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleDragStart = (e, taskId) => {
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = 'copyMove';
    setDraggedTaskId(taskId); 
    
    const el = e.currentTarget;
    setTimeout(() => {
      document.body.classList.add('is-task-dragging');
      el.classList.add('dragging-active');
    }, 0);
  };

  const handleDragEnd = (e) => clearDragState();

  const handleHourDragOver = (e, hour) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const minute = Math.min(59, Math.floor(percent * 60));
    
    setDragPreview(prev => {
      if (prev && prev.hour === hour && prev.minute === minute) return prev;
      return { hour, minute, leftPercent: percent * 100 };
    });
  };

  const handleHourDragLeave = () => setDragPreview(null);

  const handleHourDrop = (e, hour) => {
    e.preventDefault();
    clearDragState();

    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const minute = Math.min(59, Math.floor(percent * 60));

    const timeSlot = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    handleDropOnGridLogic(taskId, timeSlot);
  };

  const handleDropOnGridLogic = (taskId, timeSlot) => {
    const sourceTask = tasks.find(t => t.id === taskId);
    if (!sourceTask) return;

    const fallbackDuration = globalPomoMinutes === '∞' ? 25 : globalPomoMinutes;
    const taskDuration = sourceTask.duration || fallbackDuration;

    if (sourceTask.status === "dumped") {
      const newParentId = generateId();
      const clonedTasks = [];
      
      clonedTasks.push({ ...sourceTask, id: newParentId, isClone: true, status: "scheduled", startTime: timeSlot, date: selectedDate.toDateString(), duration: taskDuration });

      const children = tasks.filter(t => t.parentId === taskId);
      children.forEach((child) => {
        clonedTasks.push({ ...child, id: generateId(), parentId: newParentId, isClone: true });
      });

      setTasks(prev => [...prev, ...clonedTasks]);
    } else {
      setTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, status: "scheduled", startTime: timeSlot, date: selectedDate.toDateString(), duration: t.duration || fallbackDuration 
      } : t));
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDropToStatus = (e, targetStatus, isPriority = false) => {
    e.preventDefault();
    clearDragState();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus, startTime: null, date: null, isPriority: isPriority || t.isPriority } : t));
  };

  const handleAddTask = (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing && newTaskInput.trim()) {
      const newTask = {
        id: `t_${Date.now()}`,
        parentId: null,
        title: newTaskInput.trim(),
        priority: "Medium",
        duration: null, 
        status: "dumped",
        startTime: null,
        isPriority: false,
        date: null
      };
      setTasks(prev => [...prev, newTask]);
      setNewTaskInput("");
    }
  };

  const updateTask = (id, updates) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (selectedTaskForEdit && selectedTaskForEdit.id === id) {
      setSelectedTaskForEdit(prev => ({ ...prev, ...updates }));
    }
  };

  const handleToggleComplete = (taskId) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;
      const newStatus = task.status === 'done' ? (task.startTime ? 'scheduled' : 'dumped') : 'done';
      
      return prev.map(t => {
        if (t.id === taskId || t.parentId === taskId) {
          return { ...t, status: newStatus };
        }
        return t;
      });
    });
    
    if (selectedTaskForEdit && (selectedTaskForEdit.id === taskId || selectedTaskForEdit.parentId === taskId)) {
      setSelectedTaskForEdit(prev => prev.id === taskId ? { ...prev, status: selectedTaskForEdit.status === 'done' ? (selectedTaskForEdit.startTime ? 'scheduled' : 'dumped') : 'done' } : prev);
    }
  };

  const togglePriority = (taskId) => updateTask(taskId, { isPriority: !tasks.find(t=>t.id===taskId).isPriority });
  
  const deleteTask = (taskId) => setTasks(prev => prev.filter(t => t.id !== taskId && t.parentId !== taskId));

  const handlePomodoroDrop = (taskId, minutesFromTimer) => {
    clearDragState();
    
    const taskToDrop = tasks.find(t => t.id === taskId);
    if (!taskToDrop) return;
    
    setWeekOffset(0);
    setSelectedDate(new Date());
    const currentTimeSlot = getCurrentTimeSlot();
    const fallbackDuration = globalPomoMinutes === '∞' ? 25 : globalPomoMinutes;
    let activeTask;

    if (taskToDrop.status === 'dumped' || taskToDrop.status === 'done') {
      const newId = generateId();
      const newTask = { 
        ...taskToDrop, id: newId, isClone: true, status: "scheduled", startTime: currentTimeSlot, date: new Date().toDateString(), 
        duration: minutesFromTimer !== '∞' ? minutesFromTimer : (taskToDrop.duration || fallbackDuration) 
      };
      
      const clonedTasks = [newTask];
      
      const children = tasks.filter(t => t.parentId === taskId);
      children.forEach((child) => {
        clonedTasks.push({ ...child, id: generateId(), parentId: newId, isClone: true });
      });

      setTasks(prev => [...prev, ...clonedTasks]);
      activeTask = { ...newTask, timerDuration: minutesFromTimer };
    } else {
      setTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, status: "scheduled", startTime: currentTimeSlot, date: new Date().toDateString(), 
        duration: minutesFromTimer !== '∞' ? minutesFromTimer : (t.duration || fallbackDuration) 
      } : t));
      activeTask = { ...taskToDrop, timerDuration: minutesFromTimer };
    }
    
    setPomodoroTask(activeTask); 
  };

  const handleStartTasklessPomodoro = (minutesFromTimer) => {
    setWeekOffset(0);
    setSelectedDate(new Date());
    const currentTimeSlot = getCurrentTimeSlot();
    const newId = generateId();
    const durationOnGrid = minutesFromTimer === '∞' ? 25 : minutesFromTimer;

    const newTask = {
      id: newId, parentId: null, title: "專注時段", priority: "Medium", duration: durationOnGrid,
      status: "scheduled", startTime: currentTimeSlot, date: new Date().toDateString(), isPriority: false, isClone: true
    };

    setTasks(prev => [...prev, newTask]);
    setPomodoroTask({ ...newTask, timerDuration: minutesFromTimer });
  };

  const completePomodoroTask = (task, minutesSetting, elapsedSeconds) => {
    const actualMins = minutesSetting === '∞' ? Math.max(1, Math.floor(elapsedSeconds / 60)) : minutesSetting;
    setTasks(prev => prev.map(t => {
      if (t.id === task.id || t.parentId === task.id) {
        return { ...t, status: 'done', duration: t.id === task.id ? actualMins : t.duration };
      }
      return t;
    }));
    setPomodoroTask(null);
    showToast("系統執行完成", "info");
  };

  const interruptPomodoro = (task, elapsedSeconds, originalMinutes) => {
    if (elapsedSeconds < 300) { 
      if (task.title === "專注時段" || task.isClone) {
        setTasks(prev => prev.filter(t => t.id !== task.id && t.parentId !== task.id));
      } else {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'dumped', startTime: null, date: null } : t));
      }
      showToast("已無痕取消本次專注", "info");
    } else {
      const actualMins = Math.max(1, Math.floor(elapsedSeconds / 60));
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'done', duration: actualMins, interrupted: true } : t));
      showToast("專注已中斷，紀錄已保留", "error");
    }
    setPomodoroTask(null);
  };

  const handleProcessBrainDump = async () => {
    if (!brainDumpText.trim()) return;
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const aiGeneratedTasks = [
      { id: `t_${Date.now()}_1`, parentId: null, title: "回覆老闆預算 Email", priority: "High", duration: 15, status: "dumped", startTime: null, isPriority: false },
      { id: `t_${Date.now()}_2`, parentId: null, title: "學習 Quant 基本理論", priority: "Medium", duration: 60, status: "dumped", startTime: null, isPriority: false }
    ];
    setTasks(prev => [...prev, ...aiGeneratedTasks]);
    setBrainDumpText("");
    setIsProcessing(false);
  };

  const handleAIReslice = async () => {
    if (!selectedTaskForEdit) return;
    setIsReslicing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const totalDuration = selectedTaskForEdit.duration || 25;
    let p1 = Math.max(1, Math.round(totalDuration * 0.3));
    let p2 = Math.max(1, Math.round(totalDuration * 0.4));
    let p3 = totalDuration - p1 - p2;
    if (p3 <= 0) { p1 = p2 = Math.max(1, Math.floor(totalDuration / 3)); p3 = totalDuration - p1 - p2; }
    
    const newSubTasks = [
      { id: `t_${Date.now()}_sub1`, parentId: selectedTaskForEdit.id, title: "(細化) 尋找資源", priority: selectedTaskForEdit.priority, duration: p1, status: "dumped", startTime: null },
      { id: `t_${Date.now()}_sub2`, parentId: selectedTaskForEdit.id, title: "建立初步框架", priority: selectedTaskForEdit.priority, duration: p2, status: "dumped", startTime: null },
      { id: `t_${Date.now()}_sub3`, parentId: selectedTaskForEdit.id, title: "核心步驟第一段", priority: selectedTaskForEdit.priority, duration: p3, status: "dumped", startTime: null }
    ];
    setTasks(prev => [...prev, ...newSubTasks]);
    setIsReslicing(false);
  };

  const getTaskSegments = () => {
    const segmentsByHour = {};
    HOURS.forEach(h => segmentsByHour[h] = []);
    
    const placedTasks = tasks.filter(t => 
      (t.status === 'scheduled' || t.status === 'done') && 
      (!t.date || t.date === selectedDate.toDateString()) &&
      t.startTime
    );

    placedTasks.forEach(task => {
      if (!task.duration) return;
      let [h, m] = task.startTime.split(':').map(Number);
      let durationLeft = task.duration;
      let currentH = h;
      let currentM = m;
      let isFirstSegment = true;
      while (durationLeft > 0 && currentH <= 23) {
        let availableInHour = 60 - currentM;
        let timeSpent = Math.min(availableInHour, durationLeft);
        let isLastSegment = (durationLeft - timeSpent) <= 0;
        segmentsByHour[currentH].push({ ...task, leftPercent: (currentM / 60) * 100, widthPercent: (timeSpent / 60) * 100, isFirst: isFirstSegment, isLast: isLastSegment });
        durationLeft -= timeSpent; currentH++; currentM = 0; isFirstSegment = false;
      }
    });
    return segmentsByHour;
  };
  
  const leftPanelTasks = tasks.filter(t => (t.status === 'dumped' || (t.status === 'done' && !t.startTime)) && !t.parentId);
  const priorityTasks = leftPanelTasks.filter(t => t.isPriority);
  const regularTasks = leftPanelTasks.filter(t => !t.isPriority);
  const segmentsByHour = getTaskSegments();

  const renderTaskCard = (task, isSub = false, hidePriorityBtn = false) => {
    const isDone = task.status === 'done';
    const badgeColor = task.customColor ? task.customColor : (task.priority === 'High' ? 'bg-rose-500' : task.priority === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400');
    const TaskIcon = task.customIcon && ICONS[task.customIcon] ? ICONS[task.customIcon] : null;

    return (
      <div 
        key={task.id} draggable={!isDone} onDragStart={(e) => handleDragStart(e, task.id)} onDragEnd={handleDragEnd}
        onDragOver={(e) => {
          e.preventDefault(); e.stopPropagation();
          if (!isSub && task.id !== draggedTaskId && task.status === 'dumped') { setDragOverTaskId(task.id); }
        }}
        onDragLeave={() => setDragOverTaskId(null)}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation();
          setDragOverTaskId(null);
          const sourceTaskId = e.dataTransfer.getData("text/plain");
          if (sourceTaskId && sourceTaskId !== task.id && task.parentId !== sourceTaskId) {
             updateTask(sourceTaskId, { parentId: task.id, status: 'dumped' });
          }
          clearDragState();
        }}
        onDoubleClick={(e) => { e.stopPropagation(); setSelectedTaskForEdit(task); }}
        className={`task-block bg-white p-2.5 rounded-xl border shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing group relative overflow-hidden transition-all flex items-center
          ${isDone ? 'border-emerald-200 bg-emerald-50/40 opacity-80' : 'border-neutral-200'} 
          ${isSub ? 'bg-indigo-50/20' : ''}
          ${dragOverTaskId === task.id ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : ''}
        `}
      >
        <div className={`absolute top-0 left-0 w-1 h-full ${isDone ? 'bg-emerald-400' : badgeColor}`} />
        
        <div className="flex flex-col items-center ml-1 mr-2 w-4">
          <GripVertical className="text-neutral-400 opacity-50 group-hover:opacity-100 shrink-0" size={16} />
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div className="flex items-center min-w-0 mr-2">
            {TaskIcon && <TaskIcon size={14} className={`mr-1.5 shrink-0 ${isDone ? 'text-neutral-400' : 'text-neutral-600'}`} />}
            <h4 className={`font-medium leading-tight group-hover:text-indigo-600 transition-colors truncate ${isSub ? 'text-sm' : ''} ${isDone ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>
              {task.title}
            </h4>
          </div>
          
          <div className="flex items-center shrink-0 space-x-2">
            {task.duration && (
              <span className="text-[10px] font-bold text-neutral-500 bg-neutral-200/60 px-1.5 py-0.5 rounded">
                {task.duration}m
              </span>
            )}
            {appMode === 'general' && !hidePriorityBtn && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); togglePriority(task.id); }} className={`p-1 rounded transition-colors ${task.isPriority ? 'text-amber-500 bg-amber-50' : 'text-neutral-400 hover:bg-neutral-100 hover:text-amber-500'}`}>
                  <Star size={14} className={task.isPriority ? "fill-amber-500" : ""} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTaskList = (taskList) => {
    return (
      <div className="space-y-2">
        {taskList.map(task => (
          <div key={task.id} className="relative">
            {renderTaskCard(task, false, false)}
            
            {/* 子任務建立預覽 (紫色提示區塊) */}
            {dragOverTaskId === task.id && (
              <div className="ml-4 mt-2 border-l-2 border-indigo-200/60 pl-3">
                <div className="h-10 border-2 border-dashed border-indigo-300 rounded-xl bg-indigo-50/50 flex items-center px-3 animate-in fade-in slide-in-from-left-2">
                  <CornerDownRight size={14} className="text-indigo-400 mr-2" />
                  <span className="text-xs font-bold text-indigo-500">放開以建立子任務</span>
                </div>
              </div>
            )}

            {tasks.filter(t => t.parentId === task.id).length > 0 && (
              <div className="ml-4 mt-2 space-y-2 border-l-2 border-neutral-200/60 pl-3">
                {tasks.filter(t => t.parentId === task.id).map(subTask => renderTaskCard(subTask, true))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* 提示訊息 */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 z-[200] animate-in slide-in-from-bottom-5">
          {toast.type === 'error' && <AlertTriangle size={18} className="text-rose-500" />}
          {toast.type === 'info' && <CheckCircle2 size={18} className="text-emerald-500" />}
          <span className="font-bold text-sm">{toast.msg}</span>
        </div>
      )}

      {/* === 全局拖曳垃圾桶 === */}
      {draggedTaskId && (
        <div 
          className={`fixed bottom-10 right-10 z-[200] w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl border-2 ${
            isTrashHovered ? 'bg-rose-500 border-rose-400 scale-125 shadow-rose-500/50' : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsTrashHovered(true); }}
          onDragLeave={() => setIsTrashHovered(false)}
          onDrop={(e) => {
            e.preventDefault();
            clearDragState();
            const taskId = e.dataTransfer.getData("text/plain");
            if (taskId) {
              deleteTask(taskId);
              showToast("任務已刪除", "info");
            }
          }}
        >
          <Trash2 className={`transition-all duration-300 ${isTrashHovered ? 'text-white scale-110 animate-bounce' : 'text-neutral-400'}`} size={24} />
        </div>
      )}

      <div className="flex h-screen bg-neutral-50 font-sans overflow-hidden">
        
        {/* ================= 左側面板 ================= */}
        <div className="w-1/3 min-w-[360px] max-w-[420px] bg-neutral-50 border-r border-neutral-200 flex flex-col shadow-sm z-10 relative overflow-hidden">
          
          {!selectedTaskForEdit && (
            <div className="p-5 border-b border-neutral-200 bg-white flex justify-between items-center shrink-0">
              <h1 className="text-xl font-black text-neutral-800 tracking-tight">TimeBoxing</h1>
              <div className="flex bg-neutral-100 p-1 rounded-lg">
                <button onClick={() => setAppMode('general')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${appMode === 'general' ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}>一般</button>
                <button onClick={() => setAppMode('ai')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center ${appMode === 'ai' ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/20' : 'text-neutral-400 hover:text-indigo-500'}`}>
                  <Sparkles size={12} className="mr-1"/> AI 模式
                </button>
              </div>
            </div>
          )}

          {/* === 內聯編輯器模式 === */}
          {selectedTaskForEdit ? (
            <div className="flex-1 flex flex-col bg-white overflow-y-auto scrollbar-hide animate-in slide-in-from-right-4 fade-in duration-200">
              <div className="flex items-center px-5 py-4 border-b border-neutral-100 shrink-0 sticky top-0 bg-white/90 backdrop-blur-sm z-50">
                <button onClick={() => { setSelectedTaskForEdit(null); clearDragState(); }} className="p-2 -ml-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors flex items-center">
                  <ChevronLeft size={20} /> <span className="font-bold text-sm ml-1">返回</span>
                </button>
                <div className="ml-auto flex items-center space-x-2">
                  
                  <div className="relative">
                    <button onClick={() => setShowIconMenu(!showIconMenu)} className="p-2 text-neutral-400 hover:text-indigo-600 bg-neutral-50 hover:bg-indigo-50 rounded-full transition-colors flex items-center justify-center">
                      <Tag size={16} />
                    </button>
                    {showIconMenu && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white shadow-xl rounded-2xl border border-neutral-100 p-4 z-50 animate-in fade-in zoom-in-95">
                        <div className="mb-4">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 block">標籤顏色</label>
                          <div className="flex flex-wrap gap-2">
                            {COLORS.map(c => (
                              <button key={c.id} onClick={() => { updateTask(selectedTaskForEdit.id, { customColor: c.value }); setShowIconMenu(false); }} className={`w-6 h-6 rounded-full ${c.value} border-2 ${selectedTaskForEdit.customColor === c.value ? 'border-neutral-900 scale-110' : 'border-transparent hover:scale-110'} transition-all`} />
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 block">自訂圖示</label>
                          <div className="flex flex-wrap gap-2">
                            {Object.keys(ICONS).map(iconKey => {
                              const IconComponent = ICONS[iconKey];
                              return (
                                <button key={iconKey} onClick={() => { updateTask(selectedTaskForEdit.id, { customIcon: iconKey }); setShowIconMenu(false); }} className={`p-2 rounded-xl transition-all ${selectedTaskForEdit.customIcon === iconKey ? 'bg-indigo-500 text-white shadow-md' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
                                  <IconComponent size={16} />
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={() => handleToggleComplete(selectedTaskForEdit.id)} className={`p-2 rounded-full transition-colors ${selectedTaskForEdit.status === 'done' ? 'text-emerald-500 bg-emerald-50' : 'text-neutral-400 hover:bg-neutral-100 hover:text-emerald-500'}`} title="完成任務">
                    <CheckCircle2 size={18} />
                  </button>
                  <button onClick={() => { deleteTask(selectedTaskForEdit.id); setSelectedTaskForEdit(null); }} className="p-2 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors" title="刪除任務">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6 flex flex-col space-y-6 pb-20">
                <div className="flex items-center bg-transparent">
                  {selectedTaskForEdit.customIcon && ICONS[selectedTaskForEdit.customIcon] && (
                    <div className={`p-2 rounded-xl mr-3 ${selectedTaskForEdit.customColor ? selectedTaskForEdit.customColor.replace('bg-', 'text-').replace('500', '600') : 'text-indigo-600'} bg-neutral-50`}>
                      {React.createElement(ICONS[selectedTaskForEdit.customIcon], { size: 24 })}
                    </div>
                  )}
                  <input
                    type="text"
                    value={selectedTaskForEdit.title}
                    onChange={(e) => updateTask(selectedTaskForEdit.id, { title: e.target.value })}
                    className={`text-2xl font-black focus:outline-none placeholder-neutral-300 w-full bg-transparent ${selectedTaskForEdit.status === 'done' ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}
                    placeholder="輸入任務名稱..."
                  />
                </div>

                <div className="space-y-4 bg-neutral-50/80 p-5 rounded-2xl border border-neutral-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-neutral-500 flex items-center"><Timer size={16} className="mr-2 opacity-70"/> 安排時間</span>
                    <input
                      type="time"
                      value={selectedTaskForEdit.startTime || ''}
                      onChange={(e) => updateTask(selectedTaskForEdit.id, { startTime: e.target.value, status: e.target.value ? 'scheduled' : 'dumped' })}
                      className="bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-sm font-bold text-neutral-700 focus:outline-none focus:border-indigo-400 shadow-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-neutral-500 flex items-center"><Focus size={16} className="mr-2 opacity-70"/> 專注時長</span>
                    <div className="flex items-center bg-white border border-neutral-200 rounded-lg shadow-sm focus-within:border-indigo-400 px-3 py-1.5">
                      <input
                        type="number"
                        value={selectedTaskForEdit.duration || ''}
                        placeholder={globalPomoMinutes === '∞' ? '25' : globalPomoMinutes.toString()}
                        onChange={(e) => updateTask(selectedTaskForEdit.id, { duration: e.target.value ? Number(e.target.value) : null })}
                        className="w-12 text-sm font-bold text-right text-neutral-700 focus:outline-none"
                      />
                      <span className="text-xs font-bold text-neutral-400 ml-1">mins</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button onClick={() => updateTask(selectedTaskForEdit.id, { isPriority: !selectedTaskForEdit.isPriority })} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center border ${selectedTaskForEdit.isPriority ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
                    <Star size={16} className={`mr-2 ${selectedTaskForEdit.isPriority ? 'fill-amber-500' : ''}`} /> {selectedTaskForEdit.isPriority ? '已標記優先' : '設為優先'}
                  </button>
                  <button onClick={() => updateTask(selectedTaskForEdit.id, { priority: selectedTaskForEdit.priority === 'High' ? 'Medium' : 'High' })} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center border ${selectedTaskForEdit.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
                    <AlertTriangle size={16} className="mr-2" /> {selectedTaskForEdit.priority === 'High' ? '高重要度' : '一般重要度'}
                  </button>
                </div>

                <div>
                  <label className="text-sm font-bold text-neutral-500 mb-3 flex items-center"><AlignLeft size={16} className="mr-2 opacity-70" /> 筆記與參與對象</label>
                  <textarea
                    value={selectedTaskForEdit.notes || ''}
                    onChange={(e) => updateTask(selectedTaskForEdit.id, { notes: e.target.value })}
                    className="w-full h-32 bg-white border border-neutral-200 rounded-xl p-4 text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 resize-none shadow-sm"
                    placeholder="在這裡記錄細節、參與對象或會議連結..."
                  />
                </div>

                {appMode === 'ai' && (
                  <div className="mt-8 border-t border-neutral-100 pt-6">
                    <label className="text-sm font-bold text-indigo-600 mb-3 flex items-center"><Sparkles size={16} className="mr-2" /> AI 阻力降維</label>
                    <textarea className="w-full h-20 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm mb-3" placeholder="告訴 AI 你卡在哪裡？(選填)" value={userRefineContext} onChange={(e) => setUserRefineContext(e.target.value)} />
                    <button onClick={handleAIReslice} disabled={isReslicing} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center transition-colors shadow-md disabled:opacity-50">
                      {isReslicing ? "AI 計算等比切割中..." : "自動展開微任務子階層"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : appMode === 'ai' ? (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div className="p-6 border-b border-neutral-100 bg-white flex-shrink-0">
                <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-widest flex items-center mb-4"><Brain className="mr-2 text-indigo-400" size={16} /> Brain Dump</h2>
                <textarea className="w-full h-24 p-3 bg-neutral-50 border border-neutral-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-400 text-sm transition-all scrollbar-hide" placeholder="把今天腦袋裡所有的事情都倒出來..." value={brainDumpText} onChange={(e) => setBrainDumpText(e.target.value)} />
                <button onClick={handleProcessBrainDump} disabled={isProcessing || !brainDumpText.trim()} className="mt-3 w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center transition-colors disabled:opacity-50">
                  {isProcessing ? "AI 萃取中..." : <><Wand2 size={16} className="mr-2" /> 結構化整理</>}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 bg-neutral-50/50 pb-6 scrollbar-hide" onDragOver={handleDragOver} onDrop={(e) => handleDropToStatus(e, 'dumped')}>
                <div className="flex items-center justify-between px-1 mb-3">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center"><ListTodo size={14} className="mr-2" /> 待安排任務</h3>
                </div>
                {renderTaskList(regularTasks)}
              </div>

              <div className="p-6 border-t border-neutral-200 shrink-0 z-10 bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
                <AdvancedPomodoro activeTask={pomodoroTask} onDropTask={handlePomodoroDrop} onCompleteTask={completePomodoroTask} onInterrupt={interruptPomodoro} onStartTaskless={handleStartTasklessPomodoro} globalMinutes={globalPomoMinutes} setGlobalMinutes={setGlobalPomoMinutes} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div className="flex-1 p-5 overflow-y-auto scrollbar-hide pb-6" onDragOver={handleDragOver} onDrop={(e) => handleDropToStatus(e, 'dumped', false)}>
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center mb-3"><ListTodo size={14} className="mr-2" /> Brain Dump</h3>
                <div className="relative mb-4 group">
                  <input type="text" value={newTaskInput} onChange={(e) => setNewTaskInput(e.target.value)} onKeyDown={handleAddTask} placeholder="輸入任務後按 Enter..." className="w-full pl-4 pr-10 py-3 bg-white border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all shadow-sm" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-indigo-400 pointer-events-none"><Plus size={18} /></div>
                </div>
                {renderTaskList(regularTasks)}
              </div>

              <div className="p-6 bg-white border-t border-neutral-200 shrink-0 z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
                <AdvancedPomodoro 
                  activeTask={pomodoroTask} 
                  onDropTask={handlePomodoroDrop} 
                  onCompleteTask={completePomodoroTask} 
                  onInterrupt={interruptPomodoro} 
                  onStartTaskless={handleStartTasklessPomodoro}
                  globalMinutes={globalPomoMinutes}
                  setGlobalMinutes={setGlobalPomoMinutes}
                />
              </div>

              {priorityTasks.length > 0 && (
                <div className="p-5 border-t border-neutral-200 bg-amber-50/30 shrink-0 max-h-[30vh] overflow-y-auto scrollbar-hide" onDragOver={handleDragOver} onDrop={(e) => handleDropToStatus(e, 'dumped', true)}>
                  <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center mb-3"><Star size={14} className="mr-2 fill-amber-500" /> Priority Tasks</h3>
                  {renderTaskList(priorityTasks)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= 右側：無邊界畫布 ================= */}
        <div className="flex-1 flex flex-col bg-neutral-50 relative">
          
          <div className="flex items-center justify-between px-8 pt-6 pb-2 shrink-0">
            <h2 className="text-2xl font-black text-neutral-800 tracking-tight">
              {formatMonthYear(selectedDate)}
            </h2>
            
            <div className="relative">
              <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-neutral-400 hover:text-neutral-800 bg-white rounded-full shadow-sm border border-neutral-200/50 transition-colors">
                <Settings2 size={20} />
              </button>
              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl rounded-2xl border border-neutral-100 p-4 z-50 animate-in fade-in zoom-in-95">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 block">時間軸網格間距</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[5, 10, 15, 30].map(interval => (
                      <button
                        key={interval}
                        onClick={() => { setGridInterval(interval); setShowSettings(false); }}
                        className={`py-2 rounded-lg text-xs font-bold transition-all ${gridInterval === interval ? 'bg-indigo-500 text-white shadow-md' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}
                      >
                        {interval} min
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-20 flex items-center px-4 shrink-0 z-20">
            <button onClick={() => setWeekOffset(p => p - 1)} className="p-2 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200/50 rounded-full transition-colors"><ChevronLeft size={20}/></button>
            <div className="flex-1 flex items-center justify-between space-x-2 px-4">
              {weekDays.map(day => {
                const isSelected = selectedDate.toDateString() === day.id;
                return (
                  <button key={day.id} onClick={() => handleDateSelect(day.date)} className={`flex-1 flex flex-col items-center justify-center min-w-[50px] h-16 rounded-2xl transition-all ${isSelected ? 'bg-neutral-900 text-white shadow-md scale-105' : 'bg-transparent hover:bg-neutral-200/50 text-neutral-500'}`}>
                    <span className={`text-[10px] font-bold uppercase mb-0.5 ${isSelected ? 'text-neutral-300' : (day.isToday ? 'text-rose-500' : 'text-neutral-400')}`}>{day.dayName}</span>
                    <span className={`text-xl font-black leading-none ${isSelected ? 'text-white' : (day.isToday ? 'text-rose-500' : 'text-neutral-800')}`}>{day.dayNum}</span>
                    {day.isToday && !isSelected && <div className="w-1 h-1 rounded-full bg-rose-500 mt-1" />}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setWeekOffset(p => p + 1)} className="p-2 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200/50 rounded-full transition-colors"><ChevronRight size={20}/></button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] border-t border-neutral-100 relative scrollbar-hide pt-4" ref={scrollContainerRef}>
            <div className={`max-w-4xl mx-auto relative px-8 pb-20 transition-opacity duration-300 ${isFlipping ? 'opacity-0' : 'opacity-100'}`}>
              
              <div className="flex sticky top-0 z-40 pointer-events-none">
                <div className="w-16 flex-shrink-0 pt-4 pb-2"></div>
                <div className="flex-1 relative pt-4 pb-2 pr-12">
                  <div className="w-full relative h-8">
                    {headerScaleMins.map((m) => (
                      <div key={`header_${m}`} className="absolute bottom-2 w-10 -ml-5 flex justify-center pointer-events-auto" style={{ left: `${(m / 60) * 100}%` }}>
                        <span className="text-neutral-400 text-xs font-bold">
                          {String(m).padStart(2, '0')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative">
                {HOURS.map(hour => {
                  const isCurrentHour = now.getHours() === hour && selectedDate.toDateString() === new Date().toDateString();
                  const currentMinutePercent = (now.getMinutes() / 60) * 100;

                  return (
                    <div key={hour} id={`hour-row-${hour}`} className="flex h-16 group">
                      
                      <div className="w-16 flex-shrink-0 flex items-center justify-end pr-4">
                        <span className={`text-sm font-bold transition-colors ${isCurrentHour ? 'text-rose-500' : 'text-neutral-400 group-hover:text-neutral-600'}`}>
                          {String(hour).padStart(2, '0')}
                        </span>
                      </div>
                      
                      <div className="flex-1 pr-12 relative">
                        <div 
                          className="w-full h-full flex relative border-t border-neutral-200 group-hover:border-neutral-300 group-hover:bg-neutral-50/30 transition-colors"
                          onDragOver={(e) => handleHourDragOver(e, hour)}
                          onDragLeave={handleHourDragLeave}
                          onDrop={(e) => handleHourDrop(e, hour)}
                        >
                          <div className="absolute inset-0 flex pointer-events-none">
                            {currentScaleMins.map((min) => (
                              <div key={`${hour}:${min}`} className="flex-1 border-l border-neutral-200 border-dashed" />
                            ))}
                            <div className="absolute right-0 top-0 bottom-0 border-r border-neutral-200 border-dashed" />
                          </div>

                          {isCurrentHour && (
                            <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.6)]" style={{ left: `${currentMinutePercent}%` }}>
                              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                            </div>
                          )}

                          {dragPreview && dragPreview.hour === hour && (
                            <div className="absolute top-0 bottom-0 w-px border-l-2 border-indigo-400 border-dashed z-40 pointer-events-none" style={{ left: `${dragPreview.leftPercent}%` }}>
                              <div className="absolute -top-6 left-0 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                                {String(hour).padStart(2, '0')}:{String(dragPreview.minute).padStart(2, '0')}
                              </div>
                            </div>
                          )}

                          {segmentsByHour[hour].map(seg => {
                            const isDone = seg.status === 'done';
                            const isSelectedForEdit = selectedTaskForEdit?.id === seg.id;
                            const badgeColor = seg.customColor ? seg.customColor : (seg.priority === 'High' ? 'bg-rose-500' : seg.priority === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400');
                            const TaskIcon = seg.customIcon && ICONS[seg.customIcon] ? ICONS[seg.customIcon] : null;
                            
                            const isRightSide = seg.leftPercent > 50;

                            return (
                              <div
                                key={`${seg.id}_${hour}`}
                                draggable={!isSelectedForEdit && !isDone} 
                                onDragStart={(e) => handleDragStart(e, seg.id)}
                                onDragEnd={handleDragEnd}
                                onDoubleClick={(e) => { e.stopPropagation(); setSelectedTaskForEdit(seg); }}
                                className={`task-block absolute top-1 bottom-1 p-0.5 transition-all duration-200 group
                                  ${!isDone && !isSelectedForEdit ? 'cursor-grab active:cursor-grabbing hover:z-[60]' : 'cursor-default z-10 hover:z-[60]'} 
                                `}
                                style={{ left: `${seg.leftPercent}%`, width: `${seg.widthPercent}%` }}
                              >
                                <div className={`absolute bottom-full ${isRightSide ? 'right-0' : 'left-0'} mb-1 w-max max-w-[200px] flex-col bg-neutral-900 text-white rounded-lg p-3 shadow-2xl pointer-events-none transition-opacity ${isSelectedForEdit ? 'flex opacity-100 z-[70]' : 'hidden group-hover:flex opacity-100 z-[70]'}`}>
                                  <span className="font-bold mb-1 text-sm leading-tight break-words whitespace-normal">{seg.title}</span>
                                  <span className="text-rose-400 text-xs font-bold mb-0.5">{seg.startTime} ({seg.duration} 分鐘)</span>
                                  <span className="text-neutral-400 text-[10px] font-semibold">雙擊編輯，或隨意拖曳</span>
                                  <div className={`absolute top-full ${isRightSide ? 'right-4' : 'left-4'} border-4 border-transparent border-t-neutral-900`} />
                                </div>

                                <div className={`w-full h-full flex items-center px-3 overflow-hidden shadow-sm transition-colors rounded-xl relative z-10
                                  ${isSelectedForEdit ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}
                                  ${isDone ? 'bg-neutral-100 border border-neutral-200 text-neutral-400' : `${badgeColor.replace('bg-', 'bg-').replace('500', '50/80').replace('400', '50/80')} border border-neutral-200 text-neutral-800`}
                                `}>
                                  {seg.isFirst && (
                                    <div className={`absolute top-0 left-0 w-1 h-full ${isDone ? 'bg-neutral-300' : badgeColor}`} />
                                  )}
                                  
                                  {seg.isFirst && (
                                    <div className="flex items-center w-full min-w-0">
                                      {isDone && !seg.interrupted && <CheckCircle2 size={16} className="mr-1.5 opacity-90 shrink-0 text-emerald-500" />}
                                      {isDone && seg.interrupted && <AlertTriangle size={16} className="mr-1.5 text-amber-500 opacity-100 shrink-0" title="干擾中斷" />}
                                      {!isDone && TaskIcon && <TaskIcon size={14} className="mr-1.5 shrink-0 opacity-60" />}
                                      
                                      <span className={`text-sm font-bold truncate ${isDone ? 'line-through opacity-80' : ''}`}>{seg.title}</span>
                                    </div>
                                  )}
                                  {!seg.isFirst && (
                                    <span className="text-current opacity-40 flex items-center shrink-0"><ArrowRight size={14} /></span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex h-4">
                  <div className="w-16 flex-shrink-0"></div>
                  <div className="flex-1 pr-12">
                    <div className="w-full border-t border-neutral-200"></div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
