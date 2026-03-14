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

mongoose.connect("mongodb+srv://patelkanostudent_db_user:Gkq4NiPhdz8QsuoP@kano.r6ypetl.mongodb.net/?appName=kano")

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
time:{type:Date,default:Date.now}
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

const storage = multer.diskStorage({
destination:"public/uploads/",
filename:(req,file,cb)=>{
cb(null,Date.now()+"_"+file.originalname)
}
})

const upload = multer({storage})

app.post("/upload",upload.single("file"),(req,res)=>{
res.send({url:"/uploads/"+req.file.filename})
})

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
