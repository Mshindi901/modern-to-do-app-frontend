import { useEffect, useState } from 'react';
import { Tags as TagIcon, Plus, Trash2 } from 'lucide-react';
import { getUserTags, createTag, deleteTag } from '../../api/tagApi.js';
import { getApiErrorMessage } from '../../api/axios.js';

export default function Tags() {
  const [tags, setTags] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTags = async () => {
    try {
      const response = await getUserTags();
      const data = response?.data?.data || [];
      setTags(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(getApiErrorMessage(error));
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createTag({ name, color: '#8b5cf6' });
      setName('');
      loadTags();
    } catch (error) {
      console.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTag(id);
      loadTags();
    } catch (error) {
      console.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-violet-100 p-2 text-violet-700"><TagIcon size={20} /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Tags</h1>
              <p className="text-sm text-slate-500">Organize work by category</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreate} className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Create a tag" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400" required />
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500"><Plus size={16} /> Add tag</button>
        </form>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">Loading tags…</div>
        ) : tags.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">No tags yet.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-1 text-sm font-medium text-violet-700">{tag.name}</span>
                <button onClick={() => handleDelete(tag.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
