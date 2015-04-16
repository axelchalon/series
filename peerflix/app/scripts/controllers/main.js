'use strict';

/*
on s'isncrit à séance publique : (rejoindre la séance publique)
- on ajoute le torrent et on commence à télécharger
- ça nous mène vers la view de tchat (on rejoint le tchat en socket io / node "connect tchat de séancepublique N°X")
- quand l'heure arrive, on play() (faire ça en local avec heure locale)

@todo quand on est sur une autre page, supprimer le torrent

trouver le mp4 à télécharger parmi les fichiers de torrent, et à afficher

si inscrit à séance publique


séances publiques ==> s'inscrire (oupas) ==> pouvoir rejoindre 5 min avant
à la télé
lire un torrent avec ses potes


si séance publique déjà commencée, on dl et on fetch jusqu'à? non..

tv chat temps réel temps restant


COMMENT RECUP A PARTIR DE BDD? via api !

@todo récupérer séances publiques et show tv par ajax script php api bdd (recevoir le poster aussi)
@todo pouvoir rejoindre une room privée (mettre un timer?)
@todo synchronisation ? ==> pour rooms privées, quand l'utilisateur se connecte à room existante, il envoie "getPeerTimeInVideo" le créateur re nvoie "peerTimeInVideoIn5Seconds" et le nb de secondes auxquelles il est + 5secondes. Si on n'arrive pas à y aller (buffer) on renvoie un getepeertime dans 10 secondes. /// => pour séances publiques 
@todo javascript afficher "rejoindre room" pour séances publiques et tv show moins cinq minutes
@todo player juste visible par créateur room privée (évènement play, pause (getcurrenttime))
@todo buffering ==> seek un instnat plus tard et pause ; play quand prêt?

@todo recheck syntaxe pour avoir pertinence de résultats ++

@todo utiliser les routes pour pouvoir gérer les urls? comment partager sinon



OK : synchro séances publiques

partage de lien...
vérif du hash


timestamp en gmt
*/

function get_time_diff( datetime )
{
    var datetime = typeof datetime !== 'undefined' ? datetime : "2014-01-01 01:02:03.123456";

    var datetime = new Date( datetime ).getTime();
    var now = new Date().getTime();

    if( isNaN(datetime) )
    {
        return "";
    }

    console.log( datetime + " " + now);

    if (datetime < now) {
        var milisec_diff = now - datetime;
    }else{
        var milisec_diff = datetime - now;
    }

    var days = Math.floor(milisec_diff / 1000 / 60 / (60 * 24));

    var date_diff = new Date( milisec_diff );

    return days + " Days "+ date_diff.getHours() + " Hours " + date_diff.getMinutes() + " Minutes " + date_diff.getSeconds() + " Seconds";
}
console.log(get_time_diff(1429187908*1000)); 


var socket = io.connect('http://127.0.0.1:9000');

