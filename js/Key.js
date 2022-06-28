/* eslint-disable import/extensions */
//импорт компонента кнопки
import create from './utils/create.js';

export default class Key {
    constructor({ small, shift, code }) {
        this.code = code;
        this.small = small;
        this.shift = shift;
        //является ли клавиша функциональной
        this.isFnKey = Boolean(small.match(/Ctrl|arr|Alt|Shift|Tab|Back|Del|Enter|Caps|Win|Sound|Voice|Ru|En/));

        if (shift && shift.match(/[^a-zA-Zа-яА-ЯёЁ0-9]/)) {
            //создаем элемент div с классом sub и кладем его в this.shift
            this.sub = create('div', 'sub', this.shift);
        } else {
            this.sub = create('div', 'sub', '');
        }
        //создаем элемент div с классом letter и кладем его в small
        this.letter = create('div', 'letter', small);
        this.div = create('div', 'keyboard__key', [this.sub, this.letter], null, ['code', this.code],
            this.isFnKey ? ['fn', 'true'] : ['fn', 'false']); // мы забыли этот атрибут добавить )) он нужен, чтобы в разметке стилизовать функциональные клавиши отдельно
    }
}