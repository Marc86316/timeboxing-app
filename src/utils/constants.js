import { Brain, Terminal, BookOpen, Briefcase, Coffee, Tag, Focus } from 'lucide-react';

export const HOURS = Array.from({ length: 24 }, (_, i) => i); 
export const RULER_VALUES = ['∞', ...Array.from({length: 120}, (_, i) => i + 1)];
export const TICK_WIDTH = 12;

export const ICONS = {
  brain: Brain,
  terminal: Terminal,
  book: BookOpen,
  briefcase: Briefcase,
  coffee: Coffee,
  tag: Tag,
  focus: Focus
};

export const COLORS = [
  { id: 'rose', value: 'bg-rose-500' },
  { id: 'amber', value: 'bg-amber-400' },
  { id: 'emerald', value: 'bg-emerald-400' },
  { id: 'indigo', value: 'bg-indigo-500' },
  { id: 'blue', value: 'bg-blue-500' },
  { id: 'purple', value: 'bg-purple-500' },
  { id: 'neutral', value: 'bg-neutral-500' },
];
