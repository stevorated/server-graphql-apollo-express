import Joi from '@hapi/joi'

const email = Joi.string().email().required().label('Email')
const username = Joi.string().alphanum().min(4).max(30).required().label('Username')
const fname = Joi.string().min(2).max(100).required().label('First Name')
const lname = Joi.string().min(2).max(100).required().label('Last Name')
const usernameUpdate = Joi.string().alphanum().min(4).max(30).label('Username')
const fnameUpdate = Joi.string().min(2).max(100).label('First Name')
const lnameUpdate = Joi.string().min(2).max(100).label('Last Name')
const password = Joi.string().min(6).max(30).regex(/^(?=.*[a-z])(?=.*[A-Z])[A-Za-z\d@$!%#*^?&]{6,30}$/).required().label('Password').options({
  language: {
    string: {
      regex: {
        base: 'Between 6 and 30 characters, with at least one uppercase letter & one lowercase letter. (but that\'s not really enough. '
      }
    }
  }
})
// const password = Joi.string().min(8).max(30).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*^?&#])[A-Za-z\d@$!%#*^?&]{8,30}$/).required().label('Password').options({
//   language: {
//     string: {
//       regex: {
//         base: 'Between 8 and 30 characters, at least one uppercase letter, one lowercase letter, one number and one special character'
//       }
//     }
//   }
// })

export default Joi.object().keys({
  email,
  username,
  fname,
  lname,
  password
})

export const signUp = Joi.object().keys({
  email,
  username,
  fname,
  lname,
  password
})

export const signIn = Joi.object().keys({
  email,
  password
})

export const updateMyProfile = Joi.object().keys({
  username: usernameUpdate,
  fname: fnameUpdate,
  lname: lnameUpdate
})
