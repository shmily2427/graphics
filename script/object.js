var loadCharacter = async (scene) => {
	const objLoader = new THREE.OBJLoader();
	const mtlLoader = new THREE.MTLLoader();

	// set asset paths
	objLoader.setPath('./objects/character/');
	mtlLoader.setPath('./objects/character/');

	// load objects
	await mtlLoader.load('character.mtl', (materials) => {
		materials.preload();
		objLoader.setMaterials(materials);
		objLoader.load('character.obj', (object) => {
			// place character to the starting pos
			let pos = getActualPosition({
				x: Math.ceil(data.floorplan[0].length / 2),
				y: 0,
				z: Math.floor(data.floorplan.length / 2)
			});
			if (isBonus) {
				object.position.set(
					Math.ceil(data.bonusStage[0].length / 2),
					0,
					Math.floor(data.bonusStage.length / 2)
				);
			} else {
				object.position.set(
					pos.x,
					pos.y,
					pos.z
				);
			}
			object.rotation.set(0, Math.PI/2, Math.PI/2);
			object.scale.set(0.2, 0.2, 0.2);

			scene.add(object);
			character = object;
		});
	});
}

var loadMother = async (scene, mapLocation) => {
	const objLoader = new THREE.OBJLoader();
	const mtlLoader = new THREE.MTLLoader();

	objLoader.setPath('./objects/character/');
	mtlLoader.setPath('./objects/character/');

	await mtlLoader.load('character.mtl', (materials) => {
		materials.preload();
		objLoader.setMaterials(materials);
		objLoader.load('character.obj', (object) => {
			// place mother at target map location (关卡终点)
			const pos = getActualPosition(mapLocation);
			object.position.set(pos.x, pos.y, pos.z);

			// 造型差异：稍微放大、姿态不同
			object.rotation.set(Math.PI / 2, 0, 0);
			object.scale.set(0.25, 0.25, 0.25);

			// 染成柔和颜色以区分（如果材质支持），同时屏蔽射线以免影响操作
			object.traverse((child) => {
				if (child.isMesh && child.material && child.material.color) {
					child.material.color.setRGB(1.0, 0.85, 0.9);
				}
				if (child.isMesh && typeof child.raycast === "function") {
					child.raycast = () => {};
				}
			});

			scene.add(object);
		});
	});
}

var loadIntro = async () => {

}

var loadSomething = async () => {
	
}

var loadElse = async () => {
	
}

var loadPortfolio = async () => {
	
}

var loadContact = async () => {
	
}