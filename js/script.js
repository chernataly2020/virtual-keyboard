/* eslint-disable import/extensions */
//именованный импорт
// из файла storage.js импортируется только метод get
// из файла Keyboard.js импортируется только компонент кнопки Keyboard
import {get } from './storage.js';
import Keyboard from './Keyboard.js';

const rowsOrder = [
    ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Delete'],
    ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backspace'],
    ['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Backslash', 'Enter'],
    ['ShiftLeft', 'IntlBackslash', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ArrowUp', 'ShiftRight'],
    ['ControlLeft', 'Win', 'AltLeft', 'Hide', 'Ru_Eng', 'Space', 'Sound', 'Voice', 'AltRight', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ControlRight'],
];
//По умолчанию язык клавиатуры русский
const lang = get('kbLang', '"ru"');
//Отображение клавиатуры, 

new Keyboard(rowsOrder).init(lang).generateLayout();