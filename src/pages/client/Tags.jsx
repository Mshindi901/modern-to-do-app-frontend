import { useEffect, useState } from 'react';
import { Tags as TagIcon, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserTags, createTag, deleteTag } from '../../api/tagApi.js';
import { getApiErrorMessage } from '../../api/axios.js';

export default function Tags() {
  const navigate = useNavigate();
  const [tags, setTags] = useState([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6242c7');
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
      await createTag({ name, color });
      setName('');
      setColor('#6242c7');
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
    <div className="min-h-screen bg-[#f8f7ff] px-4 py-5 text-slate-900 sm:px-7 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <button onClick={() => navigate('/app')} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-violet-800 hover:text-violet-950"><ArrowLeft size={16} /> Personal dashboard</button>
        <div className="mb-8 flex flex-col gap-4 border-b border-violet-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6242c7] text-[#e4ed59]"><TagIcon size={21} /></div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-violet-700">A little order goes a long way</p>
              <h1 className="text-3xl font-semibold text-slate-950">Tags</h1>
              <p className="mt-1 text-sm text-slate-500">Use color to make related tasks easy to spot.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start rounded-lg border border-violet-100 bg-white px-3 py-2.5 sm:self-auto"><span className="h-2.5 w-2.5 rounded-full bg-[#e4ed59] ring-2 ring-violet-100" /><span className="text-xl font-semibold">{tags.length}</span><span className="text-sm text-slate-500">tags</span></div>
        </div>

        <form onSubmit={handleCreate} className="mb-8 border-b border-violet-100 pb-8">
          <label htmlFor="tag-name" className="mb-2 block text-sm font-medium text-slate-700">Create a tag</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input id="tag-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="For example, Research" className="min-w-0 flex-1 rounded-lg border border-violet-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" required />
            <label className="flex items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-600">Color<input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-9 cursor-pointer rounded-md border-0 bg-transparent p-0" aria-label="Tag color" /></label>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#6242c7] px-4 py-3 text-sm font-semibold text-white hover:bg-[#5032ae]"><Plus size={16} /> Create tag</button>
          </div>
        </form>

        {loading ? (
          <div className="border-y border-violet-100 py-10 text-center text-sm text-slate-500">Loading tags...</div>
        ) : tags.length === 0 ? (
          <div className="border-y border-violet-100 py-12 text-center"><span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><TagIcon size={20} /></span><p className="font-medium text-slate-800">No tags yet</p><p className="mt-1 text-sm text-slate-500">Create your first tag above to start organizing tasks.</p></div>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Your tags</h2><span className="text-xs text-slate-500">{tags.length} total</span></div>
            <div className="divide-y divide-violet-100 border-y border-violet-100 bg-white">
            {tags.map((tag) => (
              <div key={tag.id} className="flex min-w-0 items-center justify-between gap-3 px-3 py-3 transition hover:bg-violet-50/50 sm:px-4">
                <div className="flex min-w-0 items-center gap-3"><span className="h-4 w-4 shrink-0 rounded-sm ring-4 ring-[#e4ed59]/45" style={{ backgroundColor: tag.color || '#6242c7' }} /><span className="truncate text-sm font-medium text-slate-800">{tag.name}</span><span className="hidden rounded-md bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700 sm:inline">Tag</span></div>
                <button onClick={() => handleDelete(tag.id)} className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700" aria-label={`Delete tag ${tag.name}`} title="Delete tag"><Trash2 size={15} /></button>
              </div>
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
