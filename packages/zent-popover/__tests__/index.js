import React from 'react';
import { Simulate } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import Button from 'zent-button';

import Popover from '../src';

/* eslint-disable */
const PopoverContent = Popover.Content;
const PopoverClickTrigger = Popover.Trigger.Click;
const PopoverHoverTrigger = Popover.Trigger.Hover;
const PopoverFocusTrigger = Popover.Trigger.Focus;
const PopoverBaseTrigger = Popover.Trigger.Base;
const withPopover = Popover.withPopover;
const createPlacement = Popover.Position.create;
/* eslint-enable */

const HoverContent = withPopover(function HoverContent({popover}) { // eslint-disable-line
  return (
    <div>
      <div>popover content</div>
      <div>line two</div>
      <div>line three</div>
      <Button onClick={popover.close}>close</Button>
    </div>
  );
});

const simulateWithTimers = (node, event, ...arg) => {
  node.simulate(event, ...arg);
  jest.runAllTimers();
};

const simulateRawWithTimers = (node, event, ...arg) => {
  Simulate[event](node, ...arg);
  jest.runAllTimers();
};

const dispatchWithTimers = (node, event, ...arg) => {
  node.dispatchEvent(event, ...arg);
  jest.runAllTimers();
};

beforeAll(() => {
  jest.useFakeTimers();
});

