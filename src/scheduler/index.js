import { pop, push, peek } from "./minHeap"

// 任务池
let taskQueue = []
let taskIdCounter = 1

export function scheduleCallback(callback) {
    const currentTime = getCurrentTime()
    const timeout = -1
    const expirtationTime = currentTime - timeout

    const newTask = {
        id: taskIdCounter++,
        callback,
        expirtationTime,
        sortIndex: expirtationTime
    }

    push(taskQueue, newTask)

    // 请求调度
    requestHostCallback()
}

const channel = new MessageChannel()
const port = channel.port2
channel.port1.onmessage = function() {
    workLoop()
}

function requestHostCallback() {
    port.postMessage(null)
}

function workLoop() {
    let currentTask = peek(taskQueue)

    while(currentTask) {
        const callback = currentTask.callback
        // 防止重复执行
        currentTask.callback = null
        callback()

        pop(taskQueue)
        currentTask = peek(taskQueue)
    }
}

export function getCurrentTime() {
    return performance.now()
}