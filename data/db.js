import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

mongoose.Promise = global.Promise
mongoose.set('useFindAndModify', false);

const env = process.argv[2] || 'dev'
if(env === 'dev')
    mongoose.connect('mongodb://localhost:27017/clients', { useNewUrlParser: true }, console.log("Base de datos: \x1b[32m%s\x1b[0m", "online"))
else if(env === 'prod')
    mongoose.connect('mongodb://mbobbio:mbobbio1010@ds155516.mlab.com:55516/cms', { useNewUrlParser: true }, () => console.log("Base de datos: \x1b[32m%s\x1b[0m", "online"))

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