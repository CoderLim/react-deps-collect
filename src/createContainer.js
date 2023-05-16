import React, { createContext, useContext, } from "react";

export default function createContainer(useHook) {
  const Context = createContext(null); 

  const Provider = function Provider({ children }) {
    const state = useHook();
    return (
      <Context.Provider value={state}>
        {children}
      </Context.Provider>
    );
  };

  const useContainer = function () {
    const value = useContext(Context);
    return value;
  };

  return {
    Provider,
    useContainer,
  };
}