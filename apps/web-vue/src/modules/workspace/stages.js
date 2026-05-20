export const STAGE_CONFIG = {
  proposal: {
    title: '开题报告',
    desc: '先按模板整理，再上传材料或在平台内补充。',
    fields: [
      { name: 'templateRef', label: '模板名称/版本（可选）', type: 'input', required: false, placeholder: '例如：开题模板 v1' },
      { name: 'notes', label: '补充说明（可选）', type: 'textarea', required: false, placeholder: '如果材料已在本地整理，可写上传说明。' }
    ]
  },
  milestone_1: {
    title: '里程碑 1：启动与首轮提交',
    desc: '先按模板整理，再上传过程材料。',
    fields: [
      { name: 'templateRef', label: '模板名称/版本（可选）', type: 'input', required: false, placeholder: '例如：里程碑模板 v1' },
      { name: 'progressSummary', label: '本次完成内容', type: 'textarea', required: true },
      { name: 'coreContribution', label: '核心贡献（你做了什么）', type: 'textarea', required: true },
      { name: 'evidence', label: '证据链接/图片/视频（可选）', type: 'textarea', required: false },
      { name: 'diagram', label: '流程图/架构图（可选）', type: 'textarea', required: false },
      { name: 'nextPlan', label: '下一步计划（可选）', type: 'textarea', required: false },
      {
        name: 'codeRepo',
        label: '代码仓库链接（Gitea）',
        type: 'input',
        required: true,
        placeholder: 'https://gitea.example.com/user/repo'
      },
      {
        name: 'codeCommit',
        label: '本次提交说明 / Commit ID',
        type: 'input',
        required: true,
        placeholder: '例如：feat: 完成xxx 或 commit hash'
      }
    ]
  },
  milestone_2: {
    title: '里程碑 2：功能完善与验证',
    desc: '先整理结果，再上传验证材料。',
    fields: [
      { name: 'templateRef', label: '模板名称/版本（可选）', type: 'input', required: false, placeholder: '例如：验收模板 v1' },
      { name: 'featureSummary', label: '功能完成情况', type: 'textarea', required: true },
      { name: 'validation', label: '实验/测试验证与结果', type: 'textarea', required: true },
      { name: 'coreContribution', label: '核心贡献（你做了什么）', type: 'textarea', required: true },
      { name: 'evidence', label: '证据链接/图片/视频（可选）', type: 'textarea', required: false },
      { name: 'diagram', label: '流程图/架构图（可选）', type: 'textarea', required: false },
      {
        name: 'demoLink',
        label: '演示链接（可选）',
        type: 'input',
        required: false,
        placeholder: 'https://...'
      },
      {
        name: 'codeRepo',
        label: '代码仓库链接（Gitea）',
        type: 'input',
        required: true,
        placeholder: 'https://gitea.example.com/user/repo'
      },
      {
        name: 'codeCommit',
        label: '本次提交说明 / Commit ID',
        type: 'input',
        required: true,
        placeholder: '例如：feat: 完成xxx 或 commit hash'
      }
    ]
  },
  midterm: {
    title: '中期检查',
    desc: '按中期模板整理后上传，平台也可补充填写。',
    fields: [
      { name: 'templateRef', label: '模板名称/版本（可选）', type: 'input', required: false, placeholder: '例如：中期模板 v1' },
      { name: 'progressCompare', label: '计划 vs 现状', type: 'textarea', required: true },
      { name: 'issuesAdjust', label: '问题与调整', type: 'textarea', required: true },
      {
        name: 'demoLink',
        label: '演示链接（可选）',
        type: 'input',
        required: false,
        placeholder: 'https://...'
      },
      { name: 'evidence', label: '证据链接/图片/视频（可选）', type: 'textarea', required: false },
      {
        name: 'codeRepo',
        label: '代码仓库链接（Gitea）',
        type: 'input',
        required: true,
        placeholder: 'https://gitea.example.com/user/repo'
      },
      {
        name: 'codeCommit',
        label: '本次提交说明 / Commit ID',
        type: 'input',
        required: true,
        placeholder: '例如：feat: 完成xxx 或 commit hash'
      }
    ]
  },
  final: {
    title: '结题答辩',
    desc: '先按结题模板整理，再上传成果包。',
    fields: [
      { name: 'templateRef', label: '模板名称/版本（可选）', type: 'input', required: false, placeholder: '例如：结题模板 v1' },
      { name: 'deliverables', label: '成果包清单（报告/视频/代码等）', type: 'textarea', required: true },
      { name: 'demo', label: '演示说明/演示视频链接', type: 'textarea', required: true },
      { name: 'techSummary', label: '技术总结/关键实现', type: 'textarea', required: true },
      { name: 'reflection', label: '反思与展望', type: 'textarea', required: true },
      { name: 'validation', label: '实验验证与结果分析', type: 'textarea', required: false },
      { name: 'discussion', label: '讨论与展望补充', type: 'textarea', required: false },
      {
        name: 'codeRepo',
        label: '代码仓库链接（Gitea）',
        type: 'input',
        required: true,
        placeholder: 'https://gitea.example.com/user/repo'
      },
      {
        name: 'codeCommit',
        label: '本次提交说明 / Commit ID',
        type: 'input',
        required: true,
        placeholder: '例如：release: v1.0 或 commit hash'
      }
    ]
  }
};

