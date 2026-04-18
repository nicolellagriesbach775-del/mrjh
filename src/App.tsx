import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Play, 
  Pause, 
  Calendar as CalendarIcon, 
  BookOpen, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Star, 
  MessageCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  getDay,
  isToday
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  cn, 
  DEFAULT_SUBJECTS, 
  SUBJECT_ICONS, 
  SUBJECT_COLORS, 
  QUICK_TASKS,
  Subject,
  Task,
  SubjectIcon
} from './lib/utils';

// --- Components ---

const ProgressBar = ({ value, max, color = 'bg-purple-500', className = '' }: { value: number; max: number; color?: string; className?: string }) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className={cn("w-full h-3 bg-gray-100 rounded-full overflow-hidden", className)}>
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        className={cn("h-full transition-all duration-500 ease-out", color)}
      />
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:relative bg-white rounded-t-3xl sm:rounded-3xl p-6 z-50 max-w-md w-full mx-auto shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Plus className="w-6 h-6" /> {title}
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'calendar' | 'subjects'>('tasks');
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const saved = localStorage.getItem('subjects');
      return saved ? JSON.parse(saved) : DEFAULT_SUBJECTS;
    } catch { return DEFAULT_SUBJECTS; }
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('tasks');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem('points');
    return saved ? parseInt(saved) : 0;
  });

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [activeTimerTask, setActiveTimerTask] = useState<Task | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('subjects', JSON.stringify(subjects));
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('points', JSON.stringify(points));
  }, [subjects, tasks, points]);

  // Derived Values
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = useMemo(() => tasks.filter(t => format(new Date(t.createdAt), 'yyyy-MM-dd') === todayStr), [tasks, todayStr]);
  const completedToday = todayTasks.filter(t => t.isCompleted).length;
  
  const currentLevel = Math.floor(points / 50) + 1;
  const pointsInCurrentLevel = points % 50;
  const levelTitle = currentLevel < 5 ? '小萌芽' : currentLevel < 10 ? '学习之星' : '学霸之王';
  const pointsToNextLevel = 50 - pointsInCurrentLevel;

  // Handlers
  const addTask = (title: string, subjectId: string) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      subjectId,
      points: 10,
      isCompleted: false,
      createdAt: Date.now(),
    };
    setTasks([newTask, ...tasks]);
    setIsAddTaskOpen(false);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const newState = !t.isCompleted;
        if (newState) {
          setPoints(p => p + t.points);
        } else {
          setPoints(p => Math.max(0, p - t.points));
        }
        return { ...t, isCompleted: newState, completedAt: newState ? Date.now() : undefined };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete?.isCompleted) {
        setPoints(p => Math.max(0, p - taskToDelete.points));
    }
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addSubject = (name: string, icon: SubjectIcon, color: string) => {
    const newSubject: Subject = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      icon,
      color,
    };
    setSubjects([...subjects, newSubject]);
  };

  const deleteSubject = (id: string) => {
    if (subjects.length > 1) {
      setSubjects(prev => prev.filter(s => s.id !== id));
    }
  };

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const startTimer = (task: Task) => {
    setActiveTimerTask(task);
    setCurrentTime(0);
    setIsTimerRunning(true);
    setIsTimerOpen(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Views
  const renderTasks = () => {
    const pending = todayTasks.filter(t => !t.isCompleted);
    const completed = todayTasks.filter(t => t.isCompleted);

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        {/* Level Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#E295E3] via-[#DC5CDD] to-[#FF6AD5] rounded-[2rem] p-6 text-white shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/80 text-sm font-medium">当前称号</p>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {levelTitle} <span className="text-xl">🌱</span>
              </h2>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm font-medium">总积分</p>
              <div className="flex items-center gap-1">
                <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                <span className="text-3xl font-bold">{points}</span>
              </div>
            </div>
          </div>
          <ProgressBar value={pointsInCurrentLevel} max={50} color="bg-white/40" className="h-4 bg-black/10 shadow-inner" />
          <p className="mt-2 text-sm text-white/90 font-medium">再得 {pointsToNextLevel} 分升级 →</p>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">今日进度</h3>
              <p className="text-gray-400 text-sm mt-1">
                {format(new Date(), 'M月d日 EEEE', { locale: zhCN })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold text-purple-600">{completedToday}</span>
              <span className="text-gray-300 font-bold text-2xl"> / {todayTasks.length}</span>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">完成任务</p>
            </div>
          </div>
          <ProgressBar value={completedToday} max={todayTasks.length || 1} color="bg-gradient-to-r from-purple-400 to-pink-400" className="h-4" />
        </div>

        {/* Task Lists */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-bold text-gray-700 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-400" /> 待完成 ({pending.length})
            </h4>
            <button 
              onClick={() => setIsAddTaskOpen(true)}
              className="bg-[#9F67F4] text-white px-5 py-2 rounded-full font-bold flex items-center gap-1 shadow-lg shadow-purple-200 active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" /> 添加任务
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 space-y-4">
               <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center">
                  <div className="relative">
                    <BookOpen className="w-16 h-16 text-gray-200" />
                    <Star className="w-6 h-6 text-yellow-200 fill-yellow-200 absolute -top-2 -right-2" />
                  </div>
               </div>
               <p className="text-lg font-medium">今天还没有任务，快去添加吧！</p>
            </div>
          ) : (
            <>
              {pending.map(task => {
                const subject = subjects.find(s => s.id === task.subjectId);
                return (
                  <motion.div 
                    layout
                    key={task.id} 
                    className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-gray-100 group"
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ backgroundColor: `${subject?.color || '#F3F4F6'}30` }}>
                      {SUBJECT_ICONS.find(i => i.id === subject?.icon)?.emoji || '📚'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-gray-800 truncate">{task.title}</h5>
                      <p className="text-gray-400 text-xs flex items-center gap-1">
                        {subject?.name} · <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> +{task.points}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => startTimer(task)}
                        className="p-2.5 bg-blue-50 text-blue-500 rounded-2xl hover:bg-blue-100 transition-colors"
                      >
                        <Clock className="w-5 h-5" />
                      </button>
                      <button 
                         onClick={() => toggleTask(task.id)}
                         className="p-2.5 bg-green-50 text-green-500 rounded-2xl hover:bg-green-100 transition-colors"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="p-2.5 bg-red-50 text-red-400 rounded-2xl hover:bg-red-100 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              {completed.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="text-lg font-bold text-gray-700 flex items-center gap-2 opacity-60">
                     ✨ 已完成 ({completed.length})
                  </h4>
                  {completed.map(task => {
                    const subject = subjects.find(s => s.id === task.subjectId);
                    return (
                      <div key={task.id} className="bg-gray-50/50 p-4 rounded-3xl flex items-center gap-4 border border-gray-100 opacity-60">
                        <div className="w-12 h-12 rounded-2xl bg-gray-200 flex items-center justify-center text-2xl grayscale">
                          {SUBJECT_ICONS.find(i => i.id === subject?.icon)?.emoji || '📚'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-gray-500 line-through truncate">{task.title}</h5>
                          <p className="text-gray-400 text-xs">
                            {subject?.name} · +{task.points}
                          </p>
                        </div>
                        <Check className="w-6 h-6 text-green-400" />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderSubjectManager = () => {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 space-y-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-green-500" /> 我的科目
          </h3>
          <div className="space-y-4">
            {subjects.map(subject => (
              <div key={subject.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ backgroundColor: `${subject.color}30` }}>
                    {SUBJECT_ICONS.find(i => i.id === subject.icon)?.emoji}
                  </div>
                  <span className="font-bold text-gray-700 text-lg">{subject.name}</span>
                </div>
                {subjects.length > 1 && (
                  <button 
                    onClick={() => deleteSubject(subject.id)}
                    className="p-3 bg-white text-gray-400 rounded-2xl shadow-sm hover:text-red-500 hover:bg-red-50 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 space-y-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Plus className="w-6 h-6 text-purple-500" /> 添加科目
          </h3>
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-400">科目名称</p>
            <input 
              id="new-subject-name"
              type="text" 
              placeholder="例如：体育、编程..."
              className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-purple-200 outline-none transition-all font-medium"
            />
            
            <p className="text-sm font-medium text-gray-400 pt-2">选择图标</p>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
              {SUBJECT_ICONS.map(i => (
                <button 
                  key={i.id}
                  onClick={() => {(window as any).selectedIcon = i.id; document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('ring-4', 'ring-purple-200')); document.getElementById(`icon-${i.id}`)?.classList.add('ring-4', 'ring-purple-200')}}
                  id={`icon-${i.id}`}
                  className="icon-btn w-12 h-12 flex items-center justify-center text-2xl hover:bg-gray-50 rounded-2xl transition-all"
                >
                  {i.emoji}
                </button>
              ))}
            </div>

            <p className="text-sm font-medium text-gray-400 pt-2">选择颜色</p>
            <div className="flex flex-wrap gap-3">
              {SUBJECT_COLORS.map(c => (
                <button 
                  key={c}
                  onClick={() => {(window as any).selectedColor = c; document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('ring-4', 'ring-purple-200')); (document.getElementById(`color-${c.replace('#', '')}`) as HTMLElement)?.classList.add('ring-4', 'ring-purple-200')}}
                  id={`color-${c.replace('#', '')}`}
                  className="color-btn w-10 h-10 rounded-2xl transition-all shadow-sm"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <button 
              onClick={() => {
                const nameInput = document.getElementById('new-subject-name') as HTMLInputElement;
                const icon = (window as any).selectedIcon || 'book';
                const color = (window as any).selectedColor || SUBJECT_COLORS[0];
                if (nameInput.value) {
                  addSubject(nameInput.value, icon, color);
                  nameInput.value = '';
                }
              }}
              className="w-full bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 text-white font-bold py-4 rounded-[1.5rem] shadow-lg shadow-purple-100 active:scale-95 transition-transform flex items-center justify-center gap-2 mt-4"
            >
              添加科目 ✨
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    const [currentMonth, setMonth] = useState(new Date());
    
    const days = useMemo(() => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const prefixDays = getDay(startOfMonth(currentMonth));
    const emptyDays = Array(prefixDays === 0 ? 6 : prefixDays - 1).fill(null);

    const getDayStatus = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(t => format(new Date(t.createdAt), 'yyyy-MM-dd') === dateStr);
      if (dayTasks.length === 0) return null;
      const completedCount = dayTasks.filter(t => t.isCompleted).length;
      if (completedCount === dayTasks.length) return 'all';
      if (completedCount > 0) return 'partial';
      return 'has';
    };

    const monthStats = useMemo(() => {
      const monthStr = format(currentMonth, 'yyyy-MM');
      const monthTasks = tasks.filter(t => format(new Date(t.createdAt), 'yyyy-MM') === monthStr);
      const completedCnt = monthTasks.filter(t => t.isCompleted).length;
      const pointTotal = monthTasks.filter(t => t.isCompleted).reduce((acc, t) => acc + t.points, 0);
      const uniqueDays = new Set(monthTasks.map(t => format(new Date(t.createdAt), 'yyyy-MM-dd'))).size;
      return { completedCnt, pointTotal, uniqueDays };
    }, [tasks, currentMonth]);

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50">
          <div className="flex justify-between items-center mb-8 px-2">
            <button onClick={() => setMonth(subMonths(currentMonth, 1))} className="p-2.5 bg-gray-50 rounded-2xl">
              <ChevronLeft className="w-5 h-5 text-purple-400" />
            </button>
            <h3 className="text-2xl font-black text-gray-700">
               {format(currentMonth, 'yyyy年M月')}
            </h3>
            <button onClick={() => setMonth(addMonths(currentMonth, 1))} className="p-2.5 bg-gray-50 rounded-2xl">
              <ChevronRight className="w-5 h-5 text-purple-400" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-4">
            {['一', '二', '三', '四', '五', '六', '日'].map(d => (
              <div key={d} className="text-gray-300 font-bold py-2">{d}</div>
            ))}
            {emptyDays.map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const status = getDayStatus(day);
              const isTodayDay = isToday(day);
              return (
                <div key={day.toString()} className="aspect-square flex flex-col items-center justify-center gap-1 group cursor-default">
                  <div className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-2xl font-bold transition-all relative",
                    isTodayDay ? "bg-pink-50 text-pink-500 scale-110" : "text-gray-600 group-hover:bg-gray-50"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="flex gap-1 h-1.5 items-center">
                    {status === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                    {status === 'partial' && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                    {status === 'has' && <div className="w-1.5 h-1.5 rounded-full bg-orange-300" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-6 mt-6 py-4 border-t border-gray-50">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-400 whitespace-nowrap">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" /> 全部完成
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-400 whitespace-nowrap">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> 部分完成
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-400 whitespace-nowrap">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-300" /> 有任务
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-white p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-50 text-center space-y-2">
            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mx-auto text-xl">✅</div>
            <div className="text-xl sm:text-2xl font-black text-purple-500">{monthStats.completedCnt}</div>
            <div className="text-[10px] font-bold text-gray-400 tracking-tight">本月完成</div>
          </div>
          <div className="bg-white p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-50 text-center space-y-2">
            <div className="w-10 h-10 bg-yellow-50 text-yellow-500 rounded-2xl flex items-center justify-center mx-auto text-xl">⭐</div>
            <div className="text-xl sm:text-2xl font-black text-purple-500">{monthStats.pointTotal}</div>
            <div className="text-[10px] font-bold text-gray-400 tracking-tight">本月积分</div>
          </div>
          <div className="bg-white p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-50 text-center space-y-2">
            <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mx-auto text-xl">📅</div>
            <div className="text-xl sm:text-2xl font-black text-purple-500">{monthStats.uniqueDays}</div>
            <div className="text-[10px] font-bold text-gray-400 tracking-tight">学习天数</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDF9FF] flex flex-col font-sans text-gray-800 max-w-lg mx-auto overflow-x-hidden">
      {/* Top Header */}
      <header className="p-6 pb-2 safe-top sticky top-0 bg-[#FDF9FF]/80 backdrop-blur-md z-40">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-yellow-400 to-orange-400 p-1.5 rounded-xl shadow-lg ring-2 ring-orange-100">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <h1 className="text-2xl font-black text-[#5C3F85] tracking-tight">每日学习机</h1>
          </div>
          <div className="bg-yellow-100/50 px-4 py-1.5 rounded-2xl flex items-center gap-1.5 border border-yellow-200/50">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="text-yellow-700 font-black text-lg">{points}</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <nav className="flex items-center gap-2 bg-white/50 p-1 rounded-[1.75rem] shadow-inner border border-white">
          <button 
            onClick={() => setActiveTab('tasks')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 rounded-[1.5rem] font-bold transition-all text-sm",
              activeTab === 'tasks' ? "bg-gradient-to-r from-[#A675F5] to-[#8E56E2] text-white shadow-lg shadow-purple-100" : "text-gray-400 hover:bg-white"
            )}
          >
            <BookOpen className="w-4 h-4 hidden sm:block" /> 今日任务
          </button>
          <button 
            onClick={() => setActiveTab('calendar')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 rounded-[1.5rem] font-bold transition-all text-sm",
              activeTab === 'calendar' ? "bg-gradient-to-r from-[#A675F5] to-[#8E56E2] text-white shadow-lg shadow-purple-100" : "text-gray-400 hover:bg-white"
            )}
          >
            <CalendarIcon className="w-4 h-4 hidden sm:block" /> 学习日历
          </button>
          <button 
            onClick={() => setActiveTab('subjects')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 rounded-[1.5rem] font-bold transition-all text-sm",
              activeTab === 'subjects' ? "bg-gradient-to-r from-[#A675F5] to-[#8E56E2] text-white shadow-lg shadow-purple-100" : "text-gray-400 hover:bg-white"
            )}
          >
            <Settings className="w-4 h-4 hidden sm:block" /> 管理科目
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6 pb-24">
        {activeTab === 'tasks' && renderTasks()}
        {activeTab === 'calendar' && renderCalendar()}
        {activeTab === 'subjects' && renderSubjectManager()}

        {/* Promotion */}
        <div className="pt-8">
            <div className="bg-white/80 backdrop-blur rounded-[1.5rem] p-4 flex items-center gap-3 border border-pink-50 shadow-sm mx-auto w-fit max-w-full">
              <div className="bg-pink-100 p-2 rounded-xl flex-shrink-0">
                 <MessageCircle className="w-5 h-5 text-pink-500" />
              </div>
              <p className="text-[12px] sm:text-sm font-medium text-gray-600 leading-tight">
                想要加入 <span className="text-purple-600 font-bold">西西AI高效育儿群</span>
                <br />
                加微信 <span className="text-pink-500 font-bold">LMXD56</span>
              </p>
            </div>
        </div>
      </main>

      {/* Modals */}
      <Modal 
        isOpen={isAddTaskOpen} 
        onClose={() => setIsAddTaskOpen(false)} 
        title="添加新任务"
      >
        <div className="space-y-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">选择科目</p>
          <div className="flex flex-wrap gap-2">
            {subjects.map(s => (
              <button 
                key={s.id}
                onClick={() => (window as any).selectedTaskSubjectId = s.id}
                className="flex items-center gap-2 py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-[1.25rem] font-bold text-gray-700 transition-all border-2 border-transparent focus:border-purple-300 focus:bg-white focus:shadow-sm"
              >
                <span className="text-xl">{SUBJECT_ICONS.find(i => i.id === s.icon)?.emoji}</span>
                {s.name}
              </button>
            ))}
          </div>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none pt-2">快速选择</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_TASKS.map(t => (
              <button 
                key={t}
                onClick={() => {if (document.getElementById('custom-task')) (document.getElementById('custom-task') as HTMLInputElement).value = t}}
                className="py-2.5 px-6 bg-white border border-gray-100 rounded-[1.25rem] font-bold text-gray-500 hover:text-purple-500 hover:border-purple-200 transition-all text-sm"
              >
                {t}
              </button>
            ))}
          </div>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none pt-2">自定义任务名</p>
          <input 
            id="custom-task"
            type="text" 
            placeholder="输入任务名称..."
            className="w-full bg-gray-50 p-4 rounded-[1.25rem] border-2 border-transparent focus:border-purple-200 outline-none transition-all font-bold text-gray-700"
          />

          <button 
             onClick={() => {
               const titleInput = document.getElementById('custom-task') as HTMLInputElement;
               const subId = (window as any).selectedTaskSubjectId || subjects[0].id;
               if (titleInput.value) {
                 addTask(titleInput.value, subId);
                 titleInput.value = '';
               }
             }}
             className="w-full bg-gradient-to-r from-[#C188F1] via-[#D1A7E9] to-[#F1A8C8] text-white font-bold py-4 rounded-[1.5rem] shadow-xl shadow-purple-100 active:scale-95 transition-transform mt-4 flex items-center justify-center gap-2 text-lg"
          >
            确认添加 ✨
          </button>
        </div>
      </Modal>

      {/* Timer Modal */}
      <AnimatePresence>
        {isTimerOpen && activeTimerTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#FDF9FF] z-[100] flex flex-col p-6 items-center"
          >
            <div className="w-full flex justify-start pt-safe">
              <button 
                onClick={() => {setIsTimerOpen(false); setIsTimerRunning(false)}} 
                className="flex items-center gap-1 text-purple-600 font-bold p-2.5 bg-purple-50 rounded-2xl"
              >
                <ChevronLeft className="w-6 h-6" /> 返回
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-8 sm:space-y-12 w-full max-w-sm">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-pink-100 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-xl shadow-pink-100 mx-auto">
                   {SUBJECT_ICONS.find(i => i.id === subjects.find(s => s.id === activeTimerTask.subjectId)?.icon)?.emoji}
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-800">{activeTimerTask.title}</h2>
                  <p className="text-purple-500 font-bold flex items-center justify-center gap-1 text-lg">
                    {subjects.find(s => s.id === activeTimerTask.subjectId)?.name} · <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" /> +{activeTimerTask.points}
                  </p>
                </div>
              </div>

              {/* Circular Timer Visual */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="50%" cy="50%" r="44%" 
                      className="text-gray-100 stroke-current shadow-inner" 
                      strokeWidth="20" fill="transparent" 
                    />
                    <motion.circle 
                      cx="50%" cy="50%" r="44%" 
                      className="text-purple-500 stroke-current" 
                      strokeWidth="20" fill="transparent"
                      strokeLinecap="round"
                      style={{ strokeDasharray: 880 }}
                      animate={{ strokeDashoffset: 880 - ( (currentTime % 3600) / 3600 ) * 880 }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl sm:text-7xl font-black text-purple-600 tracking-tighter">{formatTime(currentTime)}</span>
                    <span className="text-gray-400 font-bold text-lg sm:text-xl">已计 {Math.floor(currentTime / 60)} 分钟</span>
                 </div>
              </div>

              <div className="flex gap-6">
                <button 
                   onClick={() => setIsTimerRunning(!isTimerRunning)}
                   className={cn(
                     "w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-90",
                     isTimerRunning ? "bg-orange-400 shadow-orange-100" : "bg-gradient-to-r from-purple-400 to-pink-400 shadow-purple-100"
                   )}
                >
                  {isTimerRunning ? <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-white" /> : <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white ml-2" />}
                </button>
              </div>
            </div>

            <div className="w-full pt-8 pb-safe max-w-sm">
              <button 
                onClick={() => {
                  toggleTask(activeTimerTask.id);
                  setIsTimerOpen(false);
                  setIsTimerRunning(false);
                }}
                className="w-full bg-gradient-to-r from-green-400 to-emerald-400 text-white font-black py-5 rounded-[2.5rem] text-xl shadow-xl shadow-green-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Check className="w-7 h-7 sm:w-8 sm:h-8" /> 任务完成
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .safe-top { padding-top: max(1.5rem, env(safe-area-inset-top)); }
        .pb-safe { padding-bottom: max(2rem, env(safe-area-inset-bottom)); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
      `}} />
    </div>
  );
}
