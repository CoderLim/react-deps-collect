import React, { useState } from 'react';
import createContainer from './createContainer';

const { Provider, useContainer } = createContainer(function useHook() {
  const [counter, setCounter] = useState(0);
  return {
    counter,
    setCounter
  };
});

function Child() {
  const { counter, setCounter } = useContainer();
  return <div onClick={() => setCounter(counter + 1)}>{counter}</div>
}

export default function CreateModelDemo() {
  return <Provider>
    <Child />
  </Provider>
}