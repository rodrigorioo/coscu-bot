let sonando = false;
let colaSonidos = [];

function agregarCola(comando, mensaje) {

    const sonido = {
        comando: comando,
        mensaje: mensaje,
    };

    colaSonidos.push(sonido);

    reproducirSonido();

    mensaje.reply('Sonidito agregado a la lista');
}

async function reproducirSonido() {

    // SI NO ESTÁ REPRODUCIENDO NINGÚN SONIDO
    if(!sonando) {

        const sonido = colaSonidos.shift();

        if(sonido !== undefined) {

            const voiceChannel = sonido.mensaje.member.voice.channel;

            if (voiceChannel) {

                const conexion = await voiceChannel.join();

                const dispatcher = conexion.play('./audios/' + sonido.comando + '.mp3');

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
            } else {
                mensaje.reply('Bbto metete a un chanel para escucharme');
            }
        }
    }
}

exports.agregarCola = agregarCola;
exports.sonando = sonando;