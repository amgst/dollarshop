import React, { useState } from 'react';
import { CategoryConfig } from '../../types';

interface AdminCategoriesProps {
    categories: CategoryConfig[];
    onAddCategory: (name: string) => Promise<void>;
    onDeleteCategory: (id: string) => Promise<void>;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({
    categories,
    onAddCategory,
    onDeleteCategory
}) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        setIsSubmitting(true);
        try {
            await onAddCategory(newCategoryName.trim());
            setNewCategoryName('');
        } catch (error) {
            console.error('Failed to add category:', error);
            alert('Failed to add category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the category "${name}"? Existing products with this category will not be deleted but may need updating.`)) {
            try {
                await onDeleteCategory(id);
            } catch (error) {
                console.error('Failed to delete category:', error);
                alert('Failed to delete category');
            }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-slate-900">Categories</h1>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Add Category Form */}
                <div className="md:col-span-1">
                    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 sticky top-24">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Category</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                    Category Name
                                </label>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="e.g. Garden Tools"
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || !newCategoryName.trim()}
                                className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'Adding...' : 'Add Category'}
                            </button>
                        </form>
                    </section>
                </div>

                {/* Categories List */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Category Name</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-700">{category.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(category.id, category.name)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete Category"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {categories.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No categories found. Add one to get started!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
