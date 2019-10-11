/*
**  Функция - обертка для вызовов асинхронных функций. Возвращает обертку
**  над (асинхронной) функцией, которая присваивает каждому вызову уникальный
**  идентификатор, регистрирует вызов в глобальном реестре асинхронных задач,
**  и удаляет его оттуда после того, как выполнится callback данной функции.
**
**  Если callback содержит асинхронные вызовы, они должны быть явно обернуты,
**  чтобы быть учтены - автоматически этого не происходит.
**
**  Помимо генератора оберток, также возвращается функция createTaskMonitor,
**  принимающая 2 колбэка - monitor и callback. Монитор вызывается при каждой
**  проверке числа оставшихся (незавершенных) асинхронных вызовов. Ему передается
**  текущее число незавершенных вызовов. callback вызывается, когда все вызовы
**  завершены.
**
**  Этот функционал позволяет дождаться завершения набора (множества)
**  асинхронных вызовов, в случае если мы не хотим их упорядочивать (т.е. ждать
**  завершения предыдущего для вызова следующего).
*/

function asyncCallWrapper() {

    const uuid = (() => {
        ctr = 0;
        return () => ++ctr;
    })();

    let tasks = {}; // Реестр асинхронных вызовов

    const wrap = (func) => function () {
        const callID = uuid(); // Уникальный идентификатор вызова
        tasks[callID] = 1; // Регистрируем вызов. 1 - Просто формальность, значение может быть любым
        const args = Array.from(arguments);
        const callback = args.pop(); // callback всегда идет последним
        const wrappedCallback = function () { // Создаем обертку для callback
            let result;
            try {
                result = callback(...arguments);
            } finally {
                delete tasks[callID]; // Удаляем вызов из реестра
            }
            return result;
        };
        //Выполняем исходную функцию с преобразованным callback
        return func(...args, wrappedCallback)
    };


    const createTaskMonitor = (monitor, callback, interval = 0) => {
        const taskMonitor = () => {
            const taskCount = Object.keys(tasks).length; // Сколько осталось вызовов в реестре
            monitor(taskCount);
            if (taskCount > 0) {
                setTimeout(taskMonitor, interval); // Возобновлям проверку на следующей итерации событийного цикла
            } else {
                callback(); // Все (зарегистрированные) асинхронные вызовы завершены
            }
        };
        return taskMonitor;
    };

    const getTasks = () => tasks;

    return {wrap, getTasks, createTaskMonitor}
}

module.exports = asyncCallWrapper();

