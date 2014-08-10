var t3 = require('t3'),
  _ = require('lodash'),
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
      nodeMap = {},
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

    nodes.forEach(function (node) {
      nodeMap[node.label] = node;
    });

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

    function getY(node, i) {
      return node.y - node.height * 0.5 +
        (node.properties.length - i) * 15;
    }

    function getX(node) {
      return node.x - node.width * 0.5 + margin.left;
    }

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
      // mesh.position.x += node.width / 2;
      // mesh.position.y += node.height / 2;

      mesh.position.set(
        node.x,
        node.y,
        0
      );

      group.add(mesh);
    }

    function drawNodes() {
      var me = this,
        nodeGroup = new THREE.Object3D(),
        nodeGeometry = new THREE.Geometry();

      nodes.forEach(function (node) {
        var points = [],
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
        var mesh = new THREE.Mesh(geometry);

        mesh.position.set(
          node.x - node.width * 0.5,
          node.y - node.height * 0.5,
          0
        );
        mesh.updateMatrix();
        nodeGeometry.merge(mesh.geometry, mesh.matrix);

        // add the description in another group
        drawProperties(node, nodeGroup);
      });

      // var mesh = new THREE.Line(
      //     points,
      //     new THREE.LineBasicMaterial({
      //       color: borderStyle[type],
      //       lineWidth: 1
      //     })
      //   );
      // mesh.position.z = Math.random() * 1000;
      me.activeScene.add(nodeGroup);
      me.activeScene.add(new THREE.Mesh(
        nodeGeometry,
        new THREE.LineBasicMaterial({
          color: '#eeeeee',// borderStyle['function'],
          lineWidth: 1
        })
      ));
    }

    function drawCircles() {
      var me = this,
        circleMesh = new THREE.Mesh(new THREE.CircleGeometry(5, 8)),
        meshes = {
          object: {
            material: new THREE.MeshBasicMaterial({
              color: borderStyle.object
            }),
            geometry: new THREE.Geometry()
          },
          'function': {
            material: new THREE.MeshBasicMaterial({
              color: borderStyle['function']
            }),
            geometry: new THREE.Geometry()
          }
        };
      nodes.forEach(function (node) {
        node.properties.forEach(function (property, i) {
          var geometry;
          if (property.type === 'function' || property.type === 'object') {
            circleMesh.position.set(
              getX(node), getY(node, i), 0.1
            );
            circleMesh.updateMatrix();
            meshes[property.type].geometry
              .merge(circleMesh.geometry, circleMesh.matrix);
          }
        });
      });
      me.activeScene.add(new THREE.Mesh(
        meshes.object.geometry, meshes.object.material
      ));
      me.activeScene.add(new THREE.Mesh(
        meshes['function'].geometry, meshes['function'].material
      ));
    }

    function generateSpline(f, mid, t, d) {
      var mult = 0,
        bumpZ = mid.z * 0.2,
        fm = new THREE.Vector3()
          .addVectors(f, mid)
          .multiplyScalar(0.5)
          .add(new THREE.Vector3(
            (mid.x - f.x) * mult,
            (f.y - mid.y) * mult,
            bumpZ
          )),
        mt = new THREE.Vector3()
          .addVectors(mid, t)
          .multiplyScalar(0.5)
          .add(new THREE.Vector3(
            (mid.x - t.x) * mult,
            (t.y - mid.y) * mult,
            bumpZ
          ));

      var spline = new THREE.Spline([
        f, fm, mid, mt, t
      ]), i, l = 3 * 10, index, position,
        geometry = new THREE.Geometry();

      geometry.colors = [];
      for (i = 0; i < d; i += 1) {
        index = i / d;
        position = spline.getPoint(index);
        geometry.vertices[i] = new THREE.Vector3(position.x, position.y, position.z);
        geometry.colors[i] = new THREE.Color(0xffffff);
        geometry.colors[i].setHSL(
          // 200 / 360,
          // index,
          // 0.5
          0,
          0,
          7/8
        );
      }
      return geometry;
    }

    function drawEdges(scope) {
      var me = this;
      // console.log(edges);

      edges.forEach(function (link, k) {
        var from = nodeMap[link.from];
        var to = nodeMap[link.to];

        var index = _.findIndex(
          from.properties,
          { name: link.property }
        );
        console.log(from.x, from.y, to.x, to.y, index);
        var fromV = new THREE.Vector3(
          from.x - from.width * 0.5 + margin.left,
          from.y - from.height * 0.5 + (from.properties.length - index) * 15 + 5,
          0
        );
        var toV = new THREE.Vector3(
          to.x - to.width * 0.5,
          to.y - to.height * 0.5,
          0
        );
        var d = fromV.distanceTo(toV);
        var mid = new THREE.Vector3()
          .addVectors(fromV, toV)
          .multiplyScalar(0.5)
          .setZ(50);

        var geometry = generateSpline(fromV, mid, toV, d);
        var material = new THREE.LineBasicMaterial({
          color: 0xffffff,
          opacity: 0.5,
          linewidth: 4,
          vertexColors: THREE.VertexColors
        });
        var mesh = new THREE.Line(geometry, material);

        me.activeScene.add(mesh);
      });
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
        var fov = 70,
          ratio = window.innerWidth / window.innerHeight,
          near = 1,
          far = 10000;
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
        drawNodes.call(me);
        drawCircles.call(me);
        // drawEdges.call(me);
      },
      update: function (delta) {
        var me = this;
        me.ac = me.ac || 0;
        me.ac += delta;
        if (me.ac > 2) {
          console.log(me.renderer.info.render);
          me.ac = 0;
        }
      }
    });
  }
};