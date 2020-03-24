require('dotenv').config({path: __dirname + '/.env'});
const Discord = require('discord.js');
const fs = require('fs');
const axios = require('axios');

const client = new Discord.Client();

/** CONFIGURACION BOT */

let sonando = false;
let colaSonidos = [];
let automatico = false;
let timerModoAutomatico = null;
let timerModoAutomaticoFuncionando = false;

/** END CONFIGURACION BOT */

client.login(process.env['TOKEN']);

client.on('message', async mensaje => {

    if(!mensaje.author.bot) {
        if (mensaje.content.includes('c!')) {

            let args = [];
            let comando = mensaje.content.split('c!')[1];

            // SI EL STRING TIENE ESPACIOS
            if (/\s/.test(comando)) {

                args = comando.split(' '); // DIVIDIMOS EN ARRAYS POR ESPACIOS
                comando = args.shift(); // SACAMOS EL PRIMER ITEM QUE SERÍA EL COMANDO, LO DEMÁS SON LOS ARGUMENTOS QUE LE SIGUEN
            }

            if (comando.length > 1) {
                leerComando(comando, args, mensaje);
            }
        }
    }
});

async function leerComando(comando, args, mensaje) {

    switch(comando) {
        case 'help':
            let msg = "c!<frase>: dice alguna frase de coscu (Ej: c!buenardo) (SÓLO FUNCIONA EN MODO MANUAL)\n" +
                "c!manual: El bot solo va a funcionar por comando\n" +
                "c!automatico <tiempo_en_segundos>: El bot va a ingresar a todos los channels cada X tiempo a reproducir un sonido al azar\n";
            mensaje.reply(msg); break;
        case 'automatico': modoAutomatico(true, args, mensaje); break;
        case 'manual': modoAutomatico(false, args, mensaje); break;
        case 'escuchar': escucharVoz(mensaje); break;

        default:

            const voiceChannel = mensaje.member.voice.channel;

            if (voiceChannel) {
                if(fs.existsSync('./audios/' + comando + '.mp3')) {

                    // SI ESTÁ EN MODO MANUAL
                    if(!automatico) {
                        const conexion = await voiceChannel.join();

                        agregarCola(comando, conexion, mensaje);
                    } else {
                        mensaje.reply('El bot está en modo automático brEEEo, desactivalo con c!manual');
                    }
                } else {
                    mensaje.reply('mMm ese comandovich no lo tengo');
                }
            } else {
                mensaje.reply('Bbto metete a un chanel para escucharme');
            }

            break;
    }
}

function agregarCola(comando, conexion, mensaje) {

    const sonido = {
        comando: comando,
        conexion: conexion,
        mensaje: mensaje,
    };

    colaSonidos.push(sonido);

    reproducirSonido();

    mensaje.reply('Sonidito agregado a la lista');
}

function reproducirSonido() {

    // SI NO ESTÁ REPRODUCIENDO NINGÚN SONIDO
    if(!sonando) {

        const sonido = colaSonidos.shift();

        if(sonido !== undefined) {

            const dispatcher = sonido.conexion.play('./audios/' + sonido.comando + '.mp3');

            sonando = true;

            dispatcher.on('finish', () => {

                sonando = false;
                dispatcher.destroy();

                if(colaSonidos.length > 0) {
                    reproducirSonido();
                } else {
                    sonido.mensaje.member.voice.channel.leave();
                }
            });
        }
    }
}

/************************************************************/
/** WIT.AI **/
/************************************************************/

function reconocerComando(mensaje) {

    const dataSpeech = {

    };

    const opcionesSpeech = {
        headers: {
            "Authorization": "Bearer " + process.env['TOKEN_WIT'],
            "Content-Type": 'audio/mpeg3',
        }
    };

    axios.post('https://api.wit.ai/speech?v=20170307', dataSpeech, opcionesSpeech)
        .then((res) => {
            console.log(`statusCode: ${res.statusCode}`)
            console.log(res)
        })
        .catch((error) => {
            console.error(error)
        });
}

