import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

mongoose.Promise = global.Promise
mongoose.set('useFindAndModify', false);

const env = process.env.ENV || 'dev'
let adressDB;

if(env === 'dev') adressDB = 'mongodb://localhost/cms'
else if(env === 'prod') adressDB = 'mongodb://mbobbio:mbobbio1010@ds155516.mlab.com:55516/cms'
else if(env === 'docker') adressDB = 'mongodb://mongo:27017/cms'
  
mongoose.connect(adressDB, { useNewUrlParser: true })
.then(() => console.log("Base de datos: \x1b[32m%s\x1b[0m", "online"))
.catch(error => console.log(`Error al conectar la DB en ${env}`, error))


const ClientsSchema = new mongoose.Schema({
    name: String,
    surname: String,
    company: String,
    emails: Array,
    age: Number,
    orders: Array,
    type:String,
    seller: mongoose.Types.ObjectId,
})
const Clients = mongoose.model('clients', ClientsSchema)

const ProductsSchema = new mongoose.Schema({
    name: String,
    price: Number,
    stock:Number
})
const Products = mongoose.model('products', ProductsSchema)

const OrdersSchema = new mongoose.Schema({
    order: Array,
    total: Number,
    date: Date,
    client: mongoose.Types.ObjectId,
    status: String,
    seller: mongoose.Types.ObjectId,
})
const Orders = mongoose.model('orders', OrdersSchema)

const UserSchema = new mongoose.Schema({
    user: String,
    password: String,
    name: String,
    role: String
})
UserSchema.pre('save', function(next){
    if(!this.isModified('password')){
        return next();
    }
    bcrypt.genSalt(10, (err, salt) => {
        if(err) return next(err)
        bcrypt.hash(this.password, salt, (err, hash) => {
            if(err) return next(err)
            this.password = hash
            next()
        })
    })
})
const Users = mongoose.model('users', UserSchema)

export { Clients, Products, Orders, Users }
