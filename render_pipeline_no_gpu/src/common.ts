import { VertexEx, rotateX } from "./math";
import { vec } from "./models";
import * as z from "zustand";


export type Float16 = [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];
export type Float4 = [number, number, number, number];


export function nullRefError(): never {
    throw new Error("null");
}

export enum Models {
    Cube,
    TeapotLow,
    TeapotMid,
    TeapotHigh,
    Plane,
    Sphere,
    Triangle
}

export interface RenderParamsStore {
    readonly x: number;
    y: number;
    z: number;
    rotX: number;
    rotY: number;
    rotZ: number;
    fov: number;
    near: number;
    far: number;
    _setValue(update: RenderParamsStoreSetValue);
    setX(value : number);
    setY(value : number);
    setZ(value : number);
    setRotX(value : number);
    setRotY(value : number);
    setRotZ(value : number);
    setFov(value : number);
    setNear(value : number);
    setFar(value : number);
}

export interface RenderParamsStoreSetValue {
    x?: number;
    y?: number;
    z?: number;
    rotX?: number;
    rotY?: number;
    rotZ?: number;
    fov?: number;
    near?: number;
    far?: number;
}

export const useRenderParamsStore = z.create<RenderParamsStore>((set) => ({
    x: 0,
    y: 0,
    z: 0,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    fov: 0,
    near: 0,
    far: 0,
    // setRotX: v => set((state) => ({rotX: state.rotX + v})),
    _setValue: (update: RenderParamsStoreSetValue) => {
        return set((state) => ({ ...state, ...update }));
    },
    setX: (value) => set((state) => ({...state, x: value})),
    setY: (value) => set((state) => ({...state, y: value})),
    setZ: (value) => set((state) => ({...state, z: value})),
    setRotX: (value) => set((state) => ({...state, rotX: value})),
    setRotY: (value) => set((state) => ({...state, rotY: value})),
    setRotZ: (value) => set((state) => ({...state, rotZ: value})),
    setFov: (value) => set((state) => ({...state, fov: value})),
    setNear: (value) => set((state) => ({...state, near: value})),
    setFar: (value) => set((state) => ({...state, far: value})),
}));

export class ModelsMap extends Map<Models, { label: string, vectors: () => Promise<VertexEx[]> }>{ }

export class RenderOptions {
    #store: z.UseBoundStore<z.StoreApi<RenderParamsStore>>;
    constructor(
        public readonly initialModel: Models, 
        models: ModelsMap, 
        store : z.UseBoundStore<z.StoreApi<RenderParamsStore>>
    ) {
        this.#store = store;
        models.get(initialModel)!
            .vectors()
            .then((x: VertexEx[]) => {
                this.loadedVectors = x;
            });
    }
    wireframe: boolean = false;
    light: VertexEx = {
        position: vec(0, 0, 0),
        normal: vec(-1, -1, -0.5)
    };
    view: VertexEx = {
        position: vec(0, 0, 3),
        normal: vec(0, 0, -1),
    };
    loadedVectors: VertexEx[] = [];

    public get state() : RenderParamsStore {
        return this.#store.getState();
    }
}