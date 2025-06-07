import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)
dotenv.config();

import {Client, GatewayIntentBits} from 'discord.js'
import { Prisma } from '../prisma/generated';


const prisma = new PrismaClient();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})

const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.log('Token do discord não definido no arquivo .env')
    process.exit(1);
}

client.once('ready', () =>{
    console.log('Bot está online!')
})

client.on('messageCreate',async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!criarevento')) {
        const args = message.content.slice('!criarevento'.length).trim()
        
        const partes = args.split('|').map(p => p.trim())

        if (partes.length < 3) {
            return message.channel.send('Use o comando assim: !criarevento Titulo | Descrição | Data')
        }

        const [titulo, descricao = null, dataStr] = partes
        const data = dayjs(dataStr, 'DD/MM/YYYY')

        if (!data.isValid()){
            return message.channel.send('Data inválida. Use o formato: DD/MM/YYYY')
        }

        try {
            const evento = await prisma.evento.create({
                data: {
                    titulo,
                    descricao,
                    data: data.toDate(),
                },
            })

            message.channel.send(`Evento criado com ID: ${evento.id}`)
        }catch (e){
            console.error(e)
            message.channel.send('Erro ao criar o evento!')
        }

    }

    if (message.content.startsWith('!verificar')) {
        const parts = message.content.split(' ')
        const id = parseInt(parts[1])

        if (isNaN(id)){
            return message.reply('Por favor, forneça um ID válido: Ex: "!verificar 1"')
        }

        const evento = await prisma.evento.findUnique({
            where: {id}
        })

        if (!evento) {
            return message.reply(`Nenhum evento encontrado com ID ${id}`)
        }

        const resposta = `📅 **Evento #${evento.id}**
            **Título:** ${evento.titulo}
            **Descrição:** ${evento.descricao ?? 'Sem descrição'}
            **Data:** ${evento.data.toLocaleDateString('pt-BR')}
            **Criado em:** ${evento.criadoEm.toLocaleDateString('pt-BR')}`;

            return message.channel.send(resposta)
    }

    if (message.content.startsWith('!lista')){
        const lista = await prisma.evento.findMany({
            orderBy: { data: 'asc' }
        })

        if (lista.length === 0){
            return message.reply('Não existe nada no momento')
        }

        const resposta = lista.map(lista => {
            return `🆔 ${lista.id} | **${lista.titulo}** - ${lista.data.toLocaleDateString('pt-BR')}`
        }).join('\n')

        return message.channel.send(`📋 **Eventos cadastrados:**\n${resposta}`)
    }

    async function ProcessInValid() {
        const agora = new Date()

        const eventosVencidos = await prisma.evento.findMany({
            where: { },
        })

        for (const evento of eventosVencidos) {
            return message.channel.send(`Processando evento vencido: ${evento.titulo}`)

        
        }

    }

})

client.login(token)

