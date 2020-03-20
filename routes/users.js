const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const router = express.Router();
require('../config/passport')(passport);
const User = require('../models').User;
const keys = require("../config/keys");


const validateRegisterInput = require("../validation/register");
// const validateLoginInput = require("../validation/login");


// User register route
router.post('/register', (req, res) => {
  // Form validation
  const { errors, isValid } = validateRegisterInput(req.body);
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ where: { email: req.body.email}})
    .then(user => {
      if (user) {
        return res.status(400).json({ error: "Email is already exists"});
      } else {
        User.create({
          username: req.body.username,
          email: req.body.email,
          password: req.body.password
        })
        .then((user) => {
          // create jwt payload
          const payload = {
            id: user.id,
            name: user.username
          };
          // sign token
          jwt.sign(
            payload,
            keys.secretOrKey,
            {
              expiresIn: 31556926 // 1 year in seconds
            },
            (err, token) => {
              res.json({ success: true, token: token});
            }
          )
        })
        .catch((err) => {
          console.log(err);
          res.status(400).json(err);
        });
      }
    });
});

// User login route
router.post('/login', (req, res) => {
  User
    .findOne({
      where: {
        email: req.body.email
      }
    })
    .then(user => {
      if (!user) {
        return res.status(401).json({ error: 'User not found'})
      }
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (isMatch && !err) {
          const token = jwt.sign(JSON.parse(JSON.stringify(user)), keys.secretOrKey, {expiresIn: 8600 * 30});
          jwt.verify(token, keys.secretOrKey, (err, data) => {
            console.log(err, data);
          })
          res.json({ token: 'JWT ' + token});
        } else {
          res.status(401).json({error: 'Autentication failed'});
        }
      })
    })
    .catch(err => {
      console.log(err);
    });
});

module.exports = router;