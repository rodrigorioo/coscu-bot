const fs = require('fs');

const data = require('./data');

class Automatico {

    constructor() {
        this.timerModoAutomatico = new Map();
        this.timerModoAutomaticoFuncionando = new Map();
    }

    /** MÉTODOS */

    reproducirModoAutomatico(canales, audios, mensaje) {

        // CUANDO SE TERMINA LA RECURSIÓN AL REPRODUCIR
        // SE SETEA SONANDO A FALSE PARA QUE PUEDA VOLVER A AGREGARSE A LA LISTA
        if(canales.length > 0) {

            // SE LE PONE UN TIMEOUT ACÁ PORQUE SINO LA CONEXIÓN DEVUELVE NULL
            setTimeout( async () => {

                let canal = canales.shift();

                canal.join()
                    .then((conexion) => {
                        const audio = audios[Math.floor(Math.random() * audios.length)];
                        const dispatcher = conexion.play('./audios/' + audio);

                        if(dispatcher) {
                            dispatcher.on('finish', (...args) => {

                                dispatcher.destroy();
                                canal.leave();

                                this.reproducirModoAutomatico(canales, audios, mensaje);
                            });
                        }
                    })
                    .catch((error) => {
                        throw new Error("No pude reproducir el sonido rey, fijate los permisos del chanel bb");
                    });

            }, 1000);
        } else {
            data.sonando.delete(mensaje.guild.id);
            this.timerModoAutomaticoFuncionando.delete(mensaje.guild.id);
        }

    }

    ejecutarModoAutomatico(mensaje) {

        const canalesCache = mensaje.guild.channels.cache;
        let canales = [];

        const timerModoAutomaticoFuncionando = this.timerModoAutomaticoFuncionando.get(mensaje.guild.id);

        if(!timerModoAutomaticoFuncionando) {

            this.timerModoAutomaticoFuncionando.set(mensaje.guild.id, true);

            fs.readdir('./audios', (err, audios) => {

                data.sonando.set(mensaje.guild.id, true);

                // LIMPIAMOS LOS CANALES QUE NO SON DE VOICE
                canalesCache.map( (canal, iCanal) => {

                    if(canal.type === 'voice' && canal.members.size > 0) {
                        canales.push(canal);
                    }
                });

                if(canales.length > 0) {
                    this.reproducirModoAutomatico(canales, audios, mensaje);
                } else {
                    this.modoAutomatico(false, [], mensaje);
                    mensaje.channel.send('Se desactivó el modo automático debido a que no hay ningún sv donde entrar');
                }

            });
        }

    }

    modoAutomatico(modo, args, mensaje) {

        if(data.usuariosEscuchando.size !== 0) throw new Error('No se puede activar el modo automático si hay usuarios escuchando');

        if (modo) {

            const automatico = data.automatico.get(mensaje.guild.id);
            if(automatico) throw new Error('El modo automático ya está activado');

            let tiempo = 1800000; // MEDIA HORA EN MS

            // EL PRIMER ARGUMENTO ES CADA CUANTO TIEMPO SE VA A EJECUTAR
            if (args[0] !== undefined) {

                if (!Number.isInteger(parseInt(args[0])) || parseInt(args[0]) < 1) throw new Error('El argumento del tiempo tiene que ser un número válido');

                tiempo = parseInt(args[0]) * 1000 * 60;

            }

            data.automatico.set(mensaje.guild.id, true);

            this.timerModoAutomatico.set(mensaje.guild.id, setInterval(this.ejecutarModoAutomatico.bind(this), tiempo, mensaje));

            mensaje.reply('El modo automático fue activado');

        } else {

            const automatico = data.automatico.get(mensaje.guild.id);
            if (!automatico) throw new Error('El modo manual ya está desactivado');

            data.automatico.delete(mensaje.guild.id);
            clearInterval(this.timerModoAutomatico.get(mensaje.guild.id));

            mensaje.reply('El modo automático fue desactivado');
        }
    }

    /** END MÉTODOS */
}

const automatico = new Automatico();

module.exports = automatico;