angular.module('peerflixServerApp')
  .controller('MainCtrl', function ($scope, $resource, $log, $q, $upload, torrentSocket, $http) {
    
    
    $scope.seancesPubliques = [
        {magnet: 'magnet:?xt=urn:btih:4E660F05AD95F61950985C3A6702AE605E41B649&dn=into+the+woods+2014+1080p+brrip+x264+yify&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce',
         startsAt: 1429185000,
        name:'into the woods'},
        {magnet: 'magnet:?xt=urn:btih:4E660F05AD95F61950985C3A6702AE605E41B649&dn=into+the+woods+2014+1080p+brrip+x264+yify&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce',
         startsAt: 1429189999,
        name:'into the woods2'},
        {magnet: 'magnet:?xt=urn:btih:4E660F05AD95F61950985C3A6702AE605E41B649&dn=into+the+woods+2014+1080p+brrip+x264+yify&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce',
         startsAt: 1429199600,
        name:'into the woods3'}];
    
    
    $scope.tvShows = [
        {startsAt: 1429185000,
        name:'Game of Thrones S03E01'
        },
    {startsAt: 1429185000,
        name:'Game of Thrones S03E01'
        }];
    
    
    var intervalID = window.setInterval(function() {
        $scope.$apply(function(){
            for (var i=0; i<$scope.seancesPubliques.length; i++) {
                if (Date.now()/1000>$scope.seancesPubliques[i].startsAt-300)
                    $scope.seancesPubliques[i].joinable = true;
            }
            
            for (var i=0; i<$scope.tvShows.length; i++) {
                if (Date.now()/1000>$scope.tvShows[i].startsAt-300)
                    $scope.tvShows[i].joinable = true;
            }
        });
    }, 1000);
    
    
    var Torrent = $resource('/torrents/:infoHash');

    function load() {
      var torrents = Torrent.query(function () {
        $scope.torrents = torrents;
         // $scope.removeAll(); fonctionne que si appelé un bon moment après
      });
    }
    
    $scope.getVideoSrc = function(infohash,filepath) // pk appelé plein de fois?
    {
        console.log(infohash);
        console.log(filepath);
        // /torrents/{{ torrent.infoHash }}/files/{{ file.path | encodeUri }}
        return '/torrents/'+infohash+'/files/'+encodeURIComponent(filepath);
    }
    
    $scope.searchSeries = function(series,season,episode)
    {
     $http.get('http://127.0.0.1/series/getMagnet.php?q=' + encodeURIComponent(series + ' S' + (season>9 ? season : '0' + season) + 'E' + (episode > 9 ? episode : '0' + episode) + ' category:tv'))
        .success(function(data, status, headers, config) {
         $scope.downloadFromMagnet(data);
        }).error(function(data, status, headers, config) {
         console.log(status);
        });
        
          
    }
    
     $scope.timeLeft = false;
    
    $scope.chatMessages = [];
    socket.on('chatMessage',function(data){
        $scope.$apply(function() { 
        $scope.chatMessages.push(data);
        // document.getElementById('chat').innerHTML+='<br/>'+data.nickname+' : '+data.message
        });
    });
    
    $scope.chatUserCount = 0;
    socket.on('chatUserCount',function(count){
        console.log('cuc');
        $scope.$apply(function() { 
            $scope.chatUserCount=count;
       });
    });
    
    function loadTorrent(hash) {
    
      return Torrent.get({ infoHash: hash }).$promise.then(function (torrent) {
          
        var existing = _.find($scope.torrents, { infoHash: hash });
        if (existing) {
            console.log('e');
          var index = $scope.torrents.indexOf(existing);
          $scope.torrents[index] = torrent;
        } else {
            console.log('ne');
          $scope.torrents.unshift(torrent);
        }
          
          
        if (torrent.files)
        {
            console.log('tfiles');
            console.log(torrent.files);
            console.log('thash');
            console.log(torrent.infoHash);
            $scope.beingPlayed_filePath = _.find(torrent.files, function(val) {
              return val.path.match(/.mp4|.mkv$/);
            }).path;
            
            
            console.log('fp');
            console.log($scope.beingPlayed_filePath);
            
            $scope.beingPlayed_infoHash = torrent.infoHash;
            $scope.viewView = 'watch';
            
            
            socket.emit('chatJoinRoom','prv_'+torrent.infoHash);
            socket.emit('chatSetNickname',prompt('USERNAME pour le tchat ?'));
            
            if (typeof $scope.startsAt !== 'undefined') // @todo n'éxecuter ça qu'une fois
            {
                
                $scope.timeLeftInterval = setInterval(function(){
                    
                    $scope.$apply(function(){
                        console.log('starts at ms : ' + $scope.startsAt*1000 );
                        console.log('now ms : ' + Date.now());
                        if ($scope.startsAt*1000<Date.now())
                        {
                            console.log('killing timeleft');
                            $scope.timeLeft = false;
                            clearInterval($scope.timeLeftInterval);
                            return;
                        }
                        
                        var timeLeft = new Date($scope.startsAt*1000-Date.now());
                         $scope.timeLeft = (timeLeft.getMinutes()>9 ? timeLeft.getMinutes() : '0' + timeLeft.getMinutes())  + ' : ' + (timeLeft.getSeconds()>9 ? timeLeft.getSeconds() : '0' + timeLeft.getSeconds());
                    });
                },1000);
                
                console.log('not undefined');
                console.log('routine to play');
                /*if ($scope.startsAt<Math.floor(Date.now() / 1000)) // si la séance a déjà commencé
                {*/
                    setTimeout(function(){
                    document.getElementById('player').addEventListener("canplay",function() {
                        console.log('setting current time');
                        
                        if ($scope.startsAt<Math.floor(Date.now() / 1000))
                        {
                            document.getElementById('player').currentTime = Math.floor(Date.now() / 1000) - $scope.startsAt;
                            document.getElementById('player').play();
                        }
                        else
                        {
                            setTimeout(function(){
                                console.log('play in timeout');
                                document.getElementById('player').play(); // commencement synchro
                            },Math.max(500,1000*($scope.startsAt-Math.floor(Date.now() / 1000)))); // doit être > qq sec
                        }
                    });
                    },500); // le temps que la vue change
                //}
                /*else
                {
                    console.log('pas encore commencé');
                    console.log($scope.startsAt-Math.floor(Date.now() / 1000));
                    setTimeout(function(){
                        console.log('play in timeout');
                        document.getElementById('player').play(); // commencement synchro
                        },Math.max(500,1000*($scope.startsAt-Math.floor(Date.now() / 1000)))); // doit être > qq sec
                }*/
            }
            

        }
          
          
        return torrent;
      });
        
    }
    
    /*
     console.log('sp - dll!');
            console.log(torrent);
            
            _.forEach(torrent.files,function(n,key) {
                console.log(n.name);
                if (n.name.match(/.mp4$/))
                {
                    console.log('match');
                    $scope.beingPlayed_filePath = n.name; 
                }
            });
            
            $scope.beingPlayed_filePath = _.find(torrent.files, function(val) {
  return val.name.match(/.mp4$/);
}).name;
            
            $scope.beingPlayed_infoHash = torrent.infoHash;
            $scope.viewView = 'watch';
    
    */

    function findTorrent(hash) {
      var torrent = _.find($scope.torrents, { infoHash: hash });
      if (torrent) {
        return $q.when(torrent);
      } else {
        return loadTorrent(hash);
      }
    }

    load();

    $scope.chatSendMessage = function (message) {
      socket.emit('chatSendMessage',message);
    };
    
    $scope.keypress = function (e) {
      if (e.which === 13) {
        $scope.download();
      }
    };

    $scope.viewView = 'home';
    $scope.downloadSeancePublique = function (magnet,startsAt)
    {
        
        $scope.startsAt = startsAt;
        console.log(magnet);
        console.log('sp - dl');
        Torrent.save({ link: magnet }).$promise.then(function (torrent) {
            
            loadTorrent(torrent.infoHash);
           
        });
        
        
        
    }
    
    $scope.joinTVChat = function (channelIndex) {
        $scope.viewView = 'watchChatOnly';
        socket.emit('chatJoinRoom','tv_'+channelIndex);
        socket.emit('chatSetNickname',prompt('USERNAME pour le tchat ?'));
    }
    
    // supprimmable
    $scope.download = function () {
      if ($scope.link) {
        Torrent.save({ link: $scope.link }).$promise.then(function (torrent) {
          loadTorrent(torrent.infoHash);
        });
        $scope.link = '';
      }
    };
    
    $scope.downloadFromMagnet = function (magnet) {
        Torrent.save({ link: magnet }).$promise.then(function (torrent) {
          loadTorrent(torrent.infoHash);
        });
    };

    $scope.upload = function (file) {
      $upload.upload({
        url: '/upload',
        file: file
      }).then(function (response) {
        loadTorrent(response.data.infoHash);
      });
    };

    $scope.pause = function (torrent) {
      torrentSocket.emit(torrent.stats.paused ? 'resume' : 'pause', torrent.infoHash);
    };

    
    
    $scope.select = function (torrent, file) {
      torrentSocket.emit(file.selected ? 'deselect' : 'select', torrent.infoHash, torrent.files.indexOf(file));
    };

    $scope.removeAll = function () {
        console.log('removeall');
      _.forEach($scope.torrents,function(torrent) {
          console.log('removing :');
          console.log(torrent);
           Torrent.remove({ infoHash: torrent.infoHash });
      });
      $scope.torrents = {};
    };
    
    $scope.remove = function (torrent) {
      Torrent.remove({ infoHash: torrent.infoHash });
      _.remove($scope.torrents, torrent);
    };

    torrentSocket.on('verifying', function (hash) {
      findTorrent(hash).then(function (torrent) {
        torrent.ready = false;
      });
    });

    torrentSocket.on('ready', function (hash) {
      loadTorrent(hash);
    });

    torrentSocket.on('interested', function (hash) {
      findTorrent(hash).then(function (torrent) {
        torrent.interested = true;
      });
    });

    torrentSocket.on('uninterested', function (hash) {
      findTorrent(hash).then(function (torrent) {
        torrent.interested = false;
      });
    });

    torrentSocket.on('stats', function (hash, stats) {
      findTorrent(hash).then(function (torrent) {
        torrent.stats = stats;
      });
    });

    torrentSocket.on('download', function (hash, progress) {
      findTorrent(hash).then(function (torrent) {
        torrent.progress = progress;
      });
    });

    torrentSocket.on('destroyed', function (hash) {
      _.remove($scope.torrents, { infoHash: hash });
    });

    torrentSocket.on('disconnect', function () {
      $scope.torrents = [];
    });

    torrentSocket.on('connect', load);
  });



/*
angular.directive('attronoff', function() {
    return {
    link: function($scope, $element, $attrs) {
        $scope.$watch(
            function () { return $element.attr('data-attr-on'); },
            function (newVal) { 
                var attr = $element.attr('data-attr-name');

                if(!eval(newVal)) {
                    $element.removeAttr(attr);
                }
                else {
                    $element.attr(attr, attr);
                }
            }
        );
        }
    };
});*/