import { Canvas } from '../canvas/Canvas';
import { Group } from './Group';
import { FabricObject } from './Object/FabricObject';

describe('Group', () => {
  it('avoid mutations to passed objects array', () => {
    const objs = [new FabricObject(), new FabricObject()];
    const group = new Group(objs);

    group.add(new FabricObject());

    expect(group._objects).not.toBe(objs);
    expect(objs).toHaveLength(2);
    expect(group._objects).toHaveLength(3);
  });

  test('adding and removing an object', () => {
    const object = new FabricObject();
    const group = new Group([object]);
    const group2 = new Group();
    const canvas = new Canvas();

    const eventsSpy = jest.spyOn(object, 'fire');
    const removeSpy = jest.spyOn(group, 'remove');
    const exitSpy = jest.spyOn(group, 'exitGroup');
    const enterSpy = jest.spyOn(group2, 'enterGroup');

    expect(object.group).toBe(group);
    expect(object.parent).toBe(group);
    expect(object.canvas).toBeUndefined();

    canvas.add(group, group2);
    expect(object.canvas).toBe(canvas);

    group2.add(object);
    expect(object.group).toBe(group2);
    expect(object.parent).toBe(group2);
    expect(object.canvas).toBe(canvas);
    expect(removeSpy).toBeCalledWith(object);
    expect(exitSpy).toBeCalledWith(object, undefined);
    expect(enterSpy).toBeCalledWith(object, true);
    expect(eventsSpy).toHaveBeenNthCalledWith(1, 'removed', { target: group });
    expect(eventsSpy).toHaveBeenNthCalledWith(2, 'added', { target: group2 });

    group2.remove(object);
    expect(eventsSpy).toHaveBeenNthCalledWith(3, 'removed', { target: group2 });
    expect(object.group).toBeUndefined();
    expect(object.parent).toBeUndefined();
    expect(object.canvas).toBeUndefined();
  });
});
