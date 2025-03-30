const express = require("express");
const socket = require("socket.io");
const http = require("http");
const path = require("path");
const { Chess } = require("chess.js");
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socket(server);
const chess = new Chess();
const players = {};

app.set("view engine", "ejs");
app.use("/public", express.static(path.join(__dirname, "public")));


const indexRouter = require("./routes"); 
app.use("/", indexRouter); // Use the routes file

io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("spectator");
    }

    socket.on("disconnect", () => {
        if (socket.id === players.white) {
            console.log("White disconnected, Black wins!");
            delete players.white;
        } else if (socket.id === players.black) {
            console.log("Black disconnected, White wins!");
            delete players.black;
        }
    });

    socket.on("move", (move) => {
        try {
            if (chess.turn() === "w" && socket.id !== players.white) return;
            if (chess.turn() === "b" && socket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                socket.emit("invalidMove", move);
            }
        } catch (err) {
            socket.emit("invalidMove", move);
        }
    });
});


server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

