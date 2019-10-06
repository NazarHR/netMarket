const {Client} = require('pg');
const fs=require('fs');
//const session = require('session')
const express=require('express')
const jwt = require('jsonwebtoken')
const bcrypt =require('bcrypt')
const market=express();
const client = new Client(
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
//const html = fs.createReadStream(__dirname + "/index.html",'utf-8');
const index = {page:'head'}
market.get('/',(req,res)=>{
    console.log(req.url)
    res.render('index',index);
})

market.post('/register_s', async (req,res)=>{
    try {
        const hasshedpassword= await bcrypt.hash(req.body.password,10)
        var user =[
            req.body.name,
            req.body.email,
            hasshedpassword
        ];
        await client.connect()
        await client.query("INSERT INTO users VALUES ($1, $2, $3);", [user[0],user[1],user[2]])
        await client.end()
        res.redirect('/login')
    } catch(error) {
        client.end()
        res.redirect('/register')
    }
})

market.post('/login_s', async (req,res)=>{
    console.log(req.url)
    try {
        const hasshedpassword = await bcrypt.hash(req.body.password,10)
        await client.connect()
        const result =await client.query("Select * from users where username = $1 and password = $2", [req.body.name,hasshedpassword])
        await client.end()
        if(result.rows.length<1)
        {
            throw Error("wrong data")
        }
        res.redirect('/')
    } catch (error) {
        console.log("wrong password")
        res.redirect('/login')
    }
    
})

market.listen(3000,()=>console.log("server started"));