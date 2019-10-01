

const fs=require('fs');
const http =require("http");
//const html = fs.createReadStream(__dirname + "/index.html",'utf-8');
const server = http.createServer((req, res)=>{
    console.log(req.url)
    switch(req.url)
    {
        case '/':
            fs.createReadStream(__dirname + "/html/index.html",'utf-8').pipe(res);
            break;
        case '/about_us':
            console.log("about_ue");
            fs.createReadStream(__dirname + "/html/index.html",'utf-8').pipe(res);
            break;
        default:
            console.log("default case");
            fs.createReadStream(__dirname + "/html/index.html",'utf-8').pipe(res);
            break;

    }
    
    console.log(req.url);   
});
server.listen(3000,()=>console.log("server started"));