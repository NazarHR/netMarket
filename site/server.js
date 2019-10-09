const pg = require('pg');
const fs=require('fs');
const cookieParser = require('cookie-parser')
const express=require('express')
const jwt = require('jsonwebtoken')
const bcrypt =require('bcrypt')
const market=express();
const poll = pg.Pool(
    {
        user:"postgres",
        password:"v3lamalu",
        host:"localhost",
        port:5432,
        database: "muse"
    }
)
market.set('view engine','ejs');
market.use(express.urlencoded({extended:false}))
market.use(cookieParser())
//const html = fs.createReadStream(__dirname + "/index.html",'utf-8');

market.get('/',auth,(req,res)=>{
    console.log(req.user)
    console.log(req.url)
    if(req.user!=undefined)
    {
        res.render('index',{page:'headLogged'})
    }
    else
    {
        res.render('index',{page:'head'});
    }
    
})
market.get('/products/:name',auth, async(req,res)=>{
    console.log(req.params)
    console.log("delimiter")
    let num = await poll.query('Select count(*) from $1'.replace('$1',req.params.name))
    let max =Math.ceil(num.rows[0].count/5)-1
    res.render('products',{page:'head',maximal:max,kind:req.params.name})
    res.end();
})
market.put('/products/:name/:num',async(req,res)=>{
    //console.log(req.params.name)
    console.log(req.url)
    const products =await poll.query('Select * from $1'.replace('$1',req.params.name))
    //console.log(products.rows)
    res.render('productLIst',{products: products.rows})
})

market.post('/products/:type',(req,res)=>{
    //console.log("here");
    //console.log(req.params.type)
    //console.log(req.body);
})
market.post('/register_s', async (req,res)=>{
    try {
        const hasshedpassword= await bcrypt.hash(req.body.password,10)
        var user =[
            req.body.name,
            req.body.email,
            hasshedpassword
        ];
        await poll.query("INSERT INTO users VALUES ($1, $2, $3);", [user[0],user[1],user[2]])
        console.log('registered')
        res.redirect('/login')
    } catch(error) {
        res.redirect('/register')
    }
})

market.post('/login_s', async (req,res)=>{
    console.log(req.url)
    try {
        const result =await poll.query("Select * from users where username = $1", [req.body.name])
        //console.log(result)
        if(result.rows.length<1)
        {
            throw Error("wrong login")
        }
        const validPass = await bcrypt.compare(req.body.password, result.rows[0].password)
        if(!validPass)
        {
            //return res.status(400).send("invalidPassword")
            throw Error("Wrong password")
        }
        //console.log(validPass)
        const token = jwt.sign({name: result.rows[0].username},'secret')
        console.log(token)
        res.cookie('auth',token);
        //res.writeHead(200,{'authorization': token})
        res.redirect('/')
    } catch (error) {
        console.log(error);
        res.redirect('/login')
        
    }
    
})
market.get('/logout',(req,res)=>
{
    res.clearCookie('auth')
    res.redirect('/')
})
market.listen(3000,()=>console.log("server started"));

function auth(req,res,next)
{
    const token = req.cookies.auth;
    if(token===undefined)
    {
        //console.log("auth")
    }
    else{
        try {
            const verified = jwt.verify(token,'secret')
            req.user=verified
        } catch (error) {
            req.user=undefined;
        }
    } 
    next();
}