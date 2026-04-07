function formatTask(details, index) {
  const title = details?.[`task${index}Title`] || '';
  if (!title) return '';
  const method = details?.[`task${index}Method`] || '';
  const output = details?.[`task${index}Output`] || '';
  return `任务目标：${title}\n方法/工具：${method}\n输出/成果：${output}`.trim();
}

export function buildProposalMarkdown(details = {}, wbsTasks = []) {
  const lines = [];
  const addSection = (title, content) => {
    const clean = String(content || '').trim();
    if (!clean) return;
    lines.push(`## ${title}`, clean);
  };

  addSection('背景与意义', `${details.problem || ''}\n\n目标：${details.goals || ''}\n范围：${details.scope || ''}`.trim());
  addSection('研究方法', `${details.researchMethods || ''}\n${details.researchNotes || ''}`.trim());

  const innovationBlock = [
    details.innovation || '',
    details.innovationComparison ? `对比现有方案：${details.innovationComparison}` : '',
    details.innovationProof ? `验证方式：${details.innovationProof}` : ''
  ]
    .filter(Boolean)
    .join('\n');
  addSection('创新点', innovationBlock);
  addSection('我的方法', details.approach || '');
  addSection('任务一 / 实验一', formatTask(details, 1));
  addSection('任务二 / 实验二', formatTask(details, 2));

  if (wbsTasks.length) {
    lines.push(
      '## 任务规划清单',
      wbsTasks
        .map(task => {
          const output = task.output ? `（产出：${task.output}）` : '';
          return `- [${task.phase}] ${task.title}${output}`;
        })
        .join('\n')
    );
  }

  return lines.join('\n\n');
}
