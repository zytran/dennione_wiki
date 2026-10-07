const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const crypto = require('crypto');

const db = require('../db/db');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

module.exports = router;
