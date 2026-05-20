export const courseSections = [
  {
    id: 'foundation',
    label: '公共基础',
    title: '公共基础课程',
    desc: '研究方法、协作规范与共同学习底座',
    accent: 'bg-slate-900',
    icon: 'fa-graduation-cap',
    gradient: 'from-slate-800 to-slate-600'
  },
  {
    id: 'science',
    label: '理科',
    title: '理科方向课程',
    desc: '模型理解、实验探究与学术方法',
    accent: 'bg-emerald-600',
    icon: 'fa-flask',
    gradient: 'from-emerald-600 to-teal-500'
  },
  {
    id: 'engineering',
    label: '工科',
    title: '工科方向课程',
    desc: '编程、系统实现与硬件工程实践',
    accent: 'bg-indigo-600',
    icon: 'fa-microchip',
    gradient: 'from-indigo-600 to-blue-500'
  },
  {
    id: 'social',
    label: '社科',
    title: '社科方向课程',
    desc: '用户洞察、社会研究与方案设计',
    accent: 'bg-rose-500',
    icon: 'fa-comments',
    gradient: 'from-rose-500 to-pink-500'
  },
  {
    id: 'humanities',
    label: '人文',
    title: '人文方向课程',
    desc: '叙事表达、文化理解与设计素养',
    accent: 'bg-amber-500',
    icon: 'fa-feather-pointed',
    gradient: 'from-amber-500 to-orange-400'
  },
  {
    id: 'capstone',
    label: '综合实践',
    title: '综合实践课程',
    desc: '多能力整合、成果展示与项目孵化',
    accent: 'bg-violet-600',
    icon: 'fa-rocket',
    gradient: 'from-violet-600 to-indigo-600'
  }
];

export const courseFilters = [
  { id: 'all', label: '全部' },
  ...courseSections.map(section => ({ id: section.id, label: section.label }))
];

export const materialSections = [
  {
    id: '课程导学',
    title: '课程导学',
    description: '课程介绍、导学说明和整体学习路径。',
    icon: 'fa-compass',
    badge: 'bg-indigo-50 text-indigo-600 border-indigo-100'
  },
  {
    id: '教师资料',
    title: '教师资料',
    description: '教师讲授、组织课堂与备课使用的材料。',
    icon: 'fa-chalkboard-teacher',
    badge: 'bg-amber-50 text-amber-600 border-amber-100'
  },
  {
    id: '学生资料',
    title: '学生资料',
    description: '学生学习、阅读与课后使用的核心资料。',
    icon: 'fa-user-graduate',
    badge: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  },
  {
    id: '补充资料',
    title: '补充资料',
    description: '延伸阅读、案例、视频与其他辅助材料。',
    icon: 'fa-sparkles',
    badge: 'bg-slate-50 text-slate-600 border-slate-200'
  }
];

const directionVisuals = {
  foundation: {
    cover: '/course-covers/foundation.svg',
    eyebrow: 'Method Base'
  },
  science: {
    cover: '/course-covers/science.svg',
    eyebrow: 'Lab Track'
  },
  engineering: {
    cover: '/course-covers/engineering.svg',
    eyebrow: 'Build Track'
  },
  social: {
    cover: '/course-covers/social.svg',
    eyebrow: 'Insight Track'
  },
  humanities: {
    cover: '/course-covers/humanities.svg',
    eyebrow: 'Story Track'
  },
  capstone: {
    cover: '/course-covers/capstone.svg',
    eyebrow: 'Launch Track'
  }
};

const courseVisuals = {
  'common': {
    cover: '/course-covers/common.png',
    eyebrow: 'Foundation'
  },
  'project1': {
    cover: '/course-covers/project1.png',
    eyebrow: 'Vibe Coding'
  },
  'project2': {
    cover: '/course-covers/project2.png',
    eyebrow: 'Product Design'
  },
  'project3': {
    cover: '/course-covers/project3.png',
    eyebrow: 'Web Fullstack'
  },
  'project4': {
    cover: '/course-covers/project4.png',
    eyebrow: 'AI & ML'
  },
  'project5': {
    cover: '/course-covers/project5.png',
    eyebrow: 'IoT Hardware'
  },
  'project6': {
    cover: '/course-covers/project6.png',
    eyebrow: 'Capstone Startup'
  },
  'robotics-club': {
    cover: '/course-covers/robotics-club.png',
    eyebrow: 'Robotics Club'
  },
  'maker-camp': {
    cover: '/course-covers/maker-camp.png',
    eyebrow: 'Maker Camp'
  },
  'ros2-training-robot': {
    cover: '/course-covers/ros2-training-robot.png',
    eyebrow: 'ROS2 Track'
  }
};

export function getCourseSection(direction) {
  return courseSections.find(section => section.id === direction) || courseSections[0];
}

export function getDirectionLabel(direction) {
  return getCourseSection(direction).label;
}

export function getMaterialSection(sectionId) {
  return materialSections.find(section => section.id === sectionId) || materialSections[materialSections.length - 1];
}

export function getCourseVisual(courseId, direction) {
  if (courseId && courseVisuals[courseId]) return courseVisuals[courseId];
  return directionVisuals[direction] || directionVisuals.foundation;
}
