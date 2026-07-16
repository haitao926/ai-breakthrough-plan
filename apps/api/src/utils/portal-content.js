function createPortalContentService(options) {
  const {
    path,
    readJsonFile,
    writeJsonFile,
    normalizeTaxonomyArray,
    normalizeTaxonomyValue,
    getActiveTaxonomyIndex,
    normalizeJsonArray,
    loadCourseCatalog,
    getCompetitionRegistrationStats,
    portalCompetitionsPath,
    portalCompetitionDetailsDir,
    portalStoriesPath,
    portalBannersPath,
    competitionPublishStatuses
  } = options;

  function normalizeStringArray(value) {
    if (!Array.isArray(value)) return [];
    return Array.from(new Set(value.map(item => String(item || '').trim()).filter(Boolean)));
  }

  function normalizeNullableText(value) {
    const text = String(value || '').trim();
    return text || '';
  }

  function normalizeNullableNumber(value, fallback = null) {
    if (value === null || value === undefined || value === '') return fallback;
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function resolveUnder(root, ...segments) {
    try {
      const normalizedSegments = segments.map(segment => String(segment || '').replace(/\\/g, '/'));
      const unsafeSegment = normalizedSegments
        .flatMap(segment => segment.split('/'))
        .some(part => !part || part === '.' || part === '..' || part.includes('\0'));
      if (unsafeSegment) return null;
      const rootPath = path.resolve(root);
      const candidate = path.resolve(rootPath, ...normalizedSegments);
      const relative = path.relative(rootPath, candidate);
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
      return candidate;
    } catch (_error) {
      return null;
    }
  }

  function normalizeBannerPageKey(value) {
    const pageKey = String(value || 'home').trim() || 'home';
    return pageKey === 'downloads' ? 'courses' : pageKey;
  }

  function loadPortalCompetitions() {
    const data = readJsonFile(portalCompetitionsPath, []);
    if (!Array.isArray(data)) return [];
    const taxonomyIndex = getActiveTaxonomyIndex();
    return data.map(item => ({
      title: String(item.title || '').trim(),
      slug: String(item.slug || '').trim(),
      tagline: String(item.tagline || '').trim(),
      tier: String(item.tier || '').trim(),
      banner: String(item.banner || '').trim(),
      discipline: normalizeTaxonomyArray(item.discipline, ['discipline'], taxonomyIndex),
      schoolStage: normalizeTaxonomyArray(item.schoolStage, ['stage'], taxonomyIndex),
      status: String(item.status || '').trim(),
      dateRange: String(item.dateRange || '').trim(),
      fitSummary: String(item.fitSummary || '').trim(),
      whyJoin: String(item.whyJoin || '').trim(),
      prepAdvice: String(item.prepAdvice || '').trim(),
      tags: normalizeTaxonomyArray(item.tags, ['discipline', 'skill'], taxonomyIndex),
      requiredSkills: normalizeTaxonomyArray(item.requiredSkills || item.required_skills, ['skill'], taxonomyIndex),
      recommendedSkills: normalizeTaxonomyArray(item.recommendedSkills || item.recommended_skills, ['skill'], taxonomyIndex),
      difficulty: normalizeTaxonomyValue(normalizeNullableText(item.difficulty), ['difficulty'], taxonomyIndex),
      estimatedHours: normalizeNullableNumber(item.estimatedHours || item.estimated_hours),
      teamSizeRule: normalizeTaxonomyValue(normalizeNullableText(item.teamSizeRule || item.team_size_rule), ['team_size'], taxonomyIndex),
      registrationDeadline: normalizeNullableText(item.registrationDeadline || item.registration_deadline),
      eligibilityNotes: normalizeNullableText(item.eligibilityNotes || item.eligibility_notes),
      externalLink: String(item.externalLink || '').trim(),
      attachments: Array.isArray(item.attachments) ? item.attachments : [],
      relatedCourseIds: normalizeStringArray(item.relatedCourseIds),
      featuredFlags: normalizeStringArray(item.featuredFlags),
      host: String(item.host || '').trim(),
      location: String(item.location || '').trim(),
      publishStatus: competitionPublishStatuses.has(String(item.publishStatus || item.publish_status || 'published').trim())
        ? String(item.publishStatus || item.publish_status || 'published').trim()
        : 'published',
      createdBy: item.createdBy || item.created_by || null
    })).filter(item => item.slug && item.title);
  }

  function normalizeCompetitionPayload(input = {}, existing = {}) {
    const title = String(input.title || existing.title || '').trim();
    const publishStatus = String(input.publishStatus || input.publish_status || existing.publishStatus || existing.publish_status || 'draft').trim();
    const taxonomyIndex = getActiveTaxonomyIndex();
    const slug = String(input.slug || existing.slug || title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
    return {
      title,
      slug,
      tagline: String(input.tagline || existing.tagline || '').trim(),
      tier: String(input.tier || existing.tier || '').trim(),
      banner: String(input.banner || existing.banner || '').trim(),
      discipline: normalizeTaxonomyArray(input.discipline ?? existing.discipline, ['discipline'], taxonomyIndex),
      schoolStage: normalizeTaxonomyArray(input.schoolStage ?? existing.schoolStage, ['stage'], taxonomyIndex),
      status: String(input.status || existing.status || '报名中').trim(),
      dateRange: String(input.dateRange || existing.dateRange || '').trim(),
      fitSummary: String(input.fitSummary || existing.fitSummary || '').trim(),
      whyJoin: String(input.whyJoin || existing.whyJoin || '').trim(),
      prepAdvice: String(input.prepAdvice || existing.prepAdvice || '').trim(),
      tags: normalizeTaxonomyArray(input.tags ?? existing.tags, ['discipline', 'skill'], taxonomyIndex),
      requiredSkills: normalizeTaxonomyArray(
        input.requiredSkills ?? input.required_skills ?? existing.requiredSkills ?? existing.required_skills,
        ['skill'],
        taxonomyIndex
      ),
      recommendedSkills: normalizeTaxonomyArray(
        input.recommendedSkills ?? input.recommended_skills ?? existing.recommendedSkills ?? existing.recommended_skills,
        ['skill'],
        taxonomyIndex
      ),
      difficulty: normalizeTaxonomyValue(input.difficulty || existing.difficulty, ['difficulty'], taxonomyIndex),
      estimatedHours: normalizeNullableNumber(input.estimatedHours ?? input.estimated_hours ?? existing.estimatedHours ?? existing.estimated_hours),
      teamSizeRule: normalizeTaxonomyValue(
        input.teamSizeRule || input.team_size_rule || existing.teamSizeRule || existing.team_size_rule,
        ['team_size'],
        taxonomyIndex
      ),
      registrationDeadline: normalizeNullableText(input.registrationDeadline || input.registration_deadline || existing.registrationDeadline || existing.registration_deadline),
      eligibilityNotes: normalizeNullableText(input.eligibilityNotes || input.eligibility_notes || existing.eligibilityNotes || existing.eligibility_notes),
      externalLink: String(input.externalLink || existing.externalLink || '').trim(),
      attachments: Array.isArray(input.attachments) ? input.attachments : (Array.isArray(existing.attachments) ? existing.attachments : []),
      relatedCourseIds: normalizeJsonArray(input.relatedCourseIds ?? existing.relatedCourseIds),
      featuredFlags: normalizeJsonArray(input.featuredFlags ?? existing.featuredFlags),
      host: String(input.host || existing.host || '').trim(),
      location: String(input.location || existing.location || '').trim(),
      publishStatus: competitionPublishStatuses.has(publishStatus) ? publishStatus : 'draft',
      createdBy: input.createdBy || input.created_by || existing.createdBy || existing.created_by || null
    };
  }

  function savePortalCompetition(competition) {
    const items = loadPortalCompetitions();
    const index = items.findIndex(item => item.slug === competition.slug);
    if (index >= 0) {
      items[index] = competition;
    } else {
      items.unshift(competition);
    }
    writeJsonFile(portalCompetitionsPath, items);
  }

  function loadPortalCompetitionDetail(slug) {
    const safeSlug = String(slug || '').trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(safeSlug)) return null;
    const detailPath = resolveUnder(portalCompetitionDetailsDir, `${safeSlug}.json`);
    if (!detailPath) return null;
    const detail = readJsonFile(detailPath, null);
    return detail && typeof detail === 'object' ? detail : null;
  }

  function loadPortalStories() {
    const data = readJsonFile(portalStoriesPath, []);
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      title: String(item.title || '').trim(),
      slug: String(item.slug || '').trim(),
      studentLabel: String(item.studentLabel || '').trim(),
      summary: String(item.summary || '').trim(),
      result: String(item.result || '').trim(),
      relatedCompetitionSlug: String(item.relatedCompetitionSlug || '').trim(),
      relatedCourseIds: normalizeStringArray(item.relatedCourseIds),
      cover: String(item.cover || '').trim(),
      featured: Boolean(item.featured)
    })).filter(item => item.slug && item.title);
  }

  function loadPortalBanners() {
    const data = readJsonFile(portalBannersPath, []);
    if (!Array.isArray(data)) return [];
    return data
      .map(item => ({
        pageKey: normalizeBannerPageKey(item.pageKey || item.page_key || 'home'),
        type: String(item.type || '').trim(),
        title: String(item.title || '').trim(),
        summary: String(item.summary || item.subtitle || '').trim(),
        image: String(item.image || '').trim(),
        imageAlt: String(item.imageAlt || item.image_alt || '').trim(),
        tag: String(item.tag || '').trim(),
        targetUrl: String(item.targetUrl || '').trim(),
        buttonText: String(item.buttonText || item.ctaLabel || item.cta_label || '').trim(),
        active: item.active === undefined ? true : Boolean(item.active),
        layout: String(item.layout || '').trim(),
        priority: Number.isFinite(Number(item.priority)) ? Number(item.priority) : 999
      }))
      .filter(item => item.title && item.targetUrl)
      .sort((a, b) => a.priority - b.priority);
  }

  function savePortalBanners(items) {
    writeJsonFile(portalBannersPath, Array.isArray(items) ? items : []);
  }

  function normalizeBannerPayload(input = {}, existing = {}) {
    return {
      pageKey: normalizeBannerPageKey(input.pageKey || input.page_key || existing.pageKey || existing.page_key || 'home'),
      type: String(input.type || existing.type || 'feature').trim(),
      title: String(input.title || existing.title || '').trim(),
      summary: String(input.summary || input.subtitle || existing.summary || existing.subtitle || '').trim(),
      image: String(input.image || existing.image || '').trim(),
      imageAlt: String(input.imageAlt || input.image_alt || existing.imageAlt || existing.image_alt || '').trim(),
      tag: String(input.tag || existing.tag || '').trim(),
      targetUrl: String(input.targetUrl || input.target_url || existing.targetUrl || '').trim(),
      buttonText: String(input.buttonText || input.ctaLabel || input.cta_label || existing.buttonText || existing.ctaLabel || existing.cta_label || '').trim(),
      active: input.active === undefined ? (existing.active === undefined ? true : Boolean(existing.active)) : Boolean(input.active),
      layout: String(input.layout || existing.layout || '').trim(),
      priority: Number.isFinite(Number(input.priority)) ? Number(input.priority) : (Number.isFinite(Number(existing.priority)) ? Number(existing.priority) : 999)
    };
  }

  function savePortalStories(items) {
    writeJsonFile(portalStoriesPath, Array.isArray(items) ? items : []);
  }

  function normalizeStoryPayload(input = {}, existing = {}) {
    const title = String(input.title || existing.title || '').trim();
    const slug = String(input.slug || existing.slug || title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
    return {
      title,
      slug,
      studentLabel: String(input.studentLabel || input.student_label || existing.studentLabel || '').trim(),
      summary: String(input.summary || existing.summary || '').trim(),
      result: String(input.result || existing.result || '').trim(),
      relatedCompetitionSlug: String(input.relatedCompetitionSlug || input.related_competition_slug || existing.relatedCompetitionSlug || '').trim(),
      relatedCourseIds: normalizeJsonArray(input.relatedCourseIds ?? existing.relatedCourseIds),
      cover: String(input.cover || existing.cover || '').trim(),
      featured: Boolean(input.featured ?? existing.featured)
    };
  }

  function buildCoursePreviewMap() {
    return loadCourseCatalog().reduce((acc, course) => {
      acc[course.id] = {
        id: course.id,
        title: course.title,
        summary: course.summary,
        audience: course.audience,
        positioning: course.positioning || '',
        courseType: course.courseType || '',
        direction: course.direction || ''
      };
      return acc;
    }, {});
  }

  function enrichCompetition(competition, courseMap) {
    return {
      ...competition,
      relatedCourses: competition.relatedCourseIds.map(courseId => courseMap[courseId]).filter(Boolean),
      registrationStats: getCompetitionRegistrationStats(competition.slug)
    };
  }

  function listPublishedCompetitions() {
    return loadPortalCompetitions().filter(item => item.publishStatus === 'published');
  }

  function buildStoryResponse(story, competitionMap, courseMap) {
    return {
      ...story,
      relatedCompetition: competitionMap[story.relatedCompetitionSlug] || null,
      relatedCourses: story.relatedCourseIds.map(courseId => courseMap[courseId]).filter(Boolean)
    };
  }

  return {
    loadPortalBanners,
    savePortalBanners,
    normalizeBannerPayload,
    loadPortalStories,
    savePortalStories,
    normalizeStoryPayload,
    buildStoryResponse,
    buildCoursePreviewMap,
    listPublishedCompetitions,
    enrichCompetition,
    loadPortalCompetitionDetail,
    loadPortalCompetitions,
    savePortalCompetition,
    normalizeCompetitionPayload
  };
}

module.exports = {
  createPortalContentService
};
