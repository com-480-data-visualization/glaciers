(function () {
  const ACCENT  = '#4ea8de';
  const MUTED   = '#a0a0a0';
  const GRID    = '#3e3527';

  const MARGIN = { top: 20, right: 24, bottom: 44, left: 72 };
  const HEIGHT = 260;

  function containerWidth(selector) {
    const el = document.querySelector(selector);
    return el ? el.getBoundingClientRect().width : 700;
  }

  function loadCSV(url) {
    // Files have 2 preamble rows (citation + French label) before the real header
    return d3.text(url).then(text => {
      const lines = text.split('\n').slice(2).join('\n');
      return d3.csvParse(lines);
    });
  }

  function parseRows(raw) {
    return raw
      .map(d => ({
        year: +d['End date of observation'].slice(0, 4),
        value: +d['Value']
      }))
      .filter(d => !isNaN(d.year) && !isNaN(d.value));
  }

  function styleAxis(g) {
    g.selectAll('text').style('fill', MUTED).style('font-size', '11px');
    g.selectAll('.domain').style('stroke', GRID);
    g.selectAll('.tick line').style('stroke', GRID);
  }

  function addYLabel(svg, label, height) {
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height / 2))
      .attr('y', -56)
      .attr('text-anchor', 'middle')
      .style('fill', MUTED)
      .style('font-size', '11px')
      .text(label);
  }

  function hint(svg, width) {
    svg.append('text')
      .attr('x', width)
      .attr('y', -6)
      .attr('text-anchor', 'end')
      .style('fill', MUTED)
      .style('font-size', '10px')
      .style('opacity', 0.6)
      .text('scroll · drag · dbl-click reset');
  }

  // ── Cumulative line chart ────────────────────────────────────────────────
  function drawCumulative(selector, data) {
    const W     = containerWidth(selector);
    const width = W - MARGIN.left - MARGIN.right;
    const h     = HEIGHT - MARGIN.top - MARGIN.bottom;

    const svg = d3.select(selector).append('svg')
      .attr('width', W).attr('height', HEIGHT)
      .style('border-radius', '8px')
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.value) * 1.08, 20])
      .range([h, 0]);

    // Clip path
    const clipId = 'clip-cum-' + selector.replace(/[^a-z]/gi, '');
    svg.append('defs').append('clipPath').attr('id', clipId)
      .append('rect').attr('width', width).attr('height', h + 2).attr('y', -2);

    // Gridlines
    svg.append('g')
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(''))
      .selectAll('line').style('stroke', GRID).style('stroke-opacity', 0.6);
    svg.select('.domain').remove();

    // Zero dashed line
    svg.append('line')
      .attr('x1', 0).attr('x2', width)
      .attr('y1', y(0)).attr('y2', y(0))
      .style('stroke', MUTED).style('stroke-opacity', 0.4).style('stroke-dasharray', '4,3');

    // Axes (will be updated on zoom)
    const xAxisG = svg.append('g').attr('transform', `translate(0,${h})`);
    const yAxisG = svg.append('g');
    styleAxis(xAxisG.call(d3.axisBottom(x).tickFormat(d3.format('d'))));
    styleAxis(yAxisG.call(d3.axisLeft(y)));

    addYLabel(svg, 'Cumulative length change (m)', h);
    hint(svg, width);

    // Clipped chart area
    const chartG = svg.append('g').attr('clip-path', `url(#${clipId})`);

    const linePath = chartG.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', ACCENT)
      .attr('stroke-width', 1.5);

    const dots = chartG.selectAll('circle').data(data).join('circle')
      .attr('r', 2.5).attr('fill', ACCENT);

    function render(xNew) {
      const line = d3.line().x(d => xNew(d.year)).y(d => y(d.value));
      linePath.attr('d', line);
      dots.attr('cx', d => xNew(d.year)).attr('cy', d => y(d.value));
      styleAxis(xAxisG.call(d3.axisBottom(xNew).tickFormat(d3.format('d'))));
    }

    render(x);

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([1, 40])
      .translateExtent([[0, -Infinity], [width, Infinity]])
      .on('zoom', event => {
        overlay.style('cursor', event.transform.k > 1 ? 'grabbing' : 'grab');
        render(event.transform.rescaleX(x));
      });

    const overlay = svg.append('rect')
      .attr('width', width).attr('height', h)
      .style('fill', 'none').style('pointer-events', 'all')
      .style('cursor', 'grab')
      .call(zoom)
      .on('dblclick.zoom', function () {
        overlay.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
      });
  }

  // ── Periodic bar chart ───────────────────────────────────────────────────
  function drawPeriodic(selector, data) {
    const W     = containerWidth(selector);
    const width = W - MARGIN.left - MARGIN.right;
    const h     = HEIGHT - MARGIN.top - MARGIN.bottom;

    const svg = d3.select(selector).append('svg')
      .attr('width', W).attr('height', HEIGHT)
      .style('border-radius', '8px')
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Linear x scale (easier to zoom than band scale)
    const years    = data.map(d => d.year);
    const x = d3.scaleLinear()
      .domain([years[0] - 0.5, years[years.length - 1] + 0.5])
      .range([0, width]);

    const nominalBarW = (width / data.length) * 0.82;

    const yMin = d3.min(data, d => d.value);
    const yMax = d3.max(data, d => d.value);
    const pad  = Math.abs(yMin) * 0.12;
    const y = d3.scaleLinear()
      .domain([yMin * 1.08, Math.max(yMax, 0) + pad])
      .range([h, 0]);

    const zero = y(0);

    // Clip path
    const clipId = 'clip-per-' + selector.replace(/[^a-z]/gi, '');
    svg.append('defs').append('clipPath').attr('id', clipId)
      .append('rect').attr('width', width).attr('height', h + 2).attr('y', -2);

    // Gridlines
    svg.append('g')
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(''))
      .selectAll('line').style('stroke', GRID).style('stroke-opacity', 0.6);
    svg.select('.domain').remove();

    // Zero line (static, not clipped)
    svg.append('line')
      .attr('x1', 0).attr('x2', width)
      .attr('y1', zero).attr('y2', zero)
      .style('stroke', MUTED).style('stroke-opacity', 0.5);

    // Axes
    const xAxisG = svg.append('g').attr('transform', `translate(0,${h})`);
    const yAxisG = svg.append('g');
    styleAxis(yAxisG.call(d3.axisLeft(y)));

    addYLabel(svg, 'Length change (m)', h);
    hint(svg, width);

    // Clipped chart area
    const chartG = svg.append('g').attr('clip-path', `url(#${clipId})`);

    const bars = chartG.selectAll('rect').data(data).join('rect')
      .attr('y', d => d.value >= 0 ? y(d.value) : zero)
      .attr('height', d => Math.abs(y(d.value) - zero))
      .attr('fill', ACCENT)
      .attr('opacity', 0.85);

    function render(xNew, k) {
      const bw = Math.max(1, nominalBarW * k);
      bars.attr('x', d => xNew(d.year) - bw / 2).attr('width', bw);

      // Only show years that are currently visible, subsampled so labels
      // never get closer than 48px (avoids overlapping text at any zoom level)
      const visible = years.filter(y => { const px = xNew(y); return px >= 0 && px <= width; });
      const maxTicks = Math.max(1, Math.floor(width / 48));
      const step     = Math.max(1, Math.ceil(visible.length / maxTicks));
      const ticks    = visible.filter((_, i) => i % step === 0);

      styleAxis(xAxisG.call(
        d3.axisBottom(xNew).tickValues(ticks).tickFormat(d3.format('d'))
      ));
    }

    render(x, 1);

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([1, 40])
      .translateExtent([[0, -Infinity], [width, Infinity]])
      .on('zoom', event => {
        overlay.style('cursor', event.transform.k > 1 ? 'grabbing' : 'grab');
        render(event.transform.rescaleX(x), event.transform.k);
      });

    const overlay = svg.append('rect')
      .attr('width', width).attr('height', h)
      .style('fill', 'none').style('pointer-events', 'all')
      .style('cursor', 'grab')
      .call(zoom)
      .on('dblclick.zoom', function () {
        overlay.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
      });
  }

  // ── Public API ───────────────────────────────────────────────────────────
  window.renderGlacierCharts = function (glacierId) {
    const base = '../data/csv/';
    Promise.all([
      loadCSV(`${base}length_change_cumulative_${glacierId}.csv`),
      loadCSV(`${base}length_change_${glacierId}.csv`)
    ]).then(([cumRaw, perRaw]) => {
      drawCumulative('#chart-cumulative', parseRows(cumRaw));
      drawPeriodic('#chart-periodic', parseRows(perRaw));
    }).catch(err => {
      console.warn('Could not load glacier chart data:', err);
    });
  };
}());
