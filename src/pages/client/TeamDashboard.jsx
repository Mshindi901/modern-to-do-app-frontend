import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarDays, Check, ChevronDown, CirclePlus, LogOut, Mail, Pencil, Plus, ShieldCheck, Users, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { addTeamMember, createTeam, getOwnedTeams, getTeam, getTeamMembers, getUserTeamMemberships, removeTeamMember, updateTeam, updateTeamMember } from '../../api/teamApi.js';
import { findUserByEmail } from '../../api/userApi.js';
import { getApiErrorMessage } from '../../api/axios.js';

const emptyTeamForm = { name: '', description: '' };

function getRecords(response) {
  const records = response?.data?.data;
  return Array.isArray(records) ? records : [];
}

async function fetchTeamList(userId) {
  const [ownedResponse, membershipResponse] = await Promise.all([
    getOwnedTeams().catch(() => ({ data: { data: [] } })),
    getUserTeamMemberships().catch(() => ({ data: { data: [] } })),
  ]);
  const ownedTeams = getRecords(ownedResponse);
  const memberships = getRecords(membershipResponse);
  const joinedTeamIds = [...new Set(memberships.map((membership) => membership.team_id))];
  const missingTeams = await Promise.all(joinedTeamIds
    .filter((teamId) => !ownedTeams.some((team) => team.id === teamId))
    .map((teamId) => getTeam(teamId).then((response) => response?.data?.data).catch(() => null)));

  return [...ownedTeams, ...missingTeams.filter(Boolean)].map((team) => ({
    ...team,
    memberRole: memberships.find((membership) => membership.team_id === team.id)?.role || (team.user_id === userId ? 'owner' : 'member'),
  }));
}

