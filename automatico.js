const fs = require('fs');
const sonidos = require('./sonidos');

let automatico = false;
let timerModoAutomatico = null;
let timerModoAutomaticoFuncionando = false;

function reproducirModoAutomatico(canales, audios) {

    // CUANDO SE TERMINA LA RECURSIÓN AL REPRODUCIR
    // SE SETEA SONANDO A FALSE PARA QUE PUEDA VOLVER A AGREGARSE A LA LISTA
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
        sonidos.sonando = false;
        timerModoAutomaticoFuncionando = false;
    }

}

function ejecutarModoAutomatico(mensaje) {

    const canalesCache = mensaje.guild.channels.cache;
    let canales = [];

    if(!timerModoAutomaticoFuncionando) {

        timerModoAutomaticoFuncionando = true;

        fs.readdir('./audios', (err, audios) => {

            sonidos.sonando = true;

            // LIMPIAMOS LOS CANALES QUE NO SON DE VOICE
            canalesCache.map( (canal, iCanal) => {

                if(canal.type === 'voice' && canal.members.size > 0) {
                    canales.push(canal);
                }
            });

            if(canales.length > 0) {
                reproducirModoAutomatico(canales, audios);
            } else {
                modoAutomatico(false, [], mensaje);
                mensaje.channel.send('Se desactivó el modo automático debido a que no hay ningún sv donde entrar');
            }

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

exports.modoAutomatico = modoAutomatico;
exports.automatico = automatico;