import ContentScripts from './ContentScripts';
import { create, backgroundClient, ChromeMessage } from '../../chrome';


const originArr = ['http://ytcx.laiqiankj.cn', 'http://debo.gonghongzc.com', 'http://admin.yuanjixin.cn']

if (originArr.includes(window.location.origin)) {
  new ContentScripts();
}






