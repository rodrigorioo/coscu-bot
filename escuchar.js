const fs = require('fs');
const fetch = require('node-fetch');

const sonidos = require('./sonidos');
const automatico = require('./automatico');

let usuariosEscuchando = new Map();
let chanelDeEscucha = null;
let conexionChanelDeEscucha = null;

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

        console.log(consulta);

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

async function escucharVoz(mensaje) {

    if(verificarChanelEscucha(mensaje)) {

        const receiver = conexionChanelDeEscucha.receiver.createStream(mensaje.author, {
            mode: 'pcm',
            end: 'manual',
        });

        const convertTo1ChannelStream = new ConvertTo1ChannelStream();

        let hashGrabacion = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        receiver.pipe(convertTo1ChannelStream).pipe(fs.createWriteStream('./grabaciones/' + hashGrabacion));

        setTimeout(() => {

            reconocerComando(mensaje, hashGrabacion);

            receiver.destroy();

        }, 3000);
    } else {

        // ACÁ LLEGA SI EL USUARIO ESTABA ESCUCHANDO Y SE CAMBIÓ DE CANAL
        // LO ELIMINAMOS DE LAS ESCUCHAS
        eliminarUsuarioEscucha(mensaje);
    }

}

function setearChanelEscucha(mensaje) {

    if(usuariosEscuchando.size === 1) {
        chanelDeEscucha = mensaje.member.voice.channel;
    }
}

function verificarChanelEscucha(mensaje) {

    if(chanelDeEscucha === null) {
        return true;
    }

    if(chanelDeEscucha.id === mensaje.member.voice.channel.id) {
        return true;
    }

    mensaje.reply('El bot sólo puede escuchar un server a la vez');
    return false;
}

function eliminarUsuarioEscucha(mensaje) {
    mensaje.reply('Ahora el bot no te escucha más a vos rey!');

    let intervalo = usuariosEscuchando.get(mensaje.author.id);
    clearInterval(intervalo);

    usuariosEscuchando.delete(mensaje.author.id);

    if(usuariosEscuchando.size === 0) {
        chanelDeEscucha.leave();
        chanelDeEscucha = null;
    }
}

async function agregarEscucha(mensaje) {

    if (!fs.existsSync('./grabaciones')){
        fs.mkdirSync('./grabaciones');
    }

    const voiceChannel = mensaje.member.voice.channel;

    if (voiceChannel) {

        // SI NO ESTÁ EN MODO AUTOMÁTICO
        if(!automatico.automatico) {

            // SI EL BOT NO ESTÁ SONANDO
            if(!sonidos.sonando) {

                // SI EL USUARIO ESTABA ESCUCHANDO, LO DEJAMOS DE ESCUCHAR
                if (usuariosEscuchando.has(mensaje.author.id)) {

                    eliminarUsuarioEscucha(mensaje);

                } else {

                    // VERIFICAMOS QUE EL CANAL DONDE ESTA ES EL MISMO QUE EL DE ESCUCHA
                    if(verificarChanelEscucha(mensaje)) {
                        mensaje.reply('Ahora el bot te está escuchando rey!');

                        conexionChanelDeEscucha = await voiceChannel.join();

                        let intervalo = setInterval(escucharVoz, 10000, mensaje, conexionChanelDeEscucha);

                        usuariosEscuchando.set(mensaje.author.id, intervalo);
                    }

                }

                setearChanelEscucha(mensaje);

            } else {
                mensaje.reply('El bot está sonando bbto, espera que termine y te escucho ♥');
            }
        } else {
            mensaje.reply('Sólo te puedo escuchar si el bot está en modo manual');
        }

    } else {
        mensaje.reply('Necesito ingresar a un canal para reconocer comandos por voz bb!!');
    }
}

exports.agregarEscucha = agregarEscucha;
exports.reconocerComando = reconocerComando;
exports.usuariosEscuchando = usuariosEscuchando;