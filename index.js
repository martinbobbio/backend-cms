import express from 'express'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
// Graphql
import { ApolloServer } from 'apollo-server-express'
import { typeDefs } from './data/schema'
import { resolvers } from './data/resolvers'

dotenv.config({path: 'variables.env'})

const port = process.env.PORT || 5000
const app = express()
const server = new ApolloServer({typeDefs, resolvers, context: async({req}) => {
    const token = req.headers['authorization']
    if(token !== "null"){
        try{
            const user = await jwt.verify(token, process.env.SECRET)
            req.user = user
            return {
                user
            }
        }catch(error){
            console.error(error)
        }
    }
}})

server.applyMiddleware({app})

app.listen({port}, () => console.log(`Server run in:${port}${server.graphqlPath} \x1b[32m%s\x1b[0m`, "online"))