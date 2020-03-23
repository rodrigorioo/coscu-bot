require('dotenv').config({path: __dirname + '/.env'});
const Discord = require('discord.js');
const fs = require('fs');

const client = new Discord.Client();

let sonando = false;
let colaSonidos = [];

client.login(process.env['TOKEN']);

client.on('message', async mensaje => {

    if (mensaje.content.includes('c!')) {

        let comando = mensaje.content.split('c!')[1];

        if(/\s/.test(comando)) {
            comando = comando.split(' ')[0];
        }

        if(comando.length > 1) {
            leerComando(comando, mensaje);
        }
    }
});

async function leerComando(comando, mensaje) {

    if(comando === 'help') {
        mensaje.reply('Solamente pone c! y el nombre de alguna frase bbto. Ej: buenardo');
    } else {

        const voiceChannel = mensaje.member.voice.channel;

        if (voiceChannel) {
            if(fs.existsSync('./audios/' + comando + '.mp3')) {

                const conexion = await voiceChannel.join();

                agregarCola(comando, conexion, mensaje);
            } else {
                mensaje.reply('mMm ese comandovich no lo tengo');
            }
        } else {
            mensaje.reply('Bbto metete a un chanel para escucharme');
        }

    }
}

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