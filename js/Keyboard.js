/* eslint-disable no-param-reassign */
/* eslint-disable import/extensions */
//Импорт модуля для работы с localstorage
import * as storage from './storage.js';
//Импорт функции  обертки нативных методов
import create from './utils/create.js';
//Импорт двух раскладок клавиатуры
import language from './layouts/index.js'; // { en, ru }
//импорт компонента кнопки
import Key from './Key.js';

const main = create('main', '', [create('h1', 'title', 'RSS Virtual Keyboard'),
    create('h3', 'subtitle', 'Windows keyboard that has been made under Linux'),
    create('p', 'hint', 'Use left <b>Ctrl</b> + <b>Alt</b>, or <b>Ru/Eng</b> to switch language.Last language saves in localStorage'),
    create('p', 'hint', 'Use <b>Hide</b> to hide keyboard.'),
    create('p', 'hint', 'Use <b>Sound</b> for key sounds.'),
    create('p', 'hint', 'Use <b>Voice</b> for input voice.'),
]);
//Задает и возвращает язык текущего SpeechRecognition. Если данное свойство не указано 
//по умолчанию, то используется из HTML кода значение атрибута lang, 
//или настройки языка агента текущего пользователя.
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

//Инициализация клавиатуры, клавиша CapsLock отключена
export default class Keyboard {
    constructor(rowsOrder) {
            this.rowsOrder = rowsOrder;
            //фиксация нажатой кнопки по коду
            this.keysPressed = {};
            this.isCaps = false;
            this.soundOff = storage.set('soundOff', true);
            this.shiftKey = false;
            this.speachRec = true;
            this.isCaps = false;
            this.shiftKey = false;
            this.isSound = false;
            this.isSpeech = false;
        }
        //Инициализация окна для ввода текста
    init(langCode) {
            this.keyBase = language[langCode];
            this.output = create('textarea', 'output', null, main, ['placeholder', 'Start type something...'], ['rows', 5], ['cols', 50], ['spellcheck', false], ['autocorrect', 'off']);
            this.hideButton = create('div', 'hide-button', 'Hide keyboard', main);
            //создаем контейнер для клавиатуры
            this.container = create('div', 'keyboard', null, main, ['language', langCode]);
            document.body.prepend(main); //клавиатура отрисуется перед тегом <script>
            //this.speachRecognition();
            return this;
        }
        //Формирование на экране клавиш клавиатуры
    generateLayout() {
        this.keyButtons = [];
        this.rowsOrder.forEach((row, i) => {
            const rowElement = create('div', 'keyboard__row', null, this.container, ['row', i + 1]);
            rowElement.style.gridTemplateColumns = `repeat(${row.length}, 1fr)`;
            row.forEach((code) => {
                const keyObj = this.keyBase.find((key) => key.code === code);
                if (keyObj) {
                    const keyButton = new Key(keyObj);
                    this.keyButtons.push(keyButton);
                    rowElement.appendChild(keyButton.div);
                }
            });
            this.hideButton.onmousedown = this.hideKeyboardEvent;
        });

        //Определение нажатой кнопки
        document.addEventListener('keydown', this.handleEvent);
        //Определение отжатой кнопки 
        document.addEventListener('keyup', this.handleEvent);
        this.container.onmousedown = this.preHandleEvent;
        this.container.onmouseup = this.preHandleEvent;
    }


    preHandleEvent = (e) => {
        e.stopPropagation();
        const keyDiv = e.target.closest('.keyboard__key');
        if (!keyDiv) return;
        const {
            dataset: {
                code
            }
        } = keyDiv;
        keyDiv.addEventListener('mouseleave', this.resetButtonState);
        this.handleEvent({
            code,
            type: e.type
        });
    };

    // Ф-я обработки событий

