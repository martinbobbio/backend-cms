import { Clients, Products, Orders, Users } from './db'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

const createToken = (authUser, secret, expiresIn) => {
    const { user } = authUser
    return jwt.sign({user}, secret, {expiresIn})
}

dotenv.config({path: 'variables.env'})

export const resolvers = {
    Query:{
        getClients: (root, {limit, offset}) =>{
            return Clients.find({}).limit(limit).skip(offset)
        },
        getClient: (root, {id}) => {
            return new Promise((resolve, reject) => {
                Clients.findById(id, (error, client) => {
                    if(error) reject(error)
                    else resolve(client)
                })
            })
        },
        getTotalClients: (root) => {
            return new Promise((resolve, reject) => {
                Clients.countDocuments({}, (error, count) => {
                    if(error) reject(error)
                    else resolve(count)
                })
            })
        },
        getTopClients: (root) => {
            return new Promise((resolve, reject) => {
                 Orders.aggregate([
                     { $match:{status:"COMPLETED"} },
                     { $group:{_id:"$client", total: {$sum:"$total"}} },
                     { $lookup:{from:"clients", localField: "_id", foreignField:"_id", as: "client"} },
                     { $sort:{total:-1} },
                     { $limit:10 },
                 ], (error, result) => {
                    if(error) reject(error)
                    else resolve(result)
                 })
            })
        },
        getProducts: (root, {limit, offset, stock}) =>{
            let filter
            if(stock) filter = { stock:{ $gt:0 } }
            return Products.find(filter).limit(limit).skip(offset)
        },
        getProduct: (root, {id}) => {
            return new Promise((resolve, reject) => {
                Products.findById(id, (error, product) => {
                    if(error) reject(error)
                    else resolve(product)
                })
            })
        },
        getTotalProducts: (root) => {
            return new Promise((resolve, reject) => {
                Products.countDocuments({}, (error, count) => {
                    if(error) reject(error)
                    else resolve(count)
                })
            })
        },
        getOrders: (root, {client}) =>{
            return new Promise((resolve, reject) => {
                Orders.find({client}, (error, order) =>{
                    if(error) reject(error)
                    else resolve(order)
                })
            })
        },
        getUser: (root, args, { user }) => {
            if(!user) return null
            const userAux = Users.findOne({user:user.user})
            return userAux
        },
    },
    Mutation:{
        createClient: (root, {input}) => {
            const newClient = new Clients({
                name : input.name,
                surname : input.surname,
                company : input.company,
                emails : input.emails,
                age : input.age,
                type : input.type,
                orders : input.orders,
            })
            newClient.id = newClient._id
            return new Promise((resolve, reject) => {
                newClient.save((error) => {
                    if(error) reject(error)
                    else resolve(newClient)
                })
            })
        }, 
        updateClient: (root, {input}) => {
            return new Promise((resolve, reject) => {
                Clients.findOneAndUpdate({_id:input.id}, input, {new:true}, (error, client) => {
                    if(error) reject(error)
                    else resolve(client)
                })
            })
        },
        deleteClient: (root, {id}) => {
            return new Promise((resolve, reject) => {
                Clients.findOneAndRemove({_id:id}, (error) => {
                    if(error) reject(error)
                    else resolve("The client was deleted.")
                })
            })
        },
        createProduct: (root, {input}) => {
            const newProduct = new Products({
                name : input.name,
                price : input.price,
                stock : input.stock,
            })
            newProduct.id = newProduct._id
            return new Promise((resolve, reject) => {
                newProduct.save((error) => {
                    if(error) reject(error)
                    else resolve(newProduct)
                })
            })
        },
        updateProduct: (root, {input}) => {
            return new Promise((resolve, reject) => {
                Products.findOneAndUpdate({_id:input.id}, input, {new:true}, (error, product) => {
                    if(error) reject(error)
                    else resolve(product)
                })
            })
        },
        deleteProduct: (root, {id}) => {
            return new Promise((resolve, reject) => {
                Products.findOneAndRemove({_id:id}, (error) => {
                    if(error) reject(error)
                    else resolve("The product was deleted.")
                })
            })
        },
        createOrder: (root, {input}) => {
            const newOrder = new Orders({
                order : input.order,
                total : input.total,
                date : new Date(),
                client : input.client,
                status : "PENDING",
            })
            newOrder.id = newOrder._id
            return new Promise((resolve, reject) => {
                newOrder.save((error) => {
                    if(error) reject(error)
                    else resolve(newOrder)
                })
            })
        },
        updateOrder: (root, {input}) => {
            return new Promise((resolve, reject) => {

                const { status } = input
                
                let operation
                if(status === 'COMPLETED') operation = '-'
                else if(status === 'CANCELED') operation = '+'

                input.order.forEach(order => {
                    Products.findOneAndUpdate({ _id : order.id }, 
                        { $inc:
                            { stock: `${operation}${order.count}` }
                        },{new:false}, (error) => {
                            if (error) throw new Error(error)
                    })
                })
                Orders.findOneAndUpdate({_id:input.id}, input, {new:true}, (error, order) => {
                    if(error) reject(error)
                    else resolve(order)
                })
            })
        },
        createUser:  async (root, {user, password}) => {
            const existsUser = await Users.findOne({user})
            if(existsUser) throw new Error('The user exists')

            await new Users({ user, password }).save()

            return true
        },
        authUser:  async (root, {user, password}) => {

            const userAux = await Users.findOne({user})
            if(!userAux) throw new Error('User not found')

            const passwordCorrect = await bcrypt.compare(password, userAux.password)
            if(!passwordCorrect) throw new Error('Password incorrect')

            return {
                token: createToken(userAux, process.env.SECRET, '1hr')
            }
        }
    }
}