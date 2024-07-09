require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const projectSchema = new mongoose.Schema({
  name: String,
  id: String,
  image: String,
  link: String,
  users: [String],
});
const Project = mongoose.model("Project", projectSchema);

const userSchema = new mongoose.Schema({
  uid: String,
  selected_project: String,
});

const User = mongoose.model("User", userSchema);

// ___________________________________________________________
// get all the projects on home-page

app.get("/api/v1/projects/getAll", async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ___________________________________________________________
// view the user selected project

app.get("/api/v1/projects/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ UID: req.params.userId });
    if (user) {
      const project = await Project.findOne({ ID: user.selected_project });
      res.json(project);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ___________________________________________________________
// View a particular project

app.get("/api/v1/get/project/:projectId", async (req, res) => {
  try {
    const project = await Project.findOne({ ID: req.params.projectId });
    if (project) {
      res.json(project);
    } else {
      res.status(404).json({ message: "Project not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ___________________________________________________________
// Select a project

app.post("/api/v1/selectProject", async (req, res) => {
  const { uid, projectId } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { uid },
      { selected_project: projectId },
      { new: true, upsert: true }
    );

    const project = await Project.findOneAndUpdate(
      { id: projectId },
      { $addToSet: { users: uid } },
      { new: true }
    );

    res.status(200).json({ user, project });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ___________________________________________________________
// Check if a project has two users

app.get("/api/v1/checkUsers/:projectId", async (req, res) => {
  try {
    const project = await Project.findOne({ id: req.params.projectId });

    if (project) {
      const hasTwoUsers = project.users.length === 2;
      res.json({ hasTwoUsers });
    } else {
      res.status(404).json({ message: "Project not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ___________________________________________________________
// Create a new user

app.post("/api/v1/users", async (req, res) => {
  const { uid, selected_project } = req.body;
  const user = new User({ uid, selected_project });

  try {
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ___________________________________________________________
// Create a new project

app.post("/api/v1/projects", async (req, res) => {
  const { name, id, image, link, users } = req.body;
  const project = new Project({ name, id, image, link, users });

  try {
    const savedProject = await project.save();
    res.status(201).json(savedProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ___________________________________________________________

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