    handleEvent = (e) => {
        if (e.stopPropagation) e.stopPropagation();
        const { code, type } = e;
        const keyObj = this.keyButtons.find((key) => key.code === code);
        if (!keyObj) return;
        this.output.focus();

        // НАЖАТИЕ КНОПКИ
        //Сброс настроек по умолчанию
        if (type.match(/keydown|mousedown/)) {
            if (!type.match(/mouse/)) e.preventDefault();

            // Если нажата клавиша Shift
            if (code.match(/Shift/)) this.shiftKey = true;
            //Смена регистра
            if (this.shiftKey) this.switchUpperCase(true);

            if (code.match(/Control|Alt|Caps/) && e.repeat) return;

            //Смена языка по комбинации клавиш Ctrl-Alt
            if (code.match(/Control/)) this.ctrKey = true;
            if (code.match(/Alt/)) this.altKey = true;
            if (code.match(/Control/) && this.altKey) this.switchLanguage();
            if (code.match(/Alt/) && this.ctrKey) this.switchLanguage();
            //Смена языка при нажатии на клавишу Ru_Eng
            if (code.match(/Ru_Eng/)) this.switchLanguage();
            if (code.match(/Hide/)) {
                this.hideKeyboardEvent();
            }

            //Озвучка клавиш
            if (code.match(/Sound/)) {
                if (!this.isSound) {
                    this.isSound = true;
                    this.playSound(code);
                    this.soundOff = storage.set('soundOff', false);

                } else if (this.isSound) {
                    this.isSound = false;
                    this.soundOff = storage.set('soundOff', true);
                }
            }

            if (this.isSound) {
                this.playSound(code);
            }
            //Голосовой  ввод
            if (code.match(/Voice/) && !this.isSpeech) {
                this.isSpeech = true;
                let lang = storage.get('kbLang');
                if (lang === 'ru')
                    recognition.lang = 'ru-Ru';
                else
                    recognition.lang = 'en-US';

                recognition.addEventListener('result', e => {
                    const transcript = Array.from(e.results).map(result => result[0]).map(result => result.transcript).join('');
                    document.querySelector("body > main > textarea").value = `${transcript}`;
                });
                recognition.continuous = true;
                recognition.start();
            } else if (code.match(/Voice/) && this.isSpeech) {
                this.isSpeech = false;
                recognition.abort();
                keyObj.div.classList.remove('active');
            }

            keyObj.div.classList.add('active');

            //Нажатие клавиши Caps, смена регистра
            if (code.match(/Caps/) && !this.isCaps) {
                this.isCaps = true;
                this.switchUpperCase(true);
            } else if (code.match(/Caps/) && this.isCaps) {
                this.isCaps = false;
                this.switchUpperCase(false);
                keyObj.div.classList.remove('active');
            }

            // Определяем, какой символ мы пишем в консоль (спец или основной)
            if (!this.isCaps) {
                // если не зажат капс, смотрим не зажат ли шифт
                this.printToOutput(keyObj, this.shiftKey ? keyObj.shift : keyObj.small);
            } else if (this.isCaps) {
                // если зажат капс
                if (this.shiftKey) {
                    // и при этом зажат шифт - то для кнопки со спецсимволом даем верхний регистр
                    this.printToOutput(keyObj, keyObj.sub.innerHTML ? keyObj.shift : keyObj.small);
                } else {
                    // и при этом НЕ зажат шифт - то для кнопки без спецсивмола даем верхний регистр
                    this.printToOutput(keyObj, !keyObj.sub.innerHTML ? keyObj.shift : keyObj.small);
                }
            }
            this.keysPressed[keyObj.code] = keyObj;
            // ОТЖАТИЕ КНОПКИ
        } else if (e.type.match(/keyup|mouseup/)) {
            this.resetPressedButtons(code);
            // if (code.match(/Shift/) && !this.keysPressed[code])
            if (code.match(/Shift/)) {
                this.shiftKey = false;
                this.switchUpperCase(false);
            }
            if (code.match(/Control/)) this.ctrKey = false;
            if (code.match(/Alt/)) this.altKey = false;

            if (!code.match(/Caps/)) keyObj.div.classList.remove('active');
        }
    }

