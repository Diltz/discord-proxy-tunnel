import Fastify, { FastifyRequest } from 'fastify'
import axios from 'axios'
import { config } from 'dotenv'

// dotenv

config()

//

const allowedMethods = ['PATCH', 'GET', 'POST', 'DELETE']
const server = Fastify({
    logger: true,
    trustProxy: true
})

type api_request = FastifyRequest<{
    Params: {
        guild: string,
        token: string
    }
}>

server.all('/api/webhooks/:guild/:token', async (request: api_request, response) => {
    const definedMethod = request.method
    const {guild, token} = request.params

    if (!allowedMethods.find(method => method == definedMethod)) {
        response.code(405)

        return response.send({
            message: 'Method not allowed'
        })
    }

    const api_response = await axios({
        method: definedMethod,
        url: `https://discord.com/api/webhooks/${guild}/${token}`,
        data: request.body,
        headers: {
            "User-Agent": 'proxy/1.0'
        }
    })

    response.code(api_response.status)
    response.send(api_response.data)
})

const start = async () => {
    try {
        // setup ratelimit

        await server.register(import('@fastify/rate-limit'), {
            max: 30,
            allowList: function (request) {
                return request.headers['proxified'] == 'internal'
            }
        })

        //

        await server.listen({port: Number(process.env.port)})
        console.log(`Server started`)
    } catch (err) {
        server.log.error(err)
    }
}

start()