import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop"
import { aerHookInputsEqual, HookLayout, HookPassive } from "./utils"

let currentlyRenderingFiber = null
// 永远是当前工作的hook
let workInProgressHook = null
// old hook
let currentHook = null

export function renderWithHooks(wip) {
    currentlyRenderingFiber = wip
    currentlyRenderingFiber.memorizedState = null
    workInProgressHook = null

    // 副作用
    // ? 为了方便，useEffect与useLayoutEffect区分开，并且以数组管理
    // ! 源码中是放在一起，并且是个链表
    currentlyRenderingFiber.updateQueueOfEffect = []
    currentlyRenderingFiber.updateQueueOfLayout = []
}

function updateWorkInProgressHook() {
    let hook
    const current = currentlyRenderingFiber.alternate

    // 组件更新
    if (current) {
        currentlyRenderingFiber.memorizedState = current.memorizedState

        if (workInProgressHook) {
            workInProgressHook = hook = workInProgressHook.next
            currentHook = currentHook.next
        }
        else {
            // hook0
            workInProgressHook = hook = currentlyRenderingFiber.memorizedState
            currentHook = current.memorizedState
        }
    }
    // 组件初次渲染
    else {
        currentHook = null
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

    // * 第一版
    // const dispatch = () => {
    //     hook.memorizedState = reducer(hook.memorizedState)
    //     currentlyRenderingFiber.alternate = {...currentlyRenderingFiber}
    //     scheduleUpdateOnFiber(currentlyRenderingFiber)

    //     console.log('log')
    // }

    // * 第二版
    const dispatch = dispatchReducerAction.bind(
        null,
        currentlyRenderingFiber,
        hook,
        reducer
    )

    return [hook.memorizedState, dispatch]
}

/**
 * @param {*} fiber 当前fiber
 * @param {*} hook hook
 * @param {*} reducer reducer
 * @param {*} action action
 */
function dispatchReducerAction(fiber, hook, reducer, action) {
    hook.memorizedState = reducer ? reducer(hook.memorizedState) : action
    fiber.alternate = {...fiber}
    fiber.sibling = null
    scheduleUpdateOnFiber(fiber)
}

export function useState(initalState) {
    return useReducer(null, initalState)
}

function updateEffectImp(hookFlags, create, deps) {
    const hook = updateWorkInProgressHook()

    // 比较依赖项
    // old hook
    if (currentHook) {
        const prevEffect = currentHook.memorizedState

        if (deps) {
            const prevDeps = prevEffect.deps
            
            if (aerHookInputsEqual(deps, prevDeps)) {
                return
            }
        }
    }

    const effect = {hookFlags, create, deps}
    hook.memorizedState = effect

    if (hookFlags & HookPassive) {
        currentlyRenderingFiber.updateQueueOfEffect.push(effect)
    }
    else if (hookFlags & HookLayout) {
        currentlyRenderingFiber.updateQueueOfLayout.push(effect)
    }
}

export function useEffect(create, deps) {
    return updateEffectImp(HookPassive, create, deps)
}

export function useLayoutEffect(create, deps) {
    return updateEffectImp(HookLayout, create, deps)
}