function generateOutputFile(channel, member) {
    // use IDs instead of username cause some people have stupid emojis in their name
    const fileName = `./grabaciones/${channel.id}-${member.id}-${Date.now()}.pcm`;
    return fs.createWriteStream(fileName);
}

async function escucharVoz(mensaje) {

    const voiceChannel = mensaje.member.voice.channel;

    if (voiceChannel) {
        const conexion = await voiceChannel.join();

        const receiver = conexion.receiver.createStream(mensaje.author, {
            mode: 'pcm'
        });

        receiver.pipe(fs.createWriteStream('./grabaciones/' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)));

        // conexion.on('speaking', (user, speaking) => {
        //     if (speaking) {
        //         receiver.pipe(fs.createWriteStream('./grabaciones/' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '.mp3'));
        //     }
        // });

    } else {
        mensaje.reply('Necesito ingresar a un canal para reconocer comandos por voz bb!!');
    }

}

/************************************************************/
/** END WIT.AI **/
/************************************************************/

/************************************************************/
/** MODO AUTOMÁTICO **/
/************************************************************/

function reproducirModoAutomatico(canales, audios) {

    if(canales.length > 0) {

        // SE LE PONE UN TIMEOUT ACÁ PORQUE SINO LA CONEXIÓN DEVUELVE NULL
        setTimeout( async () => {

            let canal = canales.shift();

            const conexion = await canal.join();
            const audio = audios[Math.floor(Math.random() * audios.length)];
            const dispatcher = conexion.play('./audios/' + audio);

            dispatcher.on('finish', () => {

                dispatcher.destroy();
                canal.leave();

                reproducirModoAutomatico(canales, audios);
            });

        }, 1000);
    } else {
        sonando = false;
        timerModoAutomaticoFuncionando = false;
    }

}

function ejecutarModoAutomatico(mensaje) {

    const canalesCache = mensaje.guild.channels.cache;
    let canales = [];

    if(!timerModoAutomaticoFuncionando) {

        timerModoAutomaticoFuncionando = true;

        fs.readdir('./audios', (err, audios) => {

            sonando = true;

            // LIMPIAMOS LOS CANALES QUE NO SON DE VOICE
            canalesCache.map( (canal, iCanal) => {

                if(canal.type === 'voice' && canal.members.size > 0) {
                    canales.push(canal);
                }
            });

            // CUANDO SE TERMINA LA RECURSIÓN AL REPRODUCIR
            // SE SETEA SONANDO A FALSE PARA QUE PUEDA VOLVER A AGREGARSE A LA LISTA
            reproducirModoAutomatico(canales, audios);

        });
    }

}

function modoAutomatico(modo, args, mensaje) {

    if(modo) {

        if(automatico) {
            mensaje.reply('El modo automático ya está activado');
        } else {

            try {
                let tiempo = 1800000; // MEDIA HORA EN MS

                // EL PRIMER ARGUMENTO ES CADA CUANTO TIEMPO SE VA A EJECUTAR
                if (args[0] !== undefined) {

                    if (Number.isInteger(parseInt(args[0])) && parseInt(args[0]) >= 1) {
                        tiempo = parseInt(args[0]) * 1000 * 60;
                    } else {
                        throw Error('El argumento del tiempo tiene que ser un número válido');
                    }
                }

                automatico = true;

                timerModoAutomatico = setInterval(ejecutarModoAutomatico, tiempo, mensaje);

                mensaje.reply('El modo automático fue activado');

            } catch (e) {
                mensaje.reply(e.toString());
            }
        }

    } else {

        if(!automatico) {
            mensaje.reply('El modo manual ya está desactivado');
        } else {
            automatico = false;
            clearInterval(timerModoAutomatico);

            mensaje.reply('El modo automático fue desactivado');
        }
    }
}

/************************************************************/
/** END MODO AUTOMÁTICO **/
/************************************************************/