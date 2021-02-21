// 1. Configuración
graf = d3.select('#graf')

ancho_total = graf.style('width').slice(0, -2)
alto_total = ancho_total * 0.8

//alto_total  = graf.style('height')//.slice(0, 0)
//ancho_total = alto_total * 1
//alert(alto_total)

graf.style('width' , `${ ancho_total}px`)
    .style('height', `${ alto_total }px`)

margins = {  top:    ancho_total * 0.06 
           , left:   ancho_total * 0.06
           , right:  ancho_total * 0.06
           , bottom: ancho_total * 0.18 }

ancho = ancho_total - margins.left -  margins.right
alto  = alto_total  - margins.top  - margins.bottom

// 2. Variables globales
svg = graf.append('svg')
          .style('width', `${ ancho_total }px`)
          .style('height', `${ alto_total }px`);

dataArray = []

function agregar_grupo(){
  g = svg.append('g')
         .style('transform', `translate(${margins.left}px, ${margins.top}px)`)
         .style('width', ancho + 'px')
         .style('height', alto + 'px');
  return g;
}

//    3.2  funciones para ajustar los datos de entrada a la representacion de salida
function dominio(escala,minEntrada,maxEntrada,minSalida,maxSalida) {
  f = escala
    .range( [minSalida ,  maxSalida])
    .domain([minEntrada, maxEntrada])
  return f
}
function preprocesar(data) {
  //console.log(data)
  min_x = Math.min.apply(null, data.map((e) => Math.min.apply(null, e.coordenadas.map((p) => p[0]))))
  max_x = Math.max.apply(null, data.map((e) => Math.max.apply(null, e.coordenadas.map((p) => p[0]))))
  min_y = Math.min.apply(null, data.map((e) => Math.min.apply(null, e.coordenadas.map((p) => p[1]))))
  max_y = Math.max.apply(null, data.map((e) => Math.max.apply(null, e.coordenadas.map((p) => p[1]))))

  fy = dominio(d3.scaleLinear(),min_y,max_y,0, alto)
  fx = dominio(d3.scaleTime()  ,min_x,max_x,0,ancho)  

  for (i=0; i < data.length; i+=1) {
    for (j=0; j < data[i].coordenadas.length; j+=1) {
      data[i].coordenadas[j][0] = fx(data[i].coordenadas[j][0])
      data[i].coordenadas[j][1] = alto-fy(data[i].coordenadas[j][1])
    }
  }
  
  return data;
}

//  3.3  funciones para dibujar los diferentes grupos de componentes
function render() {
  data = dataArray
  dibujarMapa(data)
}

function dibujarMapa(data){

  indicador  = document.getElementById('indicadores').value;
  //alert(indicador);
  minc = Math.min.apply(null, data.map((e) => e[indicador]))
  maxc = Math.max.apply(null, data.map((e) => e[indicador]))

  var fc = d3.scaleQuantize()
    .domain([minc,maxc])
    .range(["#65e800", "#e0e800", "#e8aa00", "#e85d00", "#e80000"]);

  data.forEach(estado => dibujarArea(estado,fc(estado[indicador])));
}
function dibujarArea(estado,color){
  agregar_grupo().selectAll("polygon")
    .data([estado.coordenadas])
    .enter()
    .append("polygon")
    .attr("points",(d) => d)
    .attr("stroke", "black")
    .attr("fill", color)
    .attr("stroke-width", 2);
}

// 4. Carga de datos
fetch('estados.json')
  .then(response => response.json())
  .then(data =>{
    dataArray = preprocesar(data);
    render();
  });

function actualizar(){
  render();
  //alert("sdfsdf");
}

