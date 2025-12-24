"use client";

import { useState, useEffect } from "react";
import { Plus, CheckCircle, Clock, AlertTriangle, Calendar, Trash2 } from "lucide-react";
import { trackerApi, TaskEntry } from "../../../features/tracker/api/client";
import { motion } from "framer-motion";

import toast from "react-hot-toast";
import ConfirmationModal from "../../components/ConfirmationModal";

export default function TasksPage() {
    const [tasks, setTasks] = useState<TaskEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Delete Confirmation State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

    // Form State
    const [newItem, setNewItem] = useState<TaskEntry>({
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        due_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const data = await trackerApi.getTasks();
            setTasks(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load tasks");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!newItem.title) return;
        try {
            await trackerApi.addTask(newItem);
            setIsModalOpen(false);
            setNewItem({ title: "", description: "", status: "pending", priority: "medium", due_date: "" });
            loadData();
            toast.success("Task created successfully");
        } catch (e) {
            console.error(e);
            toast.error("Failed to create task");
        }
    }

    async function handleStatusChange(task: TaskEntry, newStatus: TaskEntry['status']) {
        if (!task.id) return;
        try {
            await trackerApi.updateTask(task.id, { ...task, status: newStatus });
            loadData();
        } catch (e) {
            console.error(e);
            toast.error("Failed to update task status");
        }
    }

    function handleDeleteClick(id: number) {
        setTaskToDelete(id);
        setDeleteModalOpen(true);
    }

    async function handleConfirmDelete() {
        if (!taskToDelete) return;
        try {
            await trackerApi.deleteTask(taskToDelete);
            setDeleteModalOpen(false); // Close immediately
            setTaskToDelete(null);
            setTasks(tasks.filter(t => t.id !== taskToDelete)); // Optimistic delete
            toast.success("Task deleted successfully");
            // loadData(); // Optional: reload to sync
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete task");
            loadData(); // Revert
        }
    }

    // Categorize tasks for Kanban-lite view
    const columns = [
        { id: "pending", label: "To Do", icon: Clock, color: "bg-gray-100 text-gray-600" },
        { id: "in_progress", label: "In Progress", icon: Calendar, color: "bg-blue-100 text-blue-600" },
        { id: "completed", label: "Completed", icon: CheckCircle, color: "bg-green-100 text-green-600" }
    ];

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'high': return 'text-red-600 bg-red-50 border-red-100';
            case 'medium': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'low': return 'text-blue-600 bg-blue-50 border-blue-100';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    if (loading && tasks.length === 0) {
        return <div className="p-8 text-center text-gray-500">Loading tasks...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
                        <p className="text-gray-500 mt-1">Track case deadlines and to-dos.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus size={18} />
                        Add Task
                    </button>
                </div>

                {/* Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {columns.map(col => (
                        <div key={col.id} className="bg-gray-100/50 p-4 rounded-xl min-h-[500px]">
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <div className={`p-1.5 rounded-md ${col.color}`}>
                                    <col.icon size={16} />
                                </div>
                                <h3 className="font-semibold text-gray-700">{col.label}</h3>
                                <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                                    {tasks.filter(t => t.status === col.id).length}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {tasks.filter(t => t.status === col.id).map(task => (
                                    <motion.div
                                        layoutId={String(task.id)}
                                        key={task.id}
                                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 group relative"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            <button
                                                onClick={() => task.id && handleDeleteClick(task.id)}
                                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
                                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>

                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                                <Calendar size={12} />
                                                {task.due_date || "No date"}
                                            </div>

                                            {/* Move actions */}
                                            <div className="flex gap-1">
                                                {col.id !== 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusChange(task, 'pending')}
                                                        className="p-1 hover:bg-gray-100 rounded text-gray-400"
                                                        title="Move to To Do"
                                                    >
                                                        ←
                                                    </button>
                                                )}
                                                {col.id !== 'completed' && (
                                                    <button
                                                        onClick={() => handleStatusChange(task, col.id === 'pending' ? 'in_progress' : 'completed')}
                                                        className="p-1 hover:bg-gray-100 rounded text-green-600"
                                                        title="Advance"
                                                    >
                                                        →
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                            <h2 className="text-xl font-bold mb-4">New Task</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newItem.title}
                                        onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                        placeholder="e.g. Submit biometrics"
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newItem.due_date}
                                            onChange={e => setNewItem({ ...newItem, due_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                        <select
                                            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            value={newItem.priority}
                                            onChange={e => setNewItem({ ...newItem, priority: e.target.value as any })}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-24"
                                        value={newItem.description}
                                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                        placeholder="Details..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Create Task
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Task"
                message="Are you sure you want to delete this task? This cannot be undone."
                isDangerous={true}
                confirmText="Delete"
            />
        </div>
    );
}
