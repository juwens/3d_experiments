// sum.test.js
import { describe, expect, test } from 'vitest'
import * as math from './math'
import { vec } from './models';
import { unit } from './math';

test('length(vector)', () => {
  expect(math.length({x:0,y:0,z:0})).toBe(0);
  expect(math.length({x:1,y:0,z:0})).toBe(1);
  expect(math.length({x:0,y:1,z:0})).toBe(1);
  expect(math.length({x:0,y:0,z:1})).toBe(1);
  expect(math.length({x:1,y:1,z:1})).toBe(Math.sqrt(3));
  expect(math.length({x:-1,y:-1,z:-1})).toBe(Math.sqrt(3));
  expect(math.length({x:-1,y:-1,z:1})).toBe(Math.sqrt(3));
})

test('dotProd(vector, vector)', () => {
  expect(math.dotProd({x: 1, y: 0, z: 0}, {x: 1, y: 0, z: 0})).toBe(1);
  expect(math.dotProd({x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0})).toBe(0);
  expect(math.dotProd({x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0})).toBe(0);
  expect(math.dotProd({x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6})).toBe(32);
})

test('crossProd(vector, vector)', () => {
  expect(math.crossProd({x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6})).toStrictEqual({x:-3, y:6, z:-3});
})

test('angle(vector, vector)', () => {
  expect(math.angle({x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6})).toBeCloseTo(0.2257, 4);
  expect(math.angle({x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0})).toBe(Math.PI/2);
  expect(math.angle({x: 1, y: 0, z: 0}, {x: -1, y: 0, z: 0})).toBe(Math.PI);
  expect(math.angle({x: 1, y: 0, z: 0}, {x: 0, y: -1, z: 0})).toBe(Math.PI/2);
})

describe("rotateY", () => {
  test('rotateY(180°)', () => {
    const v = math.transform({position: vec(1, 0, 0), normal: vec(1,0,0)}, math.rotateY(Math.PI));
    expect(v.position.x).toBeCloseTo(-1);
    expect(v.position.y).toBeCloseTo(0);
    expect(v.position.z).toBeCloseTo(0);

    expect(v.normal.x).toBeCloseTo(-1);
    expect(v.normal.y).toBeCloseTo(0);
    expect(v.normal.z).toBeCloseTo(0);
  })

  test('rotateY(90°)', () => {
    const v = math.transform({position: vec(1, 0, 0), normal: vec(1,0,0)}, math.rotateY(Math.PI / 2));
    expect(v.position.x).toBeCloseTo(0);
    expect(v.position.y).toBeCloseTo(0);
    expect(v.position.z).toBeCloseTo(-1);

    expect(v.normal.x).toBeCloseTo(0);
    expect(v.normal.y).toBeCloseTo(0);
    expect(v.normal.z).toBeCloseTo(-1);
  })

  test('rotateY(-90°)', () => {
    const v = math.transform({position: vec(1, 0, 0), normal: vec(1,0,0)}, math.rotateY(-Math.PI / 2));
    expect(v.position.x).toBeCloseTo(0);
    expect(v.position.y).toBeCloseTo(0);
    expect(v.position.z).toBeCloseTo(1);

    expect(v.normal.x).toBeCloseTo(0);
    expect(v.normal.y).toBeCloseTo(0);
    expect(v.normal.z).toBeCloseTo(1);
  })

  test('rotateY(270°)', () => {
    const v = math.transform({position: vec(1, 0, 0), normal: vec(1,0,0)}, math.rotateY(Math.PI * 3/ 2));
    expect(v.position.x).toBeCloseTo(0);
    expect(v.position.y).toBeCloseTo(0);
    expect(v.position.z).toBeCloseTo(1);

    expect(v.normal.x).toBeCloseTo(0);
    expect(v.normal.y).toBeCloseTo(0);
    expect(v.normal.z).toBeCloseTo(1);
  })
})

describe("rotateX", () => {
  for (let angle = -Math.PI; angle < Math.PI; angle += (Math.PI/4)) {
    test(`rotateX(<1,0,0>, ${angle / Math.PI * 180}°)`, () => {
      const v = math.transform({position: vec(1, 0, 0), normal: vec(1,0,0)}, math.rotateX(angle));
      expect(v.position.x).toBeCloseTo(1);
      expect(v.position.y).toBeCloseTo(0);
      expect(v.position.z).toBeCloseTo(0);

      expect(v.normal.x).toBeCloseTo(1);
      expect(v.normal.y).toBeCloseTo(0);
      expect(v.normal.z).toBeCloseTo(0);
    })
  }
})

test("unit()", () => {
  expect(unit({x:1, y:2, z:3})).toStrictEqual({x:1/Math.sqrt(14), y:2/Math.sqrt(14), z:3/Math.sqrt(14)});
})