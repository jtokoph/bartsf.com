var stations = {};

var x = null;

$(document).ready(function() {
  x = document.querySelector(".stationName");
  getLocation();

  $(document).on('click', '#lines', function() {
    if ($('.traintimes').is(':hidden')) {
      $('.traintimes').show();
      $('.traincars').hide();
    }
    else {
      $('.traincars').show();
      $('.traintimes').hide();
    }
  });

  $(document).on('click', '#changestation', function() {
    
  });
});

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showStation);
    } else {
        x.innerHTML = "CAN'T LOCATE YOU :/";
    }
}

function showStation(position) {

  var clat = position.coords.latitude;
  var clng = position.coords.longitude;
  var currentStation = "";
  var stationAbbr = "";
  var shortest = Infinity;
  for (station in stationLocations) {
    var slat = stationLocations[station]["lat"];
    var slng = stationLocations[station]["lng"];
    var dlat = clat - slat;
    var dlng = clng - slng;
    var distance = (dlat*dlat)+(dlng*dlng);
    if (shortest > distance) {
      shortest = distance;
      currentStation = stationLocations[station].name;
      stationAbbr = station;
    }
  }
  x.innerHTML = currentStation;
  getBART(stationAbbr);
}

function getBART(stationAbbr) {
  var BARTApi = 'MW9S-E7SL-26DU-VV8V';
  var refresh = function() {
    $.get('http://api.bart.gov/api/etd.aspx?cmd=etd&orig=ALL&key=' + BARTApi + '&callback=?', function(xml) {
      processBART(xml, stationAbbr);
      setTimeout(refresh, 10000);
    });
  };

  refresh();
}

function processBART(xml, stationAbbr) {
  //parse XML
  var data = $.xml2json(xml);

  data.station.forEach(function(station) {
      stations[station.abbr] = {
        "abbr": station.abbr,
        "name": station.name,
        "lines": {}
      };

      if (!(station.etd instanceof Array)) {
        station.etd = [ station.etd ];
      }
      station.etd.forEach(function(destination) {
        stations[station.abbr].lines[destination.abbreviation] = {
          "abbr": destination.abbreviation,
          "name": destination.destination,
          "color": "",
          "trains": []
        };

        if (! (destination.estimate instanceof Array)) {
          if (destination.estimate !== null)
            destination.estimate = [ destination.estimate ];
        }

        destination.estimate.forEach(function(estimate) {
            var train = {
              "time": estimate.minutes,
              "length": estimate.length
            };
            stations[station.abbr].lines[destination.abbreviation].trains.push(train);
            if (stations[station.abbr].lines[destination.abbreviation].color === "") {
              stations[station.abbr].lines[destination.abbreviation].color = estimate.color;
            }
        });
      });
  });
  showResults(stationAbbr);
}

function showResults(stationAbbr) {
  var station = stations[stationAbbr];
  $("#stationName").text(station.name);
  $('#lines').html('');

  for (line in station.lines) {
    var a = $("<div>").text(station.lines[line].name).appendTo($("#lines"));
    a.attr('class', station.lines[line].color);
    var $traintimes = $('<div class="traintimes">').appendTo($("#lines"));
    for (train in station.lines[line].trains) {
      if (!isNaN(station.lines[line].trains[train].time)) {
        $('<div class="traintime">').text(station.lines[line].trains[train].time + " min").appendTo($traintimes);
      }
      else {
        $('<div class="traintime">').text(station.lines[line].trains[train].time).appendTo($traintimes);
      }
    }
    $traincars = $('<div class="traincars">').appendTo($("#lines")).hide();
    for (train in station.lines[line].trains) {
      $('<div class="traincar">').text(station.lines[line].trains[train].length + " cars").appendTo($traincars);
    }
  };

  // Animate loader off screen
  $(".se-pre-con").hide();
}
