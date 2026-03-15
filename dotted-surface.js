// Dotted Surface — animated Three.js particle wave (vanilla port)
(function () {
    var container = document.getElementById('dotted-surface');
    if (!container) return;

    var SEPARATION = 150;
    var AMOUNTX = 40;
    var AMOUNTY = 60;
    var count = 0;
    var animationId;

    // Scene
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000002, 2000, 10000);

    // Camera
    var camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        10000
    );
    camera.position.set(0, 355, 1220);

    // Renderer
    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Particles
    var positions = [];
    var colors = [];

    for (var ix = 0; ix < AMOUNTX; ix++) {
        for (var iy = 0; iy < AMOUNTY; iy++) {
            var x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
            var y = 0;
            var z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
            positions.push(x, y, z);
            // Light dots for dark background
            colors.push(200, 200, 200);
        }
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    var material = new THREE.PointsMaterial({
        size: 8,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    var points = new THREE.Points(geometry, material);
    scene.add(points);

    // Animate
    function animate() {
        animationId = requestAnimationFrame(animate);

        var posArr = geometry.attributes.position.array;
        var i = 0;
        for (var ix = 0; ix < AMOUNTX; ix++) {
            for (var iy = 0; iy < AMOUNTY; iy++) {
                var idx = i * 3;
                posArr[idx + 1] =
                    Math.sin((ix + count) * 0.3) * 50 +
                    Math.sin((iy + count) * 0.5) * 50;
                i++;
            }
        }
        geometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
        count += 0.03;
    }

    // Resize
    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
})();
