const socket = io()

const username = localStorage.user
const room = localStorage.room
const answer = localStorage.answer

socket.emit("join",{username,room,answer})

const messages = document.getElementById("messages")
const msg = document.getElementById("msg")
const userlist = document.getElementById("userlist")
const typing = document.getElementById("typing")

const emojiBox = document.getElementById("emojiBox")
const gifBox = document.getElementById("gifBox")
const stickerBox = document.getElementById("stickerBox")

// ================= SEND =================

function send(){

const message = msg.value.trim()

if(!message) return

socket.emit("chat",{room,username,message})

msg.value=""

}

// ================= MESSAGE RENDER =================

function renderMessage(usernameText,messageText){

const div = document.createElement("div")
div.classList.add("message")

const name = document.createElement("b")
name.textContent = usernameText + ": "

div.appendChild(name)

if(messageText.startsWith("http") &&
(messageText.includes(".gif") ||
messageText.includes(".png") ||
messageText.includes(".jpg") ||
messageText.includes(".webp"))){

const img = document.createElement("img")
img.src = messageText
img.style.maxWidth="200px"

div.appendChild(img)

}

else if(
messageText.includes("<") ||
messageText.includes("{") ||
messageText.includes(";") ||
messageText.includes("\n")
){

const pre = document.createElement("pre")
const code = document.createElement("code")

code.textContent = messageText

pre.appendChild(code)

const copyBtn = document.createElement("button")
copyBtn.textContent="Copy Code"
copyBtn.className="copyBtn"

copyBtn.onclick=()=>{
navigator.clipboard.writeText(messageText)
copyBtn.textContent="Copied"
setTimeout(()=>copyBtn.textContent="Copy Code",1500)
}

div.appendChild(copyBtn)
div.appendChild(pre)

}

else{

const span = document.createElement("span")
span.textContent = messageText
div.appendChild(span)

}

messages.appendChild(div)
messages.scrollTop = messages.scrollHeight

}

// ================= CHAT =================

socket.on("chat",d=>{
renderMessage(d.username,d.message)
})

// ================= HISTORY =================

socket.on("history",msgs=>{
msgs.forEach(m=>{
renderMessage(m.username,m.message)
})
})

// ================= USERS =================

socket.on("userlist",list=>{

userlist.innerHTML=""

list.forEach(u=>{
const li=document.createElement("li")
li.textContent=u
userlist.appendChild(li)
})

})

// ================= SYSTEM =================

socket.on("system",d=>{

const div=document.createElement("div")
div.style.color=d.color
div.textContent=d.msg
messages.appendChild(div)

})

// ================= TYPING =================

msg.oninput=()=>{
socket.emit("typing",{room,username})
}

socket.on("typing",t=>{
typing.textContent=t
setTimeout(()=>typing.textContent="",1000)
})

// ================= CLOSE PANELS =================

function closePanels(){
emojiBox.style.display="none"
gifBox.style.display="none"
stickerBox.style.display="none"
}

// ================= EMOJI =================

const emojis=['😀','😂','😍','😎','😢','😡','👍','🙏','🔥','🎉','🥳','🤔','😴']

function toggleEmoji(){

if(emojiBox.style.display==="block"){
emojiBox.style.display="none"
return
}

closePanels()

emojiBox.style.display="block"
emojiBox.innerHTML=""

emojis.forEach(e=>{
const span=document.createElement("span")
span.textContent=e

span.onclick=()=>{
msg.value+=e
emojiBox.style.display="none"
}

emojiBox.appendChild(span)
})

}

// ================= GIF =================

const gifs=[
"https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif",
"https://media.giphy.com/media/l0HlNaQ6gWfllcjDO/giphy.gif",
"https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif"
]

function toggleGIF(){

if(gifBox.style.display==="block"){
gifBox.style.display="none"
return
}

closePanels()

gifBox.style.display="block"
gifBox.innerHTML=""

gifs.forEach(g=>{
const img=document.createElement("img")
img.src=g
img.width=100

img.onclick=()=>{
socket.emit("chat",{room,username,message:g})
gifBox.style.display="none"
}

gifBox.appendChild(img)
})

}

// ================= STICKER =================

const stickers=[
"https://i.imgur.com/1Sm8XGk.png",
"https://i.imgur.com/z9d9Z5D.png",
"https://i.imgur.com/BQvsKDA.png"
]

function toggleSticker(){

if(stickerBox.style.display==="block"){
stickerBox.style.display="none"
return
}

closePanels()

stickerBox.style.display="block"
stickerBox.innerHTML=""

stickers.forEach(s=>{
const img=document.createElement("img")
img.src=s
img.width=80

img.onclick=()=>{
socket.emit("chat",{room,username,message:s})
stickerBox.style.display="none"
}

stickerBox.appendChild(img)
})

}
function logout(){

localStorage.removeItem("user")
localStorage.removeItem("room")
localStorage.removeItem("answer")

window.location.href = "login.html"

}
if(!localStorage.user){

window.location.href = "login.html"

}