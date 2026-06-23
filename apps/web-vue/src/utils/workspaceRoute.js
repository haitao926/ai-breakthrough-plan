const STAGE_KEYS = new Set(['proposal', 'milestone_1', 'midterm', 'milestone_2', 'final']);
const PANEL_ROUTE_SEGMENTS = {
  kanban: 'kanban',
  devlog: 'devlog',
  architect: 'architect',
  inception: 'project',
  charter: 'charter',
  pre_research: 'pre-research',
  literature: 'literature',
  innovation: 'innovation'
};

const STAGE_ROUTE_SEGMENTS = {
  proposal: 'proposal',
  milestone_1: 'milestone-1',
  midterm: 'midterm',
  milestone_2: 'milestone-2',
  final: 'final'
};

export function buildWorkspaceBase(projectId) {
  if (!projectId) return { path: '/my' };
  return { path: `/my/project/${encodeURIComponent(String(projectId))}` };
}

export function buildWorkspacePanelRoute(projectId, panel, extraQuery = {}) {
  const base = buildWorkspaceBase(projectId);
  if (!projectId || !panel) {
    return { ...base, query: { ...extraQuery } };
  }

  if (STAGE_KEYS.has(panel)) {
    const stageSegment = STAGE_ROUTE_SEGMENTS[panel] || encodeURIComponent(String(panel));
    return {
      path: `${base.path}/submit/${stageSegment}`,
      query: { ...extraQuery }
    };
  }

  const panelSegment = PANEL_ROUTE_SEGMENTS[panel] || `panel/${encodeURIComponent(String(panel))}`;
  return {
    path: `${base.path}/${panelSegment}`,
    query: { ...extraQuery }
  };
}

export function buildWorkspaceCreateRoute(extraQuery = {}) {
  return {
    path: '/my',
    query: {
      create: 'true',
      ...extraQuery
    }
  };
}

export function buildLegacyWorkspaceQuery(projectId, panel) {
  const query = {};
  if (projectId) query.project = String(projectId);
  if (panel) {
    if (STAGE_KEYS.has(panel)) query.stage = panel;
    else query.panel = panel;
  }
  return query;
}

export function getWorkspacePanelBySegment(segment = '') {
  const safeSegment = String(segment || '').trim();
  const stageEntry = Object.entries(STAGE_ROUTE_SEGMENTS).find(([, value]) => value === safeSegment);
  if (stageEntry) {
    return { panel: stageEntry[0], stageKey: stageEntry[0], kind: 'stage' };
  }
  const panelEntry = Object.entries(PANEL_ROUTE_SEGMENTS).find(([, value]) => value === safeSegment);
  if (panelEntry) {
    return { panel: panelEntry[0], stageKey: null, kind: 'panel' };
  }
  return null;
}
