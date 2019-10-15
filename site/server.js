const pg = require('pg');
const fs=require('fs');
const nodemailer = require('nodemailer');
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
let transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "3924826c0ee9d5",
      pass: "8a9e06afb965ce"
    },
    poll:true,
    rateLimit: true,
    maxConnections:1,
    maxMessages: 3
  });
market.set('view engine','ejs');
market.use(express.urlencoded({extended:false}))
market.use(cookieParser())
//const html = fs.createReadStream(__dirname + "/index.html",'utf-8');

market.get('/',auth,(req,res)=>{
    console.log(req.user)
    if(req.user!=undefined)
    {
        if(req.user.role==0)
        {
            res.render('index',{page:'headLogged'})
        }
        else if(req.user.role==2)
        {
            res.render('index',{page:'adminHead'})
        }
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
            res.render('productsAdmin',{page:'adminHead',maximal:max,kind:req.params.name})
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
basket=[]
market.post('/product/to/basket',async (req,res)=>{
    const good =await poll.query(('Select * from $1 where id= $2'.replace('$1',req.body.type).replace('$2',req.body.id)))
    basket.push(good.rows[0])
})
market.post('/buskdel',auth,async(req,res)=>{
    for(let i=0;i<basket.length;++i)
    {
        if(basket[i].name==req.body.toDel){
            basket.splice(i, 1);
            break;
        }
    }
    await poll.query(('insert into history values(\'$1\',\'$2\',\'Видалено\')'.replace('$1',req.user.name).replace('$2',req.body.toDel)))
})
market.post('/busksucc',auth,async(req,res)=>{
    for(let i=0;i<basket.length;++i){
        await poll.query(('insert into history values(\'$1\',\'$2\',\'Підтверджено\')'.replace('$1',req.user.name).replace('$2',basket[i].name)))
    }
    basket=[]
})
//history
market.get('/history',auth,async(req,res)=>{
    if(req.user!=undefined)
    {
        let num = await poll.query('Select count(*) from history where username = \'$1\''.replace('$1',req.user.name))
        let max =Math.ceil(num.rows[0].count/5)-1
        res.render('history',{page:'headLogged',maximal:max})
    }
    else{
        res.send("FORBIDDEN")
    }
})
market.put('/history/:page',auth,async(req,res)=>{
    const products =await poll.query(('Select * from history where username =\'$1\' OFFSET $2 FETCH FIRST 5 ROW ONLY'.replace('$1',req.user.name).replace('$2',5*req.params.page)))
    res.render('historyList',{products: products.rows})
})
//sender
market.get('/rozsl',auth, (req,res)=>{
    if(req.user!=undefined)
    {
        if(req.user.role==2)
        {
            res.render('mail',{page:'adminHead'})
        }
        else
        {
            res.send("FORBIDDEN")
        }
    }
    else
    {
        res.send("FORBIDDEN")
    } 
})
market.post('/rozsl',async(req,res)=>{
    const data=await poll.query('Select username, email from users where role=0')
    users=data.rows
    for(let i =0;i<2;++i)
    {
        const message = {
            from: 'elonmusk@muse.com', // Sender address
            to: users[i].email,         // List of recipients
            subject: 'Цікава інформація для '+users[i].username, // Subject line
            text: req.body.message // Plain text body
        };
        transport.sendMail(message)
    }
})
//Admin
market.post('/productsAdmin/:type/discount',async (req,res)=>{
    await poll.query('UPDATE $1 set discount = $2 where id = $3'.replace('$1',req.params.type).replace('$2',req.body.value).replace('$3',req.body.id))
})
market.post('/productsAdmin/:type/delete',async (req,res)=>{
    await poll.query(('delete from $1 where id = $2').replace('$1',req.params.type).replace('$2',req.body.id))
})
market.post('/productsAdmin/:type/add',async (req,res)=>{
    await poll.query(('insert into $1(name,price) values (\'$2\', $3)').replace('$1',req.params.type).replace('$2',req.body.name).replace('$3',req.body.price))
    //console.log(('insert into $1(name,price) values ($2, $3)').replace('$1',req.params.type).replace('$2',req.body.name).replace('$3',req.body.price))
})

//basket
market.get('/basket',(req,res)=>{
    res.render('basket',{page:'headLogged'})
})
market.put('/basket',(req,res)=>{
    if(basket.length==0)
    {
        res.send("Basket is empty")
    }
    else{
        res.render('basketList',{products: basket})
    }
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
    basket=[]
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