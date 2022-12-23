function getVolume(mic) {
    let vol = mic.getLevel();
    console.log(vol);
}

export { getVolume };
