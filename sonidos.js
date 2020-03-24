let sonando = false;
let colaSonidos = [];

function agregarCola(comando, conexion, mensaje) {

    const sonido = {
        comando: comando,
        conexion: conexion,
        mensaje: mensaje,
    };

    colaSonidos.push(sonido);

    reproducirSonido();

    mensaje.reply('Sonidito agregado a la lista');
}

function reproducirSonido() {

    // SI NO ESTÁ REPRODUCIENDO NINGÚN SONIDO
    if(!sonando) {

        const sonido = colaSonidos.shift();

        if(sonido !== undefined) {

            const dispatcher = sonido.conexion.play('./audios/' + sonido.comando + '.mp3');

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
        }
    }
}

exports.agregarCola = agregarCola;
exports.sonando = sonando;