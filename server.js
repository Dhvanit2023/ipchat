const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const mongoose = require("mongoose")
const multer = require("multer")
const path = require("path")

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.json())
app.use(express.static("public"))

mongoose.connect(process.env.MONGO_URL)
// ================= USERS =================

const User = mongoose.model("User",{
username:String,
password:String
})

// ================= MESSAGE =================

const Message = mongoose.model("Message",{
room:String,
username:String,
message:String,
time:{
type:Date,
default:Date.now,
expires:86400   // 24 hours in seconds
}
})
// ================= ROOMS =================

let rooms={}

// ================= REGISTER =================

app.post("/register",async(req,res)=>{

let u = new User(req.body)

await u.save()

res.send("ok")

})

// ================= LOGIN =================

app.post("/login",async(req,res)=>{

let u = await User.findOne(req.body)

if(u) res.send("ok")
else res.send("fail")

})

// ================= CREATE ROOM =================
app.post("/create-room",(req,res)=>{

let {room,name,max,question,answer} = req.body

if(rooms[room]) return res.send("exists")

rooms[room]={
name,
max:parseInt(max),
question,
answer,
users:[],
createdAt: Date.now(),              // room creation time
expiresAt: Date.now() + (24*60*60*1000)  // expires after 24 hours
}

res.send("ok")

})
// ================= FILE UPLOAD =================
// ================= FILE UPLOAD =================

const storage = multer.diskStorage({
destination:"public/uploads/",
filename:(req,file,cb)=>{
cb(null,Date.now()+"_"+file.originalname)
}
})

const upload = multer({
storage,
limits:{ fileSize:10*1024*1024 } // 10MB
})

app.post("/upload",upload.single("file"),(req,res)=>{

if(!req.file){
return res.status(400).send("Upload failed")
}

res.send({
url:"/uploads/"+req.file.filename,
name:req.file.originalname
})

})
// ================= AUTO DELETE OLD FILES =================

const fs = require("fs")

setInterval(()=>{

const folder = path.join(__dirname,"public/uploads")

fs.readdir(folder,(err,files)=>{

if(err) return

files.forEach(file=>{

const filePath = path.join(folder,file)

fs.stat(filePath,(err,stats)=>{

if(err) return

const age = Date.now() - stats.mtimeMs
const limit = 24*60*60*1000 // 24 hours

if(age > limit){

fs.unlink(filePath,err=>{
if(!err){
console.log("Deleted old upload:",file)
}
})

}

})

})

})

},60*60*1000) // check every 1 hour

// ================= SOCKET =================

io.on("connection",(socket)=>{

socket.on("join",async(data)=>{

let {username,room,answer}=data

let r=rooms[room]

if(!r){
socket.emit("error","Room not found")
return
}

if(r.users.length>=r.max){
socket.emit("error","Room full")
return
}

if(r.answer && r.answer!=answer){
socket.emit("error","Wrong answer")
return
}

socket.join(room)

socket.username=username
socket.room=room

r.users.push(username)

io.to(room).emit("userlist",r.users)

io.to(room).emit("system",{msg:username+" joined",color:"green"})

let old = await Message.find({room}).limit(50)

socket.emit("history",old)

})

// ================= CHAT =================

socket.on("chat",async(data)=>{

let msg=new Message(data)

await msg.save()

io.to(data.room).emit("chat",data)

})

// ================= TYPING =================

socket.on("typing",(d)=>{
socket.to(d.room).emit("typing",d.username+" typing...")
})

// ================= DISCONNECT =================

socket.on("disconnect",()=>{

let r=socket.room
let u=socket.username

if(!r) return

rooms[r].users=rooms[r].users.filter(x=>x!=u)

io.to(r).emit("userlist",rooms[r].users)

io.to(r).emit("system",{msg:u+" left",color:"red"})

})

})



server.listen(3000,()=>{

console.log("http://localhost:3000")

})
