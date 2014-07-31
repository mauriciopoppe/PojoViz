define(['t3'], function (t3) {
  return t3.run({
    id: 'canvas',
    init: function () {
      var camera,
        width = window.innerWidth,
        height = window.innerHeight,
        fov, ratio, near, far;

      // origin camera
      fov = 45;
      ratio = width / height;
      near = 1;
      far = 1000;
      camera = new THREE.PerspectiveCamera(fov, ratio, near, far);
      camera.position.set(30, 30, 30);
      camera.lookAt(new THREE.Vector3(100, 100, 100));
      this.addCamera(camera, 'origin');

      // orthographic camera
      camera = new THREE.OrthographicCamera(
        width / -2, width / 2, height / 2, height / -2, near, far
      );
      camera.position.set(200, 300, 200);
      camera.lookAt(new THREE.Vector3(100, 100, 100));
      this
        .addCamera(camera, 'orthographic')
        // adds orbit controls to the camera
        .createCameraControls(camera);

      var geometry = new THREE.BoxGeometry(20, 20, 20);
      var material = new THREE.MeshNormalMaterial();
      this.cube = new THREE.Mesh(geometry, material);
      this.cube.position.set(100, 100, 100);
      this.activeScene
        .add(this.cube);
    },
    update: function (delta) {
      this.cube.rotation.x += 0.01;
      this.cube.rotation.y += 0.01;
    }
  });
});