import { useEffect, useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { deleteNotification, getNotifications, getSocketServerUrl, markNotificationRead } from '../../api/notificationApi.js';
import { getTeam, getOwnedTeams, getUserTeamMemberships } from '../../api/teamApi.js';
import { getApiErrorMessage } from '../../api/axios.js';

function getRecords(response) {
  const records = response?.data?.data;
  return Array.isArray(records) ? records : [];
}

function getEntityLabel(entityType) {
  if (!entityType) return 'Related item';
  return entityType.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

async function getTeamNames() {
  const [ownedResponse, membershipResponse] = await Promise.all([
    getOwnedTeams().catch(() => ({ data: { data: [] } })),
    getUserTeamMemberships().catch(() => ({ data: { data: [] } })),
  ]);
  const teams = getRecords(ownedResponse);
  const teamIds = [...new Set(getRecords(membershipResponse).map((membership) => membership.team_id))];
  const missingTeams = await Promise.all(teamIds
    .filter((teamId) => !teams.some((team) => team.id === teamId))
    .map((teamId) => getTeam(teamId).then((response) => response?.data?.data).catch(() => null)));

  return Object.fromEntries([...teams, ...missingTeams.filter(Boolean)].map((team) => [team.id, team.name]));
}

export default function Notifications() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [teamNames, setTeamNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [notificationResult, namesResult] = await Promise.allSettled([
        getNotifications(),
        getTeamNames(),
      ]);

      if (!active) return;

      if (notificationResult.status === 'fulfilled') {
        setNotifications(getRecords(notificationResult.value).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setError('');
      } else if (notificationResult.reason?.response?.status === 404) {
        setNotifications([]);
      } else {
        setError(getApiErrorMessage(notificationResult.reason));
      }

      if (namesResult.status === 'fulfilled') setTeamNames(namesResult.value);
      setLoading(false);
    };

    load();
    const socket = io(getSocketServerUrl(), { auth: { token } });
    socket.on('new_notification', (notification) => {
      setNotifications((previous) => [
        notification,
        ...previous.filter((item) => item.id !== notification.id),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [token]);

  const handleMarkRead = async (notification) => {
    if (notification.is_read) return;
    try {
      await markNotificationRead(notification.id);
      setNotifications((previous) => previous.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((previous) => previous.filter((item) => item.id !== id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  return (
    <div className="min-h-screen bg-[#f8f7ff] px-4 py-5 text-slate-900 sm:px-7 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <button onClick={() => navigate('/app')} className="mb-6 text-sm font-medium text-violet-800 hover:text-violet-950">Back to tasks</button>
        <header className="mb-6 flex items-end justify-between gap-4 border-b border-violet-100 pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6242c7] text-[#e4ed59]"><Bell size={20} /></span>
            <div><h1 className="text-2xl font-semibold text-slate-950">Notifications</h1><p className="mt-1 text-sm text-slate-500">Personal and team activity</p></div>
          </div>
          <span className="shrink-0 text-sm text-slate-500">{unreadCount} unread</span>
        </header>

        {error && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {loading ? (
          <div className="border-y border-violet-100 py-12 text-center text-sm text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="border-y border-violet-100 py-14 text-center">
            <Bell size={22} className="mx-auto mb-3 text-violet-500" />
            <p className="font-medium text-slate-800">You're all caught up</p>
            <p className="mt-1 text-sm text-slate-500">New personal and team notifications will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-violet-100 border-y border-violet-100 bg-white">
            {notifications.map((notification) => (
              <article key={notification.id} className={`flex min-w-0 gap-3 px-4 py-4 sm:px-5 ${notification.is_read ? '' : 'bg-violet-50/60'}`}>
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.is_read ? 'bg-slate-200' : 'bg-[#6242c7]'}`} aria-label={notification.is_read ? 'Read' : 'Unread'} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <h2 className="wrap-break-word text-sm font-semibold text-slate-900">{notification.title}</h2>
                    <time className="shrink-0 text-xs text-slate-500" dateTime={notification.createdAt}>{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}</time>
                  </div>
                  <p className="mt-1 wrap-break-word text-sm leading-5 text-slate-600">{notification.message}</p>
                  <div className="mt-3 flex min-w-0 flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-4">
                    <span><span className="font-semibold text-slate-700">About:</span> {getEntityLabel(notification.entity_type)}</span>
                    <span className="break-all" title={notification.entity_id}><span className="font-semibold text-slate-700">Entity ID:</span> {notification.entity_id || 'Not specified'}</span>
                    {notification.team_id && <span className="break-all"><span className="font-semibold text-slate-700">Team:</span> {teamNames[notification.team_id] || notification.team_id}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-start gap-1">
                  {!notification.is_read && <button onClick={() => handleMarkRead(notification)} className="rounded-md p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700" aria-label="Mark as read" title="Mark as read"><Check size={16} /></button>}
                  <button onClick={() => handleDelete(notification.id)} className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700" aria-label="Delete notification" title="Delete notification"><Trash2 size={15} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}