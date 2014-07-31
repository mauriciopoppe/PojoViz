define(['t3'], function (t3) {
  return t3.run({
    id: 'canvas',
    injectCache: true,
    init: function () {
      var geometry = new THREE.BoxGeometry(20, 20, 20);
      var material = new THREE.MeshNormalMaterial();
      var cube = new THREE.Mesh(geometry, material);
      cube.position.set(100, 100, 100);
      // since THREE.Object3D.prototype was injected with the method
      // `cache` we can call it to save the object under this
      // instance `__t3cache__`      
      this.activeScene
        .add(cube)
        // unique identifier = cube        
        .cache('cube');

      // removal example
      // this.activeScene
      //   .remove(cube)
      //   .cache();
    },
    update: function (delta) {
      var cube = this.getFromCache('cube');
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
    }
  });
});