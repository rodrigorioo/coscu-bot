require('dotenv').config({path: __dirname + '/.env'});
const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();

const app = require('./src');

client.login(process.env['TOKEN']);

client.on('message', async mensaje => {

    if (mensaje.content.includes('c!')) {

        let args = [];
        let comando = mensaje.content.split('c!')[1];

        // SI EL STRING TIENE ESPACIOS
        if (/\s/.test(comando)) {

            args = comando.split(' '); // DIVIDIMOS EN ARRAYS POR ESPACIOS
            comando = args.shift(); // SACAMOS EL PRIMER ITEM QUE SERÍA EL COMANDO, LO DEMÁS SON LOS ARGUMENTOS QUE LE SIGUEN
        }

        if (comando.length > 1) {

            try {
                await leerComando(comando, args, mensaje);
            } catch (err) {
                await mensaje.reply(err.message);
            }

        }
    }
});

client.on("ready", async () => {
    console.log("Coscu BOT by RodrigoRio");
    console.log("Node Version: " + process.version);
    console.log("Discord.js Version: " + Discord.version);

    await client.user.setActivity((client.guilds.cache.size).toString() + " servers !help", {type: "PLAYING"});
});

client.on("guildCreate", async () => {
    await client.user.setActivity((client.guilds.cache.size).toString() + " servers !help", {type: "PLAYING"});
});

async function leerComando(comando, args, mensaje) {

    if(mensaje.member.id !== client.user.id) {
        switch (comando) {
            case 'help':
                let msg = "c!<frase>: dice alguna frase de coscu (Ej: c!buenardo) (SÓLO FUNCIONA EN MODO MANUAL)\n" +
                    "c!manual: El bot solo va a funcionar por comando\n" +
                    "c!automatico <tiempo_en_segundos>: El bot va a ingresar a todos los channels cada X tiempo a reproducir un sonido al azar\n" +
                    "c!escuchar: El bot va a escucharte cada 10 segundos, 3 segundos. Si decís una frase de Coscu (Ej: buenardo, clave) el bot va a reproducir la frase sólo (Deshabilitado momentaneamente por cuestiones de escalabilidad) \n" +
                    "c!sonidos: Muestra los sonidos disponibles para reproducir";
                mensaje.reply(msg);
                break;
            case 'automatico':
                app.automatico.modoAutomatico(true, args, mensaje);
                break;
            case 'manual':
                app.automatico.modoAutomatico(false, args, mensaje);
                break;

            case 'sonidos':

                let audios = [];

                await fs.readdir('./audios/', async (err, archivos) => {

                    archivos.forEach(archivo => {
                        audios.push(archivo.replace('.mp3', ''));
                    });

                    mensaje.reply("Todos los sonidos que hay para reproducir son: " + audios.join(' - '));
                });

                break;

            // case 'escuchar': app.escuchar.agregarEscucha(mensaje); break;

            default:


                const voiceChannel = mensaje.member.voice.channel;

                if (!voiceChannel) throw new Error('Bbto metete a un chanel para escucharme');
                if (!fs.existsSync('./audios/' + comando + '.mp3')) throw new Error('mMm ese comandovich no lo tengo');

                // SI ESTÁ EN MODO AUTOMÁTICO
                if (app.data.automatico) throw new Error('El bot está en modo automático brEEEo, desactivalo con c!manual');

                app.sonidos.agregarCola(comando, mensaje);

                break;
        }
    }
}
