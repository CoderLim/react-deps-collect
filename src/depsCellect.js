import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

function shallowCompare(a, b) {
    // a, b 为对象
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    return [...aKeys, ...bKeys].every(key => a[key] === b[key]);
}

export default function createContainer(useHook) {
  const { ObservableContext, IntrinsicContext } = getContexts(useHook);

  const Provider = function Provider({ initState, children }) {
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

  const useModel = function (depCb) {
    const { ObservableContext } = getContexts(useHook);
    const sealedDepCp = useCallback(depCb, []);

    const container = useContext(ObservableContext);
    const [state, setState] = useState(container.state);
    const prevDepsRef = useRef([]);

    useEffect(() => {
        const observer = () => {
            const prev = prevDepsRef.current;
            const cur = sealedDepCp(container.state);
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
  observers;
  state;

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

const ContextRegistry = new WeakMap();
export function getContexts(model) {
  if (ContextRegistry.has(model)) {
    return ContextRegistry.get(model);
  } else {
    const ObservableContext = createContext(new ObservableValue());
    const IntrinsicContext = createContext(null);
    const ret = {
      ObservableContext,
      Context: IntrinsicContext,
    };
    ContextRegistry.set(model, ret);
    return ret;
  }
}