export const DEFAULT_STAGE_CONFIG = {
  title: '提交材料',
  desc: '可直接上传阶段材料，也可补充说明。',
  fields: [
    { name: 'templateRef', label: '模板名称/版本（可选）', type: 'input', required: false, placeholder: '例如：阶段模板 v1' },
    { name: 'content', label: '补充说明', type: 'textarea', required: false }
  ]
};

export function getStageConfig(stageKey) {
  return STAGE_CONFIG[stageKey] || DEFAULT_STAGE_CONFIG;
}

export function isValidRepoUrl(repo) {
  if (!repo) return true;
  const value = String(repo).trim();
  if (!value) return true;
  return /^https?:\/\//i.test(value) || /^git@.+:.+/.test(value) || /^ssh:\/\//i.test(value);
}

export function validateStageDetails(stageKey, details, proposalStatus) {
  if (stageKey === 'proposal') {
    if (!proposalStatus?.ready && !(details?.content || details?.templateRef || details?.notes || details?.uploadedMaterials)) {
      return '请先准备开题材料、模板或上传文件';
    }
    return null;
  }

  const config = getStageConfig(stageKey);
  if ((stageKey === 'midterm' || stageKey === 'final' || stageKey === 'milestone_1' || stageKey === 'milestone_2')) {
    const missingCodeFields = (config.fields || [])
      .filter(field => ['codeRepo', 'codeCommit'].includes(field.name))
      .filter(field => !String(details?.[field.name] || '').trim());
    if (missingCodeFields.length) {
      return `请填写：${missingCodeFields.map(field => field.label).join('、')}`;
    }
  }

  if (!details?.uploadedMaterials) {
    const required = (config.fields || []).filter(field => field.required);
    const missing = required.filter(field => !String(details?.[field.name] || '').trim());
    if (missing.length) {
      return `请填写：${missing.map(field => field.label).join('、')}，或直接上传已填写模板`;
    }
  }

  if (stageKey === 'midterm' && details?.demoLink && !/^https?:\/\//i.test(details.demoLink)) {
    return '演示链接必须以 http(s) 开头';
  }

  if (details?.codeRepo && !isValidRepoUrl(details.codeRepo)) {
    return '代码仓库链接需为 http(s) 或 git@/ssh 格式';
  }

  if ((stageKey === 'midterm' || stageKey === 'final' || stageKey === 'milestone_1' || stageKey === 'milestone_2') &&
      !(details?.templateRef || details?.content || details?.notes || details?.uploadedMaterials || details?.evidence)) {
    return '请先整理模板或上传对应材料';
  }

  return null;
}
