const express = require('express');
const router = express.Router();

const db = require("../db/db");

const marked = require('marked');
const sanitize = require('sanitize-html');

//view route
router.get('/:slug', async (req,res)=>{
    const slug = req.params.slug; 
    const result = await db.query(
        "select * from pages where slug = $1",
        [slug]
    );

    if (result.rows.length===0){
        return res.render("test_article",{
            title: slug.replace(/-/g,' '), 
            message: "<p>page does not exits yet</p>",
            slug
        });
    }

    const page = result.rows[0];
    
    
    const content = sanitize(marked.parse(page.content));
    const title = sanitize(marked.parse(page.title))
    res.render("test_article",{
        title: title,
        message: content,
        slug
    });
    
});

//edit route 
router.get('/:slug/edit', async (req,res)=> {
    const slug = req.params.slug;

    const result = await db.query(
        "select * from pages where slug = $1",
        [slug]
    )

    const page = result.rows[0];

    res.render('edit',{
        title: page?.title || slug.replace(/-/g,' '),
        slug,
        content: page?.content || ''
    });

});

router.post('/:slug/edit', async (req,res)=> {
    const slug = req.params.slug;
    const title = slug.replace(/-/g," ");
    const content = req.body.content;

    await db.query(
        `
        insert into pages (slug, title, content)
        values ($1, $2, $3)
        on conflict (slug)
        do update set
            title = excluded.title,
            content = excluded.content,
            updated_at = now()
        `,
        [slug,title,content]
    );

    res.redirect(`/${slug}`);
});


module.exports = router;