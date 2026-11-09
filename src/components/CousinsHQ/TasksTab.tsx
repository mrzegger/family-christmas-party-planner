import React, { useState } from 'react';
import {
  Plus,
  Filter,
  Calendar,
  Trash2,
  CheckCircle2,
  Clock,
  CircleDot,
  UserCheck,
  Pencil,
  Check,
  X,
  Hand,
  UserPlus,
} from 'lucide-react';
import {
  TaskItem,
  Cousin,
  TaskStatus,
  TaskPriority,
} from '../../types/planner';

interface TasksTabProps {
  tasks: TaskItem[];
  cousins: Cousin[];
  activeCousinId: string;
  customCategories?: string[];
  onAddCustomCategory: (cat: string) => void;
  onAddTask: (task: Omit<TaskItem, 'id'>) => void;
  onUpdateTask: (id: string, updates: Partial<TaskItem>) => void;
  onDeleteTask: (id: string) => void;
}

const DEFAULT_CATEGORIES = [
  'Food & Drinks',
  'Games & Prizes',
  'Program & Hosting',
  'Decor & Venue',
  'Logistics & Tech',
];

const STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'Done'];

export function getTaskAssigneeIds(task: TaskItem): string[] {
  if (Array.isArray(task.assigneeIds)) {
    return task.assigneeIds.filter(Boolean);
  }
  if (task.assigneeId) {
    return [task.assigneeId];
  }
  return [];
}

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  cousins,
  activeCousinId,
  customCategories = [],
  onAddCustomCategory,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('ALL');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Food & Drinks');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [customCatInput, setCustomCatInput] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]); // Empty = Unassigned by default!
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState('2026-12-15');
  const [notes, setNotes] = useState('');

  // Inline edit task state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editIsCustomCat, setEditIsCustomCat] = useState(false);
  const [editCustomCatInput, setEditCustomCatInput] = useState('');
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>([]);
  const [editPriority, setEditPriority] = useState<TaskPriority>('Medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Collect all categories (default + custom + any used on existing tasks)
  const allCategories = Array.from(
    new Set([
      ...DEFAULT_CATEGORIES,
      ...customCategories,
      ...tasks.map((t) => t.committee).filter(Boolean),
    ])
  );

  const filteredTasks = tasks.filter((t) => {
    if (selectedCategory !== 'ALL' && t.committee !== selectedCategory)
      return false;
    const ids = getTaskAssigneeIds(t);
    if (selectedAssignee === 'UNASSIGNED') {
      return ids.length === 0;
    }
    if (selectedAssignee !== 'ALL' && !ids.includes(selectedAssignee))
      return false;
    return true;
  });

  const toggleFormAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleEditAssignee = (id: string) => {
    setEditAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const finalCat = isCustomCat
      ? customCatInput.trim() || 'General'
      : category;

    if (isCustomCat && customCatInput.trim()) {
      onAddCustomCategory(customCatInput.trim());
    }

    onAddTask({
      title: title.trim(),
      committee: finalCat,
      assigneeId: assigneeIds[0] || '',
      assigneeIds,
      status: 'To Do',
      priority,
      dueDate,
      notes: notes.trim(),
    });
    setTitle('');
    setNotes('');
    setCustomCatInput('');
    setIsCustomCat(false);
    setAssigneeIds([]);
    setShowNewTaskModal(false);
  };

  const startEditingTask = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditCategory(task.committee || 'Food & Drinks');
    setEditIsCustomCat(false);
    setEditCustomCatInput('');
    setEditAssigneeIds(getTaskAssigneeIds(task));
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate);
    setEditNotes(task.notes);
  };

  const saveEditingTask = (taskId: string) => {
    if (!editTitle.trim()) return;
    const finalCat = editIsCustomCat
      ? editCustomCatInput.trim() || 'General'
      : editCategory;

    if (editIsCustomCat && editCustomCatInput.trim()) {
      onAddCustomCategory(editCustomCatInput.trim());
    }

    onUpdateTask(taskId, {
      title: editTitle.trim(),
      committee: finalCat,
      assigneeId: editAssigneeIds[0] || '',
      assigneeIds: editAssigneeIds,
      priority: editPriority,
      dueDate: editDueDate,
      notes: editNotes.trim(),
    });
    setEditingTaskId(null);
  };

  const handleVolunteerOrToggleSelf = (task: TaskItem) => {
    const currentIds = getTaskAssigneeIds(task);
    const nextIds = currentIds.includes(activeCousinId)
      ? currentIds.filter((id) => id !== activeCousinId)
      : [...currentIds, activeCousinId];

    onUpdateTask(task.id, {
      assigneeId: nextIds[0] || '',
      assigneeIds: nextIds,
    });
  };

  const activeCousin = cousins.find((c) => c.id === activeCousinId);

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#DED6C6] bg-white p-5 shadow-2xs">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-[#1B4332]">
            Tasks &amp; Categories Board
          </h2>
          <p className="text-xs text-[#5C6B64]">
            Create tasks by category, leave tasks unassigned so anyone can volunteer, or assign multiple people together.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() =>
              setSelectedAssignee((prev) =>
                prev === activeCousinId ? 'ALL' : activeCousinId
              )
            }
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
              selectedAssignee === activeCousinId
                ? 'border-[#1B4332] bg-[#1B4332] text-white'
                : 'border-[#DED6C6] bg-[#FAF6F0] text-[#1C2826] hover:bg-[#F1ECE1]'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>My Tasks</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setSelectedAssignee((prev) =>
                prev === 'UNASSIGNED' ? 'ALL' : 'UNASSIGNED'
              )
            }
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
              selectedAssignee === 'UNASSIGNED'
                ? 'border-[#9E2A2B] bg-[#9E2A2B] text-white'
                : 'border-[#DED6C6] bg-[#FAF6F0] text-[#9E2A2B] hover:bg-[#F1ECE1]'
            }`}
          >
            <Hand className="h-3.5 w-3.5" />
            <span>Unassigned / Open</span>
          </button>

          <div className="flex items-center gap-1.5 rounded-xl border border-[#DED6C6] bg-[#FAF6F0] px-3 py-1.5">
            <Filter className="h-3.5 w-3.5 text-[#5C6B64]" />
            <select
              aria-label="Filter by Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#1C2826] focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <select
            aria-label="Filter by Organizer"
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="rounded-xl border border-[#DED6C6] bg-[#FAF6F0] px-3 py-2 text-xs font-semibold text-[#1C2826] focus:outline-none"
          >
            <option value="ALL">All Organizers ({cousins.length})</option>
            <option value="UNASSIGNED">Unassigned Tasks</option>
            {cousins.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setAssigneeIds([]);
              setShowNewTaskModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#9E2A2B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#7D2021]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="grid gap-5 lg:grid-cols-3">
        {STATUSES.map((statusCol) => {
          const colTasks = filteredTasks.filter((t) => t.status === statusCol);

          return (
            <div
              key={statusCol}
              className="flex flex-col rounded-3xl border border-[#DED6C6] bg-[#F4EFE6]/80 p-4"
            >
              <div className="flex items-center justify-between border-b border-[#DED6C6] pb-3">
                <div className="flex items-center gap-2">
                  {statusCol === 'To Do' && (
                    <CircleDot className="h-4 w-4 text-[#9E2A2B]" />
                  )}
                  {statusCol === 'In Progress' && (
                    <Clock className="h-4 w-4 text-[#B5651D]" />
                  )}
                  {statusCol === 'Done' && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  )}
                  <h3 className="font-serif-display text-base font-bold text-[#1B4332]">
                    {statusCol}
                  </h3>
                </div>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-[#1B4332] shadow-2xs">
                  {colTasks.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {colTasks.map((task) => {
                  const taskAssignees = getTaskAssigneeIds(task)
                    .map((id) => cousins.find((c) => c.id === id))
                    .filter((c): c is Cousin => Boolean(c));
                  const isAssignedToMe = taskAssignees.some(
                    (c) => c.id === activeCousinId
                  );
                  const isEditing = editingTaskId === task.id;

                  if (isEditing) {
                    return (
                      <div
                        key={task.id}
                        className="space-y-2.5 rounded-2xl border border-[#1B4332] bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1B4332]">
                            Edit Task
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingTaskId(null)}
                            className="text-[#5C6B64]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Task Title"
                          className="w-full rounded-lg border border-[#D4CBB8] px-2.5 py-1.5 text-xs font-bold"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={editIsCustomCat ? '__CUSTOM__' : editCategory}
                            onChange={(e) => {
                              if (e.target.value === '__CUSTOM__') {
                                setEditIsCustomCat(true);
                              } else {
                                setEditIsCustomCat(false);
                                setEditCategory(e.target.value);
                              }
                            }}
                            className="rounded-lg border border-[#D4CBB8] px-2 py-1 text-xs"
                          >
                            {allCategories.map((cm) => (
                              <option key={cm} value={cm}>
                                {cm}
                              </option>
                            ))}
                            <option value="__CUSTOM__">+ Custom Category...</option>
                          </select>
                          <select
                            value={editPriority}
                            onChange={(e) =>
                              setEditPriority(e.target.value as TaskPriority)
                            }
                            className="rounded-lg border border-[#D4CBB8] px-2 py-1 text-xs"
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        </div>
                        {editIsCustomCat && (
                          <input
                            type="text"
                            value={editCustomCatInput}
                            onChange={(e) =>
                              setEditCustomCatInput(e.target.value)
                            }
                            placeholder="Enter custom category name..."
                            className="w-full rounded-lg border border-[#1B4332] px-2.5 py-1 text-xs"
                          />
                        )}

                        {/* Multi-select Assignees in Edit mode */}
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#5C6B64]">
                              Assigned Organizers ({editAssigneeIds.length === 0 ? 'Unassigned' : editAssigneeIds.length})
                            </span>
                            {editAssigneeIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setEditAssigneeIds([])}
                                className="text-[10px] font-semibold text-[#9E2A2B] hover:underline"
                              >
                                Clear (Make Unassigned)
                              </button>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {cousins.map((c) => {
                              const selected = editAssigneeIds.includes(c.id);
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => toggleEditAssignee(c.id)}
                                  className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition ${
                                    selected
                                      ? 'border-[#1B4332] bg-[#1B4332] text-white'
                                      : 'border-[#D4CBB8] bg-[#FAF6F0] text-[#5C6B64]'
                                  }`}
                                >
                                  {selected ? `✓ ${c.name}` : c.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="w-full rounded-lg border border-[#D4CBB8] px-2.5 py-1 text-xs"
                        />
                        <textarea
                          rows={2}
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Notes..."
                          className="w-full rounded-lg border border-[#D4CBB8] px-2.5 py-1 text-xs"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingTaskId(null)}
                            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[#5C6B64]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditingTask(task.id)}
                            className="flex items-center gap-1 rounded-lg bg-[#1B4332] px-3 py-1 text-xs font-bold text-white"
                          >
                            <Check className="h-3 w-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-[#E5DEC9] bg-white p-4 shadow-2xs transition hover:border-[#1B4332]/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="rounded-lg bg-[#1B4332]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#1B4332]">
                          {task.committee || 'General'}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              task.priority === 'High'
                                ? 'bg-red-100 text-red-800'
                                : task.priority === 'Medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <button
                            type="button"
                            onClick={() => startEditingTask(task)}
                            title="Edit task & assignees"
                            className="rounded p-1 text-[#5C6B64] hover:bg-[#FAF6F0] hover:text-[#1B4332]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTask(task.id)}
                            title="Delete task"
                            className="rounded p-1 text-[#8C9690] hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4
                        className={`mt-2 text-sm font-bold ${
                          task.status === 'Done'
                            ? 'text-[#5C6B64] line-through'
                            : 'text-[#1C2826]'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {task.notes && (
                        <p className="mt-1.5 rounded-xl bg-[#FAF6F0] p-2.5 text-xs text-[#5C6B64]">
                          {task.notes}
                        </p>
                      )}

                      {/* Assignees & Volunteer Section */}
                      <div className="mt-3 space-y-2 border-t border-[#F1ECE1] pt-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {taskAssignees.length === 0 ? (
                              <span className="rounded-lg border border-dashed border-[#9E2A2B]/40 bg-[#9E2A2B]/5 px-2.5 py-1 text-[11px] font-bold text-[#9E2A2B]">
                                Unassigned
                              </span>
                            ) : (
                              taskAssignees.map((person) => (
                                <span
                                  key={person.id}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#E5DEC9] bg-[#FAF6F0] py-0.5 pr-2 pl-1 text-[11px] font-semibold text-[#1C2826]"
                                >
                                  <span
                                    className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                                    style={{
                                      backgroundColor: person.avatarColor,
                                    }}
                                  >
                                    {person.name.charAt(0)}
                                  </span>
                                  <span>{person.name}</span>
                                </span>
                              ))
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[11px] font-medium text-[#5C6B64]">
                            <Calendar className="h-3 w-3" />
                            <span>{task.dueDate}</span>
                          </div>
                        </div>

                        {/* Volunteer / Join Task Button */}
                        <div className="flex items-center justify-between gap-2">
                          {taskAssignees.length === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleVolunteerOrToggleSelf(task)}
                              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#9E2A2B] py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#7D2021]"
                            >
                              <Hand className="h-3.5 w-3.5" />
                              <span>
                                Volunteer ({activeCousin?.name || 'Me'})
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleVolunteerOrToggleSelf(task)}
                              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                                isAssignedToMe
                                  ? 'bg-stone-100 text-[#5C6B64] hover:bg-red-50 hover:text-red-700'
                                  : 'bg-[#1B4332]/10 text-[#1B4332] hover:bg-[#1B4332]/20'
                              }`}
                            >
                              <UserPlus className="h-3 w-3" />
                              <span>
                                {isAssignedToMe
                                  ? `Leave Task (${activeCousin?.name})`
                                  : `+ Join Task (${activeCousin?.name})`}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-1.5">
                        {STATUSES.map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              onUpdateTask(task.id, { status: st })
                            }
                            className={`rounded-lg py-1 text-[11px] font-bold transition ${
                              task.status === st
                                ? 'bg-[#1B4332] text-white'
                                : 'bg-[#FAF6F0] text-[#5C6B64] hover:bg-[#E5DEC9]/60'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#D4CBB8] p-6 text-center text-xs text-[#5C6B64]">
                    No tasks in {statusCol}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[#E5DEC9] bg-[#FAF6F0] p-6 shadow-2xl">
            <h3 className="font-serif-display text-xl font-bold text-[#1B4332]">
              Create New Party Task
            </h3>
            <form onSubmit={handleCreateTask} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Order dessert platters & confirm pickup time"
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs focus:border-[#1B4332] focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Category
                  </label>
                  <select
                    value={isCustomCat ? '__CUSTOM__' : category}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        setIsCustomCat(true);
                      } else {
                        setIsCustomCat(false);
                        setCategory(e.target.value);
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Add Custom Category...</option>
                  </select>
                  {isCustomCat && (
                    <input
                      type="text"
                      required
                      value={customCatInput}
                      onChange={(e) => setCustomCatInput(e.target.value)}
                      placeholder="Type new category name..."
                      className="mt-2 w-full rounded-xl border border-[#1B4332] bg-white px-3 py-1.5 text-xs"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as TaskPriority)
                    }
                    className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Multi-Select Assign to Organizer(s) or Leave Unassigned */}
              <div className="rounded-2xl border border-[#DED6C6] bg-white p-3.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1C2826]">
                    Assign to Organizer(s) — Select one, multiple, or leave Unassigned
                  </label>
                  <button
                    type="button"
                    onClick={() => setAssigneeIds([])}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      assigneeIds.length === 0
                        ? 'bg-[#9E2A2B] text-white'
                        : 'bg-[#FAF6F0] text-[#5C6B64] hover:bg-[#E5DEC9]'
                    }`}
                  >
                    {assigneeIds.length === 0
                      ? '✓ Unassigned (Open for Volunteers)'
                      : 'Set Unassigned'}
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-2">
                  {cousins.map((c) => {
                    const isSelected = assigneeIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleFormAssignee(c.id)}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                          isSelected
                            ? 'border-[#1B4332] bg-[#1B4332] text-white shadow-2xs'
                            : 'border-[#DED6C6] bg-[#FAF6F0] text-[#1C2826] hover:bg-[#F1ECE1]'
                        }`}
                      >
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                          style={{ backgroundColor: c.avatarColor }}
                        >
                          {c.name.charAt(0)}
                        </span>
                        <span>{c.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2826]">
                  Details / Vendor Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contact number, pickup instructions, or link..."
                  className="mt-1 w-full rounded-xl border border-[#D4CBB8] bg-white px-3.5 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#5C6B64] hover:bg-[#E5DEC9]/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#1B4332] px-5 py-2 text-xs font-bold text-white hover:bg-[#143325]"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
