var t3 = require('t3'),
  THREE = require('THREE'),
  id = 'threejscanvas',
  instance;

module.exports = {
  clean: function () {
    var el = document.getElementById(id);
    while(el.firstChild) {
      el.removeChild(el.firstChild);
    }
    el.style.display = 'none';
    if (instance) {
      instance.loopManager.stop();
    }
  },
  render: function (data) {
    var nodes = data.nodes,
      edges = data.edges,
      margin = {
        top: 10,
        left: 10
      },
      fillStyle = {
        number: '#673ab7',
        'string': '#ff9800',
        'boolean': '#259b24',
        'undefined': '#000000'
      },
      borderStyle = {
        object: '#03a9f4',
        'function': '#e51c23'
      },
      defaultColor = '#000000',
      titleHeight = 40;

    var el = document.getElementById(id);
    el.style.display = 'block';

    // pre init
    t3.themes.allWhite = {
      clearColor: 0xffffff,
      fogColor: 0xffffff,
      groundColor: 0xffffff
    };
    var wrapper = document.getElementById(id),
      bbox = wrapper.getBoundingClientRect();

    function createCameraControls(camera, domElement) {
      camera.cameraControls = new THREE.PanControls(camera, domElement);
    }

    function createTextSprites() {
      var shapes = THREE.FontUtils.generateShapes("Hello world", {
        font: "helvetiker",
        weight: "bold",
        size: 10
      });
      var geom = new THREE.ShapeGeometry(shapes);
      var mat = new THREE.MeshBasicMaterial();
      return new THREE.Mesh(geom, mat);
    }

    function drawProperties(node, group) {
      var canvas = document.createElement('canvas');
      canvas.width = node.width;
      canvas.height = node.height;
      var context = canvas.getContext('2d');
      context.font = "normal 100 18px Roboto";
      context.fillStyle = "rgba(0, 0, 0, 1)";
      context.fillText(
        node.label
          .match(/^\S*?-([\S-]*)$/)[1]
          .replace(/-/, '.'),
        margin.left,
        margin.top + 15
      );

      node.properties.forEach(function (property, i) {
        var sphere;

        // draw text on the canvas
        context.font = "normal 15px Arial";
        context.fillStyle = fillStyle[property.type] || defaultColor;
        context.fillText(
          property.name,
          margin.left * 2,
          margin.top + titleHeight + i * 15
        );

        // draw spheres
        if (property.type === 'function' || property.type === 'object') {
          sphere = new THREE.Mesh(
            new THREE.CircleGeometry(5, 8),
            new THREE.MeshBasicMaterial({
              color: borderStyle[property.type]
            })
          );
          sphere.position.x = margin.left;
          sphere.position.y = (node.properties.length - i) * 15 + 5;
          group.add(sphere);
        }
      });

      var texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;

      var material = new THREE.MeshBasicMaterial({
        map: texture,
        side:THREE.DoubleSide
      });
      material.transparent = true;
      var mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(canvas.width, canvas.height),
          material
      );
      mesh.position.x += node.width / 2;
      mesh.position.y += node.height / 2;
      group.add(mesh);
    }

    function drawNode(node) {
      var me = this,
        points = [],
        g = new THREE.Object3D();
      points.push(new THREE.Vector2(0, 0));
      points.push(new THREE.Vector2(node.width, 0));
      points.push(new THREE.Vector2(node.width, node.height));
      points.push(new THREE.Vector2(0, node.height));

      var shape = new THREE.Shape(points);
      points = shape.createPointsGeometry();

      var type = node.label
        .match(/^(\S*?)-/)[1];
      var geometry = new THREE.ShapeGeometry(shape);
      var mesh = new THREE.Line(
        points,
        new THREE.LineBasicMaterial({
          color: borderStyle[type],
          lineWidth: 2
          // side: THREE.DoubleSide
        })
      );

      drawProperties(node, g);
      g.add(mesh);

      g.position.set(
        node.x - node.width * 0.5,
        node.y - node.height * 0.5,
        0
      );

      // mesh.position.z = Math.random() * 1000;
      me.activeScene.add(g);
    }

    instance = t3.run({
      id: id,
      width: bbox.width,
      height: bbox.height,
      theme: 'allWhite',
      ambientConfig: {
        ground: false,
        axes: false,
        gridY: false,
        gridX: false,
        gridZ: false
      },
      init: function () {
        var me = this;
        this.activeScene.fog = null;

        // camera
        var fov = 75,
          ratio = window.innerWidth / window.innerHeight,
          near = 1,
          far = 50000;
        var camera = new THREE.PerspectiveCamera(fov, ratio, near, far);
        camera.position.set(
          data.center.x,
          data.center.y,
          Math.min(data.mx.x - data.mn.x, data.mx.y - data.mn.y)
        );
        // camera.lookAt(new THREE.Vector3(data.center.x, data.center.y, 0));
        me
          .addCamera(camera, 'mine')
          .setActiveCamera('mine');
        createCameraControls(camera, me.renderer.domElement);
        camera.cameraControls.target.set(
          data.center.x,
          data.center.y,
          0
        );
        camera.cameraControls.noKeys = true;

        // draw the nodes
        nodes.map(drawNode, me);
      },
      update: function (delta) {
      }
    });
  }
};