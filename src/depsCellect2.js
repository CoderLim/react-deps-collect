import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

function shallowCompare(a, b) {
  // a, b 为对象
  return [
    ...Object.keys(a),
    ...Object.keys(b)
  ].every(key => a[key] === b[key]);
}

export default function createContainer(useHook) {
  const IntrinsicContext = createContext(null);
  const ObservableContext = createContext(null);

  const Provider = function Provider({ children }) {
    // 通过 ref 来保存数据，不会触发组件渲染
    const { current: observableValue } = useRef({ state: null, observers: [] });

    const state = useHook();
    // 保存最新的 state
    observableValue.state = state;

    useEffect(() => {
      observableValue.observers.forEach(observer => observer());
    });

    return (
      <IntrinsicContext.Provider value={state}>
        <ObservableContext.Provider value={observableValue}>
          {children}
        </ObservableContext.Provider>
      </IntrinsicContext.Provider>
    );
  };

  /**
   * 用来消费 state
   * 
   * @param _depCb 返回依赖列表，当依赖有变化时，触发组件渲染
   */
  const useContainer = function (_depCb) {
    const depCp = useCallback(_depCb, []);

    const observableValue = useContext(ObservableContext);
    const [state, setState] = useState(observableValue.state);
    const prevDepsRef = useRef([]);

    useEffect(() => {
      const observer = () => {
        const prev = prevDepsRef.current;
        const cur = depCp(observableValue.state);
        if (!shallowCompare(prev, cur)) {
          setState(observableValue.state);
        }
        prevDepsRef.current = cur;
      }

      observableValue.observers.add(observer);

      return () => {
        observableValue.observers.delete(observer);
      };
    }, []);

    return state;
  };

  return {
    Provider,
    useContainer,
  };
}