//currently uses http://localhost:3000/ for testing

require('dotenv').config();

const express = require('express');

const app = express();
const port = process.env.port;

app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/',(req,res)=> {res.render('test_article',{title: "test page", message: "test page works"})})

const articleRoutes = require("./routes/wikis");
app.use(articleRoutes);

app.listen(port, () => {console.log(`server running on port ${port}`)});
