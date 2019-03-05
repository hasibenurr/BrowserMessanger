var express = require('express');
var app = express();
var server= app.listen(3000,'0.0.0.0');
var io = require('socket.io').listen(server);

// users nesnesi tanımladık. Böylece her soketi nesnede saklayabileceğiz.
kullanicilar= {};
connections=[];

console.log('Server running...');

app.get('/',function(req, res){
    res.sendFile(__dirname + '/index.html');
});

        io.sockets.on('connection', function(socket){
            connections.push(socket);
            console.log('Connected: %s sockets connected',connections.length);

            // New User eklendikçe güncelliyor
        socket.on('new user', function(data, callback){

            // Aynı nickname taşımasınlar diye
        if(data in kullanicilar){
            callback(false);
        }
        else{
        callback(true);
        socket.username =data;
        kullanicilar[socket.username]= socket;
        //users.push(socket.username);
        updateonlines();
        }
        });

            function updateonlines(){
            io.sockets.emit('get users',Object.keys(kullanicilar));
                }

                // Disconnect
            socket.on('disconnect', function(data){ 
                if(!socket.username) return;

            // Online listesinden çıkar.
            delete kullanicilar[socket.username];
             updateonlines(); // Silindikten sonra kişileri güncelliyoruz.
             console.log(socket.username+': Disconnected');
             // Offline listesine userı gönder.
            io.sockets.emit('offline', {user: socket.username});

                  });
                  
            socket.on('disconnectedd',function(data){   
            socket.disconnect();
            });

            
    
             //PM Mesaj:
            socket.on('private message',function(data,callback){

            // Özel mesaj/Genel mesaj kontrolü
            var pmsg= data.trim();

            // Özel konuşma için '/p ' girerek izin isteriz.
            if(pmsg.substring(0,3) === '/p '){

            pmsg= pmsg.substring(3);
            var ind = pmsg.indexOf(' ');

            if(ind != -1){
            // Özel mesaj gönderilecek kişinin online olması kontrolü
            var name= pmsg.substring(0,ind);
            var pmsg= pmsg.substring(ind+1); // özel olarak gönderilecek mesaj

            if(name in kullanicilar){   
            //// İzinnnn
            //  kullanicilar[name].emit('uyarı', {user: socket.username});
            //////// Kabulse fısıldaşırlar, redse uyarı mesajı gider.
            kullanicilar[name].emit('whisper', {msg: pmsg, user: socket.username});
            kullanicilar[socket.username].emit('whisper', {msg: pmsg, user: socket.username});
                                                                                        
            }
            else{
                callback("Hata! Online kişilerle özel sohbet edebilirsiniz!");
            }
        }
            else{

                callback("Hata! Özel konuşabilmek için mesaj girin.");
            }
        }
            else{
            // PM Formatında giriş yapın.
             callback("Hata! PM formatında giriş yapmalısınız!");
                }

        });

            // Grup mesajlaşması
        socket.on('send message',function(data){
          io.sockets.emit('new message', {msg: data, user: socket.username});   
            });
        
        //15 saniye aralıklarla online kişileri kontrol ediyoruz.
            setInterval(updateonlines,15000);
        /*  function intervalFunc() {
                console.log('Cant stop me now!');
              }
              
              setInterval(intervalFunc, 1500);*/
              
            
});