    resetButtonState = ({ target: { dataset: { code } } }) => {
        if (code.match('Shift')) {
            this.shiftKey = false;
            this.switchUpperCase(false);
            this.keysPressed[code].div.classList.remove('active');
        }
        if (code.match(/Control/)) this.ctrKey = false;
        if (code.match(/Alt/)) this.altKey = false;
        this.resetPressedButtons(code);
        this.output.focus();
    }

    resetPressedButtons = (targetCode) => {
        if (!this.keysPressed[targetCode]) return;
        if (!this.isCaps) this.keysPressed[targetCode].div.classList.remove('active');
        this.keysPressed[targetCode].div.removeEventListener('mouseleave', this.resetButtonState);
        delete this.keysPressed[targetCode];
    }

    switchUpperCase(isTrue) {
        // Флаг - чтобы понимать, мы поднимаем регистр или опускаем
        if (isTrue) {
            // Мы записывали наши кнопки в keyButtons, теперь можем легко итерироваться по ним
            this.keyButtons.forEach((button) => {
                // Если у кнопки есть спецсивол - мы должны переопределить стили
                if (button.sub) {
                    // Если только это не капс, тогда поднимаем у спецсимволов
                    if (this.shiftKey) {
                        button.sub.classList.add('sub-active');
                        button.letter.classList.add('sub-inactive');
                    }
                }
                // Не трогаем функциональные кнопки
                // И если капс, и не шифт, и именно наша кнопка без спецсимвола
                if (!button.isFnKey && this.isCaps && !this.shiftKey && !button.sub.innerHTML) {
                    // тогда поднимаем регистр основного символа letter
                    button.letter.innerHTML = button.shift;
                    // Если капс и зажат шифт
                } else if (!button.isFnKey && this.isCaps && this.shiftKey) {
                    // тогда опускаем регистр для основного симовла letter
                    button.letter.innerHTML = button.small;
                    // а если это просто шифт - тогда поднимаем регистр у основного символа
                    // только у кнопок, без спецсимвола --- там уже выше отработал код для них
                } else if (!button.isFnKey && !button.sub.innerHTML) {
                    button.letter.innerHTML = button.shift;
                }
            });
        } else {
            // опускаем регистр в обратном порядке
            this.keyButtons.forEach((button) => {
                // Не трогаем функциональные кнопки
                // Если есть спецсимвол
                if (button.sub.innerHTML && !button.isFnKey) {
                    // то возвращаем в исходное
                    button.sub.classList.remove('sub-active');
                    button.letter.classList.remove('sub-inactive');
                    // если не зажат капс
                    if (!this.isCaps) {
                        // то просто возвращаем основным символам нижний регистр
                        button.letter.innerHTML = button.small;
                    } else if (!this.isCaps) {
                        // если капс зажат - то возвращаем верхний регистр
                        button.letter.innerHTML = button.shift;
                    }
                    // если это кнопка без спецсимвола (снова не трогаем функциональные)
                } else if (!button.isFnKey) {
                    // то если зажат капс
                    if (this.isCaps) {
                        // возвращаем верхний регистр
                        button.letter.innerHTML = button.shift;
                    } else {
                        // если отжат капс - возвращаем нижний регистр
                        button.letter.innerHTML = button.small;
                    }
                }
            });
        }
    }

