/**
 * Application entry point.
 * Bridges React Native's AppRegistry to the root React component.
 */
import { AppRegistry } from 'react-native';
import App from './src/app/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
