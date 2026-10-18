const MAX_SECTIONS = 15;
const MAX_ROWS = 30;

function cleanText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanImageUrl(value) {
  const url = cleanText(value, 2000);

  if (!url) {
    return '';
  }

  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
  } catch {
    return '';
  }
}

function parseInfobox(raw) {
  let data = raw;

  if (typeof raw === 'string') {
    if (!raw.trim()) {
      return null;
    }

    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const sections = (Array.isArray(data.sections) ? data.sections : [])
    .slice(0, MAX_SECTIONS)
    .map(section => {
      const rows = (section && Array.isArray(section.rows) ? section.rows : [])
        .slice(0, MAX_ROWS)
        .map(row => ({
          label: cleanText(row && row.label, 100),
          value: cleanText(row && row.value, 500),
        }))
        .filter(row => row.label || row.value);

      return {
        title: cleanText(section && section.title, 100),
        rows,
      };
    })
    .filter(section => section.title || section.rows.length > 0);

  const image = cleanImageUrl(data.image);

  if (!image && sections.length === 0) {
    return null;
  }

  return { image, sections };
}

module.exports = { parseInfobox };
