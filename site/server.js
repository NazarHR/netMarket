

const fs=require('fs');
const session = require('session')
const express=require('express')
const jwt = require('jsonwebtoken')
const bcrypt =require('bcrypt')
const market=express();

market.set('view engine','ejs');
market.use(express.urlencoded({extended:false}))
//const html = fs.createReadStream(__dirname + "/index.html",'utf-8');
const users=[]
market.get('/',(req,res)=>{
    console.log(req.url)
    res.render('index');
})


market.post('/register_s', async (req,res)=>{
    try {
        const hasshedpassword= await bcrypt.hash(req.body.password,10)
        users.push({
            id:Date.now().toString(),
            login:req.body.name,
            email: req.body.email,
            password:hasshedpassword
        })
        res.redirect('/')
        console.log(users)
    } catch {
        res.redirect('/register')
    }
})
market.post('/login_s', (req,res)=>{
    users.find()
})
market.listen(3000,()=>console.log("server started"));