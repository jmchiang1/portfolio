// Background Paths — animated SVG flowing curves (vanilla port of React component)
(function () {
    var container = document.getElementById('background-paths');
    if (!container) return;

    function createPathGroup(position) {
        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        for (var i = 0; i < 36; i++) {
            var p = position;
            var d = 'M' + (-(380 - i * 5 * p)) + ' ' + (-(189 + i * 6)) +
                'C' + (-(380 - i * 5 * p)) + ' ' + (-(189 + i * 6)) + ' ' +
                (-(312 - i * 5 * p)) + ' ' + (216 - i * 6) + ' ' +
                (152 - i * 5 * p) + ' ' + (343 - i * 6) +
                'C' + (616 - i * 5 * p) + ' ' + (470 - i * 6) + ' ' +
                (684 - i * 5 * p) + ' ' + (875 - i * 6) + ' ' +
                (684 - i * 5 * p) + ' ' + (875 - i * 6);

            var el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            el.setAttribute('d', d);
            el.setAttribute('stroke', 'white');
            el.setAttribute('stroke-width', (0.5 + i * 0.03).toString());
            el.setAttribute('stroke-opacity', (0.1 + i * 0.03).toString());
            el.setAttribute('fill', 'none');
            el.setAttribute('pathLength', '1');

            var duration = 20 + Math.random() * 10;
            el.style.strokeDasharray = '0.8 0.2';
            el.style.animation = 'path-flow ' + duration.toFixed(2) + 's linear infinite';

            g.appendChild(el);
        }

        return g;
    }

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 696 316');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.style.width = '100%';
    svg.style.height = '100%';

    svg.appendChild(createPathGroup(1));
    svg.appendChild(createPathGroup(-1));
    container.appendChild(svg);
})();
