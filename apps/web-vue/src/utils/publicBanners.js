const bannerCatalog = {
  projects_focus: {
    tag: '栏目介绍',
    title: '项目库',
    summary: '先看作品、原型和课题，再决定要深入的方向。',
    highlights: ['项目地图'],
    image: '/assets/banners/banner-projects.png',
    targetUrl: '/projects',
    buttonText: '进入项目页',
    layout: 'center'
  },
  projects_topics: {
    tag: '推荐课题',
    title: '课题切口',
    summary: '先从真实问题入口判断有没有想做的点。',
    highlights: ['课题切口'],
    image: '/assets/banners/banner-projects-topics.png',
    targetUrl: '/projects?category=teacher_topics',
    buttonText: '查看课题'
  },
  projects_showcase: {
    tag: '推荐作品',
    title: '成果样例',
    summary: '先看已经完成的作品，再判断自己想做什么。',
    highlights: ['成果样例'],
    image: '/assets/banners/banner-projects-showcase.png',
    targetUrl: '/showcase',
    buttonText: '查看作品'
  },
  knowledge_focus: {
    tag: '栏目介绍',
    title: '创新知识库',
    summary: '这里只讲问题、研究线索和方向索引。',
    highlights: ['问题地图'],
    image: '/assets/banners/banner-knowledge.png',
    targetUrl: '/knowledge',
    buttonText: '进入知识库',
    layout: 'center'
  },
  knowledge_research: {
    tag: '推荐线索',
    title: '研究线索',
    summary: '把笔记、图表和现象线索整理成可研究的入口。',
    highlights: ['研究线索'],
    image: '/assets/banners/banner-knowledge-research.png',
    targetUrl: '/knowledge',
    buttonText: '查看线索'
  },
  knowledge_clues: {
    tag: '推荐方向',
    title: '方向索引',
    summary: '把主题与学科方向整理成一眼能浏览的索引。',
    highlights: ['方向索引'],
    image: '/assets/banners/banner-knowledge-clues.png',
    targetUrl: '/knowledge',
    buttonText: '查看方向'
  },
  downloads_focus: {
    tag: '栏目介绍',
    title: '课程库',
    summary: '课程、课堂任务、讲义代码和资料都集中在这里。',
    highlights: ['课程路径'],
    image: '/assets/banners/banner-courses.png',
    targetUrl: '/downloads',
    buttonText: '进入课程库',
    layout: 'center'
  },
  downloads_practice: {
    tag: '推荐内容',
    title: '课堂任务',
    summary: '直接看动手任务、步骤和实践器材。',
    highlights: ['课堂任务'],
    image: '/assets/banners/banner-courses-practice.png',
    targetUrl: '/downloads',
    buttonText: '查看任务'
  },
  downloads_materials: {
    tag: '推荐内容',
    title: '资料索引',
    summary: '把讲义、代码、数据与参考资料集中到同一入口。',
    highlights: ['资料索引'],
    image: '/assets/banners/banner-courses-materials.png',
    targetUrl: '/downloads',
    buttonText: '查看资料'
  },
  competitions_focus: {
    tag: '栏目介绍',
    title: '竞赛活动',
    summary: '先看匹配度、展示场景和活动门槛，再决定要不要投入准备。',
    highlights: ['活动地图'],
    image: '/assets/banners/banner-competitions.png',
    targetUrl: '/competitions',
    buttonText: '进入活动页',
    layout: 'center'
  },
  competitions_stage: {
    tag: '推荐内容',
    title: '展示场景',
    summary: '把作品放进真实的展示、演示与挑战环境里看。',
    highlights: ['展示场景'],
    image: '/assets/banners/banner-competitions-stage.png',
    targetUrl: '/competitions',
    buttonText: '查看场景'
  },
  competitions_match: {
    tag: '推荐内容',
    title: '报名判断',
    summary: '先看时间、门槛和方向是否匹配，再决定要不要投入。',
    highlights: ['报名判断'],
    image: '/assets/banners/banner-competitions-match.png',
    targetUrl: '/competitions',
    buttonText: '查看匹配'
  }
};

const pageBannerSets = {
  home: [
    bannerCatalog.projects_focus,
    bannerCatalog.knowledge_focus,
    bannerCatalog.downloads_focus,
    bannerCatalog.competitions_focus
  ],
  projects: [
    bannerCatalog.projects_focus,
    bannerCatalog.projects_topics,
    bannerCatalog.projects_showcase
  ],
  knowledge: [
    bannerCatalog.knowledge_focus,
    bannerCatalog.knowledge_research,
    bannerCatalog.knowledge_clues
  ],
  downloads: [
    bannerCatalog.downloads_focus,
    bannerCatalog.downloads_practice,
    bannerCatalog.downloads_materials
  ],
  competitions: [
    bannerCatalog.competitions_focus,
    bannerCatalog.competitions_stage,
    bannerCatalog.competitions_match
  ]
};

export function getPageBannerItems(page = 'home') {
  return (pageBannerSets[page] || pageBannerSets.home).map(item => ({ ...item }));
}

export function getBannerItem(key) {
  return bannerCatalog[key] ? { ...bannerCatalog[key] } : null;
}
