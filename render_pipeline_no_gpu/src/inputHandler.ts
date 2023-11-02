import { unstable_batchedUpdates } from "react-dom";
import { useRenderParamsStore } from "./common";

export function setupInputHandler() {
    document.addEventListener("keydown", handleKeyDown);
}


function handleKeyDown(event : KeyboardEvent) {
    const angleStep = Math.PI / 20
    const step = 1;

    const state = useRenderParamsStore.getState();

    const setX = (value) => useRenderParamsStore.setState({x: value});
    const setY = (value) => useRenderParamsStore.setState({y: value});
    const setZ = (value) => useRenderParamsStore.setState({z: value});
    const setRotX = (value) => useRenderParamsStore.setState({rotX: value});
    const setRotY = (value) => useRenderParamsStore.setState({rotY: value});
    const setRotZ = (value) => useRenderParamsStore.setState({rotZ: value});
    const setFov = (value) => useRenderParamsStore.setState({fov: value});
    const setNear = (value) => useRenderParamsStore.setState({near: value});
    const setFar = (value) => useRenderParamsStore.setState({far: value});

    const x = state.x;
    const y = state.y;
    const z = state.z;
    const rotX = state.rotX;
    const rotY = state.rotY;
    const fov = state.fov;
    const near = state.near;
    const far = state.far;

    if (event.key === "ArrowRight") {
        setRotY(rotY + angleStep);
        return;
    }

    if (event.key === "ArrowLeft") {
        setRotY(rotY - angleStep);
        return;
    }

    if (event.key === "ArrowUp") {
        setRotX(rotX + angleStep);
        return;
    }

    if (event.key === "ArrowDown") {
        setRotX(rotX - angleStep);
        return;
    }

    if (event.key === "PageUp" || event.key === "PageDown") {
        setY(y + (event.key === "PageUp" ? -step : step));
    }
    if (event.key === "w" || event.key === "s") {
        setZ(z + (event.key === "w" ? step : -step));
        return;
    }

    if (event.key === "a" || event.key === "d") {
        setX(x + (event.key === "a" ? step : -step));
        return;
    }
}