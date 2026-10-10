const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const crypto = require('crypto');

const db = require('../db/db');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const util = require('util');
const { sendMail } = require('../utils/mailer');
const pbkdf2 = util.promisify(crypto.pbkdf2);
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function findValidReset(token) {
  const result = await db.query(
    'select id, user_id from password_resets where token_hash = $1 and expires_at > now()',
    [hashToken(token)]
  );
  return result.rows[0];
}


passport.use(new LocalStrategy(function verify(identifier, password, cb) {
  db.query(
    'select * from users where username = $1 or lower(email) = lower($1)',
    [identifier.trim()]
  )
    .then(result => {
      const user = result.rows[0];

      if (!user) {
        return cb(null, false, { message: 'Incorrect username/email or password.' });
      }

      crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', (err, hashedPassword) => {
        if (err) {
          return cb(err);
        }

        if (!crypto.timingSafeEqual(user.hashed_password, hashedPassword)) {
          return cb(null, false, { message: 'Incorrect username/email or password.' });
        }

        return cb(null, user);
      });
    })
    .catch(err => cb(err));
}));

passport.serializeUser((user, cb) => {
  process.nextTick(() => {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser((user, cb) => {
  process.nextTick(() => cb(null, user));
});

router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Sign In',
    errors: [],
    values: {},
  });
});

// Custom callback: on failure we render the page directly with the error,
// so it doesn't depend on session/flash messages surviving a redirect.
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).render('login', {
        title: 'Sign In',
        errors: [(info && info.message) || 'Incorrect username/email or password.'],
        values: { username: (req.body.username || '').trim() },
      });
    }

    req.logIn(user, err => {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
  })(req, res, next);
});

router.post('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

router.get('/regis', (req, res) => {
  res.render('regis', {
    title: 'Register',
    errors: [],
    values: {},
  });
});

router.post('/regis', (req, res, next) => {
  const username = (req.body.username || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  const renderErrors = (errors) =>
    res.status(400).render('regis', {
      title: 'Register',
      errors,
      values: { username, email },
    });

  if (!username || !password || !email) {
    return renderErrors(['All fields are required.']);
  }
  if (!EMAIL_RE.test(email)) {
    return renderErrors(['Please enter a valid email address.']);
  }
  if (username.length < 3) {
    return renderErrors(['Username must be at least 3 characters.']);
  }
  // Keeps usernames from ever being confused with an email at login.
  if (username.includes('@')) {
    return renderErrors(['Username cannot contain "@".']);
  }
  if (password.length < 8) {
    return renderErrors(['Password must be at least 8 characters.']);
  }
  if (username === password) {
    return renderErrors(['Username and password should not be the same.']);
  }

  const salt = crypto.randomBytes(16);

  crypto.pbkdf2(password, salt, 310000, 32, 'sha256', async (err, hashedPassword) => {
    if (err) {
      return next(err);
    }

    try {
      const result = await db.query(
        'insert into users (username, email, hashed_password, salt) values ($1, $2, $3, $4) returning id, username',
        [username, email, hashedPassword, salt]
      );

      const user = result.rows[0];

      req.login(user, err => {
        if (err) {
          return next(err);
        }
        res.redirect('/');
      });
    } catch (err) {
      if (err.code === '23505') {
        const isEmail = /email/i.test(err.constraint || err.detail || '');
        return renderErrors([
          isEmail ? 'That email is already registered.' : 'That username is already taken.',
        ]);
      }
      next(err);
    }
  });
});

router.get('/forgot-password', (req, res) => {
  res.render('forgot_password', {
    title: 'Forgot Password',
    errors: [],
    message: null,
    values: { email: '' },
  });
});

router.post('/forgot-password', async (req, res, next) => {
  const email = (req.body.email || '').trim().toLowerCase();

  const renderErrors = (errors) =>
    res.status(400).render('forgot_password', {
      title: 'Forgot Password',
      errors,
      message: null,
      values: { email },
    });

  if (!email) {
    return renderErrors(['All fields are required.']);
  }
  if (!EMAIL_RE.test(email)) {
    return renderErrors(['Please enter a valid email address.']);
  }

  try {
    const result = await db.query(
      'select id, username from users where lower(email) = $1',
      [email]
    );
    const user = result.rows[0];

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');

      await db.query('delete from password_resets where user_id = $1', [user.id]);
      await db.query(
        'insert into password_resets (user_id, token_hash, expires_at) values ($1, $2, $3)',
        [user.id, hashToken(token), new Date(Date.now() + RESET_TOKEN_TTL_MS)]
      );

      const link = `${process.env.base_url}/reset-password/${token}`;

      sendMail({
        to: email,
        subject: 'Reset your Dennione password',
        text:
          `Hi ${user.username},\n\n` +
          `Use the link below to reset your password. It expires in 1 hour and can only be used once.\n\n` +
          `${link}\n\n` +
          `If you didn't request this, you can ignore this email.`,
      }).catch(err => console.error('Failed to send reset email:', err));
    }

    res.render('forgot_password', {
      title: 'Forgot Password',
      errors: [],
      message: 'If an account with that email exists, a reset link has been sent.',
      values: { email: '' },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/reset-password/:token', async (req, res, next) => {
  try {
    const reset = await findValidReset(req.params.token);

    if (!reset) {
      return res.render('reset_password', {
        title: 'Reset Password',
        token: null,
        errors: ['This reset link is invalid or has expired.'],
      });
    }

    res.render('reset_password', {
      title: 'Reset Password',
      token: req.params.token,
      errors: [],
    });
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password/:token', async (req, res, next) => {
  const { token } = req.params;
  const password = req.body.password || '';
  const confirm = req.body.confirm || '';

  try {
    const reset = await findValidReset(token);

    if (!reset) {
      return res.render('reset_password', {
        title: 'Reset Password',
        token: null,
        errors: ['This reset link is invalid or has expired.'],
      });
    }

    const renderErrors = (errors) =>
      res.status(400).render('reset_password', {
        title: 'Reset Password',
        token,
        errors,
      });

    if (!password || !confirm) {
      return renderErrors(['All fields are required.']);
    }
    if (password.length < 8) {
      return renderErrors(['Password must be at least 8 characters.']);
    }
    if (password !== confirm) {
      return renderErrors(['Passwords do not match.']);
    }

    const salt = crypto.randomBytes(16);
    const hashedPassword = await pbkdf2(password, salt, 310000, 32, 'sha256');

    await db.query(
      'update users set hashed_password = $1, salt = $2 where id = $3',
      [hashedPassword, salt, reset.user_id]
    );

    await db.query('delete from password_resets where user_id = $1', [reset.user_id]);

    await db.query(
      `delete from session where (sess::jsonb)->'passport'->'user'->>'id' = $1`,
      [String(reset.user_id)]
    );

    res.redirect('/login');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
