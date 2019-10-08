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
var k=0
market.get('/products/:id',(req,res)=>{
    res.render('products',{page:'head',maximal:10})
})
market.get('/products/:id/:num',(req,res)=>{
    console.log(req.params.num)
    res.render('productLIst',{products: [{id: 1,name:"guitar",price: 1245,discount:0},
    {id: 1,name:"guitar",price: 1245,discount:20},
    {id: 2,name:"guitar1",price: 1245,discount:14},
    {id: 3,name:"guitar2",price: 1245,discount:0},
    {id: 4,name:"guitar3",price: 1245,discount:0},
    {id: 5,name:"guitar4",price: 1245,discount:0},
    {id: 6,name:"guitar5",price: 1245,discount:10},
    {id: 7,name:"guitar6",price: 1245,discount:0},
    {id: 8,name:"guitar7",price: 1245,discount:24},
    {id: 9,name:"guitar8",price: 1245,discount:0},
    {id: 9,name:"test",price: req.params.num,discount:0}]})
})
market.get('/logout',(req,res)=>
{
    res.clearCookie('auth')
    res.redirect('/')
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
        console.log(error)
        res.redirect('/login')
        
    }
    
})

market.listen(3000,()=>console.log("server started"));

function auth(req,res,next)
{
    const token = req.cookies.auth;
    if(token===undefined)
    {
        console.log("here")
        //req.user=token
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