const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost/employee-api", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Employee model
const employeeSchema = new mongoose.Schema({
  name: String,
  age: Number,
  address: String,
  contacts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
    },
  ],
});
const Employee = mongoose.model("Employee", employeeSchema);

// Contact model
const contactSchema = new mongoose.Schema({
  type: String,
  value: String,
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
  },
});
const Contact = mongoose.model("Contact", contactSchema);

// Create a new employee with contacts
app.post("/employees", async (req, res) => {
  try {
    const { name, age, address, contacts } = req.body;

    const employee = await Employee.create({ name, age, address });

    for (const contact of contacts) {
      await Contact.create({
        type: contact.type,
        value: contact.value,
        employee: employee._id,
      });
    }

    res.status(201).json({ message: "Employee created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// List employees with pagination
app.get("/employees", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: "contacts",
    };

    const employees = await Employee.paginate({}, options);

    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Update an employee
app.put("/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, address } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      id,
      { name, age, address },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Delete an employee
app.delete("/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await Contact.deleteMany({ employee: employee._id });

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Get an employee
app.get("/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id).populate("contacts");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
