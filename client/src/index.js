import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';

import reducer from './reducers';
import rootSaga from './root-saga';
import playerSaga from './player/sagas';

import App from './App';
import './index.css';

const sagaMiddleware = createSagaMiddleware();

const middlewares = [applyMiddleware(sagaMiddleware)];
if (window && window.__REDUX_DEVTOOLS_EXTENSION__) {
    middlewares.push(window.__REDUX_DEVTOOLS_EXTENSION__());
}
const store = createStore(reducer, compose(...middlewares));
/* eslint-enable */

// applying sagas
sagaMiddleware.run(rootSaga);
sagaMiddleware.run(playerSaga);

render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root'),
);
