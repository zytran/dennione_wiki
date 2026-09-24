const express = require('express');
const router = express.Router();

const db = require('../db/db');
const marked = require('marked');
const sanitize = require('sanitize-html');

const SANITIZE_OPTIONS = {
  allowedTags: sanitize.defaults.allowedTags.concat(['img']),
  allowedAttributes: {
    ...sanitize.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
};

router.get('/', async (req, res) => {
  const result = await db.query(
    `select slug, title, updated_at
     from pages
     order by updated_at desc
     limit 10`
  );

  res.render('home', {
    title: 'Welcome to Dennione',
    recentPages: result.rows,
  });
});

router.get('/getting-started', async (req, res) => {
  res.render('getting_started', {
    title: 'Guide to Getting Started',
  });
});



router.get('/search', async (req, res) => {
  const query = req.query.q || '';

  if (!query) {
    return res.render('search', { query, results: [] });
  }

  const exact = await db.query(
    `select slug from pages where LOWER(slug) = LOWER($1) limit 1`,
    [query]
  );

  if (exact.rows.length > 0) {
    return res.redirect(`/${exact.rows[0].slug}`);
  }

  const result = await db.query(
    `select slug, title
     from pages
     where title ilike $1 or content ilike $1
     order by updated_at desc
     limit 20`,
    [`%${query}%`]
  );

  res.render('search', { query, results: result.rows });
});

router.get('/api/search-suggestions', async (req, res) => {
  const query = req.query.q || '';

  if (!query) {
    return res.json([]);
  }

  const result = await db.query(
    `select slug, title
     from pages
     where title ilike $1
     order by updated_at desc
     limit 6`,
    [`%${query}%`]
  );

  res.json(result.rows);
});

router.get('/create', (req, res) => {
  res.render('create', {
    title: 'Create New Page',
    page: {},
    errors: [],
  });
});

router.post('/create', async (req, res) => {
  const { title, slug, content } = req.body;
  const errors = [];

  if (!title || !slug || !content) {
    errors.push('All fields are required.');
  }

  const existing = await db.query('select slug from pages where slug = $1', [slug]);
  if (existing.rows.length > 0) {
    errors.push('Slug already exists. Choose a different one.');
  }

  if (errors.length > 0) {
    return res.render('create', { title: 'Create New Page', page: req.body, errors });
  }

  await db.query(
    'insert into pages (title, slug, content, updated_at) values ($1, $2, $3, now())',
    [title, slug, content]
  );

  res.redirect(`/${slug}`);
});

router.get('/:slug/edit', async (req, res) => {
  const { slug } = req.params;

  const result = await db.query('select * from pages where slug = $1', [slug]);
  const page = result.rows[0];

  res.render('edit', {
    title: page?.title || slug.replace(/-/g, ' '),
    slug,
    content: page?.content || '',
    page,
  });
});

router.post('/:slug/edit', async (req, res) => {
  const { slug } = req.params;
  const { title, content } = req.body;

  await db.query(
    `insert into pages (slug, title, content)
     values ($1, $2, $3)
     on conflict (slug)
     do update set
       title = excluded.title,
       content = excluded.content,
       updated_at = now()`,
    [slug, title, content]
  );

  res.redirect(`/${slug}`);
});

router.post('/:slug/delete', async (req, res) => {
  const { slug } = req.params;

  await db.query('delete from pages where slug = $1', [slug]);

  res.sendStatus(200);
});

router.get('/map', (req, res) => {
  res.render('map', {
    title: 'Map',
  });
});

router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login',
  });
});

router.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  const result = await db.query('select * from pages where slug = $1', [slug]);

  if (result.rows.length === 0) {
    return res.render('test_article', {
      title: slug.replace(/-/g, ' '),
      message: '<p>There is currently no text created for this page. To create this page, log in and look at the <a href="../getting-started">getting started</a> to learn how to create this page.</p>',
      slug,
    });
  }

  const page = result.rows[0];
  const content = sanitize(marked.parse(page.content), SANITIZE_OPTIONS);
  const title = sanitize(page.title);

  res.render('test_article', {
    title,
    message: content,
    slug,
  });
});

module.exports = router;
