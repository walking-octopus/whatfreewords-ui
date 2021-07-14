function updateWords(coords) {
  words = coord_to_words(coords);

  document.getElementById("words").textContent = words;
  console.log(words);
  console.log(coords);
}

function setStart(coords, map, marker) {
  map.setView(
    new ol.View({
      center: ol.proj.fromLonLat(coords),
      zoom: 19,
      maxZoom: 20,
    })
  );

  marker.setPosition(ol.proj.fromLonLat(coords));

  updateWords(coords);
}

async function copyToClipboard(textToCopy) {
  try {
    await navigator.clipboard.writeText(textToCopy);
    console.log("Link copied to clipboard");
  } catch (err) {
    console.error("Failed to copy: ", err);
  }
}

coords = [-0.116708278, 51.50844113];
var map = new ol.Map({
  target: "map",
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
    }),
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat(coords),
    zoom: 16,
    maxZoom: 20,
  }),
});

var marker = new ol.Overlay({
  position: ol.proj.fromLonLat(coords),
  // positioning: "center-center",
  element: document.getElementById("marker"),
  stopEvent: false,
});
map.addOverlay(marker);

updateWords(coords);

map.on("click", function (evt) {
  coords = ol.proj.transform(evt.coordinate, "EPSG:3857", "EPSG:4326");
  marker.setPosition(ol.proj.fromLonLat(coords));

  updateWords(coords);
});

function parseParams() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const textParam = urlParams.get("words");

  if (queryString) {
    return textParam;
  } else {
    return null;
  }
}

function shareWords() {
  words = document.getElementById("words").textContent;

  let ourURL = window.location.href;
  let host = ourURL.split("?")[0];

  parameters = "?words=" + words;
  link = host + parameters;

  copyToClipboard(link);
}

onload = function () {
  URLwords = parseParams();

  if (URLwords != null) {
    setStart(words_to_coord(URLwords), map, marker);
    // notify("You recived a message!")
  } else {
    // notify("Write something and share the URL!")
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (position) {
        setStart(
          [position.coords.longitude, position.coords.latitude],
          map,
          marker
        );
      });
    }
  }
};
