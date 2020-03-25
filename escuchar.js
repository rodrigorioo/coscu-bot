const fs = require('fs');
const fetch = require('node-fetch');

const sonidos = require('./sonidos');

let escucharUsuarios = new Map();

// ESTO ES PARA CONVERTIR EL AUDIO STEREO A MONO
// ***************************************************************************************

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

// ***************************************************************************************
// END CONVERTIR AUDIO STEREO A MONO

async function reconocerComando(mensaje, hash) {

    const archivoAudio = './grabaciones/' + hash;
    const informacionArchivoAudio = fs.statSync(archivoAudio);
    const tamanioArchivoAudio = informacionArchivoAudio["size"];

    // SI EL ARCHIVO PESA ALGO (ESTO ES PARA VERIFICAR QUE EL USUARIO HAYA HABLADO)
    if(tamanioArchivoAudio) {

        const stream = fs.createReadStream(archivoAudio);

        const dataSpeech = {
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + process.env['TOKEN_WIT'],
                "Content-Type": 'audio/raw;encoding=signed-integer;bits=16;rate=44100;endian=little',
            },
            body: stream,
        };

        let respuestaConsulta = await fetch('https://api.wit.ai/speech', dataSpeech);
        let consulta = await respuestaConsulta.json();

        if ('entities' in consulta) {

            if ('intent' in consulta.entities) {
                let intents = consulta.entities.intent;

                intents.forEach((intent, iIntent) => {

                    if (intent.confidence > 0.75) {
                        sonidos.agregarCola(intent.value, mensaje);
                    }
                });
            }
        }
    }

    fs.unlink(archivoAudio, (err) => {
        if (err) {
            console.error(err);
        }
    });
}

async function escucharVoz(mensaje, conexion) {

    console.log('Escuchando');

    const receiver = conexion.receiver.createStream(mensaje.author, {
        mode: 'pcm',
        end: 'manual',
    });

    const convertTo1ChannelStream = new ConvertTo1ChannelStream();

    let hashGrabacion = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    receiver.pipe(convertTo1ChannelStream).pipe(fs.createWriteStream('./grabaciones/' + hashGrabacion));

    setTimeout( () => {

        reconocerComando(mensaje, hashGrabacion);

        receiver.destroy();

    }, 3000);

}

async function agregarEscucha(mensaje) {

    if (!fs.existsSync('./grabaciones')){
        fs.mkdirSync('./grabaciones');
    }

    const voiceChannel = mensaje.member.voice.channel;

    if (voiceChannel) {
        const conexion = await voiceChannel.join();

        setInterval(escucharVoz, 10000, mensaje, conexion);

    } else {
        mensaje.reply('Necesito ingresar a un canal para reconocer comandos por voz bb!!');
    }
}

exports.agregarEscucha = agregarEscucha;