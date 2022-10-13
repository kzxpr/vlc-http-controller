const { spawn } = require('child_process');
let fs = require('fs');

var vlc;

/*let writeStream = fs.createWriteStream('test_gfg.txt', {
    flags: 'w'
});

writeStream.on("open", () => {
    console.log("Stream opened");
  });writeStream.on("ready", () => {
    console.log("Stream ready");
  });
writeStream.on("pipe", src => {
    console.log("MY PIPE")
    console.log(src);
  });writeStream.on("unpipe", src => {
    console.log(src);
  });writeStream.on("finish", () => {
    console.log("Stream finished");
  });*/

vlc = spawn('vlc', ['/home/kzxpr/Desktop/MusketeersOfPigAlley.mp4', '-I', 'rc', '--rc-fake-tty']);
// , { stdio: ['pipe', writeStream, 'pipe'] }

//const readable = fs.createReadStream("input.txt");


vlc.stdin.on('data', (data) => {
    console.log(`VLC received:\n${data.toString()}`);
});

//vlc.stdout.pipe(writeStream)

let mergedOut = '';
vlc.stdout.on("data", (chunk) => {
    //while(chunk){
        process.stdout.write(chunk, (_err) => { });
    //}
    
    //mergedOut += chunk;
})

vlc.stderr.on('data', (data) => {
    //console.log(`VLC ERROR:\n${data.toString()}`);
});



const express = require("express");
const app = express();

app.get("/", (request, response) => {
    response.send("Hi there");
});


app.get("/pause", (request, response) => {
    vlc.stdin.write("pause\n")
});

app.get("/play", (request, response) => {
    vlc.stdin.write("play\n")
});

app.get("/currenttime", (req, res) => {
    //vlc
    const test = vlc.stdin.write("get_time\n")
    /*vlc.send("get_time", function(data) {
        console.log("OUT:"+data)
    })*/
    //const test = vlc.read();
    //console.log(test)
    res.send("OK")
})

app.listen(3000, () => {
    console.log("Listen on the port 3000...");
});


/*
const words = spawn('echo', ['hej kasper lauritzen']);
const wc = spawn('wc', ['-w']);

words.stdout.on('data', (data) => {
    console.log(`child stdout:\n${data}`);
});

words.stdout.pipe(wc.stdin)

wc.stdout.on('data', (data) => {
    console.log(`Number of words ${data}`);
});
/* */