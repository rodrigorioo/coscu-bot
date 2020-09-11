require('dotenv').config({path: __dirname + '/.env'});
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

client.login('TOKEN').then( () => {
    
    client.on('message', mensaje => {
        /*Va a entrar a la funcion solo si el mensaje es "c!help"
        O si el cliente manda un mensaje embebido (esta afuera del primer if por esto)*/  
            help(mensaje);

        if (mensaje.content.includes(prefix) && mensaje.author.id != client.user.id) {

            let args = [];
            let comando = mensaje.content.split(prefix)[1];

            // SI EL STRING TIENE ESPACIOS
            //El && es porque en la funcion help necesita un mensaje que mando el mismo bot, 
            //Si se modifica no entra en el else if que reacciona los mensajes
            if (/\s/.test(comando) && mensaje.author.id != client.user.id) { 

                args = comando.split(' '); // DIVIDIMOS EN ARRAYS POR ESPACIOS
                comando = args.shift(); // SACAMOS EL PRIMER ITEM QUE SERÍA EL COMANDO, LO DEMÁS SON LOS ARGUMENTOS QUE LE SIGUEN
            }

            if (comando.length > 1) {

                leerComando(comando, args, mensaje).then( (res) => {
                    mensaje.reply(res);
                }).catch( (err) => {
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
            client.user.setActivity(results.reduce((acc, guildCount) => acc + guildCount, 0) + " servers "+ prefix +"help", {type: "PLAYING"});
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
            client.user.setActivity(results.reduce((acc, guildCount) => acc + guildCount, 0) + " servers "+ prefix +"help", {type: "PLAYING"});
                // console.log(`${results.reduce((acc, guildCount) => acc + guildCount, 0)} total guilds`);
            }).catch(console.error);

        // await client.user.setActivity((client.guilds.cache.size).toString() + " servers "+ prefix +"help", {type: "PLAYING"});

    });


}).catch(console.error);

async function leerComando(comando, args, mensaje) {

    return new Promise( async (success, failure) => {

        if(true) {
            switch (comando) {

                case 'help':
                    //Sin esto entra al default y responde dos veces
                    //Aunque esta solucion es muy lenta.
                    break;
                
                case 'automatico':
                    app.automatico.modoAutomatico(true, args, mensaje).then( (suc) => {
                        success(suc);
                    }).catch( (err) => {
                        failure(err);
                    });
                    break;
                case 'manual':
                    app.automatico.modoAutomatico(false, args, mensaje).then( (suc) => {
                        success(suc);
                    }).catch( (err) => {
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
                    if (automatico) return failure('El bot está en modo automático brEEEo, desactivalo con '+ prefix +'manual');

                    app.sonidos.agregarCola(comando, mensaje).then( (suc) => {
                        success(suc);
                    }).catch( (err) => {
                        failure(err);
                    });

                    break;
            }
        }
    });
}


//Por samurairepublicano, samurai#1995 en discord
async function help(message) {

    let audios = [];
    await fs.readdir('./audios/', (err, archivos) => {
    archivos.forEach(archivo => {
        audios.push(archivo.replace('.mp3', ''));
    });
    if(message.content === 'c!help' && message.author.id != client.user.id) {    
        //Manda ek mensaje de help
        var embed = new Discord.MessageEmbed()

        embed = embed
            .setTitle('AYUDA DE COSCU-BOT')
            .setColor('#FF3D1E')
            .addField('c!<frase>', '(Ej: c!buenardo) (SÓLO FUNCIONA EN MODO MANUAL)')
            .addField('c!manual', 'El bot solo va a funcionar por comando')
            .addField('c!automatico <tiempo_en_segundos>', 'El bot va a ingresar a todos los channels cada X tiempo a reproducir un sonido al azar')
            .addField('c!escuchar', 'El bot va a escucharte cada 10 segundos, 3 segundos. Si decís una frase de Coscu (Ej: buenardo, clave) el bot va a reproducir la frase sólo (Deshabilitado momentaneamente por cuestiones de escalabilidad)')
            .setFooter('Si reaccionas con las flechas cambias de pagina, con el cuadrado eliminas este mensaje')
            //En el footer tambien queda bien poner el autor
            .setAuthor(`Pagina 1`);
        message.channel.send(embed);
        
        return;
    } else if(message.embeds.length === 1 && message.author.id === client.user.id) { 
        //Entra a esta condicion solo cuando el cliente manda un mensaje embebido
        //Hay que arreglar si se quiere mandar otro mensaje embebido distinto de la pagina de help
        var page = 0;
        message.react('◀');
        message.react('⏹');
        message.react('▶');

        const filter = (reaction) => reaction.emoji.name === '⏹' || reaction.emoji.name === '◀' || reaction.emoji.name === '▶';
        const collector = message.createReactionCollector(filter);
        collector.on('collect', r => { 
            if(r.count === 2 && r.emoji.name === '⏹') message.delete();
            
            if(r.count === 2 && r.emoji.name === '▶') {
                //Aca se podria poner manualmente un maximo de paginas para que en las ultimas no muestre undefined
                page = page + 1;
                emb(page, audios, message);
                return;
            }

            if(r.count === 2 && r.emoji.name === '◀') {
                if(page > 0) page = page - 1;
                else return;
                emb(page, audios, message)
                return;
            }

            return;
        });
      } 
    else return;
    });
}


function emb(page, audios, message) {
    //Ver MeesageEmbed en la documentacion de discordjs
    var embed = new Discord.MessageEmbed();
    /*
    Unico inconveniente de esta forma es que hay que aniadir mas pags
    cada vez que se aniaden muchos sonidos, no se me ocurre una forma de 
    automatizarlo
    Hacer el codigo mas compacto seria un golazo
    */ 
    switch(page) {
        case 0:
            embed = 
            embed
            .setTitle('AYUDA DE COSCU-BOT')
            .setColor('#FF3D1E')
            .addField('c!<frase>', '(Ej: c!buenardo) (SÓLO FUNCIONA EN MODO MANUAL)')
            .addField('c!manual', 'El bot solo va a funcionar por comando')
            .addField('c!automatico <tiempo_en_segundos>', 'El bot va a ingresar a todos los channels cada X tiempo a reproducir un sonido al azar')
            .addField('c!escuchar', 'El bot va a escucharte cada 10 segundos, 3 segundos. Si decís una frase de Coscu (Ej: buenardo, clave) el bot va a reproducir la frase sólo (Deshabilitado momentaneamente por cuestiones de escalabilidad)')
            .setFooter('Si reaccionas con las flechas cambias de pagina, con el cuadrado eliminas este mensaje')
            //En el footer tambien queda bien poner el autor

            .setAuthor(`Pagina 1`);
            message.edit(embed);
            break;
        
        case 1:
            //Los guiones son porque no se puede pasar un valor vacio en el segundo parametro de las fields
            //Otra opcion para los guiones podria ser poner el sonido siguiente pero habria unos en negrita y otros no
            embed =
                embed
                    .setTitle('AYUDA DE COSCU-BOT')
                    .setColor('#FF3D1E')
                    .setDescription('Sonidos:')
                    .setFooter('Bot hecho por jaxor#5059\nPagina de ayuda hecha por samurai#1995')
                    .setAuthor(`Pagina ${page+1}`);
            for(var i=0; i<6; i++) {
                //Esta parte la copie de la ayuda original
                embed = embed
                .addField(audios[i], '_')
            }
            message.edit(embed);
            break;
        
        case 2:
            embed =
                embed
                    .setTitle('AYUDA DE COSCU-BOT')
                    .setColor('#FF3D1E')
                    .setDescription('Sonidos:')
                    .setFooter('Bot hecho por jaxor#5059\nPagina de ayuda hecha por samurai#1995')
                    .setAuthor(`Pagina ${page+1}`);
            for(var i=6; i<12; i++) {
                embed = embed
                .addField(audios[i], '_')
            }
            message.edit(embed);
            break;

        case 3:
            embed =
                embed
                    .setTitle('AYUDA DE COSCU-BOT')
                    .setColor('#FF3D1E')
                    .setDescription('Sonidos:')
                    .setFooter('Bot hecho por jaxor#5059\nPagina de ayuda hecha por samurai#1995')
                    .setAuthor(`Pagina ${page + 1}`);
            for (var i = 12; i < 18; i++) {
                embed = embed
                    .addField(audios[i], '_')
            }
            message.edit(embed);
            break;

        case 4:
            embed =
                embed
                    .setTitle('AYUDA DE COSCU-BOT')
                    .setColor('#FF3D1E')
                    .setDescription('Sonidos:')
                    .setFooter('Bot hecho por jaxor#5059\nPagina de ayuda hecha por samurai#1995')
                    .setAuthor(`Pagina ${page + 1}`);
            for (var i = 18; i < 24; i++) {
                embed = embed
                    .addField(audios[i], '_')
            }
            message.edit(embed);
            break;

        case 5:
            embed =
                embed
                    .setTitle('AYUDA DE COSCU-BOT')
                    .setColor('#FF3D1E')
                    .setDescription('Sonidos:')
                    .setFooter('Bot hecho por jaxor#5059\nPagina de ayuda hecha por samurai#1995')
                    .setAuthor(`Pagina ${page + 1}`);
            for (var i = 24; i < 30; i++) {
                embed = embed
                    .addField(audios[i], '_')
            }
            message.edit(embed);
            break;

        case 6:
            embed =
                embed
                    .setTitle('AYUDA DE COSCU-BOT')
                    .setColor('#FF3D1E')
                    .setDescription('Sonidos:')
                    .setFooter('Bot hecho por jaxor#5059\nPagina de ayuda hecha por samurai#1995')
                    .setAuthor(`Pagina ${page + 1}`);
            for (var i = 30; i < 36; i++) {
                embed = embed
                    .addField(audios[i], '_')
            }
            message.edit(embed);
            break;

        case 7:
            embed =
                embed
                    .setTitle('AYUDA DE COSCU-BOT')
                    .setColor('#FF3D1E')
                    .setDescription('Sonidos:')
                    .setFooter('Bot hecho por jaxor#5059\nPagina de ayuda hecha por samurai#1995')
                    .setAuthor(`Pagina ${page + 1}`);
            for (var i = 36; i < 42; i++) {
                embed = embed
                    .addField(audios[i], '_')
            }
            message.edit(embed);
            break;

        case 8:
            embed =
                embed
                    .setTitle('AYUDA DE COSCU-BOT')
                    .setColor('#FF3D1E')
                    .setDescription('Sonidos:')
                    .setFooter('Bot hecho por jaxor#5059\nPagina de ayuda hecha por samurai#1995')
                    .setAuthor(`Pagina ${page + 1}`);
            for (var i = 42; i < 48; i++) {
                embed = embed
                    .addField(audios[i], '_')
            }
            message.edit(embed);
            break;

        case 9:
            embed =
                embed
                    .setTitle('AYUDA DE COSCU-BOT')
                    .setColor('#FF3D1E')
                    .setDescription('Sonidos:')
                    .setFooter('Bot hecho por jaxor#5059\nPagina de ayuda hecha por samurai#1995')
                    .setAuthor(`Pagina ${page + 1}`);
            for (var i = 48; i < 54; i++) {
                embed = embed
                    .addField(audios[i], '_')
            }
            message.edit(embed);
            break;
    }
    
}    