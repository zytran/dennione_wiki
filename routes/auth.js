const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const crypto = require('crypto');

const db = require('../db/db');

passport.use(new LocalStrategy(function verify(username, password, cb) {
  db.query('select * from users where username = $1', [username])
    .then(result => {
      const user = result.rows[0];

      if (!user) {
        return cb(null, false, { message: 'Incorrect username or password.' });
      }

      crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', (err, hashedPassword) => {
        if (err) {
          return cb(err);
        }

        if (!crypto.timingSafeEqual(user.hashed_password, hashedPassword)) {
          return cb(null, false, { message: 'Incorrect username or password.' });
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
  });
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
}));

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
  });
});

router.post('/regis', async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('regis', {
      title: 'Register',
      errors: ['Username and password are required.'],
    });
  }

  const salt = crypto.randomBytes(16);

  crypto.pbkdf2(password, salt, 310000, 32, 'sha256', async (err, hashedPassword) => {
    if (err) {
      return next(err);
    }

    try {
      const result = await db.query(
        'insert into users (username, hashed_password, salt) values ($1, $2, $3) returning id, username',
        [username, hashedPassword, salt]
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
        return res.render('regis', {
          title: 'Register',
          errors: ['That username is already taken.'],
        });
      }
      next(err);
    }
  });
});

module.exports = router;