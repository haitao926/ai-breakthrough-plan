import { getLocalData } from './storage';

export function mapResearchMethod(method) {
  const map = {
    interview: '访谈',
    survey: '问卷',
    observation: '观察',
    data: '数据分析'
  };
  return map[method] || method;
}

export function getTeamMembersText(projectDetail) {
  const explicit = projectDetail?.project?.team_members;
  if (explicit) return explicit;
  const names = (projectDetail?.members || [])
    .map(member => member.name)
    .filter(Boolean);
  return names.length ? names.join('、') : '';
}

export function getProposalSources(projectId, projectDetail) {
  const charter = getLocalData(`ai_course_charter_${projectId}`) || {};
  const preResearch = getLocalData(`ai_course_pre_research_${projectId}`) || {};
  const literature = getLocalData(`ai_course_literature_${projectId}`) || {};
  if (!Array.isArray(preResearch.methods)) preResearch.methods = [];
  if (!Array.isArray(literature.papers)) literature.papers = [];
  const innovationData = getLocalData(`ai_course_innovation_${projectId}`) || {};
  const wbsData = getLocalData(`ai_course_wbs_${projectId}`) || {};
  if (!Array.isArray(wbsData.tasks)) wbsData.tasks = [];
  const teamMembers = getTeamMembersText(projectDetail);
  const deliverableType = charter.mode === 'research' ? 'research' : 'engineering';
  const innovation =
    innovationData.summary ||
    innovationData.comparison ||
    literature.notes ||
    preResearch.findings ||
    charter.projValue ||
    '';
  return {
    charter,
    preResearch,
    literature,
    innovationData,
    wbsData,
    teamMembers,
    deliverableType,
    innovation
  };
}

export function buildWbsTasks(sources) {
  const tasks = [];
  const seen = new Set();
  const add = (title, phase) => {
    const clean = String(title || '').trim();
    if (!clean || seen.has(clean)) return;
    seen.add(clean);
    tasks.push({ title: clean, phase });
  };

  const charter = sources.charter || {};
  const pre = sources.preResearch || {};
  const literature = sources.literature || {};
  const wbsData = sources.wbsData || {};

  const hasManualWbs = Array.isArray(wbsData.tasks) && wbsData.tasks.length > 0;
  if (hasManualWbs) {
    wbsData.tasks.forEach(item => {
      if (!item) return;
      add(item.title, item.phase || 'm1');
    });
  } else {
    if (charter.projPain || charter.projValue || pre.question) {
      add('明确问题与目标', 'm1');
    }

    if (literature.topic || (literature.papers || []).length) {
      add('文献阅读与关键结论整理', 'm1');
    }

    (pre.methods || []).forEach(method => {
      if (method === 'interview') {
        add('访谈与记录整理', 'm1');
      } else if (method === 'survey') {
        add('问卷设计与数据分析', 'm1');
      } else if (method === 'observation') {
        add('观察记录与结论提炼', 'm1');
      } else if (method === 'data') {
        add('数据采集与分析', 'm1');
      }
    });

    if (sources.innovation) {
      add('创新点对比与验证', 'm1');
    }

    if (charter.projSolution) {
      add('确定技术路线与方案设计', 'm2');
    }

    add('原型/系统设计', 'm2');
    add('核心实现或实验执行', 'm3');
    add('实验验证与结果分析', 'm3');
  }

  if (sources.deliverableType === 'research') {
    add('整理过程图片/实验记录', 'm3');
    add('项目报告撰写与排版', 'm3');
  } else {
    add('演示脚本设计', 'm3');
    add('演示视频录制与剪辑', 'm3');
    add('代码/原型整理归档', 'm3');
  }

  return tasks;
}

