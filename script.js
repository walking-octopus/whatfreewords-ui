function updateWords(coords) {
  words = coord_to_words(coords);

  document.getElementById("words").textContent = words;
  console.log(words);
  console.log(coords);
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

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(function (position) {
    map.setView(
      new ol.View({
        center: ol.proj.fromLonLat([
          position.coords.longitude,
          position.coords.latitude,
        ]),
        zoom: 19,
        maxZoom: 20,
      })
    );

    coords = [position.coords.longitude, position.coords.latitude];
    marker.setPosition(ol.proj.fromLonLat(coords));

    updateWords(coords);
  });
}

map.on("click", function (evt) {
  coords = ol.proj.transform(evt.coordinate, "EPSG:3857", "EPSG:4326");
  marker.setPosition(ol.proj.fromLonLat(coords));

  updateWords(coords);
});
