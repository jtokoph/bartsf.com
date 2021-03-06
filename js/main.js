var stations = {};

var stationAbbr = "";

$(document).ready(function() {
  getLocation();

  $(document).on('click', '#switch-views-button', function() {
    if ($('.traintimes').is(':visible')) {
      $('.traintimes').hide();
      $('.traincars').show();
      $(this).text('show times');
    } else {
      $('.traintimes').show();
      $('.traincars').hide();
      $(this).text('show cars');
    }
  });

  $(document).on('click touchstart', '.trainname', function() {
    var color = $(this).parent().attr('color');
    var $othertrains = $('.trainline').not('[color="'+ color + '"]');
    if ($othertrains.is(':visible')) {
      $othertrains.hide();
    } else {
      $othertrains.show();
    }
  });
  
});

$(document).on('click', '.bound', function() {
  var direction = $(this).attr('id');
  if (direction === "North") {
    $('[direction="North"]').show();
    $('[direction="South"]').hide();
  }
  else if (direction === "South") {
    $('[direction="North"]').hide();
    $('[direction="South"]').show();
  }
  else {
    $('.trainline').show();
  }
});

function changeStation(selectstationAbbr) {
  stationAbbr = selectstationAbbr;
  showResults();
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showStation);
  } else {
    $('.stationName').text("CAN'T LOCATE YOU :/");
  }
}

function showStation(position) {
  var clat = position.coords.latitude;
  var clng = position.coords.longitude;
  var currentStation = "";
  var shortest = Infinity;
  for (station in stationLocations) {
    $('<option value="'+station+'">').text(stationLocations[station].name).appendTo($('#selectstation'));
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
  $('#selectstation').val(stationAbbr);
  getBART();
}

function getBART() {
  var BARTApi = 'MW9S-E7SL-26DU-VV8V';
  var refresh = function() {
    $.get('http://api.bart.gov/api/etd.aspx?cmd=etd&orig=ALL&key=' + BARTApi + '&callback=?', function(xml) {
      processBART(xml);
      setTimeout(refresh, 10000);
    });
  };
  refresh();
}

function processBART(xml) {
  //parse XML
  var data = $.xml2json(xml);
  console.log(data);

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
        "direction": "",
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
            stations[station.abbr].lines[destination.abbreviation].direction = estimate.direction;
          }
      });
    });
  });
  showResults();
}

function showResults() {
  var station = stations[stationAbbr];
  $(".stationName").text(station.name);
  $('#lines').text('');

  for (line in station.lines) {
    $trainline = $('<div class="trainline">').appendTo($("#lines"));
    $trainname = $('<div class="trainname">').text(station.lines[line].name).appendTo($trainline);
    $trainname.addClass(station.lines[line].color);
    $trainline.attr("color", station.lines[line].color);
    $trainline.attr("direction", station.lines[line].direction);

    var $traintimes = $('<div class="traintimes">').appendTo($trainline);
    for (train in station.lines[line].trains) {
      if (!isNaN(station.lines[line].trains[train].time)) {
        $('<div class="traininfo traintime">').text(station.lines[line].trains[train].time + " min").appendTo($traintimes);
      }
      else {
        $('<div class="traininfo traintime">').text(station.lines[line].trains[train].time).appendTo($traintimes);
      }
    }
    $traincars = $('<div class="traincars">').appendTo($trainline).hide();
    for (train in station.lines[line].trains) {
      $('<div class="traininfo traincar">').text(station.lines[line].trains[train].length + " cars").appendTo($traincars);
    }
  };

  // Animate loader off screen
  $(".se-pre-con").hide();
}