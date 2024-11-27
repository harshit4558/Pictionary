const socket = io('http://localhost:3000');
socket.on('connect', () => {
    console.log('connected new socket ');
});
let canDraw = false;
let isDrawing = false;

window.onload = () => {
    socket.emit('start-turn');
}

const canvas = document.getElementById("canvas");
const clearBtn = document.getElementById('clearBtn');
let ctx = canvas.getContext('2d');

        ctx.fillStyle = "black";
       
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 8 * (window.devicePixelRatio );
        
        ctx.lineCap = "round";
        let painting = false;
        let last;        
        let isTouchDevice = 'ontouchstart' in canvas;

        function resizeCanvas() {
            const dpr = window.devicePixelRatio;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        function getCanvasCoordinates(e) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            return { x, y };
        }

        if (isTouchDevice) {
            canvas.ontouchstart = (e) => {
                e.preventDefault();
                const { x, y } = getCanvasCoordinates(e.touches[0]);
                last = { x, y };
            };
        
            canvas.ontouchmove = (e) => {
                e.preventDefault();
                if (!last) return;
                const { x, y } = getCanvasCoordinates(e.touches[0]);
                drawLine(last.x, last.y, x, y);
                last = { x, y }; // Update `last` to current position
                socket.emit("draw", { x1: last.x, y1: last.y, x2: x, y2: y });
            };
        
            canvas.ontouchend = () => {
                last = null;
            };
        } else {
            canvas.onmousedown = (e) => {
                painting = true;
                const { x, y } = getCanvasCoordinates(e);
                last = { x, y };
            };
        
            canvas.onmousemove = (e) => {
                if (!painting || !last) return;
                const { x, y } = getCanvasCoordinates(e);
                drawLine(last.x, last.y, x, y);
                socket.emit("draw", { x1: last.x, y1: last.y, x2: x, y2: y });
                last = { x, y }; // Update `last` to current position
            };
        
            canvas.onmouseup = () => {
                painting = false;
                last = null; // Reset `last` after the drawing ends
            };
        
            canvas.onmouseleave = () => {
                painting = false;
                last = null; // Reset `last` if the mouse leaves the canvas
            };
        }
        
        function drawLine(x1, y1, x2, y2) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        // Clear canvas functionality
        clearBtn.addEventListener("click", () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
        
        // Handle drawing from the server
        socket.on("draw", (data) => {
            drawLine(data.x1, data.y1, data.x2, data.y2);
        });
let timeLeft = 60;
let timerDisplay = document.getElementById('timer-display');
socket.on('word', (data) => {
    document.getElementById('word-display').innerText = `${data}`;
            
});
socket.on('timer', (time) => {
    timeLeft = time;
    updateTimerDisplay(timeLeft);
});
function updateTimerDisplay(timeLeft){
    timerDisplay.innerText = `Time : ${timeLeft}`;
}
socket.on('users' ,(users) => {
    console.log(users);
});

socket.on('new-message', (msgText) => {
    console.log('back in cleint');
    const msgContainer = document.getElementById('messages');
    if(msgContainer){
        const msgElement = document.createElement('div');
        msgElement.textContent = msgText;
        msgContainer.appendChild(msgElement);
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }
});
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const msgContainer = document.getElementById('messages');
let mainWord = null;
socket.on('mainWord', (word)=> {
    const mainWord = word;
});
function sendGuess(){
    let msgText = chatInput.value.trim();

    if(msgText === mainWord){
        socket.emit('correct-guess');
    } else {
        socket.emit('new-message', msgText);
        const msgElement = document.createElement('div');
        msgElement.textContent = msgText;
        msgContainer.appendChild(msgElement);
        console.log('msg pushed to server');

        chatInput.value = '';
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('sendBtn');
    if(sendBtn){
        sendBtn.addEventListener('click', sendGuess);
    } else {
        console.error('sendBtn not found');
    }
});
chatInput.addEventListener('keypress', (event) =>{
    if(event.key === 'Enter'){
        sendGuess();
    }
});
socket.on('correct-guess', (message) => {
    const msgContainer = document.getElementById('messages');
    const msgElement = document.createElement('div');
    msgElement.textContent = message;  // This message will be like "Player X guessed the correct word!"
    msgElement.style.color = 'green'; // Optional: You can style it to highlight it

    // Append the new message to the chatbox
    msgContainer.appendChild(msgElement);
    msgContainer.scrollTop = msgContainer.scrollHeight;  // Scroll to the bottom of the messages
});
