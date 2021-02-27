require("dotenv").config();
const config = require("./config/index");

const mongoose = require("mongoose");
const express = require("express");
const emailValidator = require("deep-email-validator");

const app = express();

const Comment = require("./model/Comment");

const regexMessage = /(com|org|net|int|vn|edu|gov|mil)/gm;

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

const MONGODB_URI = process.env.MONGODB_URI || config.MONGODB_URI;

mongoose
  .connect(MONGODB_URI, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected"));

const SECRET_HEADERS = ["X-Powered-By", "Server"];

app.use((req, res, next) => {
  SECRET_HEADERS.forEach((item) => {
    res.removeHeader(item);
  });
  next();
});

app.get("/", async (req, res) => {
  const comments = await Comment.find();
  res.render("index", { comments: comments });
});

app.post("/comments", async (req, res) => {
  const { name, email, job, message } = req.body;

  const validEmailExists = await emailValidator.validate(email);
  console.log(validEmailExists);
  if (!validEmailExists.valid) {
    return res.send("NOT_EXISTS_SMTP");
  }

  const comment = await Comment.findOne({ email: email });
  if (comment) {
    return res.send("EMAIL_EXISTED");
  }

  if (regexMessage.test(message)) {
    return res.send("MSG_INVALID");
  }

  const newComment = {
    name: name,
    email: email,
    job: job,
    message: message,
  };
  Comment.create(newComment, (err, res) => {
    if (err) throw err;
  });
  res.send("OK");
});

const PORT = process.env.PORT || config.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
