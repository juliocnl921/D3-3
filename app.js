// 1. Configuración
COLOR_BASE    = '#1960ad'
COLOR_ESTADOS = ['#7fa7d1','#6695c8','#4c83bf','#3272b6','#1960ad','#004fa4','#004793','#003f83','#003772','#002f62']

grafMapa = d3.select('#grafMapa')
grafBarras = d3.select('#grafBarras')

ancho_total = grafMapa.style('width').slice(0, -2)
alto_total = ancho_total * 0.8

grafMapa.style('width' , `${ ancho_total}px`).style('height', `${ alto_total }px`)
grafBarras.style('width' , `${ ancho_total}px`).style('height', `${ alto_total }px`)

margins = {  top:    ancho_total * 0.06 
           , left:   ancho_total * 0.10
           , right:  ancho_total * 0.06
           , bottom: ancho_total * 0.18 }

ancho = ancho_total - margins.left -  margins.right
alto  = alto_total  - margins.top  - margins.bottom

// 2. Variables globales
svgM =   grafMapa.append('svg').style('width', `${ ancho_total }px`).style('height', `${ alto_total }px`);
svgB = grafBarras.append('svg').style('width', `${ ancho_total }px`).style('height', `${ alto_total }px`);

dataArray = []
g_estados = []
g_barras  = null
eje_x     = d3.axisBottom()
eje_y     = d3.axisLeft()
eje_x_g   = null
eje_y_g   = null

fy_b = d3.scaleLinear()
  .range([alto, 0])

fx_b = d3.scaleBand()
  .range([0, ancho])

 
function agregar_g(svg){
  g = svg.append('g')
    .style('transform', `translate(${margins.left}px, ${margins.top}px)`)
    .style('width', ancho + 'px')
    .style('height', alto + 'px');
  return g;
}
function generar_g(){
  dataArray.forEach(estado => g_estados.push({indice:estado.indice, g:agregar_g(svgM)}));
  g_barras = agregar_g(svgB);
  eje_x_g = g_barras.append('g')
    .attr('transform', `translate(0, ${ alto })`)
    .attr('class', 'eje')
  eje_y_g = g_barras.append('g')
    .attr('class', 'eje')
}

//    3.2  funciones para ajustar los datos de entrada a la representacion de salida
function preprocesar(data) {

  min_x = Math.min.apply(null, data.map((e) => Math.min.apply(null, e.coordenadas.map((p) => p[0]))))
  max_x = Math.max.apply(null, data.map((e) => Math.max.apply(null, e.coordenadas.map((p) => p[0]))))
  min_y = Math.min.apply(null, data.map((e) => Math.min.apply(null, e.coordenadas.map((p) => p[1]))))
  max_y = Math.max.apply(null, data.map((e) => Math.max.apply(null, e.coordenadas.map((p) => p[1]))))

  fy = d3.scaleLinear().domain([min_y,max_y]).range([0, alto])
  fx = d3.scaleTime().domain([min_x,max_x]).range([0,ancho])

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
  
  fc = d3.scaleOrdinal().domain([min,max]).range(COLOR_ESTADOS)

  data.forEach(estado => dibujarArea(estado,fc,indicador));
}
function dibujarArea(estado,fc,indicador){
  
  g_estado = g_estados.find(g => g.indice == estado.indice);
  
  color = fc(estado[indicador]);

  elementos = g_estado.g.selectAll('polygon').data(estado.coordenadas)

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

  datos = data
    .map(estado => [estado.nombre, estado[indicador]])
    .sort((a,b) => (a[1] < b[1]) ? 1 : ((b[1] < a[1]) ? -1 : 0));

  min = Math.min.apply(null, data.map((e) => e[indicador]));
  max = Math.max.apply(null, data.map((e) => e[indicador]));
  ajuste = ((max-min)*0.1);
  min = (min-ajuste)<0 ? 0: (min-ajuste);

  fy_b.domain([min, max]);
  fx_b.domain(datos.map(d => d[0]));

  elementos = g_barras.selectAll('rect').data(datos)

  elementos.enter()
    .append('rect')   
    .style('fill', COLOR_BASE)
    .style('x', (d,i) => fx_b(d[0]) + 'px')
    .style('y', d => fy_b(d[1])+'px')
    .style('width' , (5)+'px')
    .style('height', d => (alto - fy_b(d[1])) + 'px')
    .merge(elementos)
    .transition()
    .duration(2000)
    .style('x', (d,i) => fx_b(d[0]) + 'px')
    .style('y', d => fy_b(d[1])+'px')
    .style('width' , fx_b.bandwidth()-2+'px')
    .style('height', d => (alto - fy_b(d[1])) + 'px')

  elementos.exit()
    .transition()
    .remove()

  yAxisCall = d3.axisLeft(fy_b)
    
  eje_y_g.transition()
    .duration(2000)
    .call(yAxisCall)

  xAxisCall = d3.axisBottom(fx_b)
  eje_x_g.transition()
    .duration(2000)
    .call(xAxisCall)
    .selectAll('text')
    .attr('x', '-8px')
    .attr('y', '-5px')
    .attr('text-anchor', 'end')
    .attr('transform', 'rotate(-90)')
}

//--------------------------------------
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
