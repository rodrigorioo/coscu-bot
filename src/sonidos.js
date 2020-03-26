const escuchar = require('./escuchar');

class Sonido {

    constructor() {
        this._colaSonidos = [];
        this._sonando = false;
    }

    /** METODOS */

    agregarCola(comando, mensaje) {

        const sonido = {
            comando: comando,
            mensaje: mensaje,
        };

        this._colaSonidos.push(sonido);

        this.reproducirSonido();

        mensaje.reply('Sonidito agregado a la lista');
    }

    async reproducirSonido() {

        // SI NO ESTÁ REPRODUCIENDO NINGÚN SONIDO
        if(!this._sonando) {

            const sonido = this._colaSonidos.shift();

            if(sonido !== undefined) {

                const voiceChannel = sonido.mensaje.member.voice.channel;

                if (voiceChannel) {

                    const conexion = await voiceChannel.join();

                    const dispatcher = conexion.play('./audios/' + sonido.comando + '.mp3');

                    this._sonando = true;

                    dispatcher.on('finish', () => {

                        this._sonando = false;
                        dispatcher.destroy();

                        if(this.colaSonidos.length > 0) {
                            this.reproducirSonido();
                        } else {

                            // SI NO HAY USUARIOS ESCUCHANDO
                            if(escuchar.usuariosEscuchando.size === 0) {
                                sonido.mensaje.member.voice.channel.leave();
                            }
                        }
                    });
                } else {
                    mensaje.reply('Bbto metete a un chanel para escucharme');
                }
            }
        }
    }

    /** END MÉTODOS */

    /** GETTERS & SETTERS */

    get sonando() {
        return this._sonando;
    }

    set sonando(value) {
        this._sonando = value;
    }
    get colaSonidos() {
        return this._colaSonidos;
    }

    set colaSonidos(value) {
        this._colaSonidos = value;
    }

    /** END GETTERS & SETTERS */
}

const sonido = new Sonido();

module.exports = sonido;