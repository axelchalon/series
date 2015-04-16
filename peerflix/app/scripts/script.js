
'use strict';
var socket = io.connect('http://127.0.0.1:3561');
var mySuggestions;

socket.on('shortId',function(shortId){
    
    socket.on('newImage',function(data){
        console.log('New image');
        $('body').removeClass().addClass('writeSuggestions');
    
        $('textarea#mySuggestionsAre').empty();
        // $('#image').attr('src',data);
        $('body').css('background-image','url('+data+')');

        mySuggestions = [];
        setTimeout(function(){ // 
            // mySuggestions = $('input#mySuggestionsAre').val().split('\n').filter(function(e){return e});
            socket.emit('mySuggestionsAre',mySuggestions);

            $('input#mySuggestionsAre').val('');
        },5000);
    });

    socket.on('words',function(data){
        
        console.log(data);
        $('body').removeClass().addClass('showResults');
        $('div#results').empty();   

        for (var i = 0; i < data.length; i++)
        {
            var ul = $('<ul></ul>').appendTo('div#results');
            if (data[i].shortId == shortId) ul.addClass('mySuggestions');
            
            for (var j = 0; j < data[i]['suggestions'].length ; j++)
            {
                if (jQuery.inArray(data[i]['suggestions'][j],mySuggestions) !== -1)
                {
                    console.log(data[i]['suggestions'][j] + ' in');
                    console.log(mySuggestions);
                    ul.append($('<li></li>').text(data[i]['suggestions'][j]).addClass('alsoOneOfMySuggestions'));
                }
                else
                    ul.append($('<li></li>').text(data[i]['suggestions'][j]));
            }
        }

        // et compare, vote, addtowordlist etc.
    });



});

$('#mySuggestionsAre').keypress(function(e) {
   if (e.keyCode == 13) // si on appuie sur entrée, on ajoute à la liste et on supprime
   {
       mySuggestions.push($(this).val());
       $(this).val('');
       return false;
   }
    
    e.stopPropagation();
});

$('#mySuggestionsAre').on('keyup change',function(e) {
    if ($(this).val() == '') $(this).addClass('empty'); else $(this).removeClass('empty');
});

$('body').keypress(function(e){
    
    console.log('body keydown');
    console.log(String.fromCharCode(e.which));
    $('#mySuggestionsAre').val($('#mySuggestionsAre').val()+String.fromCharCode(e.which)).focus();
    return false;
});

if (typeof localStorage['savedWords'] == 'undefined')
    localStorage['savedWords'] = JSON.stringify([]);

$('#results').on('click','li',function(){
    console.log('added');
    var newWordlist = JSON.parse(localStorage['savedWords']);
    newWordlist.push($(this).text());
    localStorage['savedWords'] = JSON.stringify(newWordlist);
});

$('a#savedWords').click(function(){
    $(this).remove();
   var savedWords = JSON.parse(localStorage['savedWords']);
    
    
    $.each(savedWords,function(n,o) {
        var el = $('<span></span>').append($('<span></span>').text(o));
        el.append('<a href="#" class="deleteSavedWord">(x)</a>');
        $('footer').prepend(el); 
    });
    
});
    
$('footer').on('click','.deleteSavedWord', function() {
    var wordToKill = $(this).parent().find('span').text();
    var savedWords = JSON.parse(localStorage['savedWords']);    
    var newSavedWords = $.grep(savedWords, function(value) {
        return value != wordToKill;
    });
    localStorage['savedWords'] = JSON.stringify(newSavedWords);
    $(this).parent().remove();
});