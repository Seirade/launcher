import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import configureStore from './configureStore';
import { createMemoryHistory } from 'history';
import { ConnectedRouter } from 'connected-react-router';
import ConnectedApp from './containers/ConnectedApp';

(async () => {
  // Toggle DevTools when CTRL+SHIFT+I is pressed
  window.addEventListener('keypress', (event) => {
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyI') {
      window.External.toggleDevtools();
      event.preventDefault();
    }
  });
  // Wait for the preferences and config to initialize
  await window.External.config.waitUtilInitialized();
  await window.External.preferences.waitUtilInitialized();
  // Create history
  const history = createMemoryHistory();
  // Create Redux store
  const store = configureStore(history, { preferences: { data: window.External.preferences.getData() } });
  // Render the application
  ReactDOM.render((
      <Provider store={store}>
        <ConnectedRouter history={history}>
            <ConnectedApp />
        </ConnectedRouter>
      </Provider>
    ),
    document.getElementById('root')
  );
})();
