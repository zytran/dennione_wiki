//currently uses http://localhost:3000/ for testing

require('dotenv').config();
const path = require("path");
const express = require('express');

const app = express();
const port = process.env.port;

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

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

app.listen(port, () => {console.log(`server running on port ${port}`)});
