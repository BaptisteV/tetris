var express = require("express");
var app = express();
var path = require("path");

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(express.static("../public"));

var knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: "tetrisdb.sqlite3"
    }
});

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + "/../public/index.html"));
});

app.get("/scores", function (req, res) {
    knex("score").orderBy("score", "desc").then(function (rows) {
        res.send(rows);
    });
});

app.post("/addScore", function (req, res) {
    console.log("addScore", req.body);
    var score = req.body;
        knex('score').insert({ score: score.score, name: score.name }).then(function () {
            res.sendStatus(200);
        });

});

app.listen(8080, function () {
    console.log("Tetris app listening on port 3000!");
});
