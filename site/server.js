

const fs=require('fs');
const session = require('express-session')
const express=require('express')
var market=express();
market.set('view engine','ejs');
//const html = fs.createReadStream(__dirname + "/index.html",'utf-8');

market.get('/',(req,res)=>{
    console.log(req.url)
    res.render('index');
})

market.listen(3000,()=>console.log("server started"));