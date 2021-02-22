// 1. Configuración
grafMapa = d3.select('#grafMapa')
grafBarras = d3.select('#grafBarras')

ancho_total = grafMapa.style('width').slice(0, -2)
alto_total = ancho_total * 0.8

grafMapa.style('width' , `${ ancho_total}px`).style('height', `${ alto_total }px`)
grafBarras.style('width' , `${ ancho_total}px`).style('height', `${ alto_total }px`)

margins = {  top:    ancho_total * 0.06 
           , left:   ancho_total * 0.06
           , right:  ancho_total * 0.06
           , bottom: ancho_total * 0.18 }

ancho = ancho_total - margins.left -  margins.right
alto  = alto_total  - margins.top  - margins.bottom

// 2. Variables globales
svgM =   grafMapa.append('svg').style('width', `${ ancho_total }px`).style('height', `${ alto_total }px`);
svgB = grafBarras.append('svg').style('width', `${ ancho_total }px`).style('height', `${ alto_total }px`);
dataArray = []
grupos = []

function agregar_g(svg){
  g = svg.append('g')
    .style('transform', `translate(${margins.left}px, ${margins.top}px)`)
    .style('width', ancho + 'px')
    .style('height', alto + 'px');
  return g;
}
function generar_g(){
  dataArray.forEach(estado => grupos.push({indice:estado.indice, gM:agregar_g(svgM), gB:agregar_g(svgB)}));
}

//    3.2  funciones para ajustar los datos de entrada a la representacion de salida
function dominio(escala,minEntrada,maxEntrada, salida) {
  f = escala.domain([minEntrada, maxEntrada]).range(salida)
  return f
}
function preprocesar(data) {
  //console.log(data)
  min_x = Math.min.apply(null, data.map((e) => Math.min.apply(null, e.coordenadas.map((p) => p[0]))))
  max_x = Math.max.apply(null, data.map((e) => Math.max.apply(null, e.coordenadas.map((p) => p[0]))))
  min_y = Math.min.apply(null, data.map((e) => Math.min.apply(null, e.coordenadas.map((p) => p[1]))))
  max_y = Math.max.apply(null, data.map((e) => Math.max.apply(null, e.coordenadas.map((p) => p[1]))))

  fy = dominio(d3.scaleLinear(),min_y,max_y,[0, alto])
  fx = dominio(d3.scaleTime()  ,min_x,max_x,[0,ancho])  

  for (i=0; i < data.length; i+=1) {
    data[i].indice = i;
    for (j=0; j < data[i].coordenadas.length; j+=1) {
      data[i].coordenadas[j][0] = fx(data[i].coordenadas[j][0])
      data[i].coordenadas[j][1] = alto-fy(data[i].coordenadas[j][1])
    }
    data[i].coordenadas = [data[i].coordenadas];
  }
  
  return data;
}

//  3.3  funciones para dibujar los diferentes grupos de componentes
function render() {
  data = dataArray;
  dibujarMapa(data);
  dibujarBarras(data);
}

function dibujarMapa(data){
  indicador = document.getElementById('indicadores').value;

  min = Math.min.apply(null, data.map((e) => e[indicador]));
  max = Math.max.apply(null, data.map((e) => e[indicador]));

  fc = dominio(d3.scaleQuantize(),min,max,["#65e800", "#e0e800", "#e8aa00", "#e85d00", "#e80000"])

  data.forEach(estado => dibujarArea(estado,fc,indicador));
}
function dibujarArea(estado,fc,indicador){
  
  grupo = grupos.find(g => g.indice == estado.indice);
  
  color = fc(estado[indicador]);

  elementos = grupo.gM.selectAll('polygon').data(estado.coordenadas)

  elementos.enter()
    .append("polygon")
    .attr("points",(d) => d)
    .attr("stroke", "black")
    .attr("fill", color)
    .attr("stroke-width", 2)
    .merge(elementos)
    .transition()
    .duration(d => 1000)
    .attr("fill", color);

  elementos.exit()
    .transition()
    .remove();
  
}
function dibujarBarras(data){
  indicador = document.getElementById('indicadores').value;

  min = Math.min.apply(null, data.map((e) => e[indicador]));
  max = Math.max.apply(null, data.map((e) => e[indicador]));

  datos = data.map(estado => [estado.nombre,estado[indicador]]);
  //falta ordenar datos
  fx = dominio(d3.scaleLinear(),min,max,[[0,ancho]])

  elementos = grupo.gB.selectAll('bar').data(datos)

  elementos.enter()
    .append("rect")
    .style("fill", "steelblue")
    .attr("x", function(e) { return 0; })
    .attr("width", function(d) { return  20*fx(d[1]);} )
    .attr("y", function(d,i) { return i*20; })
    .attr("height", 15)
    .merge(elementos)
    .transition()
    .duration(d => 1000)
    .attr("fill", color);

  elementos.exit()
    .transition()
    .remove();

}

// 4. Carga de datos
fetch('estados.json')
  .then(response => response.json())
  .then(data =>{
    dataArray = preprocesar(data);
    generar_g();
    actualizar();
  });

function actualizar(){
  render();
}

