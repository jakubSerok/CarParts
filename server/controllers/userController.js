const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


// Create token
function createToken(user) {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      throw new Error("Secret key is not defined");
    }
    return jwt.sign(
      {
        _id: user._id,
        role: user.role,
      },
      secretKey,
      { expiresIn: "1h" }
    );
  }
  
// Register
const register = async (req, res) => {
  try {
    const { username, password, firstName, lastName, role } = req.body;
    const user = new User({ username, password, firstName, lastName, role });
    await user.save();
    res.status(201).send('User registered');
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// Login
const login = async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await User.findOne({ username });
  
      if (!user) {
        return res.json({ success: false, message: "Użytkownik nie istnieje" });
      } 
   
  
      if (!await bcrypt.compare(password, user.password)) {
        return res.json({
          success: false,
          message: "Nieprawidłowe dane logowania",
        });
      }
  
      const token = createToken(user);
      res.json({
        success: true,
        token,
        role: user.role,
      });
    } catch (error) {
      console.log(error);
      res.json({ success: false, message: "Error" });
    }
  };

module.exports = { register, login };