describe('Popover', () => {
  it('Popover has its core function, popover :)', () => {
    let wrapper = mount(
      <Popover position={Popover.Position.BottomLeft} display="inline">
        <PopoverClickTrigger>
          <Button>click me</Button>
        </PopoverClickTrigger>
        <PopoverContent>
          <div>popover content</div>
          <div>line two</div>
        </PopoverContent>
      </Popover>
    );
    expect(wrapper.find('Portal').length).toBe(0);
    simulateWithTimers(wrapper.find('button'), 'click');
    expect(wrapper.find('Portal').length).toBe(1);
    expect(document.querySelectorAll('.zent-popover-content div').length).toBe(2);
    expect(document.querySelectorAll('.zent-popover-content div')[1].textContent).toBe('line two');
    simulateWithTimers(wrapper.find('button'), 'click');
    expect(wrapper.find('Portal').length).toBe(1);
    // NOTE: 只能直接调用close method，无法mock。
    wrapper.getNode().close();
    expect(wrapper.find('Portal').length).toBe(0);

    // HACK: branch window.resize (throttle)
    wrapper.find('PopoverContent').getNode().onWindowResize({}, {
      deltaX: 0,
      deltaY: 0
    });
    // HACK: throttle
    setTimeout(() => {
      wrapper.find('PopoverContent').getNode().onWindowResize({}, {
        deltaX: 10,
        deltaY: 10
      });
    }, 160);
    jest.runAllTimers();
    wrapper.unmount();

    wrapper = mount(
      <Popover position={Popover.Position.RightTop} display="inline">
        <PopoverHoverTrigger showDelay={100} hideDelay={100} isOutSide={() => true}>
          <Button>hover on me</Button>
        </PopoverHoverTrigger>
        <PopoverContent>
          <HoverContent />
        </PopoverContent>
      </Popover>
    );

    expect(wrapper.find('Portal').length).toBe(0);

    // 快速进入又快速离开
    wrapper.find('button').simulate('mouseenter');
    expect(wrapper.find('Portal').length).toBe(0);
    wrapper.find('button').simulate('mouseleave');
    expect(wrapper.find('Portal').length).toBe(0);

    // hover 直到popup，然后window监听mousemove，判断是否离开。
    simulateWithTimers(wrapper.find('button'), 'mouseenter');
    expect(wrapper.find('Portal').length).toBe(1);
    const fakeEvent = new MouseEvent('mousemove');
    dispatchWithTimers(window, fakeEvent);
    wrapper.unmount();

    wrapper = mount(
      <Popover position={Popover.Position.TopRight} display="inline" cushion={10}>
        <PopoverFocusTrigger>
          <input placeholder="focus on me" />
        </PopoverFocusTrigger>
        <PopoverContent>
          <div>popover content</div>
          <div>line two focus</div>
        </PopoverContent>
      </Popover>
    );

    wrapper.find('input').simulate('focus');
    wrapper.find('input').simulate('focus');
    expect(wrapper.find('Portal').length).toBe(1);
    wrapper.find('input').simulate('blur');
    jest.runAllTimers();
  });

  it('Popover has children validation and position type check', () => {
    // NOTE: children.length === 2
    expect(() => {
      mount(
        <Popover position={Popover.Position.BottomLeft} display="inline">
          <span className="foo" />
        </Popover>
      );
    }).toThrow();

    // NOTE: must have one PopoverTrigger
    expect(() => {
      mount(
        <Popover position={Popover.Position.BottomLeft} display="inline">
          <span className="foo" />
          <PopoverContent>
            <div>popover content</div>
            <div>line two</div>
          </PopoverContent>
        </Popover>
      );
    }).toThrow();

    // NOTE: must have one PopoverContent
    expect(() => {
      mount(
        <Popover position={Popover.Position.BottomLeft} display="inline">
          <PopoverClickTrigger>
            <Button>click me</Button>
          </PopoverClickTrigger>
          <span className="foo" />
        </Popover>
      );
    }).toThrow();
  });

  it('Popover can have custom prefix and custom className and custom placement position', () => {
    const wrapper = mount(
      <Popover position={Popover.Position.BottomLeft} display="inline" prefix="foo" wrapperClassName="foo" className="bar">
        <PopoverClickTrigger>
          <Button>click me</Button>
        </PopoverClickTrigger>
        <PopoverContent>
          <HoverContent />
        </PopoverContent>
      </Popover>
    );
    expect(wrapper.find('.foo-popover-wrapper').length).toBe(1);
    expect(wrapper.find('.foo-popover-wrapper').hasClass('foo')).toBe(true);
    simulateWithTimers(wrapper.find('button'), 'click');

    // popover portal still in root tail of body..
    expect(wrapper.find('button').length).toBe(1);

    wrapper.unmount();

    // NOTE: createPlacement method need a function as arg[0] and this function need return object that contains some needed keys.
    expect(() => {
      createPlacement(() => {
        return null;
      })();
    }).toThrow();
  });

  it('Popover have series of placement position class', () => {
    const {
      BottomLeft,
      BottomCenter,
      BottomRight,
      LeftTop,
      LeftCenter,
      LeftBottom,
      RightTop,
      RightCenter,
      RightBottom,
      TopLeft,
      TopCenter,
      TopRight,
      AutoBottomLeft,
      AutoBottomCenter,
      AutoBottomRight,
      AutoTopLeft,
      AutoTopCenter,
      AutoTopRight
    } = Popover.Position;
    const positionArr = [
      BottomLeft,
      BottomCenter,
      BottomRight,
      LeftTop,
      LeftCenter,
      LeftBottom,
      RightTop,
      RightCenter,
      RightBottom,
      TopLeft,
      TopCenter,
      TopRight,
      AutoBottomLeft,
      AutoBottomCenter,
      AutoBottomRight,
      AutoTopLeft,
      AutoTopCenter,
      AutoTopRight
    ];

    positionArr.forEach(pos => {
      const wrapper = mount(
        <Popover position={pos} display="inline">
          <PopoverClickTrigger>
            <Button>click me</Button>
          </PopoverClickTrigger>
          <PopoverContent>
            <div>popover content</div>
            <div>line two</div>
          </PopoverContent>
        </Popover>
      );
      wrapper.find('PopoverClickTrigger').getNode().onClickOutside({ target: (<div className="outside" />) });
      expect(wrapper.find('Portal').length).toBe(0);

      simulateWithTimers(wrapper.find('button'), 'click');
      expect(wrapper.find('Portal').length).toBe(1);

      wrapper.find('PopoverClickTrigger').getNode().onClickOutside({ target: (<div className="outside" />) });
      expect(wrapper.find('Portal').length).toBe(0);
      wrapper.unmount();
    });
  });

  it('Children of Trigger could not have string ref prop', () => {
    expect(() => {
      mount(
        <Popover position={Popover.Position.BottomLeft} display="inline">
          <PopoverClickTrigger>
            <Button ref="trigger">click me</Button>
          </PopoverClickTrigger>
          <PopoverContent>
            <div>popover content</div>
            <div>line two</div>
          </PopoverContent>
        </Popover>
      );
    }).toThrow();
  });

  it('Base Trigger HACK', () => {
    const wrapper = mount(
      <Popover position={Popover.Position.BottomLeft} display="inline">
        <PopoverBaseTrigger>
          <Button>click me</Button>
        </PopoverBaseTrigger>
        <PopoverContent>
          <div>popover content</div>
          <div>line two</div>
        </PopoverContent>
      </Popover>
    );
    simulateWithTimers(wrapper.find('button'), 'click');
    wrapper.unmount();
  });

  it('throws if only has visible', () => {
    expect(() => mount(
      <Popover visible position={Popover.Position.BottomLeft} display="inline">
        <PopoverClickTrigger>
          <Button>click me</Button>
        </PopoverClickTrigger>
        <PopoverContent>
          <div>popover content</div>
          <div>line two</div>
        </PopoverContent>
      </Popover>
    )).toThrow();

    expect(() => mount(
      <Popover onVisibleChange={() => {}} position={Popover.Position.BottomLeft} display="inline">
        <PopoverClickTrigger>
          <Button>click me</Button>
        </PopoverClickTrigger>
        <PopoverContent>
          <div>popover content</div>
          <div>line two</div>
        </PopoverContent>
      </Popover>
    )).toThrow();
  });

  it('can be controlled by visible & onVisibleChange', () => {
    let visible = true;
    let changeVisible = (v) => visible = v;
    let wrapper = mount(
      <Popover visible={visible} onVisibleChange={changeVisible} position={Popover.Position.BottomLeft} display="inline">
        <PopoverClickTrigger>
          <Button>click me</Button>
        </PopoverClickTrigger>
        <PopoverContent>
          <div>popover content</div>
          <div>line two</div>
        </PopoverContent>
      </Popover>
    );
    expect(document.querySelector('.zent-popover')).toBeTruthy();

    wrapper.setProps({
      visible: false
    });
    jest.runAllTimers();
    expect(document.querySelector('.zent-popover')).toBeFalsy();

    // console.log(wrapper.instance());
    wrapper.instance().open();
    jest.runAllTimers();
    wrapper.setProps({
      visible: true
    });
    expect(document.querySelector('.zent-popover')).toBeTruthy();

    wrapper.setProps({
      visible: false
    });
    jest.runAllTimers();
    expect(document.querySelector('.zent-popover')).toBeFalsy();
  });

  it('onBeforeXXX can return a Promise', () => {
    let p;
    let onBeforeShow = () => {
      p = new Promise((resolve) => {
        resolve(2);
      });
      return p;
    }
    let wrapper = mount(
      <Popover onBeforeShow={onBeforeShow} position={Popover.Position.BottomLeft} display="inline">
        <PopoverClickTrigger>
          <Button>click me</Button>
        </PopoverClickTrigger>
        <PopoverContent>
          <div>popover content</div>
          <div>line two</div>
        </PopoverContent>
      </Popover>
    );
    wrapper.find('button').simulate('click');
    jest.runAllTimers();

    return p.then(v => {
      expect(v).toBe(2);
      jest.runAllTimers();
      expect(document.querySelectorAll('.zent-popover-content').length).toBe(1);

      wrapper.unmount();
      dispatchWithTimers(window, new MouseEvent('click'));
      expect(document.querySelectorAll('.zent-popover-content').length).toBe(0);
    });
  });

  it('onBeforeXXX can have a callback', () => {
    const onBeforeShow = (callback) => {
      setTimeout(callback, 1000);
    }
    const wrapper = mount(
      <Popover onBeforeShow={onBeforeShow} position={Popover.Position.BottomLeft} display="inline">
        <PopoverClickTrigger>
          <Button>click me</Button>
        </PopoverClickTrigger>
        <PopoverContent>
          <div>popover content</div>
          <div>line two</div>
        </PopoverContent>
      </Popover>
    );
    wrapper.find('button').simulate('click');
    jest.runAllTimers();
    expect(document.querySelectorAll('.zent-popover-content').length).toBe(1);

    wrapper.unmount();
    dispatchWithTimers(window, new MouseEvent('click'));
    expect(document.querySelectorAll('.zent-popover-content').length).toBe(0);
  });

  it('hover trigger closes on window blur', () => {
    const wrapper = mount(
      <Popover position={Popover.Position.BottomLeft}>
        <PopoverHoverTrigger>
          <Button>Hover on me</Button>
        </PopoverHoverTrigger>
        <PopoverContent>
          <div>popover content</div>
        </PopoverContent>
      </Popover>
    );

    simulateWithTimers(wrapper.find('button'), 'mouseenter');
    expect(wrapper.find('Portal').length).toBe(1);

    // wont' close if target is not window
    let fakeEvent = new FocusEvent('blur');
    dispatchWithTimers(window, fakeEvent);
    expect(wrapper.find('Portal').length).toBe(1);

    // it's tricky to set target manually
    fakeEvent = new FocusEvent('blur');
    const evt = fakeEvent.__proto__.__proto__.__proto__;
    const descriptor = Object.assign(
      {},
      Object.getOwnPropertyDescriptor(evt, 'target'),
      {
        get() {
          return window;
        }
      }
    );
    Object.defineProperty(evt, 'target', descriptor);

    dispatchWithTimers(window, fakeEvent);
    expect(document.querySelectorAll('.zent-popover-content').length).toBe(0);
    wrapper.unmount();
  });

  it('Click trigger supports custom isOutside', () => {
    const wrapper = mount(
      <Popover position={Popover.Position.BottomLeft} display="inline">
        <PopoverClickTrigger isOutside={() => false}>
          <Button>click me</Button>
        </PopoverClickTrigger>
        <PopoverContent>
          <div>popover content</div>
          <div>line two</div>
        </PopoverContent>
      </Popover>
    );
    simulateWithTimers(wrapper.find('button'), 'click');
    expect(wrapper.find('Portal').length).toBe(1);

    dispatchWithTimers(window, new MouseEvent('click'));
    expect(document.querySelectorAll('.zent-popover-content').length).toBe(1);

    wrapper.unmount();

    const popover = document.querySelector('.zent-popover');
    popover.parentNode.removeChild(popover);
    expect(document.querySelectorAll('.zent-popover-content').length).toBe(0);
  });

  it('can be nested', () => {
    const wrapper = mount(
      <Popover position={Popover.Position.BottomLeft} display="inline">
        <PopoverClickTrigger>
          <Button className="trigger-level-1">click me</Button>
        </PopoverClickTrigger>
        <PopoverContent>
          <div>popover content</div>
          <div className="level-1">line two</div>

          <Popover position={Popover.Position.BottomLeft} display="inline">
            <PopoverClickTrigger>
              <Button className="trigger-level-2">click me</Button>
            </PopoverClickTrigger>
            <PopoverContent>
              <div>popover content</div>
              <div className="level-2">line two</div>

              <Popover position={Popover.Position.BottomLeft} display="inline">
                <PopoverClickTrigger>
                  <Button className="trigger-level-3">click me</Button>
                </PopoverClickTrigger>
                <PopoverContent>
                  <div>popover content</div>
                  <div className="level-3">line two</div>
                </PopoverContent>
              </Popover>
            </PopoverContent>
          </Popover>
        </PopoverContent>
      </Popover>
    );

    simulateWithTimers(wrapper.find('.trigger-level-1'), 'click');
    expect(document.querySelectorAll('.zent-popover-content').length).toBe(1);

    simulateRawWithTimers(document.querySelector('.trigger-level-2'), 'click');
    expect(document.querySelectorAll('.zent-popover-content').length).toBe(2);

    simulateRawWithTimers(document.querySelector('.trigger-level-3'), 'click');
    expect(document.querySelectorAll('.zent-popover-content').length).toBe(3);

    dispatchWithTimers(window, new MouseEvent('click'));
    expect(document.querySelectorAll('.zent-popover-content').length).toBe(0);

    wrapper.unmount();
  });
});
