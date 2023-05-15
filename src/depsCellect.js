import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

function shallowCompare(a, b) {
    // a, b 为对象
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    return [...aKeys, ...bKeys].every(key => a[key] === b[key]);
}

export default function createModel(model) {
  const { SpecContext, CommonContext } = getContexts(model);

  const ClassConsumer = CommonContext.Consumer;

  const Provider = function Provider({ initState, children }) {
    const containerRef = useRef();
    if (!containerRef.current) {
      containerRef.current = new ObservableContext();
    }

    const state = model();
    containerRef.current.state = state;

    useEffect(() => {
      containerRef.current.notify();
    });

    return (
      <CommonContext.Provider value={state}>
        <SpecContext.Provider value={containerRef.current}>
          {children}
        </SpecContext.Provider>
      </CommonContext.Provider>
    );
  };

  const useModel = function (depCb) {
    const { SpecContext } = getContexts(model);
    const sealedDepCp = useCallback(depCb, []);

    const container = useContext(SpecContext);
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
    ClassConsumer,
    useModel,
  };
}

export class ObservableContext {
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
    const SpecContext = createContext(new ObservableContext());
    const CommonContext = createContext(null);
    const ret = {
      SpecContext,
      CommonContext,
    };
    ContextRegistry.set(model, ret);
    return ret;
  }
}
