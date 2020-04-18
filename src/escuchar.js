const fs = require('fs');
const fetch = require('node-fetch');

const sonidos = require('./sonidos');
const data = require('./data');

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

class Escuchar {

    constructor() {
        this._chanelDeEscucha = null;
        this._conexionChanelDeEscucha = null;
    }

    /** MÉTODOS */

    async reconocerComando(mensaje, hash) {

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
                    // "Content-Type": 'audio/mpeg3',
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

    async escucharVoz(mensaje) {

        if(this.verificarChanelEscucha(mensaje)) {

            const receiver = this.conexionChanelDeEscucha.receiver.createStream(mensaje.author, {
                mode: 'pcm',
                end: 'manual',
            });

            const convertTo1ChannelStream = new ConvertTo1ChannelStream();

            let hashGrabacion = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            receiver.pipe(convertTo1ChannelStream).pipe(fs.createWriteStream('./grabaciones/' + hashGrabacion));

            setTimeout(() => {

                this.reconocerComando(mensaje, hashGrabacion);

                receiver.destroy();

            }, 3000);
        } else {

            // ACÁ LLEGA SI EL USUARIO ESTABA ESCUCHANDO Y SE CAMBIÓ DE CANAL
            // LO ELIMINAMOS DE LAS ESCUCHAS
            this.eliminarUsuarioEscucha(mensaje);
        }

    }

    setearChanelEscucha(mensaje) {

        if(data.usuariosEscuchando.size === 1) {
            this.chanelDeEscucha = mensaje.member.voice.channel;
        }
    }

    verificarChanelEscucha(mensaje) {

        if(this.chanelDeEscucha === null) {
            return true;
        }

        const voiceChannel = mensaje.member.voice.channel;

        if (!voiceChannel) {
            return false;
        }

        if(this.chanelDeEscucha.id === mensaje.member.voice.channel.id) {
            return true;
        }

        mensaje.reply('El bot sólo puede escuchar un server a la vez');
        return false;
    }

    eliminarUsuarioEscucha(mensaje) {
        mensaje.reply('Ahora el bot no te escucha más a vos rey!');

        let intervalo = data.usuariosEscuchando.get(mensaje.author.id);
        clearInterval(intervalo);

        data.usuariosEscuchando.delete(mensaje.author.id);

        if(data.usuariosEscuchando.size === 0) {
            this.chanelDeEscucha.leave();
            this.chanelDeEscucha = null;
        }
    }

    async agregarEscucha(mensaje) {

        if (!fs.existsSync('./grabaciones')){
            fs.mkdirSync('./grabaciones');
        }

        const voiceChannel = mensaje.member.voice.channel;

        if (voiceChannel) {

            // SI NO ESTÁ EN MODO AUTOMÁTICO
            if(!data.automatico) {

                // SI EL BOT NO ESTÁ SONANDO
                if(!data.sonando) {

                    // SI EL USUARIO ESTABA ESCUCHANDO, LO DEJAMOS DE ESCUCHAR
                    if (data.usuariosEscuchando.has(mensaje.author.id)) {

                        this.eliminarUsuarioEscucha(mensaje);

                    } else {

                        // VERIFICAMOS QUE EL CANAL DONDE ESTA ES EL MISMO QUE EL DE ESCUCHA
                        if(this.verificarChanelEscucha(mensaje)) {
                            mensaje.reply('Ahora el bot te está escuchando rey!');

                            voiceChannel.join()
                                .then((conexion) => {

                                    this.conexionChanelDeEscucha = conexion;
                                    let intervalo = setInterval(this.escucharVoz.bind(this), 10000, mensaje);

                                    data.usuariosEscuchando.set(mensaje.author.id, intervalo);
                                })
                                .catch((error) => {
                                    mensaje.reply("No pude reproducir el sonido rey, fijate los permisos del chanel bb");
                                });
                        }

                    }

                    this.setearChanelEscucha(mensaje);

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

    /** END MÉTODOS */

    /** GETTERS & SETTERS */

    get chanelDeEscucha() {
        return this._chanelDeEscucha;
    }

    set chanelDeEscucha(value) {
        this._chanelDeEscucha = value;
    }

    get conexionChanelDeEscucha() {
        return this._conexionChanelDeEscucha;
    }

    set conexionChanelDeEscucha(value) {
        this._conexionChanelDeEscucha = value;
    }

    /** END GETTERS & SETTERS */
}

const escuchar = new Escuchar();

module.exports = escuchar;