    //Озвучка клавиатуры
    playSound(code) {
            let audio = new Audio();
            audio.preload = 'true';
            let lang = storage.get('kbLang');
            if (lang === 'ru') audio.src = 'assets/Doink.ogg';
            else audio.src = 'assets/Drip.ogg';
            /*if (this.soundOff) return;*/
            // console.log(Sound ${code})
            if (code.match(/Control/)) audio.src = 'assets/Alt.mp3';
            if (code.match(/Lang/)) audio.src = 'assets/pixiedust.ogg';
            if (code.match(/Arr/)) audio.src = 'assets/drip.ogg';
            if (code.match(/Alt/)) audio.src = 'assets/Aldebaran.ogg';
            if (code.match(/Shift/)) audio.src = 'assets/arcturus.ogg';
            if (code.match(/Caps/)) audio.src = 'assets/tweeters.ogg';
            if (code.match(/Lang/)) audio.src = 'assets/pixiedust.mp3';
            if (code.match(/Speach/)) audio.src = 'assets/regulus.ogg';
            if (code.match(/Enter/)) audio.src = 'assets/Merope.ogg';
            if (code.match(/Hide/)) audio.src = 'assets/tada.ogg';
            if (code.match(/Backspace/)) audio.src = 'assets/Sirrah.ogg';
            if (code.match(/Delete/)) audio.src = 'assets/Sirrah.ogg';
            if (code.match(/Win/)) audio.src = 'assets/Castor.ogg' //return;
            if (code.match(/Sound/)) audio.src = 'assets/Electra.ogg' //return;
            audio.play();
        }
        //Смена раскладки клавиатуры
    switchLanguage = () => {
        const langAbbr = Object.keys(language);
        let langIdx = langAbbr.indexOf(this.container.dataset.language);
        this.keyBase = langIdx + 1 < langAbbr.length ? language[langAbbr[langIdx += 1]] :
            language[langAbbr[langIdx -= langIdx]];

        this.container.dataset.language = langAbbr[langIdx];
        storage.set('kbLang', langAbbr[langIdx]);

        this.keyButtons.forEach((button) => {
            const keyObj = this.keyBase.find((key) => key.code === button.code);
            if (!keyObj) return;
            button.shift = keyObj.shift;
            button.small = keyObj.small;
            if (keyObj.shift && keyObj.shift.match(/[^a-zA-Zа-яА-ЯёЁ0-9]/g)) {
                button.sub.innerHTML = keyObj.shift;
            } else {
                button.sub.innerHTML = '';
            }
            button.letter.innerHTML = keyObj.small;
        });
        if (this.isCaps) this.switchUpperCase(true);
    }

    //Скрытие клавиатуры
    hideKeyboardEvent = (e) => {
        let hideKeyboard = this.container.classList.length === 1 ? true : false;
        if (hideKeyboard) {
            this.container.classList.add("keyboard--hidden");
            this.hideButton.innerText = 'Show keyboard';

        } else {
            this.container.classList.remove("keyboard--hidden");
            this.hideButton.innerText = 'Hide keyboard';
        }
    }



    printToOutput(keyObj, symbol) {
        let cursorPos = this.output.selectionStart;
        const left = this.output.value.slice(0, cursorPos);
        const right = this.output.value.slice(cursorPos);
        const textHandlers = {
            Tab: () => {
                this.output.value = `${left}\t${right}`;
                cursorPos += 1;
            },
            ArrowLeft: () => {
                cursorPos = cursorPos - 1 >= 0 ? cursorPos - 1 : 0;
            },
            ArrowRight: () => {
                cursorPos += 1;
            },
            ArrowUp: () => {
                const positionFromLeft = this.output.value.slice(0, cursorPos).match(/(\n).*$(?!\1)/g) || [
                    [1]
                ];
                cursorPos -= positionFromLeft[0].length;
            },
            ArrowDown: () => {
                const positionFromLeft = this.output.value.slice(cursorPos).match(/^.*(\n).*(?!\1)/) || [
                    [1]
                ];
                cursorPos += positionFromLeft[0].length;
            },
            Enter: () => {
                this.output.value = `${left}\n${right}`;
                cursorPos += 1;
            },
            Delete: () => {
                this.output.value = `${left}${right.slice(1)}`;
            },
            Backspace: () => {
                this.output.value = `${left.slice(0, -1)}${right}`;
                cursorPos -= 1;
            },
            Space: () => {
                this.output.value = `${left} ${right}`;
                cursorPos += 1;
            },
        };
        if (textHandlers[keyObj.code]) textHandlers[keyObj.code]();
        else if (!keyObj.isFnKey) {
            cursorPos += 1;
            this.output.value = `${left}${symbol || ''}${right}`;
        }
        this.output.setSelectionRange(cursorPos, cursorPos);
    }

}