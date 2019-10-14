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
    // console.log(req.params)
    // //console.log("delimiter")
    let num = await poll.query('Select count(*) from $1'.replace('$1',req.params.name))
    let max =Math.ceil(num.rows[0].count/5)-1
    console.log(max)
    if(req.user==undefined)
    {
        res.render('products',{page:'head',maximal:max,kind:req.params.name})
    }
    else
    {
        if(req.user.role==0)
        {
            res.render('products',{page:'headLogged',maximal:max,kind:req.params.name})
        }
        else{
            res.render('productsAdmin',{page:'headLogged',maximal:max,kind:req.params.name})
        }
    }
        
    res.end();
})
market.put('/products/:name/:num',auth,async(req,res)=>{
    const products =await poll.query('Select * from $1 OFFSET $2 FETCH FIRST 5 ROW ONLY'.replace('$1',req.params.name).replace('$2',5*req.params.num))
    if(req.user==undefined){
        res.render('defaultLIst',{products: products.rows})
    }
    else{
        if(req.user.role==0){
            res.render('productLIst',{products: products.rows})
        }
        else if(req.user.role==2)
        {
            res.render('productsLIstAdmin',{products: products.rows})
        }
    }
})
var basket=[]
market.post('/products/:type',(req,res)=>{
    basket.push({name:req.user.name,type : req.params.type,id:req.body.id})
})
//Admin
market.post('/productsAdmin/:type/discount',(req,res)=>{
    console.log(req.params.type,req.body.id)
})
market.post('/productsAdmin/:type/delete',(req,res)=>{
    console.log(req.params.type,req.body.id)
})
//basket
market.get('/basket',(req,res)=>{
    
})

//register `n` login
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
        const token = jwt.sign({name: result.rows[0].username, role: result.rows[0].role},'secret')
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