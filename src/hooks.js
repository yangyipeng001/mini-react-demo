import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop"

let currentlyRenderingFiber = null
// 永远是当前工作的hook
let workInProgressHook = null

export function renderWithHooks(wip) {
    currentlyRenderingFiber = wip
    currentlyRenderingFiber.memorizedState = null
    workInProgressHook = null
}

function updateWorkInProgressHook() {
    let hook
    const current = currentlyRenderingFiber.alternate

    // 组件更新
    if (current) {
        currentlyRenderingFiber.memorizedState = current.memorizedState

        if (workInProgressHook) {
            workInProgressHook = hook = workInProgressHook.next
        }
        else {
            // hook0
            workInProgressHook = hook = currentlyRenderingFiber.memorizedState
        }
    }
    // 组件初次渲染
    else {
        hook = {
            // state
            memorizedState: null,
            // 下一个hook
            next: null,
        }

        if (workInProgressHook) {
            workInProgressHook = workInProgressHook.next = hook
        }
        else {
            // hook0
            workInProgressHook = currentlyRenderingFiber.memorizedState = hook
        }
    }

    return hook
}

export function useReducer(reducer, initalState) {
    const hook = updateWorkInProgressHook()

    // 初次渲染
    if (!currentlyRenderingFiber.alternate) {
        hook.memorizedState = initalState
    }

    const dispatch = () => {
        hook.memorizedState = reducer(hook.memorizedState)
        currentlyRenderingFiber.alternate = {...currentlyRenderingFiber}
        scheduleUpdateOnFiber(currentlyRenderingFiber)

        console.log('log')
    }

    return [hook.memorizedState, dispatch]
}