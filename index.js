require('dotenv').config({path: __dirname + '/.env'});
const Discord = require('discord.js');
const fs = require('fs');
const axios = require('axios');
const witai_speech = require('witai-speech');
const fetch = require('node-fetch');

const client = new Discord.Client();

/** MIS MODULOS */

const sonidos = require('./sonidos');
const automatico = require('./automatico');

/** END MIS MODULOS */

/** CONFIGURACION BOT */

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
        case 'automatico': automatico.modoAutomatico(true, args, mensaje); break;
        case 'manual': automatico.modoAutomatico(false, args, mensaje); break;
        case 'escuchar': escucharVoz(mensaje); break;
        case 'test': test(mensaje); break;

        default:

            const voiceChannel = mensaje.member.voice.channel;

            if (voiceChannel) {
                if(fs.existsSync('./audios/' + comando + '.mp3')) {

                    // SI ESTÁ EN MODO MANUAL
                    if(!automatico.automatico) {
                        sonidos.agregarCola(comando, mensaje);
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

/************************************************************/
/** WIT.AI **/
/************************************************************/

const { Transform } = require('stream');

function convertBufferTo1Channel(buffer) {
    const convertedBuffer = Buffer.alloc(buffer.length / 2);

    for (let i = 0; i < convertedBuffer.length / 2; i++) {
        const uint16 = buffer.readUInt16LE(i * 4);
        convertedBuffer.writeUInt16LE(uint16, i * 2)
    }

    return convertedBuffer
}

class ConvertTo1ChannelStream extends Transform {
    constructor(source, options) {
        super(options)
    }

    _transform(data, encoding, next) {
        next(null, convertBufferTo1Channel(data))
    }
}

async function reconocerComando(mensaje, hash) {

    const archivoAudio = './grabaciones/' + hash;

    const stream = fs.createReadStream(archivoAudio);

    const dataSpeech = {
        method: 'POST',
        headers: {
            "Authorization": "Bearer " + process.env['TOKEN_WIT'],
            "Content-Type": 'audio/raw;encoding=signed-integer;bits=16;rate=48000;endian=little',
        },
        body: stream,
    };

    let respuestaConsulta = await fetch('https://api.wit.ai/speech', dataSpeech);
    let jsonRespuesta = await respuestaConsulta.json();

    console.log(jsonRespuesta);

    // fs.unlink(archivoAudio, (err) => {
    //     if (err) {
    //         console.error(err)
    //         return;
    //     }
    // });
}

async function escucharVoz(mensaje) {

    const voiceChannel = mensaje.member.voice.channel;

    if (voiceChannel) {
        const conexion = await voiceChannel.join();

        const receiver = conexion.receiver.createStream(mensaje.author, {
            mode: 'pcm'
        });

        const convertTo1ChannelStream = new ConvertTo1ChannelStream();

        conexion.on('speaking', (user, speaking) => {
            if (speaking) {
                let hashGrabacion = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                receiver.pipe(convertTo1ChannelStream).pipe(fs.createWriteStream('./grabaciones/' + hashGrabacion));

                reconocerComando(mensaje, hashGrabacion);
            }
        });

    } else {
        mensaje.reply('Necesito ingresar a un canal para reconocer comandos por voz bb!!');
    }

}

function test(mensaje) {

    reconocerComando(mensaje, 'buenardo');
}

/************************************************************/
/** END WIT.AI **/
/************************************************************/