import ContentScripts from './ContentScripts';
import { create, backgroundClient, ChromeMessage } from '../../chrome';

if (window.location.origin === 'http://debo.gonghongzc.com') {
  new ContentScripts();
}






