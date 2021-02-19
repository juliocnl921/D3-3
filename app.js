// 1. Configuración
ANCHO_TREND = 30;

COLOR_OSCURO    = "#000000"
COLOR_CLARO     = "#575757"
COLOR_GRID      = "#CCCCCC"
COLOR_PRE       = "#377ef2" 
COLOR_POST      = "#ff3131"
COLOR_INCREMENTO = "#f57836"
COLOR_INFLEXION = "#05de41"
COLOR_INICIO_ANORMALIDAD = "#ce29df"

FECHA_INCREMENTO = new Date(2020,3,15);
FECHA_INFLEXION = new Date(2020,8,3);
FECHA_INICIO_ANORMALIDAD = new Date(2020,3,1);


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

g = null;

dataArray = [];
elementos_inicio_normalidad = []
elementos_incremento = []
elementos_inflexion = []
elemento_tendencia = null;
// 3. render (update o dibujo)
//    3.1 generar g, solo para los puntos
function generar_grupos(){
  g = svg.append('g')
         .style('transform', `translate(${margins.left}px, ${margins.top}px)`)
         .style('width', ancho + 'px')
         .style('height', alto + 'px');
}
//    3.2  funciones para ajustar los datos de entrada a la representacion de salida
function dominio(escala,minEntrada,maxEntrada,minSalida,maxSalida) {
  f = escala
        .range( [minSalida ,  maxSalida])
        .domain([minEntrada, maxEntrada])
  return f
}
function preprocesar(data) {
  max_Y = Math.max.apply(null, data.map(function(d) { return d.total; }))
  fy = dominio(d3.scaleLinear(),0,max_Y,0,alto)

  fx = dominio(d3.scaleTime(),0,data.length-1,0,ancho)    

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

  return data;
}
function mediaMovil(data,i){
  inicio_ventana = i - (ANCHO_TREND/2);
  fin_ventana    = i + (ANCHO_TREND/2);
  if (inicio_ventana < 0) inicio_ventana = 0; 
  if (fin_ventana   >  data.length - 1)  fin_ventana = data.length - 1; 
  //if (i>680)alert(inicio_ventana+"-"+i+"-"+fin_ventana);
  //if (i<10)alert(inicio_ventana+"-"+i+"-"+fin_ventana);
  numOr0 = n => n == "" ? 0 : n
  conjunto = data.slice(inicio_ventana, fin_ventana).map(a => a.total);
  if (conjunto.length > 0){
    media = conjunto.reduce(((a, b) => numOr0(a) + numOr0(b)),0) / conjunto.length;
  }else{
    media = data[i].total;
  }
  

  return media;
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
  generar_grupos();
  renderizarEjes();
  renderizarTitulos();
  renderizarInsights();
  renderizarPuntos();
  renderizarTendencia(COLOR_INFLEXION, dataArray);
}
function renderizarPuntos(){
  radio   = document.getElementById('radio').value;
  limite  = document.getElementById('limite').value;
  datos_filtrados = dataArray.filter(d => d.total != "");
  
  elementos = g.selectAll('circle').data(datos_filtrados)
  
  elementos.enter()
    .append('circle')
    .style('fill', (d) => (d.fecha > FECHA_INICIO_ANORMALIDAD ? COLOR_POST:COLOR_PRE))
    .style('cx', (d, i) => d.dia + 'px')
    .style('cy', d => d.total + 'px')
    .style('r', '0px')
    .merge(elementos)
    .transition()
    .duration(d => duracion(d))
    .style('cx', (d, i) => d.dia + 'px')
    .style('cy', d => d.total + 'px')
    .style('r', d => ((d.indice > limite) ? 0 : radio) + 'px');

  elementos.exit()
      .transition()
      .remove();
}
function renderizarEjes(){   
  espacio = 6;
  ancho_2019 = ancho*(365/700);
  ancho_2020 = ancho*(335/700);
  formato_entero = d3.format("");
  formato_mes    = d3.timeFormat("%b");

  fecha_min = Math.min.apply(null, dataArray.map(function(d) { return d.fecha; })); 
  fecha_max = Math.max.apply(null, dataArray.map(function(d) { return d.fecha; })); 

  //EJE HORIZONTAL - AÑOS
  renderizarEje(d3.axisBottom(),d3.scaleLinear(),2019,2019,ancho_2019-espacio,espacio/2,alto+20,1,0,formato_entero);
  renderizarEje(d3.axisBottom(),d3.scaleLinear(),2020,2020,ancho_2020-espacio,ancho_2019+espacio/2,alto+20,1,0,formato_entero);
  //EJE HORIZONTAL - MESES
  renderizarEje(d3.axisBottom(),d3.scaleTime(),fecha_min,fecha_max,ancho,0,alto,23,-alto,formato_mes);
  //EJE VERTICAL
  renderizarEje(d3.axisLeft(),d3.scaleLinear(),30,0,alto,0,0,   7,-ancho,formato_entero); 
}
function renderizarInsights(){  
  i1=renderizarTexto("Incremento en el consumo de oxígeno.", 0.896969, 0.305151,'end');
  i2=renderizarImagen("incremento.png",0.896969, 0.283333);
  i3=renderizarPath(COLOR_INCREMENTO,[[0.939393, 0.301515], [0.945454, 0.301515], 
    [0.945454, 0.232424], [0.658484, 0.232424], [0.658484, 0.1796969]]);
  i4=renderizarTriangulo(COLOR_INCREMENTO, 0.012, 0.658484, 0.1796969)
  elementos_incremento = [i1,i2,i3,i4];

  e1=renderizarTexto("Punto de inflexión que refleja disminución en el consumo y su posterior incremento.", 0.896969, 0.341515,'end');
  e2=renderizarImagen("inflexion.png",0.896969, 0.3196969);
  e3=renderizarPath(COLOR_INFLEXION,[[0.939393, 0.337878], [0.957575, 0.337478],
    [0.957575, 0.218181], [0.830303, 0.218181], [0.8303030, 0.1878787]]);
  e4=renderizarTriangulo(COLOR_INFLEXION, 0.012, 0.8303030, 0.1878787);
  elementos_inflexion = [e1,e2,e3,e4];

  a1=renderizarTexto("Alta dispersión entre los datos.", 0.896969, 0.37787,'end');
  a2=renderizarImagen("dispersion.png",0.896969, 0.35606);
  a3=renderizarPath(COLOR_INICIO_ANORMALIDAD, [[0.939393, 0.374242], [0.969696, 0.374242], 
      [0.969696, 0.043303], [0.781818, 0.043303], [0.7818181, 0.050363], 
      [0.636242, 0.050363], [0.636242, 0.056424], [0.636242, 0.050363], 
      [0.9333333, 0.050363], [0.933333, 0.056424]]); 

  elementos_inicio_normalidad = [a1,a2,a3];
}
function renderizarTitulos(){
  renderizarTexto("Efectos del COVID en el consumo de oxígeno de Hospital Civil de Culiacán",0.5, 0.025, 'middle')
      .style("fill", COLOR_OSCURO)
      .attr("font-size","22");

  renderizarTexto("Consumo (m³)", 0, 0, "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", 0.030303*ancho_total)
    .attr("x",-0.193939*ancho_total)
    .attr("font-size","12");
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
function renderizarTendencia(color){
  mostrar = document.getElementById('tendencia').checked;
  limite  = document.getElementById('limite').value;
  datos_filtrados = dataArray.filter(d => d.indice < limite && mostrar);
  if (elemento_tendencia != null) elemento_tendencia.remove();

  elemento_tendencia = g.append('path')
    .datum(datos_filtrados)
    .attr('d', d3.line() 
      .x(d => d.dia)
      .y(d => d.tendencia)
    )
    .attr('stroke', color)
    .attr('stroke-width', '2px')
    .attr('fill', 'none');
}
function renderizarTriangulo(color,radio,x,y){
  radio = radio*ancho_total;
  x = x*ancho_total;
  y = y*ancho_total;
  puntos = [[x,y-radio/2],[x+radio/2,y+radio/2],[x-radio/2,y+radio/2]]
  elementos = svg.append('path')
    .attr('d', d3.line()(puntos))
    .attr('stroke', color)
    .attr('stroke-width', '2px')
    .attr('fill', color);

  return elementos;
}
function renderizarTexto(texto,x,y,anchor){

  elementos = svg.append('text')
    .attr("x", x*ancho_total)
    .attr("y", y*ancho_total)
    .attr('text-anchor', anchor)
    .attr("font-weight","bold")
    .attr("font-size","18")
    .style("fill", COLOR_CLARO)
    //.style("opacity", 1.4)
    .text(texto);
  return elementos;
  
}
function renderizarImagen(ruta,x,y){
  elementos = svg.append("svg:image")
    .attr("x", x*ancho_total)
    .attr("y", y*ancho_total)
    .attr('width', 0.03636 * ancho_total)
    .attr('height',0.03636 * ancho_total)
    .attr('xlink:href', ruta)
  return elementos;
}
function renderizarEje(axis, escala, escala_inicio, escala_fin, longitud, x, y,ticks, tick_size, formato){
  f = dominio(escala, escala_inicio, escala_fin, 0, longitud);
  axis.scale(f);
  axis.tickSize(tick_size).ticks(ticks); 
  axis.tickFormat(formato);

  axisGroup = svg.append('g')
    .attr("transform", `translate(${x+margins.left},${y+margins.top})`)
    .attr('class', 'eje')   
    .call(axis)  
    .style("stroke",COLOR_CLARO) 
    .selectAll("line").style("stroke",COLOR_GRID);
}
function actualizar(){
  renderizarPuntos();

  limite  = document.getElementById('limite').value;
  dato = dataArray.find(x =>  x.indice == limite);

  visibilidad(elementos_incremento,0.0);
  visibilidad(elementos_inflexion,0.0);
  visibilidad(elementos_inicio_normalidad,0.0);
  if (dato.fecha >= FECHA_INICIO_ANORMALIDAD) visibilidad(elementos_inicio_normalidad, 1.0);
  if (dato.fecha >= FECHA_INCREMENTO) visibilidad(elementos_incremento, 1.0);
  if (dato.fecha >= FECHA_INFLEXION) visibilidad(elementos_inflexion, 1.0);
  
  renderizarTendencia(COLOR_INFLEXION);
}

function visibilidad(elementos,opacidad){
  elementos.forEach(x =>x.transition().duration(1000).style('opacity', opacidad));
}
// 4. Carga de datos
d3.csv('datos.csv')
  .then(function(data) {
    dataArray = preprocesar(data);

    max_indice = Math.max.apply(null, dataArray.map(function(d) { return d.indice; }));
    d3.select("#limite").attr("max"   ,max_indice);
    d3.select("#limite").attr("value" ,max_indice);

    render();
  })
  //.catch(e => {
  //  console.log('No se tuvo acceso al archivo: ' + e.message)
  //});


