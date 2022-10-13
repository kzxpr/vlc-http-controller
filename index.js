const express = require("express");
const app = express();
const { spawn } = require('child_process');
const fs = require('fs');

app.use(express.json());

/* LOAD LIBRARY */
const { media } = require("./library.json")

var vlc;

/* LISTENING PARAMETERS */
var parameters = {};

vlc = spawn('vlc', ['-I', 'rc', '--rc-fake-tty']);

var stdout_queue = new Array();
var stdouts = new Array();

vlc.stdin.on('data', (data) => {
    console.log(`VLC received:\n${data.toString()}`);
});

vlc.stdout.on("data", (chunk) => {
    if(stdout_queue.length>0){
        console.log("THERE IS A CB", stdout_queue[0])
        const cb = stdout_queue[0];
        stdout_queue.splice(0, 1)
        cb(chunk.toString())
    }
    console.log("CB QUEUE", stdout_queue)
    stdouts.push(chunk.toString())
    process.stdout.write("BANG"+chunk, (_err) => { });
})

vlc.stderr.on('data', (data) => {
    console.log(`VLC ERROR:\n${data.toString()}`);
});

app.get("/library", (req, res) => {
    res.sendFile(__dirname + '/library.json');
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/rc.html');
});

async function findMedia(id){
    return new Promise((resolve, reject) => {
        const found = media.filter((v) => {
            return (v.id == id);
        })
        console.log("FOUND", found)
        if(found.length==1){
            resolve(found[0])
        }else{
            reject("TOO FEW OR TOO MANY!")
        }
    })
}

app.post("/load", async (req, res) => {
    const { fileid } = req.body;
    await findMedia(fileid)
        .then((file) => {
            vlc.stdin.write("clear\n");
            vlc.stdin.write('add '+file['src']+'\n')
            vlc.stdin.write("play\n");
            res.send({status: "OK"})
        })
    
});

app.post("/seek", async (req, res) => {
    const { time } = req.body;
    console.log("SEEK", time)
    if(time){
        vlc.stdin.write('seek '+time+'\n')
        res.send({status: "OK"})
    }
});

app.post("/enqueue", async (req, res) => {
    const { fileid } = req.body;
    console.log("ADD")
    findMedia(fileid).then((file) => {
        vlc.stdin.write('enqueue '+file['src']+'\n')
        res.send({status: "OK"})
    })
});

app.post("/pause", (req, res) => {
    vlc.stdin.write("pause\n")
    res.send({status: "OK"})
});

app.post("/play", (req, res) => {
    vlc.stdin.write("play\n")
    res.send({status: "OK"})
});

app.post("/stop", (req, res) => {
    vlc.stdin.write("stop\n")
    res.send({status: "OK"})
});

app.post("/next", (req, res) => {
    vlc.stdin.write("next\n")
    res.send({status: "OK"})
});

app.post("/prev", (req, res) => {
    vlc.stdin.write("prev\n")
    res.send({status: "OK"})
});

app.post("/clear", (req, res) => {
    vlc.stdin.write("clear\n")
    res.send({status: "OK"})
});

app.post("/fastforward", (req, res) => {
    vlc.stdin.write("fastforward\n")
    res.send({status: "OK"})
});

app.post("/rewind", (req, res) => {
    vlc.stdin.write("rewind\n")
    res.send({status: "OK"})
});

app.post("/faster", (req, res) => {
    vlc.stdin.write("faster\n")
    res.send({status: "OK"})
});

app.post("/slower", (req, res) => {
    vlc.stdin.write("slower\n")
    res.send({status: "OK"})
});

app.post("/normal", (req, res) => {
    vlc.stdin.write("normal\n")
    res.send({status: "OK"})
});

app.post("/frame", (req, res) => {
    vlc.stdin.write("frame\n")
    res.send({status: "OK"})
});

app.post("/fullscreen", (req, res) => {
    vlc.stdin.write("fullscreen\n")
    res.send({status: "OK"})
});

function handleCurrenttime(data){
    console.log("Handletime called: ",data);
    const parts = data.split("\r\n")
    parameters["currenttime"] = parts[0];
}

function handlePlaylist(data){
    console.log("Handleplaylist called: ")
    const parts = data.split("\r\n")
    parameters["playlist"] = parts;
}

function handleCurrentlength(data){
    console.log("HandleCurrentlength called: ", data)
    //parameters["currentlength"] = data;
    const parts = data.split("\r\n")
    parameters["currentlength"] = parts[0];
}

async function awaitParameter(param){
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if(parameters[param]!=null){
                resolve(parameters[param])
            }else{
                reject("TIMEOUT on await "+param)
            }
        }, 100)
    })
}

app.post("/gettime", async (req, res) => {
    parameters["currenttime"] = null;
    stdout_queue.push(handleCurrenttime);
    vlc.stdin.write("get_time\n")
    const value = await awaitParameter("currenttime")
        .then((data) => {
            res.send({status: "OK", data})
        })
})

app.post("/getplaylist", async (req, res) => {
    parameters["playlist"] = null;
    stdout_queue.push(handlePlaylist);
    vlc.stdin.write("playlist\n")
    const value = await awaitParameter("playlist")
        .then((data) => {
            res.send({status: "OK", data})
        })
})

async function updateParameter(vlccmd, paramname, cb){
    return new Promise(async (resolve, reject) => {
        parameters[paramname] = null;
        stdout_queue.push(cb);
        vlc.stdin.write(vlccmd+"\n")
        await awaitParameter(paramname).then(async (data) => {
            resolve(data)
        })
    })
}

app.post("/gettimeline", async (req, res) => {
    updateParameter("get_time", "currenttime", handleCurrenttime)
    .then(() => {
        updateParameter("get_length", "currentlength", handleCurrentlength)
        .then(() => {
            res.send({status: "OK", parameters})
        })
    })
})

/*app.post("/info", async (req, res) => {
    parameters["currentlength"] = null;
    parameters["currenttime"] = null;

    stdout_queue.push(handleCurrenttime);
    vlc.stdin.write("get_time\n")
    
    stdout_queue.push(handleCurrentlength);
    vlc.stdin.write("get_length\n")
    
    Promise.all([awaitParameter("currenttime"), awaitParameter("currentlength")])
        .then((data) => {
            res.send({status: "OK", parameters})
        })
})*/

app.post("/getlength", async (req, res) => {
    parameters["currentlength"] = null;
    stdout_queue.push(handleCurrentlength);
    vlc.stdin.write("get_length\n")
    const value = await awaitParameter("currentlength")
        .then((data) => {
            res.send({status: "OK", data})
        })
})

app.post("/help", (req, res) => {
    const test = vlc.stdin.write("help\n")
    res.send({status: "OK"})
})

app.listen(3000, () => {
    console.log("Listen on the port 3000...");
});