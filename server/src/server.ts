import express from 'express'
import cors from 'cors'

import { PrismaClient } from '@prisma/client'
import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes'
import { convertMinutesToHourString } from './utils/conver-minutes-to-hour-string'

const app = express()

app.use(express.json())
app.use(cors())

const prisma = new PrismaClient()


app.get('/games', async (request, response) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    ads:true
                }
            }
        }
    })

    return response.json(games);
});

app.post('/games/:id/ads', async (request, response) => {
    const gameId = request.params.id;
    const body: any = request.body;
    
    //validação - Biblioteca = Zode

    const ad = await prisma.ad.create({
        data: {
            gameId,
            name: body.name,
            yearsPlaying: body.yearsPlaying,
            discord: body.discord,
            weekDays: body.weekDays.join(','),
            hourStart: convertHourStringToMinutes(body.hourStart),
            hourEnd: convertHourStringToMinutes(body.hourEnd),
            useVoiceChannel: body.useVoiceChannel,
        }
    })

    return response.status(201).json(ad);
});

app.get('/games/:id/ads', async (request, response) => {
    const gameId = request.params.id;

    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            weekDays: true,
            useVoiceChannel: true,
            yearsPlaying: true,
            hourStart:true,
            hourEnd:true,
        },
        where: {
            gameId,
        },
        orderBy: {
            createdAt: 'desc',
        },
    })

    return response.json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hourStart: convertMinutesToHourString(ad.hourStart),
            hourEnd: convertMinutesToHourString(ad.hourEnd),
        }
    }))
});

app.get('/ads/:id/discord', async (request, response) => {
    const adId = request.params.id;

    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true,
        },
        where: {
            id:adId
        }
    })

    return response.json({
        discord: ad.discord,
    })
});

app.listen(3333)


//HTTP methods / API RESTful / HTTP Codes

/*  
    -- HTTP METHODS -- 

    GET
    POST
    PUT
    PATCH  
    DELETE 

*/

/*  
    -- API RESTful -- 

    Precisa de uma padronização no uso dos http methods:
    
    GET(buscar info), 
    POST(criar algo), 
    PUT(editar vários campos), 
    PATCH (editar um campo, [booleano: y/n]), 
    DELETE (deletar) ...

*/

/*  
    -- HTTP CODES -- 

    Informa se os envios foram realizados com sucesso ou não.
    (status(201).) = Começam com o número '2' = sucesso;
    (status(300).) = Começam com o número '3' = redirecionamento;
    (status(400).) = Começam com o número '4' = erros gerados pela aplicação;
    (status(500).) = Começam com o número '5' = erros inesperados; 

    mais info = http codes mdn (google.com);
*/

/*
    -- TIPOS DE PARÂMETROS --

    *Query: São utilizados quando precisamos persistir "estado" reconhecido pelo sinal"?".
            Quando entramos em um site e colocamos os filtros e enviamos a URL para alguém
            acessar, mas quando a pessoa acessa não está com os filtros, ou seja, ela perdeu
            o "estado". Geralmente o usamos para filtro, ordenação, paginação, coisas que não 
            são sensíveis. Vale ressaltar que eles sempre são nomeados, que nesse caso o '2' e
            o 'title' são as nomeações.

                 ex: localhost:3333/ads?page=2&sort=title
    
    *Route: Diferentemente do Query, eles não são nomeados. No exemplo abaixo estamos querendo
            acessar o anuncio que tem o id='5' ou 'como-criar-uma-api-em-node'. Nós utilizamos
            o Route quando queremos identificar um recurso. 
                
                ex: localhost:3333/ads/5
                    localhost:3333/post/como-criar-uma-api-em-node
    
    *Body: Usamos para quando queremos enviar várias informações sensíveis em uma única 
           requisição, geralmente para envio de formulário. Ele é sensível, desta forma 
           a requisição não fica visível na URL.

                ex: Criação de um usuário (nome, e-mail, senha, dados pessoais, etc...)

*/