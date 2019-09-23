

const fs=require('fs');
const http =require("http");
const html = fs.createReadStream(__dirname + "/index.html",'utf-8');
const server = http.createServer((req, res)=>{
    switch(req.url){
        case '/':
            const html = fs.createReadStream(__dirname + "/index.html",'utf-8');
            res.writeHead(200,{'Content-Type':'text/html'});
            html.pipe(res);
        // default:res.writeHead(200,{'Content-Type':'text/html'});
        //     const inneed = fs.createReadStream(__dirname+'/css/mainstyle.css','utf-8');
        //     css.pipe(res);
    }
    
    console.log('debug');
});
server.listen(3000,()=>console.log("server started"));