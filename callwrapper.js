function asyncCallWrapper(){

    const uuid = (() => {
        ctr = 0;
        return () => ++ctr;
    })();

    let tasks = {};

    const wrap  = (func) => {
        const callID = uuid();
        return function(){
            tasks[callID] = 1;
            const args = Array.from(arguments);
            const callback = args.pop();
            const wrappedCallback = function(){
                const result = callback(...arguments);
                delete tasks[callID];
                return result;
            };
            return func(...args, wrappedCallback)
        }
    };

    const createTaskMonitor = (monitor, callback, interval = 0) => {
        const taskMonitor = () =>  {
            const taskCount = Object.keys(tasks).length;
            monitor(taskCount);
            if(taskCount > 0 ){
                setTimeout(taskMonitor, interval);
            } else {
                callback();
            }
        };
        return taskMonitor;
    };

    const getTasks = () => tasks;

    return {wrap, getTasks, createTaskMonitor}
}

module.exports = asyncCallWrapper();