export default function TeamDashboard() {
  const navigate = useNavigate();
  const { id: routeTeamId } = useParams();
  const { user, logout } = useAuth();
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [membersTeamId, setMembersTeamId] = useState(null);
  const [activeTeam, setActiveTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [modal, setModal] = useState('');
  const [teamForm, setTeamForm] = useState(emptyTeamForm);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' });
  const [saving, setSaving] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState(null);

  const loadTeams = async () => {
    try {
      const allTeams = await fetchTeamList(user?.id);
      setTeams(allTeams);
      const selected = allTeams.find((team) => team.id === routeTeamId) || (!routeTeamId ? allTeams[0] : null);
      setActiveTeam(selected || null);
      if (selected && selected.id !== routeTeamId) navigate(`/app/teams/${selected.id}`, { replace: true });
    } catch (error) {
      setNotice({ type: 'error', message: getApiErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchTeamList(user?.id)
      .then((allTeams) => {
        if (!active) return;
        setTeams(allTeams);
        const selected = allTeams.find((team) => team.id === routeTeamId) || (!routeTeamId ? allTeams[0] : null);
        setActiveTeam(selected || null);
        if (selected && selected.id !== routeTeamId) navigate(`/app/teams/${selected.id}`, { replace: true });
      })
      .catch((error) => {
        if (active) setNotice({ type: 'error', message: getApiErrorMessage(error) });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate, routeTeamId, user?.id]);

  const activeTeamId = activeTeam?.id;
  useEffect(() => {
    let active = true;
    if (!activeTeamId) return undefined;
    getTeamMembers(activeTeamId)
      .then((response) => {
        if (active) {
          setMembers(getRecords(response));
          setMembersTeamId(activeTeamId);
        }
      })
      .catch((error) => {
        if (active) {
          setMembers([]);
          setMembersTeamId(activeTeamId);
          setNotice({ type: 'error', message: getApiErrorMessage(error) });
        }
      });
    return () => { active = false; };
  }, [activeTeamId]);

  const visibleMembers = membersTeamId === activeTeamId ? members : [];
  const membersLoading = Boolean(activeTeamId && membersTeamId !== activeTeamId);
  const isOwner = activeTeam?.user_id === user?.id;
  const currentMembership = visibleMembers.find((member) => member.user_id === user?.id);
  const canManageMembers = ['owner', 'admin'].includes(currentMembership?.role || activeTeam?.memberRole);
  const adminsCount = visibleMembers.filter((member) => member.role === 'admin' || member.role === 'owner').length;

  const openCreateTeam = () => {
    setTeamForm(emptyTeamForm);
    setModal('create');
  };

  const openEditTeam = () => {
    setTeamForm({ name: activeTeam?.name || '', description: activeTeam?.description || '' });
    setModal('edit');
  };

  const handleSaveTeam = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      if (modal === 'create') {
        await createTeam(teamForm);
        setModal('');
        await loadTeams();
        setNotice({ type: 'success', message: 'Team created.' });
      } else {
        await updateTeam(activeTeam.id, teamForm);
        setTeams((previous) => previous.map((team) => team.id === activeTeam.id ? { ...team, ...teamForm } : team));
        setActiveTeam((previous) => ({ ...previous, ...teamForm }));
        setModal('');
        setNotice({ type: 'success', message: 'Team details saved.' });
      }
    } catch (error) {
      setNotice({ type: 'error', message: getApiErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const response = await findUserByEmail(inviteForm.email.trim());
      const invitedUser = response?.data?.data;
      if (!invitedUser?.id) throw new Error('No account was found for that email address.');
      await addTeamMember({ user_id: invitedUser.id, team_id: activeTeam.id, role: inviteForm.role });
      setModal('');
      setInviteForm({ email: '', role: 'member' });
      const membersResponse = await getTeamMembers(activeTeam.id);
      setMembers(getRecords(membersResponse));
      setMembersTeamId(activeTeam.id);
      setNotice({ type: 'success', message: `${invitedUser.name || 'Member'} added to ${activeTeam.name}.` });
    } catch (error) {
      setNotice({ type: 'error', message: error?.message === 'No account was found for that email address.' ? error.message : getApiErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (member, role) => {
    try {
      await updateTeamMember(member.id, role);
      setMembers((previous) => previous.map((item) => item.id === member.id ? { ...item, role } : item));
      setNotice({ type: 'success', message: 'Member role updated.' });
    } catch (error) {
      setNotice({ type: 'error', message: getApiErrorMessage(error) });
    }
  };

  const handleRemoveMember = async (member) => {
    try {
      await removeTeamMember(member.id);
      setMembers((previous) => previous.filter((item) => item.id !== member.id));
      setPendingRemoval(null);
      setNotice({ type: 'success', message: member.user_id === user?.id ? 'You left the team.' : 'Member removed.' });
      if (member.user_id === user?.id) {
        await loadTeams();
        navigate('/app/teams', { replace: true });
      }
    } catch (error) {
      setNotice({ type: 'error', message: getApiErrorMessage(error) });
      setPendingRemoval(null);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f3f7f5] text-sm text-slate-500">Loading team space...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f3f7f5] text-slate-900 lg:flex">
      <aside className="flex w-full shrink-0 flex-col bg-[#153a32] text-white lg:min-h-screen lg:w-70">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <button onClick={() => navigate('/app')} className="flex items-center gap-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d9f36a] text-[#153a32]"><Building2 size={20} /></span>
            <span><span className="block text-sm font-semibold">Team spaces</span><span className="block text-xs text-emerald-100/60">The lazy / workspace</span></span>
          </button>
          <button onClick={() => navigate('/app')} className="rounded-lg p-2 text-emerald-100/70 hover:bg-white/10 hover:text-white" title="Back to personal tasks" aria-label="Back to personal tasks"><ArrowLeft size={18} /></button>
        </div>

        <div className="flex items-center justify-between px-5 pb-2 pt-6">
          <p className="text-[11px] font-semibold uppercase text-emerald-100/55">Your teams</p>
          <button onClick={openCreateTeam} className="rounded-md p-1.5 text-emerald-100 hover:bg-white/10" aria-label="Create team" title="Create team"><Plus size={17} /></button>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {teams.map((team) => (
            <button key={team.id} onClick={() => navigate(`/app/teams/${team.id}`)} className={`flex min-w-48 items-center gap-3 rounded-lg px-3 py-2.5 text-left transition lg:min-w-0 ${activeTeam?.id === team.id ? 'bg-white/12 text-white' : 'text-emerald-50/75 hover:bg-white/8 hover:text-white'}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#d9f36a]/15 text-[#d9f36a]"><Users size={16} /></span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{team.name}</span>
              <span className="text-[10px] capitalize text-emerald-100/55">{team.memberRole}</span>
            </button>
          ))}
          {teams.length === 0 && <p className="px-3 py-3 text-xs text-emerald-100/55">No team spaces yet.</p>}
        </nav>

        <div className="hidden space-y-1 border-t border-white/10 px-3 py-4 lg:mt-auto lg:block">
          <button onClick={() => navigate('/app')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-emerald-50/70 hover:bg-white/10 hover:text-white"><ArrowLeft size={16} /> Personal tasks</button>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-emerald-50/70 hover:bg-white/10 hover:text-white"><LogOut size={16} /> Sign out</button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-7 sm:py-7 lg:px-10">
        <div className="mx-auto max-w-6xl">
          {notice && <div role="status" className={`mb-5 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${notice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}><span>{notice.message}</span><button onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={15} /></button></div>}

          {!activeTeam ? (
            <section className="flex min-h-[65vh] flex-col items-center justify-center text-center">
              <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d9f36a] text-[#153a32]"><Users size={28} /></span>
              <p className="mb-2 text-xs font-semibold uppercase text-emerald-800">A shared space for your people</p>
              <h1 className="max-w-lg text-3xl font-semibold text-slate-900">Bring a team together.</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">Create a workspace, invite people who already use The lazy, and keep the right roles clear.</p>
              <button onClick={openCreateTeam} className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#153a32] px-4 py-3 text-sm font-semibold text-white hover:bg-[#205447]"><CirclePlus size={17} /> Create your first team</button>
            </section>
          ) : (
            <>
              <div className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-3 flex items-center gap-2 text-xs font-medium text-emerald-800"><span>Workspace</span><ChevronDown size={13} /><span className="capitalize">{activeTeam.memberRole}</span></div>
                  <h1 className="wrap-break-word text-3xl font-semibold text-slate-950">{activeTeam.name}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{activeTeam.description || 'A focused space for your team to coordinate and share ownership.'}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {isOwner && <button onClick={openEditTeam} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"><Pencil size={15} /> Edit details</button>}
                  {canManageMembers && <button onClick={() => setModal('invite')} className="inline-flex items-center gap-2 rounded-lg bg-[#153a32] px-3 py-2.5 text-sm font-medium text-white hover:bg-[#205447]"><Plus size={16} /> Invite member</button>}
                </div>
              </div>

              <div className="mb-7 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
                <div className="bg-white p-4 sm:p-5"><div className="mb-3 flex items-center justify-between text-xs text-slate-500"><span>People</span><Users size={16} className="text-emerald-800" /></div><strong className="text-2xl font-semibold">{membersLoading ? '...' : visibleMembers.length}</strong></div>
                <div className="bg-white p-4 sm:p-5"><div className="mb-3 flex items-center justify-between text-xs text-slate-500"><span>Admins & owners</span><ShieldCheck size={16} className="text-emerald-800" /></div><strong className="text-2xl font-semibold">{membersLoading ? '...' : adminsCount}</strong></div>
                <div className="bg-white p-4 sm:p-5"><div className="mb-3 flex items-center justify-between text-xs text-slate-500"><span>Your access</span><Building2 size={16} className="text-emerald-800" /></div><strong className="text-lg font-semibold capitalize">{currentMembership?.role || activeTeam.memberRole}</strong></div>
              </div>

              <div className="mb-5 flex items-center justify-between border-b border-slate-200">
                <div className="flex gap-5" role="tablist" aria-label="Team sections">
                  {['overview', 'members'].map((tab) => <button key={tab} role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={`border-b-2 px-1 pb-3 text-sm font-medium capitalize ${activeTab === tab ? 'border-[#205447] text-[#153a32]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{tab}</button>)}
                </div>
                {!isOwner && currentMembership && currentMembership.role !== 'owner' && <button onClick={() => setPendingRemoval(currentMembership)} className="mb-2 text-xs font-medium text-rose-700 hover:text-rose-900">Leave team</button>}
              </div>

              {activeTab === 'overview' ? (
                <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                  <section>
                    <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold">People</h2><p className="mt-1 text-sm text-slate-500">The people with access to this workspace.</p></div><button onClick={() => setActiveTab('members')} className="text-sm font-medium text-emerald-800 hover:text-emerald-950">View roster <span aria-hidden="true">-&gt;</span></button></div>
                    <MemberList members={visibleMembers.slice(0, 5)} currentUserId={user?.id} loading={membersLoading} />
                  </section>
                  <section className="border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <h2 className="mb-4 text-lg font-semibold">Workspace details</h2>
                    <dl className="divide-y divide-slate-200 border-y border-slate-200">
                      <div className="flex items-start justify-between gap-5 py-3"><dt className="text-sm text-slate-500">Created</dt><dd className="text-right text-sm font-medium">{activeTeam.createdAt ? new Date(activeTeam.createdAt).toLocaleDateString() : 'Recently'}</dd></div>
                      <div className="flex items-start justify-between gap-5 py-3"><dt className="text-sm text-slate-500">Workspace ID</dt><dd className="max-w-[60%] break-all text-right font-mono text-xs text-slate-600">{activeTeam.id}</dd></div>
                      <div className="flex items-start justify-between gap-5 py-3"><dt className="text-sm text-slate-500">Your role</dt><dd className="text-sm font-medium capitalize">{currentMembership?.role || activeTeam.memberRole}</dd></div>
                    </dl>
                    {isOwner && <p className="mt-4 text-xs leading-5 text-slate-500">As owner, you control team details and member access. Admins can help manage the roster.</p>}
                  </section>
                </div>
              ) : (
                <section>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-semibold">Member directory</h2><p className="mt-1 text-sm text-slate-500">{visibleMembers.length} {visibleMembers.length === 1 ? 'person has' : 'people have'} access.</p></div>{canManageMembers && <button onClick={() => setModal('invite')} className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Mail size={15} /> Add someone</button>}</div>
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="hidden grid-cols-[minmax(0,1fr)_140px_160px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase text-slate-500 sm:grid"><span>Member</span><span>Role</span><span>Joined</span></div>
                    {membersLoading ? <div className="p-8 text-center text-sm text-slate-500">Loading roster...</div> : visibleMembers.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No roster details available.</div> : visibleMembers.map((member) => (
                      <div key={member.id} className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_140px_160px] sm:items-center sm:gap-4">
                        <MemberIdentity member={member} currentUserId={user?.id} />
                        <div>{member.role === 'owner' ? <span className="inline-flex items-center gap-1.5 rounded-md bg-[#eaf2ed] px-2 py-1 text-xs font-semibold capitalize text-[#205447]"><ShieldCheck size={13} /> Owner</span> : canManageMembers ? <select value={member.role} onChange={(event) => handleRoleChange(member, event.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs capitalize outline-none focus:border-emerald-700" aria-label={`Role for ${member.user_id}`}><option value="member">Member</option><option value="admin">Admin</option></select> : <span className="text-sm capitalize text-slate-600">{member.role}</span>}</div>
                        <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={13} />{member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Recently'}</span>{canManageMembers && member.role !== 'owner' && <button onClick={() => setPendingRemoval(member)} className="text-xs font-medium text-rose-700 hover:text-rose-900">Remove</button>}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10241f]/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(''); }}>
          <section className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="team-modal-title">
            <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase text-emerald-800">{modal === 'invite' ? 'Team access' : 'Workspace'}</p><h2 id="team-modal-title" className="mt-1 text-xl font-semibold">{modal === 'create' ? 'Create a team' : modal === 'edit' ? 'Edit team details' : 'Invite a member'}</h2></div><button onClick={() => setModal('')} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close dialog"><X size={18} /></button></div>
            {modal === 'invite' ? <form onSubmit={handleInvite} className="space-y-4"><label className="block text-sm font-medium text-slate-700">Account email<input type="email" value={inviteForm.email} onChange={(event) => setInviteForm({ ...inviteForm, email: event.target.value })} placeholder="name@example.com" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-700" required /></label><label className="block text-sm font-medium text-slate-700">Role<select value={inviteForm.role} onChange={(event) => setInviteForm({ ...inviteForm, role: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-700"><option value="member">Member</option><option value="admin">Admin</option></select></label><p className="text-xs leading-5 text-slate-500">The person must already have a The lazy account. They will be added immediately.</p><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModal('')} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#153a32] px-4 py-2 text-sm font-medium text-white hover:bg-[#205447] disabled:opacity-60"><Mail size={15} />{saving ? 'Adding...' : 'Add member'}</button></div></form> : <form onSubmit={handleSaveTeam} className="space-y-4"><label className="block text-sm font-medium text-slate-700">Team name<input value={teamForm.name} onChange={(event) => setTeamForm({ ...teamForm, name: event.target.value })} maxLength={100} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-700" required /></label><label className="block text-sm font-medium text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span><textarea value={teamForm.description} onChange={(event) => setTeamForm({ ...teamForm, description: event.target.value })} maxLength={1000} rows={4} placeholder="What is this team working on?" className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-700" /></label><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModal('')} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#153a32] px-4 py-2 text-sm font-medium text-white hover:bg-[#205447] disabled:opacity-60"><Check size={15} />{saving ? 'Saving...' : modal === 'create' ? 'Create team' : 'Save changes'}</button></div></form>}
          </section>
        </div>
      )}

      {pendingRemoval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10241f]/55 p-4">
          <section className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="remove-member-title"><h2 id="remove-member-title" className="text-lg font-semibold">{pendingRemoval.user_id === user?.id ? 'Leave this team?' : 'Remove this member?'}</h2><p className="mt-2 text-sm leading-5 text-slate-500">{pendingRemoval.user_id === user?.id ? 'You will lose access to this workspace.' : 'This person will lose access to the workspace.'}</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setPendingRemoval(null)} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button><button onClick={() => handleRemoveMember(pendingRemoval)} className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-800">{pendingRemoval.user_id === user?.id ? 'Leave team' : 'Remove member'}</button></div></section>
        </div>
      )}
    </div>
  );
}

function MemberList({ members, currentUserId, loading }) {
  if (loading) return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading team...</div>;
  if (members.length === 0) return <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Your roster will appear here.</div>;
  return <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">{members.map((member) => <MemberIdentity key={member.id} member={member} currentUserId={currentUserId} compact />)}</div>;
}

function MemberIdentity({ member, currentUserId, compact = false }) {
  const isCurrentUser = member.user_id === currentUserId;
  const label = isCurrentUser ? 'You' : `Member ${member.user_id?.slice(0, 8) || ''}`;
  return <div className={`flex min-w-0 items-center gap-3 ${compact ? 'px-4 py-3' : ''}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf2ed] text-xs font-semibold uppercase text-[#205447]">{isCurrentUser ? 'You'.slice(0, 1) : (member.user_id?.slice(0, 1) || 'M')}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-800">{label}</span><span className="block truncate text-xs capitalize text-slate-500">{member.role}{isCurrentUser ? ' · signed in' : ''}</span></span></div>;
}