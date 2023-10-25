// sum.test.js
import { expect, test } from 'vitest'
import * as math from './math'

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