// step1
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const port = 1200;
const password = process.env.pass



// step2
const app = express()
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use(session({
    secret:'express dog',
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 24 * 64000}
}))

app.use(passport.initialize());
app.use(passport.session())

// step 3
const userSchema = new mongoose.Schema({
    name:String,
    email : String,
    password:String
})
// step4
userSchema.plugin(passportLocalMongoose)

// Model
const User = new mongoose.model("user", userSchema);

passport.use(User.createStrategy())

// serialize
passport.serializeUser(User.serializeUser())

// deserialize
passport.deserializeUser(User.deserializeUser())

const connectionString = `mongodb+srv://Drazzy:${password}@cluster0.35p4stg.mongodb.net/?retryWrites=true&w=majority`
const connectDB = async()=>{
    await mongoose.connect(connectionString);
    console.log("db connectd");
}

app.post('/signup', async (req, res)=>{
    const {username, email, password} = req.body
     if(!username){
        return res.json({error: 'name is required'})
     }
     if(!email){
        return res.json({error: 'email is required'})
     }
     if(!password){
        return res.json({error: 'password is required'})
     }

     const existingUser = await User.findOne({email});

     if(existingUser){
        return res.json({error: "User already exist"})
     }

     const newuser = new User({
        email: email,
        username:username
     })
     User.register(newuser, password, function(err){
        if(err){
            console.log(err);
        }

        passport.authenticate("local")(req, res, function(){
            res.json({message : "Signed up successfully!"})
        })
     })
})

app.post("/login", async(req, res)=>{
    const {username, password} = req.body;
    if(!username){
        res.json({error: 'email is empty'})

    }
    if(!password){
        res.json({error: 'password required'})
    }

    const existingUser = await User.findOne({username})
    if(!existingUser){
       return res.json({error: "user not found, please sign up to continue"})
    }

    const passwordCorrect = await User.findOne({password:existingUser.password})
    if(!passwordCorrect){
        return res.json({error: "password is incorrect"})
    }

    const user = new User({
       username, 
        password
    })

    req.login( user, function(err){
        if(err){
            return res.json(err)
        }
        passport.authenticate("local")(req, res, function(){
            res.json({message: "Logged in successfully"})
        })
    })
})


app.get('/logout', (req, res)=>{
    req.logout(function(err){
        if(err){
            return res.json(err)
            
        }
        res.json({message: "logout successfully done"})
    })
})

app.get("/", (req, res)=>{
    const user = req.user;

    if(!req.isAuthenticated()){
        return res.json({error: "you are not authenticated"})
    }

    res.json({msg : "Welcome " + user?.username})
})

app.listen(port, async()=>{
    await connectDB();
    console.log("server started on port" + port);
})