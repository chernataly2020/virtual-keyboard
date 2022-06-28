//Работа с localstorage - кастомная функция
export function set(name, value) {
    //Записывает данные в localstorage
    window.localStorage.setItem(name, JSON.stringify(value));
}

export function get(name, subst = null) {
    //Получает данные из localstorage
    return JSON.parse(window.localStorage.getItem(name) || subst);
}

export function del(name) {
    //Удаляет данные из localstorage
    localStorage.removeItem(name);
}