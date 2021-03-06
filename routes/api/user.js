const mongoose=require("mongoose")
const express=require("express")
const router=express.Router()
const { check, validationResult } = require('express-validator/check')
const app=express()
const gravatar=require('gravatar')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const config=require('config')

const Point=require('../../node')
const User=require('../../user')
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
mongoose.connect('mongodb://localhost:27017/MindMap',{useNewUrlParser:true,useCreateIndex:true, useUnifiedTopology:true})
router.post('/',
[
    check('name','Name is required').not().isEmpty(),
    check('email','Please include a valid email').isEmail(),
    check('password','Please enter a password with 6 or more characters').isLength({min:6})
],
async(req,res)=>{
    console.log(req.body)
    const errors=validationResult(req)
    if (!errors.isEmpty())
    {
   
    return res.status(400).json({errors:errors.array()})
    }


    
    const{name,email,password}=req.body
    try{
        let user=await User.findOne({email})
        if (user){
         return res.status(400).json({errors:[{msg:'User alreaady exists'}]})
        }
        const avatar=gravatar.url(email,{
            s: '200',
            r: 'pg',
            d: 'mm'
        })
        user=new User({
            name,password,avatar,email
        })
        console.log(user)
        const salt=await bcrypt.genSalt(10)
        user.password=await bcrypt.hash(password,salt)
        await user.save()
        const payload={
            user:{
                id:user.id
            }
        }
        jwt.sign(
            payload,
            config.get('jwtSecret'),
            {expiresIn:3600},
            (err,token)=>{
                if(err) throw err
                res.json({token})
            }
        )
        
    }
    catch(err){
        console.error(err.message)
       res.status(500).send('Server error')
    }
})
module.exports= router