export function buildProposalStatus(projectId, projectDetail) {
  if (!projectId) {
    return {
      ready: false,
      missing: ['请选择项目'],
      items: [],
      wbsTasks: [],
      planText: ''
    };
  }
  const sources = getProposalSources(projectId, projectDetail);
  const charter = sources.charter;
  const pre = sources.preResearch;
  const literature = sources.literature;
  const innovationData = sources.innovationData || {};
  const wbsData = sources.wbsData || {};

  const missing = [];
  const problemParts = [];
  if (charter.projPain) problemParts.push(charter.projPain);
  if (pre.question) problemParts.push(pre.question);
  if (pre.findings) problemParts.push(pre.findings);
  const problem = problemParts.join('\n');

  const goals = charter.projValue || '';
  const scope = pre.plan || pre.nextSteps || '';
  const approach = charter.projSolution || '';
  const teamMembers = sources.teamMembers || '';

  const hasManualWbs = Array.isArray(wbsData.tasks) && wbsData.tasks.length > 0;
  const wbsTasks = buildWbsTasks(sources);
  const validWbsCount = hasManualWbs ? wbsTasks.length : 0;

  const charterMissing = [];
  if (!charter.projName) charterMissing.push('项目名称');
  if (!charter.projValue) charterMissing.push('项目目标');
  if (!(charter.projPain || charter.projPersona)) charterMissing.push('问题/用户画像');

  const researchMissing = [];
  if (!pre.question) researchMissing.push('调研问题');
  if (!Array.isArray(pre.methods) || !pre.methods.length) researchMissing.push('调研方式');
  if (!pre.findings) researchMissing.push('关键发现');
  if (!pre.plan && !pre.nextSteps) researchMissing.push('调研计划/下一步');

  const literatureMissing = [];
  if (!literature.topic) literatureMissing.push('阅读主题');
  if (!((literature.papers || []).length || literature.notes)) {
    literatureMissing.push('至少 1 篇文献或阅读笔记');
  }

  const innovationMissing = [];
  if (!innovationData.summary) innovationMissing.push('创新点描述');
  if (!innovationData.proof) innovationMissing.push('验证方式');

  const approachMissing = [];
  if (!charter.projSolution) approachMissing.push('技术路线');

  const teamMissing = [];
  if (!teamMembers) teamMissing.push('团队成员');

  const wbsMissing = [];
  if (validWbsCount < 5) wbsMissing.push(`任务数量不足（${validWbsCount}/5）`);

  const items = [
    {
      key: 'charter',
      label: '完成立项书梳理',
      desc: '在立项书里填写问题、目标与技术方案',
      done: charterMissing.length === 0,
      detail: charterMissing.length ? `缺：${charterMissing.join('、')}` : '',
      action: 'charter'
    },
    {
      key: 'research',
      label: '完成前期调研',
      desc: '至少选择一种调研方式并输出发现',
      done: researchMissing.length === 0,
      detail: researchMissing.length ? `缺：${researchMissing.join('、')}` : '',
      action: 'pre_research'
    },
    {
      key: 'literature',
      label: '完成文献阅读',
      desc: '记录主题与关键文献',
      done: literatureMissing.length === 0,
      detail: literatureMissing.length ? `缺：${literatureMissing.join('、')}` : '',
      action: 'literature'
    },
    {
      key: 'innovation',
      label: '创新点梳理',
      desc: '明确创新点与验证方式',
      done: innovationMissing.length === 0,
      detail: innovationMissing.length ? `缺：${innovationMissing.join('、')}` : '',
      action: 'innovation'
    },
    {
      key: 'approach',
      label: '技术路线明确',
      desc: '在立项书里补充技术方案',
      done: approachMissing.length === 0,
      detail: approachMissing.length ? `缺：${approachMissing.join('、')}` : '',
      action: 'charter'
    },
    {
      key: 'team',
      label: '团队成员确认',
      desc: '项目成员已完善',
      done: teamMissing.length === 0,
      detail: teamMissing.length ? `缺：${teamMissing.join('、')}` : '',
      action: 'projects'
    },
    {
      key: 'wbs',
      label: 'WBS 拆解完成',
      desc: '至少拆解 5 条任务',
      done: validWbsCount >= 5,
      detail: wbsMissing.length ? `缺：${wbsMissing.join('、')}` : '',
      action: 'wbs'
    }
  ];

  items.forEach(item => {
    if (!item.done) missing.push(item.label);
  });

  const ready = items.every(item => item.done);

  const details = {
    problem,
    goals,
    scope,
    approach,
    plan: buildPlanText(wbsTasks),
    teamMembers,
    innovation: innovationData.summary || sources.innovation,
    innovationComparison: innovationData.comparison || '',
    innovationProof: innovationData.proof || '',
    researchMethods: Array.isArray(pre.methods) ? pre.methods.map(mapResearchMethod).join('、') : '',
    researchNotes: pre.findings || pre.questions || '',
    deliverableType: sources.deliverableType
  };

  return {
    ready,
    missing,
    items,
    details,
    wbsTasks,
    planText: details.plan
  };
}

export function buildPlanText(tasks) {
  if (!tasks.length) return '';
  const phaseMap = { m1: '立项', m2: '实施', m3: '结题' };
  return tasks.map(task => `- [${phaseMap[task.phase] || task.phase}] ${task.title}`).join('\n');
}
