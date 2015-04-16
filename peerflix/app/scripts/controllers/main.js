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
*/

var socket = io.connect('http://127.0.0.1:9000');

angular.module('peerflixServerApp')
  .controller('MainCtrl', function ($scope, $resource, $log, $q, $upload, torrentSocket, $http) {
    var Torrent = $resource('/torrents/:infoHash');

    function load() {
      var torrents = Torrent.query(function () {
        $scope.torrents = torrents;
         // $scope.removeAll(); fonctionne que si appelé un bon moment après
      });
    }
    
    $scope.getVideoSrc = function(infohash,filepath)
    {
        console.log(infohash);
        console.log(filepath);
        // /torrents/{{ torrent.infoHash }}/files/{{ file.path | encodeUri }}
        return '/torrents/'+infohash+'/files/'+encodeURIComponent(filepath);
    }
    
    $scope.searchSeries = function(series,season,episode)
    {
     $http.get('http://127.0.0.1/series/getMagnet.php?q=' + encodeURIComponent(series + ' S' + (season>9 ? season : '0' + season) + ' E' + (episode > 9 ? episode : '0' + episode) + ' category:tv'))
        .success(function(data, status, headers, config) {
         $scope.downloadFromMagnet(data);
        }).error(function(data, status, headers, config) {
         console.log(status);
        });
        
          
    }
    
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
              return val.path.match(/.mp4$/);
            }).path;
            
            
            console.log('fp');
            console.log($scope.beingPlayed_filePath);
            
            $scope.beingPlayed_infoHash = torrent.infoHash;
            $scope.viewView = 'watch';
            
            
            socket.emit('chatJoinRoom','prv_'+torrent.infoHash);
            socket.emit('chatSetNickname',prompt('USERNAME pour le tchat ?'));
            
            
            

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
        
        
        console.log(magnet);
        console.log('sp - dl');
        Torrent.save({ link: magnet }).$promise.then(function (torrent) {
            
            loadTorrent(torrent.infoHash);
           
        });
        
        console.log(startsAt-Math.floor(Date.now() / 1000));
        setTimeout(function(){
            document.getElementById('player').play();
            },1000*(startsAt-Math.floor(Date.now() / 1000))); // doit être > qq sec

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
