define(['t3'], function (t3) {
  return t3.run({
    id: 'canvas',
    renderImmediately: false,
    init: function () {
      var geometry = new THREE.BoxGeometry(20, 20, 20);
      var material = new THREE.MeshNormalMaterial();
      this.cube = new THREE.Mesh(geometry, material);
      this.cube.position.set(100, 100, 100);
      // this.activeScene = this.scenes.default      
      this.activeScene
        .add(this.cube);
    },
    update: function (delta) {
      this.cube.rotation.x += 0.01;
      this.cube.rotation.y += 0.01;
    }
  });
});