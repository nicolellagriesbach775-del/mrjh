import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SubjectIcon = 'book' | 'calculator' | 'globe' | 'microscope' | 'music' | 'palette' | 'run' | 'monitor' | 'theater' | 'ruler' | 'pencil' | 'flask' | 'guitar' | 'football' | 'swim';

export interface Subject {
  id: string;
  name: string;
  icon: SubjectIcon;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  subjectId: string;
  points: number;
  isCompleted: boolean;
  createdAt: number;
  completedAt?: number;
  duration?: number; // duration in seconds
}

export interface DailyGoal {
    date: string; // YYYY-MM-DD
    tasks: Task[];
    pointsEarned: number;
}

export const SUBJECT_ICONS: { id: SubjectIcon; emoji: string }[] = [
  { id: 'book', emoji: '📖' },
  { id: 'calculator', emoji: '🔢' },
  { id: 'globe', emoji: '🌍' },
  { id: 'microscope', emoji: '🔬' },
  { id: 'music', emoji: '🎵' },
  { id: 'palette', emoji: '🎨' },
  { id: 'run', emoji: '🏃' },
  { id: 'monitor', emoji: '🖥️' },
  { id: 'theater', emoji: '🎭' },
  { id: 'ruler', emoji: '📏' },
  { id: 'pencil', emoji: '📝' },
  { id: 'flask', emoji: '🧪' },
  { id: 'guitar', emoji: '🎸' },
  { id: 'football', emoji: '⚽' },
  { id: 'swim', emoji: '🏊' },
];

export const SUBJECT_COLORS = [
  '#FF9AA2', // Soft Red
  '#FFB7B2', // Soft Coral
  '#FFDAC1', // Soft Orange
  '#E2F0CB', // Soft Green
  '#B5EAD7', // Soft Mint
  '#C7CEEA', // Soft Purple
  '#E0E7FF', // Soft Blue
  '#D1FAE5', // Soft Cyan
  '#FDE68A', // Soft Yellow
  '#DDD6FE', // Soft Violet
];

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: '1', name: '语文', icon: 'book', color: '#FF9AA2' },
  { id: '2', name: '数学', icon: 'calculator', color: '#C7CEEA' },
  { id: '3', name: '英语', icon: 'globe', color: '#E0E7FF' },
  { id: '4', name: '科学', icon: 'microscope', color: '#B5EAD7' },
  { id: '5', name: '音乐', icon: 'music', color: '#DDD6FE' },
  { id: '6', name: '美术', icon: 'palette', color: '#FDE68A' },
];

export const QUICK_TASKS = ['背课文', '写日记', '词语听写', '阅读理解', '作文练习'];
