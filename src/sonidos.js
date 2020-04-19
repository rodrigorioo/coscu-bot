const data = require('./data');

class Sonido {

    constructor() {
        this.colaSonidos = new Map();
    }

    /** METODOS */

    agregarCola(comando, mensaje) {

        const sonido = {
            comando: comando,
            mensaje: mensaje,
        };

        let cola = this.colaSonidos.get(mensaje.guild.id);
        if(!cola || cola.length === 0) {
            this.colaSonidos.set(mensaje.guild.id, [sonido]);
        } else {
            cola.push(sonido);
            this.colaSonidos.set(mensaje.guild.id, cola);
        }

        try {
            this.reproducirSonido(mensaje);
        } catch(err) {
            throw new Error(err);
        }

        mensaje.reply('Sonidito agregado a la lista');
    }

    reproducirSonido(mensaje) {

        // SI NO ESTÁ REPRODUCIENDO NINGÚN SONIDO
        const sonando = data.sonando.get(mensaje.guild.id);
        if(!sonando) {

            let cola = this.colaSonidos.get(mensaje.guild.id);
            const sonido = cola.shift();
            this.colaSonidos.set(mensaje.guild.id, cola);

            if(sonido !== undefined) {

                const voiceChannel = sonido.mensaje.member.voice.channel;

                if (voiceChannel) {

                    voiceChannel.join()
                        .then((conexion) => {
                            const dispatcher = conexion.play('./audios/' + sonido.comando + '.mp3');

                            if(dispatcher) {
                                data.sonando.set(mensaje.guild.id, true);

                                dispatcher.on('finish', () => {

                                    data.sonando.delete(mensaje.guild.id);
                                    dispatcher.destroy();

                                    let cola = this.colaSonidos.get(mensaje.guild.id);
                                    if(cola.length > 0) {
                                        this.reproducirSonido(mensaje);
                                    } else {

                                        this.colaSonidos.delete(mensaje.guild.id);

                                        // SI NO HAY USUARIOS ESCUCHANDO
                                        if(data.usuariosEscuchando.size === 0) {

                                            if(sonido.mensaje.member.voice.channel) {
                                                sonido.mensaje.member.voice.channel.leave();
                                            }
                                        }
                                    }
                                });
                            }
                        })
                        .catch( (err) => {
                            throw new Error("No pude reproducir el sonido rey, fijate los permisos del chanel bb")
                        });

                } else {

                }
            }
        }
    }

    /** END MÉTODOS */
}

const sonido = new Sonido();

module.exports = sonido;