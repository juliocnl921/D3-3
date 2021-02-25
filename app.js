
// 1. Configuración
COLOR_BASE    = '#1960ad'
COLOR_ESTADOS = ['#5395db','#001a36']
COLOR_AXIS     = "#575757"
DURACION       = 1000
DURACION_FAST  = 400
grafMapa   = d3.select('#grafMapa')
grafBarras = d3.select('#grafBarras')
body       = d3.select('body')
MARGEN_BARRAS = 2

ancho_total = grafMapa.style('width').slice(0, -2)
alto_total = ancho_total * 0.8

grafMapa.style('width' , `${ ancho_total}px`).style('height', `${ alto_total }px`)
grafBarras.style('width' , `${ ancho_total}px`).style('height', `${ alto_total }px`)

margins = {  top:    ancho_total * 0.1
           , left:   ancho_total * 0.10
           , right:  ancho_total * 0.10
           , bottom: ancho_total * 0.12 }

ancho = ancho_total - margins.left -  margins.right
alto  = alto_total  - margins.top  - margins.bottom

// 2. Variables globales
svgM =   grafMapa.append('svg').style('width', `${ ancho_total }px`).style('height', `${ alto_total }px`);
svgB = grafBarras.append('svg').style('width', `${ ancho_total }px`).style('height', `${ alto_total }px`);

dataArray = [];
g_estados = [];
g_barras  = null;
label_y_barras_g = null;
label_y_mapa_g   = null;
eje_x_g   = null;
eje_y_g   = null;

tooltip = d3.select("#mytooltip")


var tooltip = d3.select("body")
.append("div")
.attr("id", "mytooltip")
.style("position", "absolute")
.style("z-index", "10")
.style("visibility", "hidden");


fy_b = d3.scaleBand()
  .range([alto, 0]);

fx_b = d3.scaleLinear()
  .range([0, ancho]);

function agregar_g(padre,x,y){
  g = padre.append('g')
    .style('transform', `translate(${x}px, ${y}px)`)
    .style('width', ancho + 'px')
    .style('height', alto + 'px');
  return g;
}
function generar_g(){
  dataArray.forEach(estado => g_estados.push({indice:estado.indice, g:agregar_g(svgM,margins.left,margins.top)}));
  g_barras  = agregar_g(svgB, 1.6*margins.left, margins.top);
  eje_x_g   = agregar_g(svgB, 1.6*margins.left, 0.15 * alto);
  eje_y_g   = agregar_g(svgB, 1.6*margins.left, margins.top);
  label_y_barras_g = agregar_g(svgB,0,0);
  label_y_mapa_g = agregar_g(svgM,0,0);
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
  
  fc = d3.scaleLinear().domain([min,max]).range(COLOR_ESTADOS)
  
  data.forEach(estado => dibujarArea(estado,fc,indicador));

  dibujarLabel(label_y_mapa_g)
  
}
function dibujarArea(estado,fc,indicador){
  
  g_estado = g_estados.find(g => g.indice == estado.indice);
  valor    = estado[indicador];
  color    = fc(valor);
  nombre   = estado.nombre
  elementos = g_estado.g.selectAll('polygon').data(estado.coordenadas)

  elementos.enter()
    .append("polygon")
    .attr("points",(d) => d)
    .attr("id",estado.indice)
    .attr("stroke","white")
    .attr("fill", color)
    .attr("color_base", color)
    .attr("valor", valor)
    .attr("nombre", nombre)
    .attr("stroke-width", 0.3+'px')
    .on("mouseover", function() {
      d3.select(this).transition().duration(d => DURACION_FAST).attr("fill", COLOR_AXIS)   
      console.log(d3.select(this).attr("nombre"))
      mostrartooltip(d3.select(this),true) 
    })
    .on("mouseout", function() {
      colorx = d3.select(this).attr("color_base")
      d3.select(this).transition().duration(d => DURACION_FAST).attr("fill", colorx)     
      mostrartooltip(d3.select(this),false)
    })
    .on("mousemove", function(event) {    
      xy = d3.pointer(event,body.node());
      tooltip.style("left", xy[0]+10 + "px").style("top", xy[1]+10 + "px")
    })
    .merge(elementos)
    .transition()
    .duration(d => DURACION)
    .attr("fill", color)
    .attr("color_base", color)
    .attr("valor", valor)
    .attr("nombre", nombre);

  elementos.exit().transition().remove()

}

function dibujarBarras(data){
  indicador       = document.getElementById('indicadores').value;
  
  datos = data
    .map(estado => [estado.nombre, estado[indicador]])
    .sort((a,b) => (a[1] > b[1]) ? 1 : ((b[1] > a[1]) ? -1 : 0));

  min = Math.min.apply(null, data.map((e) => e[indicador]));
  max = Math.max.apply(null, data.map((e) => e[indicador]));

  
 
  ajuste = ((max-min)*0.1);
  min = (min-ajuste)<0 ? 0: (min-ajuste);

  fx_b.domain([min, max]);
  fy_b.domain(datos.map(d => d[0]));

  alto_barra = (alto - (MARGEN_BARRAS*datos.length))/datos.length;

  elementos = g_barras.selectAll('rect').data(datos)
  elementos.enter()
    .append('rect')   
    .style('fill', COLOR_BASE)
    .style('x', (d,i) => 0 + 'px')
    .style('y',     d => fy_b(d[0]) + 'px')
    .style('width', d => fx_b(d[1])+  'px')
    .style('height', 3+ 'px')
    .merge(elementos)
    .transition()
    .duration(DURACION)
    .style('x', (d,i) => 0 + 'px')
    .style('y',     d => fy_b(d[0]) + 'px')
    .style('width', d => fx_b(d[1]) + 'px')
    .style('height',alto_barra+ 'px')
  elementos.exit().transition().remove()
  

  yAxisCall = d3.axisLeft(fy_b) 
  eje_y_g.transition()
    .duration(DURACION)
    .call(yAxisCall);

  xAxisCall = d3.axisTop(fx_b)
  eje_x_g.transition()
    .duration(DURACION)
    .call(xAxisCall);
 dibujarLabel(label_y_barras_g)
}
function mostrartooltip(area,mostrar){
  label = area.attr("nombre")+": "+area.attr("valor")
  if (mostrar) d3.select("#mytooltip").style("visibility", "visible").text(label)
  else d3.select("#mytooltip").style("visibility", "hidden")
}

function dibujarLabel(padre){
  seleccion = document.getElementById('indicadores');
  texto_indicador = seleccion.options[seleccion.selectedIndex].text;
  texto = padre.selectAll('text').data([texto_indicador])

  texto.enter()
      .append('text')
      .attr('text-anchor', "middle")
      .attr("font-weight","bold")
      .attr("font-size","18")
      .style("fill", COLOR_AXIS)
      .text(d => d)
      .attr("y", 0.06*alto)
      .attr("x",0.7*ancho)
      .attr("font-size","15")
      .merge(texto)
      .transition()
      .duration(DURACION)
      .text(d => d);
  texto.exit().transition().remove()
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
