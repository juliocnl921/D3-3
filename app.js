// 1. Configuración
graf = d3.select('#graf')

ancho_total = graf.style('width').slice(0, -2)
alto_total = ancho_total * 0.42

graf.style('width' , `${ ancho_total}px`)
    .style('height', `${ alto_total }px`)

margins = {  top:    ancho_total*0.06 
           , left:   ancho_total*0.06
           , right:  ancho_total*0.06
           , bottom: ancho_total*0.18 }

ancho = ancho_total - margins.left -  margins.right
alto  = alto_total  - margins.top  - margins.bottom

// 2. Variables globales
svg = graf.append('svg')
          .style('width', `${ ancho_total }px`)
          .style('height', `${ alto_total }px`);

g = svg.append('g')
         .style('transform', `translate(${margins.left}px, ${margins.top}px)`)
         .style('width', ancho + 'px')
         .style('height', alto + 'px');

dataArray = []

//    3.2  funciones para ajustar los datos de entrada a la representacion de salida
function dominio(escala,minEntrada,maxEntrada,minSalida,maxSalida) {
  f = escala
        .range( [minSalida ,  maxSalida])
        .domain([minEntrada, maxEntrada])
  return f
}
function preprocesar(data) {
  console.log(data)

  max_Y = Math.max.apply(null, data.map(function(d) { return d.cordenadas; }))
  fy = dominio(d3.scaleLinear(),0,max_Y,0,alto)

  fx = dominio(d3.scaleTime(),0,data.length-1,0,ancho)    
/*
  data.forEach((d,i) => {
    d.indice = i + 1;
    d.dia    = fx(d.indice);
    d.total  =  d.total=="" ? "": alto - fy(d.total);  
    dia  = d.fecha.substring(0, 2);
    mes  = d.fecha.substring(3, 5);
    anio = d.fecha.substring(6, 10);
    d.fecha = new Date(anio, mes-1, dia);
  });

  data.forEach((d,i) => {
    d.tendencia =  mediaMovil(data,i);
  });
  */

  return data;
}

function random(d){
  proporcion=d/ancho;
  numero = Math.random();
  return proporcion*proporcion*numero;
}
function duracion(d, maximo){
  maximo     = document.getElementById('limite').max;
  random     = 700 + Math.random() * 1000;
  proporcion = d.dia / maximo;
  return proporcion * random;
}
//  3.3  funciones para dibujar los diferentes grupos de componentes
function render() {

}

//    3.4  funciones para dibujar componenentes individuales
function renderizarPath(color, puntos){
  puntos = puntos.map(function(d) { return [d[0]*ancho_total,d[1]*ancho_total]});
  
  elementos = svg.append('path')
    .attr('d', d3.line()(puntos))
    .attr('stroke', color)
    .attr('stroke-width', '2px')
    .attr('fill', 'none');
  
  return elementos;
}


// 4. Carga de datos
/*
d3.csv('estados.json')
  .then(function(data) {
    console.log(data.json())
    //console.log(JSON.parse(data))
    //dataArray = preprocesar(data);
    render();
  })
  .catch(e => {
    console.log('No se tuvo acceso al archivo: ' + e.message)
  });
*/
fetch('estados.json')
  .then(response => response.json())
  .then(data =>{
    dataArray = preprocesar(data);
    render();
  });

