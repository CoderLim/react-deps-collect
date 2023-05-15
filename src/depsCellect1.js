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
  const ObservableContext = createContext(new ObservableValue());

  const Provider = function Provider({ children }) {
    const containerRef = useRef();
    if (!containerRef.current) {
      containerRef.current = new ObservableValue();
    }

    const state = useHook();
    containerRef.current.state = state;

    useEffect(() => {
      containerRef.current.notify();
    });

    return (
      <IntrinsicContext.Provider value={state}>
        <ObservableContext.Provider value={containerRef.current}>
          {children}
        </ObservableContext.Provider>
      </IntrinsicContext.Provider>
    );
  };

  const useModel = function (_depCb) {
    const depCp = useCallback(_depCb, []);

    const container = useContext(ObservableContext);
    const [state, setState] = useState(container.state);
    const prevDepsRef = useRef([]);

    useEffect(() => {
      const observer = () => {
        const prev = prevDepsRef.current;
        const cur = depCp(container.state);
        if (!shallowCompare(prev, cur)) {
          setState(container.state);
        }
        prevDepsRef.current = cur;
      }

      container.observers.add(observer);

      return () => {
        container.observers.delete(observer);
      };
    }, []);

    return state;
  };

  return {
    Provider,
    useModel,
  };
}

export class ObservableValue {
  constructor(state) {
    this.observers = new Set();
    this.state = state;
  }

  notify() {
    for (const observer of this.observers) {
      observer();
    }
  }
}