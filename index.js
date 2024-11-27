import { words } from './public/words.js';
import path from  'path';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';


const app = express();
const server = http.createServer(app);
const io = new Server(server);
const __dirname = path.dirname(new URL(import.meta.url).pathname);
app.use(express.static(path.join(__dirname, 'public', )));

app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

let hostId = null

const users = [];

io.on('connection', (socket) => {
    console.log('connection reached backend');
    const playerName = `Player ${users.length + 1}`;
    const isHost = hostId === null;
    users.push({
        id : socket.id,
        score : null,
        name : playerName,
        isHost : isHost,
        canDraw : false,
    });
    console.log(users);
    if(isHost){
        hostId = socket.id;
        console.log('host', hostId);
    }
    socket.on('draw', (data) => {
        socket.broadcast.emit('draw', data);
    });
    socket.on('new-message',(msgText) => {
        socket.broadcast.emit('new-message', msgText);
    });
    socket.on('start-turn', () => {
        if(socket.id == hostId){
            startTurn();
        }
    });
    socket.on('correct-guess', () => {
        const user = users.find(user => user.id === socket.id); // Find the user who made the correct guess
    
        if (user) {
            // Increase the user's score when they guess correctly
            user.score = (user.score || 0) + 10;
    
            // Emit a message to all connected clients announcing the correct guess
            const message = `${user.name} guessed the correct word! 🎉`;
            io.emit('correct-guess', message); // Broadcast to all users
    
            // Emit the updated leaderboard to all users
            io.emit('update-leaderboard', users);
        }
    });
    socket.on('disconnect', () => {
        console.log('a user disconnected');
        setTimeout(() => {
            const index = users.findIndex(user => user.id === socket.id);
            if(index !== -1){
                users.splice(index,1);
            } if(socket.id === hostId && users.length > 0){
                hostId = users[0].id;
                io.emit('host-changed', hostId)
            }
            io.emit('users', users);
        },5000);
       
    });

})
let currentWord;
let currentplayerindex = 0;
function startTurn(){
    console.log('inside startturn');
    if(users.length === 0) return ;

    const currentPlayer = users[currentplayerindex];
    currentWord = words[Math.floor(Math.random() * words.length)];
    if(currentPlayer){
        currentPlayer.canDraw = true;
        io.to(currentPlayer.id).emit('word', currentWord);
        io.emit('mainWord', currentWord);
        io.to(currentPlayer.id).emit('can-draw', true);
        
        let timeLeft = 60;
        const countdown = setInterval(() => {
            timeLeft--;
            io.to(currentPlayer.id).emit('timer', timeLeft);
            if(timeLeft <= 0){
                clearInterval(countdown);
                nextTurn();
            }
        }, 1000);
    }
}    
function nextTurn(){
    currentplayerindex = (currentplayerindex + 1) % users.length;
    startTurn();
}




server.listen(PORT, () => {
    console.log(`server is listening fro connections on ${PORT}`);
})