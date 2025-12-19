const temp = {};
const express = require('express');
const router = express.Router();

const marked = require('marked');
const sanitize = require('sanitize-html');

//view route
router.get('/wiki/:slug',(req,res)=>{
    const slug = req.params.slug; 
    const markdown = temp[slug] || 'page does not exist';
    
    const content = sanitize(marked.parse(markdown));

    res.render('test_article',{title:slug.replace(/-/g,' '),message: content});
});

//edit route 
router.get('/wiki/:slug/edit',(req,res)=> {
    const slug = req.params.slug;

    res.render('edit',{
        title: slug.replace(/-/g,' '),
        slug,
        content: temp[slug] || ''
    });

});
router.post('/wiki/:slug/edit',(req,res)=> {
    const slug = req.params.slug;
    temp[slug] = req.body.content;

    res.redirect(`/wiki/${slug}`);
})


module.exports = router;