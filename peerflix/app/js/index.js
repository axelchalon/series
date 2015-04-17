//Quand le bouton next est cliqué
$(".next").click(function() {

    var input = $("input.name");

    // Avons nous au moins 1 element deja "Active"?
    if ($("li.active").length == 0) {
        var active = $("li.first");
        active.removeClass('first');
        active.addClass('active');
        console.log(active.text());
        searchSeries_series = input.val();
        active.text(input.val());
        input.attr("placeholder", "Numéro de la saison");
        $('#searchSeries_next').attr('value', 'Suivant');
    }

    // Faisons en sorte de passer au prochain element
    // Afin d'eviter tout bug possible nous créons la classe activated
    else {
        var active = $("li.active");
        var next = active.next();
        next.addClass('active');
        active.removeClass('active');
        active.addClass('actived');
        input.attr("placeholder", "Numéro de l'épisode"); //@todo num

        console.log(next.text());
        searchSeries_season = input.val();
        next.text(next.text() + ': ' + input.val());


        if ($("li.actived").length == 2) {
            searchSeries_episode = input.val();
            // $(".next").replaceWith( '<input type="submit" class="submit" name="submit" value="Regarder!"></input>' );
            $('#searchSeries_next').hide();
            $('#searchSeries').show();
            input.attr("placeholder", "Paré au décollage ?");
            input.prop('disabled', true);
        } else if ($("li.activated").length == 1) {

        }

    }

    input.val('');

});

$('input').keypress(function(e) {
    if (e.which == 13) {
        e.preventDefault();
        $(".next").click();
    }
});

$(".submit").click(function() {
    return false;
});

$(".discover").click(function() {});


// Rotation de mots en rouge:

var TxtRotate = function(el, toRotate, period) {
    this.toRotate = toRotate;
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.txt = '';
    this.tick();
    this.isDeleting = false;
};

TxtRotate.prototype.tick = function() {
    var i = this.loopNum % this.toRotate.length;
    var fullTxt = this.toRotate[i];

    if (this.isDeleting) {
        this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
        this.txt = fullTxt.substring(0, this.txt.length + 1);
    }

    this.el.innerHTML = '<span class="wrap">' + this.txt + '</span>';

    var that = this;
    var delta = 300 - Math.random() * 100;

    if (this.isDeleting) {
        delta /= 2;
    }

    if (!this.isDeleting && this.txt === fullTxt) {
        delta = this.period;
        this.isDeleting = true;
    } else if (this.isDeleting && this.txt === '') {
        this.isDeleting = false;
        this.loopNum++;
        delta = 500;
    }

    setTimeout(function() {
        that.tick();
    }, delta);
};

var elements = document.getElementsByClassName('red');
console.log(elements);
for (var i = 0; i < elements.length; i++) {
    var toRotate = elements[i].getAttribute('data-rotate');
    var period = elements[i].getAttribute('data-period');
    if (toRotate) {
        new TxtRotate(elements[i], JSON.parse(toRotate), period);
    }
}