import "./PanControls";
import t3 from "t3-boilerplate";
import _ from "lodash";

let el;
let instance;

const threeRenderer = {
  clear: function () {
    const root = document.querySelector(el);
    while (root.firstChild) {
      root.removeChild(root.firstChild);
    }
    if (instance) {
      instance.loopManager.stop();
    }
  },
  setCanvasEl: function (newEl) {
    el = newEl;
  },
  render: function (data) {
    let rootEl;
    const nodes = data.nodes;
    const edges = data.edges;
    const nodeMap = {};
    const margin = {
      top: 10,
      left: 10,
    };
    const fillStyle = {
      number: "#673ab7",
      string: "#ff9800",
      boolean: "#259b24",
      undefined: "#000000",
    };
    const borderStyle = {
      object: "#03a9f4",
      function: "#e51c23",
    };
    const defaultColor = "#000000";
    const titleHeight = 40;
    const projector = new THREE.Projector();
    const nodeMeshes = [];

    // the actual root element is a div created under the root
    rootEl = document.createElement("div");
    rootEl.id = "root";
    rootEl.style.height = "100%";
    document.querySelector(el).appendChild(rootEl);

    nodes.forEach(function (node) {
      nodeMap[node.hashKey] = node;
    });

    const wrapperEl = rootEl;
    const bbox = rootEl.getBoundingClientRect();

    function getY(node, i) {
      return node.y - node.height * 0.5 + (node.properties.length - i) * 15;
    }

    function getX(node) {
      return node.x - node.width * 0.5 + margin.left;
    }

    function createCameraControls(camera, domElement) {
      camera.cameraControls = new THREE.PanControls(camera, domElement);
    }

    function createTextSprites() {
      const shapes = THREE.FontUtils.generateShapes("Hello world", {
        font: "helvetiker",
        weight: "bold",
        size: 10,
      });
      const geom = new THREE.ShapeGeometry(shapes);
      const mat = new THREE.MeshBasicMaterial();
      return new THREE.Mesh(geom, mat);
    }

    function drawProperties(node, group) {
      const canvas = document.createElement("canvas");
      canvas.width = node.width;
      canvas.height = node.height;
      const context = canvas.getContext("2d");
      context.font = "normal 100 18px Roboto";
      context.fillStyle = "rgba(0, 0, 0, 1)";
      context.fillText(node.label, margin.left, margin.top + 15);

      node.properties.forEach(function (property, i) {
        let sphere;

        // draw text on the canvas
        context.font = "normal 15px Arial";
        context.fillStyle = fillStyle[property.type] || defaultColor;
        context.fillText(
          property.property,
          margin.left * 2,
          margin.top + titleHeight + i * 15,
        );
      });

      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });
      material.transparent = true;
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(canvas.width, canvas.height),
        material,
      );
      // mesh.position.x += node.width / 2;
      // mesh.position.y += node.height / 2;

      mesh.position.set(node.x, node.y, 0.1);

      group.add(mesh);
    }

    function drawNodes() {
      const me = this;
      const nodeGroup = new THREE.Object3D();

      nodes.forEach(function (node) {
        const points = [];
        const g = new THREE.Object3D();
        points.push(new THREE.Vector2(0, 0));
        points.push(new THREE.Vector2(node.width, 0));
        points.push(new THREE.Vector2(node.width, node.height));
        points.push(new THREE.Vector2(0, node.height));

        const shape = new THREE.Shape(points);

        const geometry = new THREE.ShapeGeometry(shape);
        const mesh = new THREE.Mesh(
          geometry,
          new THREE.LineBasicMaterial({
            color: "#eeeeee", // borderStyle['function'],
            lineWidth: 1,
          }),
        );

        mesh.userData.node = node;
        mesh.position.set(
          node.x - node.width * 0.5,
          node.y - node.height * 0.5,
          0,
        );

        // EACH ONE IS A SINGLE MESH
        me.activeScene.add(mesh);
        nodeMeshes.push(mesh);

        // MERGE
        // mesh.updateMatrix();
        // nodeGeometry.merge(mesh.geometry, mesh.matrix);

        // add the description in another group
        drawProperties(node, nodeGroup);
      });

      me.activeScene.add(nodeGroup);

      // MERGE
      // me.activeScene.add(new THREE.Mesh(
      //   nodeGeometry,
      //   new THREE.LineBasicMaterial({
      //     color: '#eeeeee',// borderStyle['function'],
      //     lineWidth: 1
      //   })
      // ));
    }

    function drawCircles() {
      const me = this;
      const circleMesh = new THREE.Mesh(new THREE.CircleGeometry(5, 8));
      const meshes = {
        object: {
          material: new THREE.MeshBasicMaterial({
            color: borderStyle.object,
          }),
          geometry: new THREE.Geometry(),
        },
        function: {
          material: new THREE.MeshBasicMaterial({
            color: borderStyle["function"],
          }),
          geometry: new THREE.Geometry(),
        },
      };
      nodes.forEach(function (node) {
        node.properties.forEach(function (property, i) {
          if (property.type === "function" || property.type === "object") {
            circleMesh.position.set(getX(node), getY(node, i) + 5, 0.2);
            circleMesh.updateMatrix();
            meshes[property.type].geometry.merge(
              circleMesh.geometry,
              circleMesh.matrix,
            );
          }
        });
      });
      me.activeScene.add(
        new THREE.Mesh(meshes.object.geometry, meshes.object.material),
      );
      me.activeScene.add(
        new THREE.Mesh(
          meshes["function"].geometry,
          meshes["function"].material,
        ),
      );
    }

    function generateSpline(f, mid, t, d) {
      const mult = 0;
      const bumpZ = mid.z * 0.2;
      const fm = new THREE.Vector3()
        .addVectors(f, mid)
        .multiplyScalar(0.5)
        .add(
          new THREE.Vector3((mid.x - f.x) * mult, (f.y - mid.y) * mult, bumpZ),
        );
      const mt = new THREE.Vector3()
        .addVectors(mid, t)
        .multiplyScalar(0.5)
        .add(
          new THREE.Vector3((mid.x - t.x) * mult, (t.y - mid.y) * mult, bumpZ),
        );

      const spline = new THREE.Spline([f, fm, mid, mt, t]);
      let i,
        l = 10,
        index,
        position;
      const geometry = new THREE.Geometry();

      geometry.colors = [];
      for (i = 0; i <= l; i += 1) {
        index = i / l;
        position = spline.getPoint(index);
        geometry.vertices[i] = new THREE.Vector3(
          position.x,
          position.y,
          position.z,
        );
        geometry.colors[i] = new THREE.Color(0xffffff);
        geometry.colors[i].setHSL(
          // 200 / 360,
          // index,
          // 0.5
          200 / 360,
          1,
          0.9,
        );
      }
      return geometry;
    }

    function drawEdges(scope) {
      const me = this;
      const fromV = new THREE.Vector3();
      const toV = new THREE.Vector3();
      const mid = new THREE.Vector3();

      edges.forEach(function (link, i) {
        // console.log(i, edges.length);
        const from = nodeMap[link.from];
        const to = nodeMap[link.to];

        const index = _.findIndex(from.properties, { name: link.property });
        fromV.set(
          from.x - from.width * 0.5 + margin.left,
          from.y -
            from.height * 0.5 +
            (from.properties.length - index) * 15 +
            5,
          0,
        );
        toV.set(to.x - to.width * 0.5, to.y - to.height * 0.5, 0);
        const d = fromV.distanceTo(toV);
        mid.addVectors(fromV, toV).multiplyScalar(0.5).setZ(50);

        const geometry = generateSpline(fromV, mid, toV, d);
        const material = new THREE.LineBasicMaterial({
          color: 0xffffff,
          opacity: 0.5,
          linewidth: 3,
          vertexColors: THREE.VertexColors,
        });
        const mesh = new THREE.Line(geometry, material);
        me.activeScene.add(mesh);
      });
    }

    // pre init
    t3.themes.allWhite = {
      clearColor: 0xffffff,
      fogColor: 0xffffff,
      groundColor: 0xffffff,
    };
    instance = t3.run({
      selector: el + " #root",
      width: bbox.width,
      height: bbox.height,
      theme: "allWhite",
      ambientConfig: {
        ground: false,
        axes: false,
        gridY: false,
        gridX: false,
        gridZ: false,
      },
      init: function () {
        const me = this;
        const rendererEl = me.renderer.domElement;
        me.datgui.close();
        me.activeScene.fog = null;
        me.renderer.sortObjects = false;
        me.renderer.shadowMapEnabled = true;
        me.renderer.shadowMapType = THREE.PCFShadowMap;

        const mouse = new THREE.Vector3();
        let moved = false,
          down = false;
        rendererEl.addEventListener("mousemove", function (e) {
          if (down) {
            moved = true;
            wrapperEl.style.cursor = "move";
          } else {
            moved = false;
          }
        });
        rendererEl.addEventListener("mousedown", function (e) {
          down = true;
        });
        rendererEl.addEventListener("mouseup", function (e) {
          down = false;
          wrapperEl.style.cursor = "auto";
        });
        rendererEl.addEventListener(
          "click",
          function (e) {
            e.preventDefault();
            const bbox = rendererEl.getBoundingClientRect();
            const cx = e.clientX - bbox.left;
            const cy = e.clientY - bbox.top;
            mouse.x = (cx / rendererEl.clientWidth) * 2 - 1;
            mouse.y = -(cy / rendererEl.clientHeight) * 2 + 1;
            const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
            projector.unprojectVector(vector, me.activeCamera);

            const raycaster = new THREE.Raycaster(
              camera.position,
              vector.sub(camera.position).normalize(),
            );
            const intersects = raycaster.intersectObjects(nodeMeshes);
            const iObject = intersects[0] && intersects[0].object;
            if (iObject && !moved) {
              // focus on this object on click
              // console.log(iObject);
              const dest = {
                x: iObject.position.x + iObject.userData.node.width / 2,
                y: iObject.position.y + iObject.userData.node.height / 2,
              };
              new TWEEN.Tween(me.activeCamera.position)
                .to(
                  _.merge({}, dest, {
                    z: Math.max(iObject.userData.node.height, 350),
                  }),
                  1000,
                )
                .easing(TWEEN.Easing.Cubic.InOut)
                .start();
              new TWEEN.Tween(me.activeCamera.cameraControls.target)
                .to(dest, 1000)
                .easing(TWEEN.Easing.Cubic.InOut)
                .start();
            }
          },
          false,
        );

        // camera setup
        const fov = 70;
        const ratio = rendererEl.clientWidth / rendererEl.clientHeight;
        const near = 1;
        const far = 20000;
        const camera = new THREE.PerspectiveCamera(fov, ratio, near, far);
        me.addCamera(camera, "mine").setActiveCamera("mine");
        createCameraControls(camera, rendererEl);
        camera.cameraControls.target.set(data.center.x, data.center.y, 0);
        camera.cameraControls.noKeys = true;

        // draw the nodes
        drawNodes.call(me);
        drawCircles.call(me);
        drawEdges.call(me);

        setTimeout(function () {
          camera.position.set(
            data.center.x,
            data.center.y,
            Math.min(data.mx.x - data.mn.x, data.mx.y - data.mn.y),
          );
          //camera.lookAt(new THREE.Vector3(data.center.x, data.center.y, 0));
        }, 0);
      },
      update: function (delta) {
        TWEEN.update();
        const me = this;
        me.ac = me.ac || 0;
        me.ac += delta;
        if (me.ac > 2) {
          // console.log(me.renderer.info.render);
          // console.log(me.renderer);
          me.ac = 0;
        }
      },
    });
  },
};

export default threeRenderer;

