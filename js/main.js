var stations = {};

function getBART(stationAbbr) {
  var BARTApi = 'MW9S-E7SL-26DU-VV8V';
  $.get('http://api.bart.gov/api/etd.aspx?cmd=etd&orig=ALL&key=' + BARTApi + '&callback=?', function(xml) {
    processBART(xml, stationAbbr);
  });
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
          "times": []
        };

        if (! (destination.estimate instanceof Array)) {
          destination.estimate = [ destination.estimate ];
        }
        destination.estimate.forEach(function(estimate) {
            stations[station.abbr].lines[destination.abbreviation].times.push(parseInt(estimate.minutes, 10));
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
  for (line in station.lines) {
    var a = $("<div>").text(station.lines[line].name).appendTo($("#results"));
    a.attr('class', station.lines[line].color);
    for (time in station.lines[line].times) 
      $("<ul>").text(station.lines[line].times[time]+"min").appendTo($("#results"));    
  };
}

var x = null;

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

$(document).ready(function() {
  x = document.querySelector(".stationName");
  getLocation();
});
