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
// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      throw new Error('Secret key is not defined');
    }
    
    const decoded = jwt.verify(token, secretKey);
    const user = await User.findById(decoded._id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = { register, login, getUserProfile, authenticate };