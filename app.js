//currently uses http://localhost:3000/ for testing

require('dotenv').config();
const path = require("path");
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const sessionPool = new Pool({
  connectionString: process.env.database_url,
  ssl: { rejectUnauthorized: false },
});

app.use(session({
  store: new pgSession({ pool: sessionPool }),
  secret: process.env.session_secret,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.authenticate('session'));

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.set('view engine', 'ejs');
app.set("views", path.join(__dirname,"views"));

/*app.get("/", (req, res) => {
    res.render("test_article", {
        title: "test page",
        slug: "test-page",
        message: "<p>test page works</p>"
    });
});*/

const articleRoutes = require("./routes/wikis");
app.use("/", articleRoutes);

app.listen(port, '0.0.0.0', () => {
  console.log(`server running on port ${port}`);
});
