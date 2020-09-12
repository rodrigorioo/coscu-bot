require('dotenv').config({ path: __dirname + '/.env' });
const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();

const app = require('./src');

const prefix = 'c!';

// client.on('message', message => {
//
//     if (!message.content.startsWith(prefix) || message.author.bot) return;
//
//     const args = message.content.slice(prefix.length).trim().split(/ +/);
//     const command = args.shift().toLowerCase();
//
//     if (command === 'stats') {
//         return message.channel.send(`Server count: ${client.guilds.cache.size}`);
//     }
// });
//
// client.login(process.env['TOKEN']);

client.login(process.env['TOKEN']).then(() => {
    client.on('message', mensaje => {
        reaccionaEmbed(mensaje);
        if (mensaje.content.includes(prefix)) {

            let args = [];
            let comando = mensaje.content.split(prefix)[1];

            // SI EL STRING TIENE ESPACIOS
            if (/\s/.test(comando)) {

                args = comando.split(' '); // DIVIDIMOS EN ARRAYS POR ESPACIOS
                comando = args.shift(); // SACAMOS EL PRIMER ITEM QUE SERÍA EL COMANDO, LO DEMÁS SON LOS ARGUMENTOS QUE LE SIGUEN
            }

            if (comando.length > 1) {

                leerComando(comando, args, mensaje).then((res) => {
                    mensaje.reply(res);
                }).catch((err) => {
                    mensaje.reply(err);
                });

            }
        }
    });

    client.on("ready", async () => {
        console.log("Coscu BOT by RodrigoRio");
        console.log("Node Version: " + process.version);
        console.log("Discord.js Version: " + Discord.version);

        client.shard.fetchClientValues('guilds.cache.size').then(results => {
            client.user.setActivity(results.reduce((acc, guildCount) => acc + guildCount, 0) + " servers " + prefix + "help", { type: "PLAYING" });
            // console.log(`${results.reduce((acc, guildCount) => acc + guildCount, 0)} total guilds`);
        }).catch(console.error);

        // const canalesCache = client.channels.cache;
        // canalesCache.map( (canal, iCanal) => {
        //
        //     if(canal.type === 'text') {
        //         client.channels.cache.get(canal.id).send('Hola bbtos, ya estoy ON OTRA VEZ NASHEEE!');
        //     }
        // });

        // await client.user.setActivity((client.guilds.cache.size).toString() + " servers "+ prefix +"help", {type: "PLAYING"});
    });

    client.on("guildCreate", async () => {

        client.shard.fetchClientValues('guilds.cache.size').then(results => {
            client.user.setActivity(results.reduce((acc, guildCount) => acc + guildCount, 0) + " servers " + prefix + "help", { type: "PLAYING" });
            // console.log(`${results.reduce((acc, guildCount) => acc + guildCount, 0)} total guilds`);
        }).catch(console.error);

        // await client.user.setActivity((client.guilds.cache.size).toString() + " servers "+ prefix +"help", {type: "PLAYING"});

    });


}).catch(console.error);

async function leerComando(comando, args, mensaje) {

    return new Promise(async (success, failure) => {

        if (mensaje.member.id !== client.user.id) {
            switch (comando) {
                case 'help':
                    embed = new Discord.MessageEmbed();
                    embed =
                        embed
                            .setTitle('AYUDA DE COSCU BOT')
                            .setColor('#FF3D1E')
                            .addField('c!<frase>', 'dice alguna frase de coscu (Ej: c!buenardo) (SÓLO FUNCIONA EN MODO MANUAL)')
                            .addField('c!manual', 'El bot solo va a funcionar por comando')
                            .addField('c!automatico <tiempo_en_segundos>', 'El bot va a ingresar a todos los channels cada X tiempo a reproducir un sonido al azar')
                            .addField('c!escuchar', 'El bot va a escucharte cada 10 segundos, 3 segundos. Si decís una frase de Coscu (Ej: buenardo, clave) el bot va a reproducir la frase sólo (Deshabilitado momentaneamente por cuestiones de escalabilidad)')
                            .setFooter('Reaccionando con las flechas cambias de pagina y con el cuadrado borras este mensaje.')
                            .setAuthor(`Pagina 0`);
                    mensaje.channel.send(embed);
                    break;
                case 'automatico':
                    app.automatico.modoAutomatico(true, args, mensaje).then((suc) => {
                        success(suc);
                    }).catch((err) => {
                        failure(err);
                    });
                    break;
                case 'manual':
                    app.automatico.modoAutomatico(false, args, mensaje).then((suc) => {
                        success(suc);
                    }).catch((err) => {
                        failure(err);
                    });
                    break;


                case 'test':
                    break;

                // case 'escuchar': app.escuchar.agregarEscucha(mensaje); break;

                default:

                    const voiceChannel = mensaje.member.voice.channel;

                    if (!voiceChannel) return failure('Bbto metete a un chanel para escucharme');
                    if (!fs.existsSync('./audios/' + comando + '.mp3')) failure('mMm ese comandovich no lo tengo');

                    // SI ESTÁ EN MODO AUTOMÁTICO
                    const automatico = app.data.automatico.get(mensaje.guild.shardID + '-' + mensaje.guild.id);
                    if (automatico) return failure('El bot está en modo automático brEEEo, desactivalo con ' + prefix + 'manual');

                    app.sonidos.agregarCola(comando, mensaje).then((suc) => {
                        success(suc);
                    }).catch((err) => {
                        failure(err);
                    });

                    break;
            }
        }
    });
}

async function reaccionaEmbed(message, page) {
    if(message.embeds.length === 1 && message.author.id === client.user.id) {
        page = 0;
        message.react('◀');
        message.react('⏹');
        message.react('▶');

        const filter = (reaction) => reaction.emoji.name === '⏹' || reaction.emoji.name === '◀' || reaction.emoji.name === '▶';
        const collector = message.createReactionCollector(filter);
        collector.on('collect', r => { 
            if(r.count === 2 && r.emoji.name === '⏹') message.delete();
            
            if(r.count === 2 && r.emoji.name === '▶') {
                page = page + 6;
                message.edit(emb(page, message));
            }

            if(r.count === 2 && r.emoji.name === '◀') {
                if(page > 0) page = page - 6;
                message.edit(emb(page, message));
            }

            return;
        });
    } else return;
}

async function emb(page, message) {
    let audios = [];
    var coAudio = 0;
    embed = new Discord.MessageEmbed()

    await fs.readdir('./audios/', (err, archivos) => {

        archivos.forEach(archivo => {
            audios.push(archivo.replace('.mp3', ''));
        });

        //Sin este if cuando pasas desde la ultima pagina deja  el mensaje vacio
        if(page >= audios.length) return;
        for (page; page < audios.length; page++) {
            coAudio++;

            embed =
                embed
                    .setTitle('AYUDA DE COSCU BOT')
                    .setColor('#FF3D1E')
                    .addField(audios[page], '_')
                    .setDescription('Sonidos:')
                    .setFooter('Por jaxor#5059')
                    .setAuthor(`Pagina ${Math.floor(page/6)}`);
            if (coAudio === 6) break;
        }
        message.edit(embed);
        coAudio = 0;
    });

}