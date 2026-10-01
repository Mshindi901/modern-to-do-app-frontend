import api from './axios.js';

const teamResourceRoutes = {
  projects: '/project/team',
  tasks: '/task/team',
  tags: '/tags/team',
  subtasks: '/sub-task/team',
  notes: '/notes/team',
  plans: '/plans/team',
};

async function getTeamResource(path, teamId) {
  try {
    return await api.get(`${path}/${teamId}`);
  } catch (error) {
    const body = error?.response?.data;
    const missingRoute = typeof body === 'string' && /Cannot GET \/api\//i.test(body);
    if (error?.response?.status === 404 && !missingRoute) {
      return { data: { data: [] } };
    }
    throw error;
  }
}

export async function getTeamWorkspace(teamId) {
  const entries = await Promise.all(Object.entries(teamResourceRoutes).map(async ([key, route]) => {
    const response = await getTeamResource(route, teamId);
    const records = response?.data?.data;
    return [key, Array.isArray(records) ? records : []];
  }));
  return Object.fromEntries(entries);
}