const data = require('./data');

class Sonido {

    constructor() {
        this._colaSonidos = [];
    }

    /** METODOS */

    agregarCola(comando, mensaje) {

        const sonido = {
            comando: comando,
            mensaje: mensaje,
        };

        this._colaSonidos.push(sonido);

        this.reproducirSonido(mensaje);

        mensaje.reply('Sonidito agregado a la lista');
    }

    reproducirSonido(mensaje) {

        // SI NO ESTÁ REPRODUCIENDO NINGÚN SONIDO
        if(!this._sonando) {

            const sonido = this._colaSonidos.shift();

            if(sonido !== undefined) {

                const voiceChannel = sonido.mensaje.member.voice.channel;

                if (voiceChannel) {

                    voiceChannel.join()
                        .then((conexion) => {
                            const dispatcher = conexion.play('./audios/' + sonido.comando + '.mp3');

                            if(dispatcher) {
                                this._sonando = true;

                                dispatcher.on('finish', () => {

                                    this._sonando = false;
                                    dispatcher.destroy();

                                    if(this.colaSonidos.length > 0) {
                                        this.reproducirSonido(mensaje);
                                    } else {

                                        // SI NO HAY USUARIOS ESCUCHANDO
                                        if(data.usuariosEscuchando.size === 0) {
                                            sonido.mensaje.member.voice.channel.leave();
                                        }
                                    }
                                });
                            }
                        })
                        .catch( (err) => {
                            console.log(err);
                            throw new Error("No pude reproducir el sonido rey, fijate los permisos del chanel bb")
                        });

                } else {

                }
            }
        }
    }

    /** END MÉTODOS */

    /** GETTERS & SETTERS */

    get colaSonidos() {
        return this._colaSonidos;
    }

    // set colaSonidos(value) {
    //     this._colaSonidos = value;
    // }

    /** END GETTERS & SETTERS */
}

const sonido = new Sonido();

module.exports = sonido;